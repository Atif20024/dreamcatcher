// BackdropDirector (plan 2.4): each room names a backdrop set; the set's
// painted layers (src/art/backdrops/painted.js) are painted once per page
// into tileable canvases and shown as TileSprites, at most 2× the viewport
// wide. Between two seam-joined rooms both sets are alive and crossfade on
// the RoomGraph's blend t, with the horizon lerped on the same t (never
// assigned raw). Interiors (no backdrop) show nothing behind their back wall.
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
    this.state = { a: null, b: null, t: 0 };
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
      const img = s.add.image(0, 0, key).setOrigin(0.5, 1).setScrollFactor(lm.f ?? 0.3, 1).setDepth(D.BG_LANDMARK).setAlpha(0);
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

  // every frame: the committed room + the blend from the RoomGraph
  update(currentId, blend, time = 0) {
    const cam = this.scene.cameras.main;
    this.frames += 1;
    let a = currentId;
    let b = null;
    let t = 0;
    if (blend) {
      a = blend.a;
      b = blend.b;
      t = blend.t;
    }
    const want = new Set([a, b].filter(Boolean));
    for (const id of [...this.live.keys()]) if (!want.has(id)) this.drop(id);
    const A = this.build(a);
    const B = b ? this.build(b) : null;
    // the shared horizon: lerped on t; a teleport (door, respawn) snaps
    const target = B ? this.horizonOf(a) + (this.horizonOf(b) - this.horizonOf(a)) * t : this.horizonOf(a);
    const jumped = this._lastScroll !== undefined && Math.abs(cam.scrollX - this._lastScroll) > this.camW;
    if (this.hz === null || jumped || this._lastRoom === undefined || (!blend && this._lastRoom !== a && !this.graph.zone(this._lastRoom).has(a))) this.hz = target;
    else this.hz += Phaser.Math.Clamp(target - this.hz, -6, 6);
    this._lastScroll = cam.scrollX;
    this._lastRoom = a;
    const same = B && A.set === B.set;
    const show = (e, k, top) => {
      if (!e) return;
      if (e.sky) e.sky.setAlpha(top ? k : 1).setDepth(D.SKY + (top ? 0.02 : 0));
      for (const L of e.layers) {
        L.setAlpha(k);
        L.y = this.hz + L.dy;
        L.tilePositionX = cam.scrollX * L.f;
      }
      if (e.landmark) {
        e.landmark.setAlpha(k);
        e.landmark.y = this.hz + e.landmark.dy;
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
    if (!B) show(A, 1, false);
    else if (same) {
      show(A, 1, false);
      if (B.sky) B.sky.setAlpha(0);
      for (const L of B.layers) L.setAlpha(0);
      if (A.landmark) A.landmark.setAlpha(1 - t);
      if (B.landmark) {
        B.landmark.setAlpha(t);
        B.landmark.y = this.hz + B.landmark.dy;
      }
    } else {
      show(A, 1 - t, false);
      show(B, t, true);
      if (A.sky) A.sky.setAlpha(1);
    }
    this.state = { a, b, t, horizon: this.hz };
    cam.setBackgroundColor(A.sky || (B && B.sky) ? 0x1a1420 : 0x0c0a10);
  }

  // harness: layer y values and alphas (blend continuity checks)
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
