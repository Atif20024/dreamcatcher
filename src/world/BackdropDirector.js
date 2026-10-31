// BackdropDirector (plan 2.4): each room names a backdrop set; the set's
// painted layers (src/art/backdrops/painted.js) are painted once per page
// into tileable canvases and shown as TileSprites, at most 2× the viewport
// wide. One room's set is shown at a time, at full strength: rooms swap at
// the full dark of a frame's dip (src/world/thresholds.js), never blended.
// Interiors (no backdrop) show nothing behind their back wall.
//
// set = { sky: {top, mid, bottom, sun?, stars?, clouds?}, palette: {...},
//         layers: [{ kind, f (parallax 0..1), dy (px below horizon), seed }],
//         landmark?: { kind, x (room tile col), dy, f }, motes?: 'fireflies' | 'dust' }
// room.backdrop = { set: 'dusk', horizon: <room tile row of the ground line> } | null
import Phaser from 'phaser';
import { D } from '../builders/depths.js';
import { paintBackdropLayer, paintSky, paintLandmark } from '../art/backdrops/painted.js';

const T = 32;
const MIN_ZOOM = 0.6;

export class BackdropDirector {
  constructor(scene, graph, sets = {}) {
    this.scene = scene;
    this.graph = graph;
    this.sets = sets;
    this.live = new Map(); // roomId → { objs, layers, sky, landmark, motes, horizon }
    const cam = scene.cameras.main;
    this.camW = cam.width;
    this.camH = cam.height;
    this.spanW = Math.ceil(this.camW / MIN_ZOOM);
    this.spanX = -(this.spanW - this.camW) / 2;
    this.frames = 0;
    this.hz = null;
    this.state = { a: null, next: null };
    scene.events.once('shutdown', () => this.destroyAll());
  }

  tex(key, canvas, linear = false) {
    const tm = this.scene.textures;
    if (!tm.exists(key)) {
      tm.addCanvas(key, canvas);
      if (linear) tm.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    return key;
  }

  horizonOf(roomId) {
    const r = this.graph.room(roomId);
    const b = r && r.data.backdrop;
    return r.y0 + ((b && b.horizon) ?? r.h - 3) * T;
  }

  build(roomId) {
    if (this.live.has(roomId)) return this.live.get(roomId);
    const r = this.graph.room(roomId);
    const b = r && r.data.backdrop;
    const set = b && this.sets[b.set];
    const entry = { roomId, set: b ? b.set : null, objs: [], layers: [], sky: null, landmark: null, motes: [] };
    this.live.set(roomId, entry);
    if (!set) return entry;
    const s = this.scene;
    const skyKey = this.tex(`bdsky:${b.set}`, paintSky(set.sky), true);
    entry.sky = s.add.image(this.spanX, -this.camH * 0.2, skyKey).setOrigin(0).setDisplaySize(this.spanW, this.camH * 1.4).setScrollFactor(0).setDepth(D.SKY).setAlpha(0);
    entry.objs.push(entry.sky);
    const depths = [D.BG_FAR, D.BG_SCENERY, D.BG_MID, D.BG_NEAR];
    (set.layers || []).forEach((L, i) => {
      const c = paintBackdropLayer(L.kind, { ...set.palette, ...(L.palette || {}) }, L.seed || i + 1);
      const key = this.tex(`bd:${b.set}:${i}`, c, true);
      const ts = s.add.tileSprite(this.spanX, 0, this.spanW, c.height, key).setOrigin(0, 1).setScrollFactor(0, 1).setDepth(depths[Math.min(i, 3)] + i * 0.01).setAlpha(0);
      ts.f = L.f ?? 0.2 + i * 0.15;
      ts.dy = L.dy || 0;
      entry.layers.push(ts);
      entry.objs.push(ts);
    });
    if (set.landmark) {
      const lm = set.landmark;
      const key = this.tex(`bdlm:${lm.kind}`, paintLandmark(lm.kind, set.palette), true);
      const img = s.add.image(0, 0, key).setOrigin(0.5, 1).setScrollFactor(lm.f ?? 0.3, 1).setDepth(lm.depth ?? D.BG_LANDMARK).setAlpha(0);
      const f = lm.f ?? 0.3;
      const wx = r.x0 + ((lm.x ?? r.w / 2) + 0.5) * T;
      img.x = (this.camW / 2) * (1 - f) + wx * f;
      img.dy = lm.dy || 0;
      entry.landmark = img;
      entry.objs.push(img);
    }
    if (set.motes) {
      for (let i = 0; i < (set.moteCount || 18); i++) {
        // 'rain' (phase 3b): slanted streaks that fall through the view
        const m =
          set.motes === 'rain'
            ? s.add.rectangle(0, 0, 1.2, 14, 0xb8d0f0, 0.55).setAngle(14).setDepth(D.PLAYER + 2).setAlpha(0)
            : s.add.circle(0, 0, set.motes === 'fireflies' ? 1.6 : 1, set.motes === 'fireflies' ? 0xfff0a0 : 0xf2e6d0, 0.8).setDepth(D.PLAYER - 1).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
        m.rain = set.motes === 'rain';
        m.seed = Math.random() * 1000;
        m.u = Math.random();
        m.v = Math.random();
        entry.motes.push(m);
        entry.objs.push(m);
      }
    }
    return entry;
  }

  drop(roomId) {
    const e = this.live.get(roomId);
    if (!e) return;
    e.objs.forEach((o) => o.destroy());
    this.live.delete(roomId);
  }

  destroyAll() {
    for (const id of [...this.live.keys()]) this.drop(id);
  }

  // every frame: the committed room's set, alone, at full strength. A room
  // only changes at a frame's full dark (or a teleport), so the horizon is
  // simply that room's. `next` (the room past a frame Jo is near) is built
  // but kept at alpha 0, so the swap never has to paint.
  update(currentId, time = 0, next = null) {
    const cam = this.scene.cameras.main;
    this.frames += 1;
    const a = currentId;
    const want = new Set([a, next].filter(Boolean));
    for (const id of [...this.live.keys()]) if (!want.has(id)) this.drop(id);
    const A = this.build(a);
    const N = next && next !== a ? this.build(next) : null;
    this.hz = this.horizonOf(a);
    const show = (e, k) => {
      if (!e) return;
      if (e.sky) e.sky.setAlpha(k).setDepth(D.SKY);
      for (const L of e.layers) {
        L.setAlpha(k);
        L.y = this.hz + L.dy;
        L.tilePositionX = cam.scrollX * L.f;
      }
      if (e.landmark) {
        e.landmark.setAlpha(k);
        e.landmark.y = this.hz + e.landmark.dy;
      }
      if (!k) {
        for (const m of e.motes) m.setAlpha(0);
        return;
      }
      const vw = this.camW / cam.zoom;
      const vh = this.camH / cam.zoom;
      const x0 = cam.midPoint.x - vw / 2;
      const y0 = cam.midPoint.y - vh / 2;
      for (const m of e.motes) {
        const s = time / 1000 + m.seed;
        if (m.rain) {
          const fall = (m.v + s * 1.4) % 1;
          m.x = x0 + ((((m.u - fall * 0.12) % 1) + 1) % 1) * vw;
          m.y = y0 + fall * vh;
          m.setAlpha(k * 0.45);
          continue;
        }
        m.u = (m.u + 0.0004 * Math.sin(s * 0.7)) % 1;
        m.x = x0 + ((((m.u + Math.sin(s * 0.3) * 0.02) % 1) + 1) % 1) * vw;
        m.y = y0 + vh * (0.25 + 0.6 * m.v) + Math.sin(s * 1.3) * 10;
        m.setAlpha(k * (0.35 + 0.45 * (0.5 + 0.5 * Math.sin(s * 2.1))));
      }
    };
    show(A, 1);
    show(N, 0);
    this.state = { a, next: N ? next : null, horizon: this.hz };
    cam.setBackgroundColor(A.sky ? 0x1a1420 : 0x0c0a10);
  }

  // harness: layer y values and alphas (one room visible at a time)
  probe() {
    const out = [];
    for (const [id, e] of this.live) {
      for (const L of e.layers) out.push({ room: id, y: L.y, alpha: L.alpha });
      if (e.sky) out.push({ room: id, sky: true, alpha: e.sky.alpha });
    }
    return out;
  }
}

export default BackdropDirector;
