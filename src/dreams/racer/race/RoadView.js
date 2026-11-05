// The road from behind the car, for RaceScene. The view reads the engine; the
// engine never reads the view. One Graphics refilled each frame for the road (the
// projection is src/engines/road.js), a pool of images for what stands beside it,
// all from one painted atlas so the whole world is one batch; two parallax layers of
// the coast behind, turning with the road. Everything here is freed on leaving
// (freeRoad), and a restart keeps it.
import { project, heightAt, CAM, SEG_LEN, ROAD_M } from '../../../engines/road.js';
import { CAR_LEN, TUNE, chalkAt } from '../../../engines/race.js';
import { paintSky, forgetPainted } from '../../../art/backdrops/painted.js';
import { mix, hex } from '../../../art/paint.js';
import { carItems, CAR_M } from './carArt.js';
import { propItems, PROPS } from './roadsideArt.js';

const W = 960;
const H = 540;
const HORIZON = H * CAM.horizon;
const MARGIN = 40; // past the screen's edge: a camera shake must not show the back of the world
const ATLAS_W = 1024;

const TUFTS = 45; // m: grass going by, near the car only
const FAR_DETAIL = 90; // m: tracks and kerbs stop here
const BAND_FADE = 110; // m: the road's light and dark bands blur together by here (they would shimmer)
const FADE_FROM = 150; // m: what stands by the road sinks into the haze from here …
const FADE_TO = 236; // … to here
const LAND_RATE = [0.1, 0.35]; // of the road's turn, far land and near
const START_D = 20; // m: the banner over the start, clear of the lights
const POOL = 120;
const SLOW_POOL = 60;
const FOV_K = 0.03; // the lens widens this much at the top speed
const PITCH_K = 0.35; // how much of a hill's slope the camera follows
const LAND_TURN = 150; // px/s of land, for a curve of 1 at the top speed
const CAR_SCALE = 2;
const CAR_Y = Math.round(HORIZON + ((CAM.depth * W) / 2) * (CAM.height / (CAM.back - CAR_LEN / 2))); // where the tail's wheels meet the road
const SLOW_IN = 14; // ms of work: ten frames averaging over this: the view draws less …
const SLOW_OUT = 9; // … and under this it comes back
const SLOW_NEAR = 20; // segments drawn in full whatever the frame costs

const keyOf = (theme, part) => `race:${theme.id}:${part}`;
const hash = (i, salt = 0) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---- the atlas -----------------------------------------------------------------
// items: { name, w, h, paint(ctx, w, h), lods }. Frames `name@0` (near) .. `@2` (a
// quarter): a far thing is smoothed down from the near one, so it does not crawl
function buildAtlas(scene, key, items) {
  const parts = items.flatMap((it) => Array.from({ length: it.lods || 1 }, (_, l) => ({ it, l, w: Math.ceil(it.w / 2 ** l), h: Math.ceil(it.h / 2 ** l) })));
  parts.sort((a, b) => b.h - a.h);
  let x = 0;
  let y = 0;
  let row = 0;
  for (const p of parts) {
    if (x + p.w + 1 > ATLAS_W) {
      x = 0;
      y += row + 1;
      row = 0;
    }
    p.x = x;
    p.y = y;
    x += p.w + 1;
    row = Math.max(row, p.h);
  }
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_W;
  canvas.height = y + row + 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  const near = new Map();
  for (const p of parts.filter((q) => q.l === 0)) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.beginPath();
    ctx.rect(0, 0, p.w, p.h);
    ctx.clip();
    p.it.paint(ctx, p.w, p.h);
    ctx.restore();
    near.set(p.it, p);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  for (const p of parts.filter((q) => q.l > 0)) {
    const n = near.get(p.it);
    ctx.drawImage(canvas, n.x, n.y, n.w, n.h, p.x, p.y, p.w, p.h);
  }
  const tex = scene.textures.addCanvas(key, canvas);
  for (const p of parts) tex.add(`${p.it.name}@${p.l}`, 0, p.x, p.y, p.w, p.h);
  return tex;
}

// ---- what stands where: the same road every run --------------------------------
export function dressRoad(track) {
  const segs = track.segments;
  const end = Math.ceil(track.length / SEG_LEN);
  const dress = Array.from({ length: segs.length }, () => []);
  const put = (i, frame, x, extra = {}) => {
    if (i >= 0 && i < dress.length) dress[i].push({ frame, x, m: (PROPS[frame.replace(/[RL]$/, '')] || PROPS[frame]).m, ...extra });
  };
  const bendOf = (i) => track.bends.find((b) => i * SEG_LEN >= b.from - 8 && i * SEG_LEN < b.to + 8);
  for (let i = 0; i < segs.length; i++) {
    const inBend = bendOf(i);
    for (const side of [-1, 1]) {
      const clear = inBend && inBend.side === side ? 2.1 : 1.65; // (behind the bales, on a bend's outside)
      if (i % 3 === (side > 0 ? 0 : 1) && hash(i, side) > 0.3) {
        const r = hash(i, side + 7);
        put(i, r < 0.42 ? 'pine0' : r < 0.78 ? 'pine1' : 'cypress', side * (clear + hash(i, side + 3) * 1.1), { far: false });
      }
      if (i % 4 === 2 && hash(i, side + 11) > 0.35) put(i, hash(i, side + 13) < 0.7 ? 'pine0' : 'pine1', side * (3.6 + hash(i, side + 17) * 3), { far: true });
      if (i > 12 && i % 5 === (side > 0 ? 3 : 1) && hash(i, side + 19) > 0.5) put(i, 'broom', side * (1.24 + hash(i, side + 23) * 0.32), { far: true });
    }
    if (i % 13 === 6) put(i, 'pole', -1.5, { far: true });
    if (i % 25 === 0 && i > 0 && i < end) put(i, 'stone', 1.2);
    if (i > 6 && i % 16 >= 12 && (inBend ? inBend.side !== -1 : true)) put(i, 'wall', -1.34, { far: true });
  }
  // the outside of every bend: straw, and the chevrons over it
  for (const b of track.bends) {
    const turn = -b.side;
    for (let d = b.from - 8; d < b.to + 8; d += SEG_LEN) put(Math.floor(d / SEG_LEN), 'bale', b.side * 1.34);
    for (let d = b.from; d < b.to; d += SEG_LEN * 2.5) put(Math.floor(d / SEG_LEN), 'chevron', b.side * 1.5, { flip: turn < 0 });
  }
  for (const seg of segs) {
    for (const o of seg.things) {
      if (o.kind === 'lamp') put(seg.i, 'lamp', 1.32, { lamp: o.d });
      else if (o.kind === 'board' && o.d > START_D + 8) {
        const hand = o.bend.side > 0 ? 'L' : 'R';
        put(seg.i, `board${o.dist}${hand}`, (o.bend.side > 0 ? -1 : 1) * 1.36);
      } else if (o.kind === 'cart') put(seg.i, 'cart', o.x, { ob: o });
    }
  }
  // the start and the line: banners, rope, and a man in a jacket watching
  put(Math.round(START_D / SEG_LEN), 'start', 0);
  put(end, 'line', 0);
  for (let i = 0; i < 14; i += 2) {
    put(i, 'rope', -1.3);
    put(i, 'rope', 1.3);
  }
  if (track.watcher !== false) put(2, 'aldo', -1.48);
  return dress;
}

// the land at the end of the road: headlands over a line of sea, then a nearer ridge
// of pines with a village's roofs in it. Low, hazed, and tiling at 1024 px, because a
// room's backdrop is drawn for a street's scale and would stand like a wall here.
const LAND_W = 1024;
const wave = (x, parts) => parts.reduce((a, [n, amp, ph]) => a + amp * Math.sin((x / LAND_W) * Math.PI * 2 * n + ph), 0);
function paintLand(layer, L) {
  const h = layer === 0 ? 70 : 54;
  const c = document.createElement('canvas');
  c.width = LAND_W;
  c.height = h;
  const ctx = c.getContext('2d');
  const col = (color, x, y, w, hh) => {
    ctx.fillStyle = hex(color);
    ctx.fillRect(x, y, w, hh);
  };
  for (let x = 0; x < LAND_W; x += 2) {
    if (layer === 0) {
      const top = Math.round(34 + wave(x, [[3, 13, 0.4], [7, 6, 2.1], [19, 2, 1]]));
      col(mix(L.far, L.haze, 0.25), x, top, 2, h - top);
      col(mix(L.far, L.cliff, 0.7), x, top + 2, 2, 5 + Math.round(wave(x, [[11, 3, 0]]) + 3));
      col(L.far, x, top + 14, 2, h - top - 14);
    } else {
      const top = Math.round(24 + wave(x, [[2, 9, 1.1], [5, 5, 0.3], [13, 2, 2]]));
      const bump = Math.round(Math.abs(wave(x, [[61, 2.4, 0], [97, 1.6, 1]])));
      col(L.ridgeDark, x, top - bump, 2, h - top + bump);
      col(L.ridge, x, top - bump, 2, 3);
      if ((x * 7) % 26 < 4) col(L.ridgeLit, x, top - bump + 4, 2, 3);
    }
  }
  if (layer === 0) {
    col(L.sea, 0, h - 8, LAND_W, 8);
    for (let x = 0; x < LAND_W; x += 37) col(L.seaLit, x, h - 6 + (x % 3), 14 + (x % 11), 1);
  } else {
    for (const vx of [150, 182, 214, 640, 672, 860]) {
      const top = Math.round(24 + wave(vx, [[2, 9, 1.1], [5, 5, 0.3], [13, 2, 2]])) + 8;
      col(L.wall, vx, top, 16, 8);
      col(L.roof, vx - 1, top - 3, 18, 3);
      col(L.ridgeDark, vx + 6, top + 4, 3, 4);
    }
  }
  return c;
}

function paintBands(paint) {
  const K = 16;
  // sun, the pines' shadow, the sun on a road climbing towards you
  const shadeOf = (c, s) => (s === 1 ? mix(c, paint.shade, 0.2) : s === 2 ? mix(c, paint.lit, 0.16) : c);
  const out = [];
  for (let k = 0; k < K; k++) {
    const haze = (k / (K - 1)) ** 1.4 * 0.72;
    const z = (k / (K - 1)) * 240;
    const flat = Math.min(1, z / BAND_FADE) ** 2;
    const set = (a, b, s) => {
      const m = mix(a, b, 0.5);
      return [mix(mix(shadeOf(a, s), shadeOf(m, s), flat), paint.haze, haze), mix(mix(shadeOf(b, s), shadeOf(m, s), flat), paint.haze, haze)];
    };
    const row = [0, 1, 2].map((s) => ({
      road: set(paint.road[0], paint.road[1], s),
      verge: set(paint.verge[0], paint.verge[1], s),
      shoulder: set(paint.shoulder[0], paint.shoulder[1], s),
      kerb: set(paint.kerb[0], paint.kerb[1], s),
      track: mix(shadeOf(paint.track, s), paint.haze, haze),
      tuft: shadeOf(paint.tuft, s),
      tuftLit: shadeOf(paint.tuftLit, s),
      edge: mix(shadeOf(paint.edge, s), paint.haze, haze),
      stone: mix(shadeOf(paint.stone, s), paint.haze, haze),
    }));
    out.push(row);
  }
  return out;
}

export function freeRoad(scene, theme) {
  for (const key of scene.textures.getTextureKeys()) {
    if (!key.startsWith(`race:${theme.id}:`)) continue;
    const src = scene.textures.get(key).getSourceImage();
    forgetPainted(src);
    scene.textures.remove(key);
  }
}

export class RoadView {
  constructor(scene, track, race, { slow = false, chalk = false, joLivery = 'dante' } = {}) {
    this.scene = scene;
    this.track = track;
    this.race = race;
    this.theme = track.theme;
    this.slow = slow;
    this.slowRing = [];
    this.bands = paintBands(this.theme.paint);
    const k = (part) => keyOf(this.theme, part);
    this.atlasKey = k(`atlas:${track.id}`);
    const entered = track.rivals || (track.rival ? [track.rival] : []);
    const liveryOf = (id) => entered.find((r) => r.id === id)?.livery || id;
    if (!scene.textures.exists(this.atlasKey)) buildAtlas(scene, this.atlasKey, [...propItems(track), ...carItems(joLivery, entered.map((r) => liveryOf(r.id)))]);
    this.riv = new Map(race.rivals.map((r) => [r, liveryOf(r.id)]));
    this.frames = scene.textures.get(this.atlasKey).frames;
    this.dress = dressRoad(track);
    this.shadeSeg = track.segments.map((s, i, all) => {
      const rise = (all[i + 1]?.y ?? s.y) - s.y;
      if (rise > 0.02) return 2;
      return rise < -0.02 || hash(Math.floor(i / 2), 41) > 0.62 ? 1 : 0;
    });
    this.chalk = chalk ? track.bends.map((b) => chalkAt(b)) : [];
    this.bg = this.theme.paint.haze;

    // the sky and the land: one layer a frame while the picture fades up, so the door has none to paint
    this.sky = scene.add.image(W / 2, HORIZON, this.atlasKey, 'stone@0').setOrigin(0.5, 1).setDepth(0).setVisible(false);
    this.land = [];
    this.landX = 0;
    this.todo = [
      () => {
        if (!scene.textures.exists(k('sky'))) scene.textures.addCanvas(k('sky'), paintSky(this.theme.sky));
        this.sky.setTexture(k('sky')).setDisplaySize(W + MARGIN * 2, HORIZON + 100).setVisible(true);
      },
      ...LAND_RATE.map((f, i) => () => {
        const key = k(`land${i}`);
        if (!scene.textures.exists(key)) scene.textures.addCanvas(key, paintLand(i, this.theme.ridge));
        const h = scene.textures.get(key).getSourceImage().height;
        this.land[i] = { ts: scene.add.tileSprite(-MARGIN, HORIZON, W + MARGIN * 2, h, key).setOrigin(0, 1).setDepth(1 + i), f };
      }),
    ];
    this.todo.shift()(); // the sky at once: it is the cheapest, and the picture's background

    this.g = scene.add.graphics().setDepth(5);
    this.pool = Array.from({ length: POOL }, () => scene.add.image(-400, 0, this.atlasKey, 'stone@1').setOrigin(0.5, 1).setDepth(10).setVisible(false));
    this.poolUsed = 0;
    this.want = [];
    this.chalkSegs = new Set(this.chalk.map((d) => Math.floor(d / SEG_LEN)));
    this.litLamps = new Set();

    // Jo's car: the tyres stay on the road, the body moves on its springs
    this.tyres = scene.add.image(W / 2, CAR_Y, this.atlasKey, 'tyres-0@0').setOrigin(0.5, 1).setScale(CAR_SCALE).setDepth(60);
    this.body = scene.add.image(W / 2, CAR_Y, this.atlasKey, 'body0@0').setOrigin(0.5, 1).setScale(CAR_SCALE).setDepth(61);
    this.dust = Array.from({ length: 18 }, () => scene.add.image(-200, 0, 'cars', 'puff').setVisible(false).setDepth(62));
    this.dustNext = 0;
    this.dustAt = 0;
    this.spark = scene.add.image(-200, 0, 'cars', 'spark').setVisible(false).setDepth(63);
    this.sparkLife = 0;

    this.pitch = 0;
    this.lean = 0;
    this.carX = 0;
    this.squat = 0;
    this.yaw = 0;
    this.spinT = 0;
    this.pan = 0;
    this.buzz = 0;
    this.stats = { strips: 0, sprites: 0 };
    this.onRendered = () => this.measure();
    scene.game.events.on('postrender', this.onRendered);
    scene.events.once('shutdown', () => scene.game.events.off('postrender', this.onRendered));
  }

  // ---- slow machines: fewer far strips, half the roadside; the engine never changes.
  // What is timed is the frame's own work, update to the end of the render: a 60 Hz
  // screen hands everybody 16.7 ms whatever they spent
  startFrame() {
    this.frameT0 = performance.now();
  }

  measure() {
    if (!this.frameT0) return;
    this.slowRing.push(performance.now() - this.frameT0);
    this.frameT0 = 0;
    if (this.slowRing.length < 10) return;
    const avg = this.slowRing.reduce((a, b) => a + b, 0) / this.slowRing.length;
    this.slowRing.length = 0;
    this.lastWork = avg;
    if (!this.slow && avg > SLOW_IN) this.slow = true;
    else if (this.slow && avg < SLOW_OUT) this.slow = false;
  }

  // ---- one frame ------------------------------------------------------------------
  update(dt = 16.67, moving = true) {
    if (this.todo.length) this.todo.shift()();
    const r = this.race;
    const c = r.jo;
    const a = r.alpha();
    const jd = c.prevD + (c.d - c.prevD) * a;
    const jx = c.prevX + (c.x - c.prevX) * a;
    const speedK = Math.min(1, c.v / TUNE.vMax);
    const ease = (ms) => 1 - Math.exp(-dt / ms);
    const camD = jd - CAM.back;

    // a hill tips the camera (half of it: the road must still rise in front of you)
    const slope = (heightAt(this.track, jd + 12) - heightAt(this.track, jd - 12)) / 24;
    this.pitch += (slope * ((CAM.depth * W) / 2) * PITCH_K - this.pitch) * ease(220);

    // a spin swings the whole world round the car
    if (c.state === 'spin') {
      this.spinT += dt / 1000;
      this.pan = Math.sin(this.spinT * 7) * 2.4 * Math.max(0, 1 - this.spinT / 2);
    } else {
      this.spinT = 0;
      this.pan *= 1 - ease(90);
    }

    const lensW = W * (1 - FOV_K * speedK);
    const strips = project(this.track, camD, jx + this.pan, { w: lensW });
    const ox = (W - lensW) / 2;
    let clip = Infinity;
    for (const s of strips) {
      s.clip = clip;
      if (s.y < clip) clip = s.y;
      s.x += ox;
    }
    this.lastStrips = strips;
    this.drawRoad(strips);
    this.drawThings(strips, camD);
    this.drawLand(dt, speedK, moving);
    this.drawCar(dt, speedK, jd, moving);
    this.drawDust(dt, c, moving);
  }

  drawLand(dt, speedK, moving) {
    const b = this.race.bendAt(this.race.jo.d);
    const curve = b ? b.curve : 0;
    if (moving) this.landX += curve * speedK * speedK * LAND_TURN * (dt / 1000);
    const y = Math.round(HORIZON + this.pitch);
    this.sky.y = y + 6;
    for (const L of this.land) {
      if (!L) continue;
      L.ts.tilePositionX = Math.round((this.landX + this.race.jo.x * 18) * (L.f / LAND_RATE[0])) % LAND_W;
      L.ts.y = y + 2;
    }
  }

  drawRoad(strips) {
    const g = this.g.clear();
    const hy = Math.round(HORIZON + this.pitch);
    const far = this.bands[this.bands.length - 1][0];
    g.fillStyle(far.verge[0]).fillRect(-MARGIN, hy, W + MARGIN * 2, H - hy + MARGIN);
    const P = this.pitch;
    const step = this.slow ? 2 : 1;
    let drawn = 0;
    // (the nearest strip can stand up to 5 m out: the road carries on under the car to the screen's edge)
    const first = strips[0];
    if (first) {
      const k = (H + MARGIN * 4 - HORIZON) / Math.max(1, first.y + P - HORIZON);
      if (k > 1) strips.unshift({ seg: this.track.segments[Math.max(0, first.seg.i - 1)], z: 1, x: W / 2 + (first.x - W / 2) * k, y: H + MARGIN * 4 - P, halfW: first.halfW * k, visible: true, scale: first.scale * k, clip: Infinity });
    }
    // back to front; a strip behind the crest is simply not painted
    let i = strips.length - 1;
    while (i >= 1) {
      const n = i > SLOW_NEAR && step === 2 ? 2 : 1;
      const f = strips[i];
      const near = strips[i - n] || strips[0];
      i -= n;
      if (!f.visible || !near.visible) continue;
      const y1 = Math.round(f.y + P);
      const y2 = Math.round(near.y + P);
      if (y2 <= y1 || y1 > H + MARGIN) continue;
      this.drawStrip(g, f, near, y1, Math.min(y2, H + MARGIN * 4), y2);
      drawn += 1;
    }
    this.stats.strips = drawn;
  }

  drawStrip(g, f, n, y1, yClamp, y2) {
    const seg = f.seg;
    const idx = Math.max(0, seg.i);
    const k = Math.min(15, Math.floor((n.z / 240) * 16));
    const B = this.bands[k][this.shadeSeg[idx]];
    const alt = Math.floor(idx / 2) % 2;
    const each = idx % 2;
    // (a quad reaching far below the screen is cut at its edge: the x at the cut, not at the car)
    const cut = y2 > yClamp ? (yClamp - y1) / (y2 - y1) : 1;
    const nx = f.x + (n.x - f.x) * cut;
    const nw = f.halfW + (n.halfW - f.halfW) * cut;
    const quad = (color, l, r) => {
      const x1 = f.x + l * f.halfW;
      const x2 = f.x + r * f.halfW;
      const x3 = nx + r * nw;
      const x4 = nx + l * nw;
      g.fillStyle(color);
      g.fillTriangle(x1, y1, x2, y1, x3, yClamp);
      g.fillTriangle(x1, y1, x3, yClamp, x4, yClamp);
    };
    g.fillStyle(B.verge[alt]).fillRect(-MARGIN, y1, W + MARGIN * 2, yClamp - y1);
    const bend = seg.curve !== 0;
    quad(B.shoulder[alt], -1.16, 1.16);
    quad(B.road[alt], -1, 1);
    if (n.z < TUFTS) {
      for (let t = 0; t < 4; t++) {
        const at = 1.3 + hash(idx, t + 61) * 3.2;
        const side = t % 2 ? 1 : -1;
        const c = hash(idx, t + 71) > 0.5 ? B.tuft : B.tuftLit;
        quad(c, side * at, side * at + side * (0.04 + hash(idx, t + 67) * 0.08));
      }
    }
    if (n.z < FAR_DETAIL) {
      quad(B.track, -0.24, -0.15);
      quad(B.track, 0.15, 0.24);
      if (hash(idx, 53) > 0.82) quad(B.track, hash(idx, 59) - 0.7, hash(idx, 59) - 0.52); // a tar patch going by
      if (bend) {
        quad(B.kerb[each], -1.12, -1);
        quad(B.kerb[each], 1, 1.12);
      } else {
        quad(B.edge, -1.03, -1);
        quad(B.edge, 1, 1.03);
        if (each && n.z < 50) {
          quad(B.stone, -1.14, -1.09);
          quad(B.stone, 1.09, 1.14);
        }
      }
      if (this.chalkSegs.has(idx)) quad(0xf2eedc, -0.86, 0.86);
    } else if (bend) {
      quad(B.kerb[alt], -1.1, -1);
      quad(B.kerb[alt], 1, 1.1);
    }
    // the line, in chequers across the road
    const L = this.track.length;
    if (seg.d <= L && seg.d + SEG_LEN > L) {
      for (let c = -8; c < 8; c++) {
        quad(c % 2 === 0 ? 0xf2e6cc : 0x14101a, c / 8, (c + 1) / 8);
      }
    }
  }

  // the nearest things have the pool first; then painted far to near, so the images'
  // own order is the depth and nothing needs sorting
  drawThings(strips, camD) {
    const maxN = (this.slow ? SLOW_POOL : POOL) * 3;
    const cars = this.race.rivals.filter((c) => c.d > camD + 2 && c.d < camD + 240).sort((a, b) => a.d - b.d);
    const want = this.want;
    want.length = 0;
    let ci = 0;
    for (let i = 0; i < strips.length && want.length < maxN; i++) {
      const s = strips[i];
      const list = s.z >= 2 ? this.dress[s.seg.i] : null;
      if (list) {
        for (let j = 0; j < list.length && want.length < maxN; j++) {
          const t = list[j];
          if ((this.slow && t.far) || (t.ob && t.ob.gone)) continue;
          if (this.onScreen(t, s)) want.push(t, s, null);
        }
      }
      while (ci < cars.length && cars[ci].d < s.seg.d + SEG_LEN && want.length < maxN) {
        if (cars[ci].d >= s.seg.d) want.push(cars[ci], s, strips[i + 1] || s);
        ci += 1;
      }
    }
    let n = 0;
    for (let k = want.length - 3; k >= 0; k -= 3) {
      if (want[k + 2] ? this.placeCar(n, want[k], want[k + 1], want[k + 2]) : this.place(n, want[k], want[k + 1])) n += 1;
    }
    for (let i = n; i < this.poolUsed; i++) this.pool[i].setVisible(false);
    this.poolUsed = n;
    this.stats.sprites = n;
  }

  onScreen(t, s) {
    const hPx = t.m * s.scale;
    if (hPx < 5) return false; // (a bale at 150 m is a speck: the pool has better uses)
    const near = this.frames[`${this.frameOf(t)}@0`];
    if (!near) return false;
    const x = s.x + t.x * s.halfW;
    const halfW = (hPx * near.width) / near.height / 2;
    return x + halfW >= -MARGIN && x - halfW <= W + MARGIN;
  }

  // one image of the pool on a strip: scaled, cut off at the crest, sunk in the haze
  place(n, t, s) {
    const hPx = t.m * s.scale;
    const x = s.x + t.x * s.halfW;
    const near = this.frames[`${this.frameOf(t)}@0`];
    const y = s.y + this.pitch;
    const clip = s.clip + this.pitch;
    const shown = y > clip ? hPx - (y - clip) : hPx;
    if (shown <= 1) return false;
    let name = `${this.frameOf(t)}@0`;
    if (hPx < near.height * 0.32 && this.frames[`${this.frameOf(t)}@2`]) name = `${this.frameOf(t)}@2`;
    else if (hPx < near.height * 0.66 && this.frames[`${this.frameOf(t)}@1`]) name = `${this.frameOf(t)}@1`;
    this.show(this.pool[n], name, x, y, hPx, shown, s.z, t.flip);
    return true;
  }

  frameOf(t) {
    if (t.frame === 'lamp' && this.litLamps.has(t.lamp)) return 'lampLit';
    return t.frame;
  }

  show(img, name, x, y, hPx, shown, z, flip = false) {
    if (!img.visible) img.setVisible(true);
    if (img.frame.name !== name) img.setFrame(name);
    const sc = hPx / img.frame.height;
    img.setScale(sc);
    img.setPosition(Math.round(x), Math.round(y));
    img.flipX = !!flip;
    if (shown < hPx) {
      img.setCrop(0, 0, img.frame.width, Math.round(shown / sc));
      img.wasCut = true;
    } else if (img.wasCut) {
      img.setCrop();
      img.wasCut = false;
    }
    const alpha = z <= FADE_FROM ? 1 : Math.max(0, 1 - (z - FADE_FROM) / (FADE_TO - FADE_FROM));
    if (img.alpha !== alpha) img.setAlpha(alpha);
  }

  placeCar(n, c, s, farther) {
    const f = farther || s;
    const k = f === s ? 0 : Math.max(0, Math.min(1, (c.d - s.seg.d) / SEG_LEN));
    const z = s.z + (f.z - s.z) * k;
    if (z < 1.5) return false;
    const scale = (s.scale * s.z) / z;
    const rx = s.x + (f.x - s.x) * k;
    const x = rx + c.x * scale * ROAD_M;
    const hPx = CAR_M.height * scale;
    if (hPx < 2) return false;
    const y = s.y + (f.y - s.y) * k + this.pitch;
    const clip = s.clip + this.pitch;
    const shown = y > clip ? hPx - (y - clip) : hPx;
    if (shown <= 1) return false;
    const base = `rear-${this.riv.get(c)}${c.braking && c.v > 0.5 ? '-lit' : ''}`;
    const name = hPx < 40 && this.frames[`${base}@1`] ? `${base}@1` : `${base}@0`;
    this.show(this.pool[n], name, x, y, hPx, shown, z);
    return true;
  }

  drawCar(dt, speedK, jd, moving) {
    const c = this.race.jo;
    const ease = (ms) => 1 - Math.exp(-dt / ms);
    // the springs: squat on the gas, nose down on the brake, both settling
    const hard = c.v < 26 ? 1 : Math.max(0, (36 - c.v) / 10);
    const wantSquat = c.state !== 'run' ? 0 : c.braking && c.v > 1 ? -1 : c.throttle ? hard : 0;
    this.squat += (wantSquat - this.squat) * ease(wantSquat < 0 ? 70 : 130);
    // the wheel, and what the road does to it: she leans out of the turn, and points where she is going
    const b = this.race.bendAt(c.d);
    const steer = c.state === 'run' ? c.steer : 0;
    const slide = c.slip > 0 && b ? -b.side * Math.min(1, c.slip / 3) : 0;
    const turn = b && c.state === 'run' ? -b.side * Math.min(1, c.v / 18) * 0.35 : 0;
    const wantYaw = c.state === 'spin' ? Math.sin(this.spinT * 16) * 2 : Math.max(-2, Math.min(2, (steer * 1.3 + turn + slide) * speedK ** 0.4 + slide));
    this.yaw += (wantYaw - this.yaw) * ease(c.state === 'spin' ? 30 : 70);
    this.lean += ((steer + turn) * speedK - this.lean) * ease(110);
    this.carX += (steer * speedK * 12 - this.carX) * ease(160);
    // the road through the body: a buzz with speed, a hammering on the verge
    const rough = c.onVerge && c.v > 2 ? 2 : c.v > 12 ? 1 : 0;
    const buzzY = moving && rough ? Math.round(Math.sin(jd * (rough > 1 ? 7.3 : 3.7)) * (rough > 1 ? 2 : 0.6 + 0.4 * speedK)) : 0;
    const x = Math.round(W / 2 + this.carX);
    this.tyres.setPosition(x, CAR_Y + (rough > 1 ? buzzY : 0));
    // the tread, by the road travelled
    const phase = Math.floor(jd / 0.4) % 2;
    this.tyres.setFrame(`tyres-${c.v < 22 ? Math.max(0, phase) : Math.floor(jd * 3) % 2}@0`);
    const yawF = Math.max(-2, Math.min(2, Math.round(this.yaw)));
    this.body.setFrame(`body${yawF}${c.braking && c.v > 0.5 ? '-lit' : ''}@0`);
    this.body.setPosition(x, CAR_Y + Math.round(this.squat * 2) + buzzY);
    this.body.setAngle(c.state === 'spin' ? this.yaw * 3 : this.lean * -3);
    const blink = c.ghost > 0 && Math.floor(c.ghost * 10) % 2 ? 0.45 : 1;
    this.body.setAlpha(blink);
    this.tyres.setAlpha(blink);
    if (this.sparkLife > 0) {
      this.sparkLife -= dt;
      if (this.sparkLife <= 0) this.spark.setVisible(false);
    }
  }

  drawDust(dt, c, moving) {
    if (moving) {
      this.dustAt -= dt;
      const kick = (c.onVerge && c.v > 4 ? 1 : 0) + (c.slip > 1 ? 1 : 0);
      if (kick && this.dustAt <= 0) {
        this.dustAt = 50;
        for (const side of [-1, 1]) this.puff(side * 70, kick > 1 || c.onVerge ? 1 : 0.7, c.onVerge ? 0xb09c6e : 0xd8d4cc);
      }
    }
    for (const p of this.dust) {
      if (!p.visible) continue;
      p.life -= dt;
      p.x += p.vx * (dt / 1000);
      p.y += p.vy * (dt / 1000);
      p.setAlpha(Math.max(0, p.life / 520) * 0.8).setScale(p.scaleX + dt * 0.006);
      if (p.life <= 0) p.setVisible(false);
    }
  }

  puff(off, size = 1, tint = 0xd8d4cc) {
    const p = this.dust[this.dustNext];
    this.dustNext = (this.dustNext + 1) % this.dust.length;
    p.life = 520;
    p.vx = off * 0.9 + (Math.random() - 0.5) * 40;
    p.vy = 30 + Math.random() * 30;
    p.setVisible(true).setTint(tint).setScale(1.2 * size).setAlpha(0.8).setPosition(W / 2 + this.carX + off, CAR_Y - 6);
  }

  burst(n, tint) {
    for (let i = 0; i < n; i++) this.puff((i % 2 ? 1 : -1) * (30 + i * 12), 1.4, tint);
  }

  sparkAt(side = 1) {
    this.sparkLife = 120;
    this.spark.setVisible(true).setPosition(W / 2 + this.carX + side * 70, CAR_Y - 50).setScale(2);
  }

  lightLamp(d) {
    this.litLamps.add(d);
  }

  // what is painted, for the budgets
  textureBytes() {
    const out = {};
    for (const key of this.scene.textures.getTextureKeys()) {
      if (!key.startsWith('race:')) continue;
      const src = this.scene.textures.get(key).getSourceImage();
      out[key] = src.width * src.height * 4;
    }
    return out;
  }
}
