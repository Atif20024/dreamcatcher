// The road from behind the car, for RaceScene. The view reads the engine; the
// engine never reads the view. One Graphics refilled each frame for the road (the
// projection is src/engines/road.js), a pool of images for what stands beside it,
// all from one painted atlas so the whole world is one batch; two parallax layers of
// the coast behind, turning with the road. Everything here is freed on leaving
// (freeRoad), and a restart keeps it.
//
// Each race is its own day: its scenery (SCENERY, dressRoad), its light (light.js:
// the bands are repainted as the day moves, what stands by the road is tinted), and
// what the story does on the road (react, from the scene's events; `actors` are the
// things that only exist for a moment: a wheel, smoke, people running).
import { project, heightAt, CAM, SEG_LEN, ROAD_M } from '../../../engines/road.js';
import { CAR_LEN, TUNE, STEP, chalkAt } from '../../../engines/race.js';
import { paintSky, forgetPainted } from '../../../art/backdrops/painted.js';
import { mix, hex } from '../../../art/paint.js';
import { carItems, CAR_M, rearOf, LAMP_Y } from './carArt.js';
import { tellFlash } from '../../../engines/rivals.js';
import { propItems, PROPS, EMISSIVE, REFLECTIVE, paintSlate } from './roadsideArt.js';
import { LIGHTS, STEPS, lightOf, lightK, paintBands, groundOf, spriteTint, paintLightSky, mul } from './light.js';

const W = 960;
const H = 540;
const HORIZON = H * CAM.horizon;
const MARGIN = 40; // past the screen's edge: a camera shake must not show the back of the world
const ATLAS_W = 1024;

const TUFTS = 45; // m: grass going by, near the car only
const FAR_DETAIL = 90; // m: tracks and kerbs stop here
const FADE_FROM = 150; // m: what stands by the road sinks into the haze from here …
const FADE_TO = 236; // … to here (by day; the dark takes it sooner)
const NEAR_SLATE = 90; // m: the slate has its word on it from here
const LAND_RATE = [0.1, 0.35]; // of the road's turn, far land and near
const START_D = 20; // m: the banner over the start, clear of the lights
const POOL = 140;
const SLOW_POOL = 60;
const FOV_K = 0.03; // the lens widens this much at the top speed
const PITCH_K = 0.35; // how much of a hill's slope the camera follows
const LAND_TURN = 150; // px/s of land, for a curve of 1 at the top speed
const CAR_SCALE = 2;
const CAR_Y = Math.round(HORIZON + ((CAM.depth * W) / 2) * (CAM.height / (CAM.back - CAR_LEN / 2))); // where the tail's wheels meet the road
const SLOW_IN = 14; // ms of work: ten frames averaging over this: the view draws less …
const SLOW_OUT = 9; // … and under this it comes back
const SLOW_NEAR = 20; // segments drawn in full whatever the frame costs
// what stands by the road goes as it comes level with the car: a trunk or a sign beside the lens is a block at the screen's edge, not a thing
const NEAR_GONE = [3.5, 5]; // m: gone by here (small things, tall things), by when they are at the screen's edge …
const NEAR_FULL = [6, 8]; // … whole from here (quickly: a half-there trunk is a ghost, not a tree)
const NEAR_FADES = /^(pine|cypress|pole|chevron|board|lamp|quayLamp|tamarisk|windpump|gull)/; // (thin things: a house or a stand beside you is still a house)
const OIL_SHEEN = [24, 170]; // m: from here out, a spill too thin to paint is a glint on the road, so it can be read at 100 m
const GULL_BLOOM = 1.6; // s: the Gull lamp's light coming up

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

const QUAY_LAMP = 7; // segments between the standards

// where a road's stretches change, from its own bends and crossing: a layout can move and the sea moves with it
function zonesOf(track) {
  const b = (name) => track.bends.find((q) => q.name === name);
  if (track.id === 'harbour') return { quay: b('harbour hairpin').from, town: b('fish market').from + 10, gull: b('Gull Bend').from };
  if (track.id === 'salt') return { crossing: track.things.find((o) => o.kind === 'crossing').d };
  if (track.id === 'coppa') {
    const g = b('Gull Bend');
    return { lap: track.lapLen, pit: b('harbour hairpin').from, salt: b('harbour hairpin').to, terraces: b('terraces').from, climb: b('terraces out').to, gull: g.from, straight: g.to };
  }
  return {};
}

// the scenery of a stretch of road: put(i, frame, x, extra)
const pinewoodRow = (put, i, inBend, end) => {
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
};

const quayRow = (put, i) => {
  if (i % QUAY_LAMP === 0) for (const side of [-1, 1]) put(i, 'quayLamp', side * 1.28);
};

const rockRow = (put, i, side) => {
  if (i % 2 === 0) put(i, 'rock0', side * (2.2 + hash(i, 83) * 0.3));
  if (i % 7 === 3) put(i, hash(i, 87) < 0.5 ? 'pine0' : 'cypress', side * (2.6 + hash(i, 89)), { far: true });
};

const saltRow = (put, i, side = 0) => {
  if (i % 12 === 4) put(i, 'pole', 1.62, { far: true });
  for (const s of side ? [side] : [-1, 1]) {
    if (i % 6 === (s > 0 ? 1 : 4) && hash(i, s + 31) > 0.42) put(i, hash(i, s + 33) < 0.5 ? 'saltHeap0' : 'saltHeap1', s * (2.5 + hash(i, s + 35) * 4), { far: true });
  }
};

const SCENERY = {
  pinewood: pinewoodRow,
  test: pinewoodRow,
  // the quay at dusk, sea on the left and sheds on the right; the town; then the cliff road
  harbour(put, i, inBend, end, Z) {
    const d = i * SEG_LEN;
    if (d < Z.quay) {
      quayRow(put, i);
      if (i % 4 === 1) put(i, 'bollard', -1.2);
      if (i % 6 === 2) put(i, `boat${i % 3}`, -(1.9 + hash(i, 43) * 1.2));
      if (i % 5 === 0) put(i, `shed${i % 3}`, 2.45 + hash(i, 45) * 0.3);
    } else if (d < Z.town) {
      for (const side of [-1, 1]) if (i % 5 === (side > 0 ? 0 : 2)) put(i, `shed${(i + side + 3) % 3}`, side * (2.3 + hash(i, 47) * 0.3));
      if (i % 9 === 3) put(i, 'cypress', 1.72);
      if (i % QUAY_LAMP === 0 && d > Z.town - 40) quayRow(put, i);
    } else {
      rockRow(put, i, 1);
      if (d < Z.gull && i % 8 >= 5) put(i, 'wall', -1.32, { far: true });
    }
  },
  // the flat white road: nothing stands here but poles and salt, and one pump
  salt(put, i) {
    const d = i * SEG_LEN;
    saltRow(put, i);
    if (i % 11 === 7 && hash(i, 39) > 0.45) put(i, 'tamarisk', (i % 2 ? 1 : -1) * (1.62 + hash(i, 37) * 0.4));
    if (i % 61 === 20) put(i, 'windpump', (i % 2 ? -1 : 1) * (4 + hash(i, 49) * 2), { far: true });
    if (i % 25 === 0 && d > 100) put(i, 'stone', 1.2);
  },
  // the whole coast in one lap: the pit straight, the salt, the terraces, the climb, the wall
  coppa(put, i, inBend, end, Z) {
    const d = (i * SEG_LEN) % Z.lap;
    if (d < Z.pit || d >= Z.straight) {
      quayRow(put, i);
      if (i % 6 === 2) put(i, `shed${i % 2}`, -2.4 - hash(i, 51) * 0.3);
      if (i % 6 === 4) put(i, `shed${(i + 1) % 2}`, 3 + hash(i, 53) * 0.4);
    } else if (d < Z.salt) {
      if (i % 5 === 1) put(i, `shed${i % 2}`, -2.4);
      if (i % QUAY_LAMP === 0) put(i, 'quayLamp', -1.28);
    } else if (d < Z.terraces) saltRow(put, i, -1);
    else if (d < Z.climb) {
      if (i % 4 === 1) for (const side of [-1, 1]) put(i, 'cypress', side * (1.7 + hash(i, side + 55) * 0.4), { far: true });
    } else if (d < Z.gull) pinewoodRow(put, i, inBend, end);
    else rockRow(put, i, 1);
  },
};

// Where the sea, the pans and the stone walls are: a strip of the view's ground, not a thing that stands
// water: [from, to, side, from the road's middle, in widths]; stone: [from, to, side, x, m high]
const GROUND = {
  harbour: (Z, track) => ({ water: [[0, Z.quay, -1, 1.3], [Z.town + 60, track.length + 200, -1, 1.5]], stone: [] }),
  salt: (Z, track) => ({ water: [[8, Z.crossing - 60, -1, 2.3], [8, Z.crossing - 60, 1, 2.3], [Z.crossing + 80, track.length + 200, -1, 2.3], [Z.crossing + 80, track.length + 200, 1, 2.3]], stone: [] }),
  coppa: (Z) => ({ lap: Z.lap, water: [[0, Z.pit, -1, 1.4], [Z.straight, Z.lap, -1, 1.4], [Z.salt, Z.terraces, 1, 2.3], [Z.gull, Z.straight, -1, 1.5]], stone: [[Z.terraces + 5, Z.climb, -1, 1.42, 2.8], [Z.terraces + 5, Z.climb, 1, 1.42, 2.8]] }),
};

export function groundRows(track) {
  const n = track.segments.length;
  const water = Array.from({ length: n }, () => null);
  const walls = Array.from({ length: n }, () => null);
  const G = GROUND[track.id]?.(zonesOf(track), track);
  const add = (list, i, v) => {
    if (i >= 0 && i < n) (list[i] ??= []).push(v);
  };
  const laps = G?.lap ? Math.ceil(track.length / G.lap) + 1 : 1;
  for (let lap = 0; lap < laps; lap++) {
    const o = lap * (G?.lap ?? 0);
    for (const [a, b, side, from] of G?.water ?? []) for (let d = a + o; d < b + o; d += SEG_LEN) add(water, Math.floor(d / SEG_LEN), { side, from });
    for (const [a, b, side, x, h] of G?.stone ?? []) for (let d = a + o; d < b + o; d += SEG_LEN) add(walls, Math.floor(d / SEG_LEN), { x: side * x, h });
  }
  // the outside of a wall bend: the stone itself, whitewashed along the top
  for (const b of track.bends) {
    if (b.outside !== 'wall') continue;
    for (let d = b.from - 12; d < b.to + 12; d += SEG_LEN) add(walls, Math.floor(d / SEG_LEN), { x: b.side * 1.32, h: 1.5 });
  }
  return { water, walls };
}

// ---- what stands where: the same road every run --------------------------------
export function dressRoad(track) {
  const segs = track.segments;
  const end = Math.ceil(track.length / SEG_LEN);
  const dress = Array.from({ length: segs.length }, () => []);
  const put = (i, frame, x, extra = {}) => {
    if (i >= 0 && i < dress.length) dress[i].push({ frame, x, m: (PROPS[frame.replace(/[RL]$/, '')] || PROPS[frame]).m, ...extra });
  };
  const segOf = (d) => Math.floor(d / SEG_LEN);
  const bendOf = (i) => track.bends.find((b) => i * SEG_LEN >= b.from - 8 && i * SEG_LEN < b.to + 8);
  const row = SCENERY[track.id] || pinewoodRow;
  const Z = zonesOf(track);
  for (let i = 0; i < segs.length; i++) row(put, i, bendOf(i), end, Z);
  // the outside of every bend: straw or stone, and the chevrons over it
  for (const b of track.bends) {
    const turn = -b.side;
    if (b.outside !== 'wall') for (let d = b.from - 8; d < b.to + 8; d += SEG_LEN) put(segOf(d), 'bale', b.side * 1.34);
    for (let d = b.from; d < b.to; d += SEG_LEN * 2.5) put(segOf(d), 'chevron', b.side * (b.outside === 'wall' ? 1.26 : 1.5), { flip: turn < 0 });
  }
  const lapLen = track.lapLen;
  const gulls = (track.things || []).filter((o) => o.kind === 'gull_lamp').flatMap((o) => (lapLen ? [o.d, o.d + lapLen] : [o.d]));
  const pitAt = (d, frame, x, extra) => {
    put(segOf(d), frame, x, extra);
    if (lapLen && d < lapLen) put(segOf(d + lapLen), frame, x, extra); // (the pit wall does not go home after the first lap)
  };
  for (const seg of segs) {
    for (const o of seg.things) {
      if (o.kind === 'lamp') {
        if (!gulls.some((g) => Math.abs(g - o.d) < 12)) put(seg.i, 'lamp', 1.32, { lamp: o.d }); // (the Gull's lamp is the checkpoint there)
      } else if (o.kind === 'board' && o.d > START_D + 8) {
        const hand = o.bend.side > 0 ? 'L' : 'R';
        put(seg.i, `board${o.dist}${hand}`, (o.bend.side > 0 ? -1 : 1) * 1.36);
      } else if (o.kind === 'cart') put(seg.i, 'cart', o.x, { ob: o });
      else if (o.kind === 'crowd') {
        if (track.id === 'salt' && Math.abs(o.d - Z.crossing) < 60) put(seg.i, 'stand', o.side * 2.1);
        else for (let k = 0; k < 3; k++) put(seg.i + k * 2, `crowd${(seg.i + k) % 2}`, o.side * (1.62 + k * 0.03));
      } else if (o.kind === 'bunting') put(seg.i, 'bunting', 0);
      else if (o.kind === 'figure') pitAt(o.d, o.who, 1.42);
      else if (o.kind === 'chair') pitAt(o.d, o.gloves ? 'chairGloves' : 'chair', 1.42);
      else if (o.kind === 'pitboard') pitAt(o.d, 'slate', 1.5, { slate: true });
      else if (o.kind === 'pitbox') {
        for (let d = o.d - 26; d < o.d + o.len + 48; d += 8) pitAt(d, 'pitCounter', 1.66);
      } else if (o.kind === 'gull_lamp') {
        const b = track.bends.find((q) => q.name === 'Gull Bend');
        for (const g of gulls) put(segOf(g), 'gullDark', -b.side * 1.36, { gull: true });
      } else if (o.kind === 'crossing') {
        for (const side of [-1, 1]) put(seg.i, 'crossOff', side * 1.2, { post: o.d });
        put(seg.i, 'gate0', 0, { gate: o.d });
        put(seg.i + 1, 'train', 0, { train: o.d });
      }
    }
  }
  // the start and the line: banners, rope, and on Pinewood a man in a jacket watching
  put(Math.round(START_D / SEG_LEN), 'start', 0);
  if (!track.gate?.scripted) put(end, 'line', 0); // (the Harbour Night Cup has no line: nobody reaches it)
  for (let i = 0; i < 14; i += 2) {
    put(i, 'rope', -1.3);
    put(i, 'rope', 1.3);
  }
  if (track.id === 'pinewood' || track.id === 'test') put(2, 'aldo', -1.48);
  return dress;
}

// the land at the end of the road: headlands over a line of sea, then a nearer ridge
// of pines with a village's roofs in it. Low, hazed, and tiling at 1024 px, because a
// room's backdrop is drawn for a street's scale and would stand like a wall here.
const LAND_W = 1024;
const wave = (x, parts) => parts.reduce((a, [n, amp, ph]) => a + amp * Math.sin((x / LAND_W) * Math.PI * 2 * n + ph), 0);
function paintLand(layer, L, flat = 1) {
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
      const top = Math.round(h - 36 * flat + wave(x, [[3, 13, 0.4], [7, 6, 2.1], [19, 2, 1]]) * flat);
      col(mix(L.far, L.haze, 0.25), x, top, 2, h - top);
      col(mix(L.far, L.cliff, 0.7), x, top + 2, 2, 5 + Math.round(wave(x, [[11, 3, 0]]) + 3));
      col(L.far, x, top + 14, 2, h - top - 14);
    } else {
      const top = Math.round(h - 30 * flat + wave(x, [[2, 9, 1.1], [5, 5, 0.3], [13, 2, 2]]) * flat);
      const bump = Math.round(Math.abs(wave(x, [[61, 2.4, 0], [97, 1.6, 1]])));
      col(L.ridgeDark, x, top - bump, 2, h - top + bump);
      col(L.ridge, x, top - bump, 2, 3);
      if ((x * 7) % 26 < 4) col(L.ridgeLit, x, top - bump + 4, 2, 3);
    }
  }
  if (layer === 0) {
    col(L.sea, 0, h - 8, LAND_W, 8);
    for (let x = 0; x < LAND_W; x += 37) col(L.seaLit, x, h - 6 + (x % 3), 14 + (x % 11), 1);
  } else if (flat === 1) {
    for (const vx of [150, 182, 214, 640, 672, 860]) {
      const top = Math.round(24 + wave(vx, [[2, 9, 1.1], [5, 5, 0.3], [13, 2, 2]])) + 8;
      col(L.wall, vx, top, 16, 8);
      col(L.roof, vx - 1, top - 3, 18, 3);
      col(L.ridgeDark, vx + 6, top + 4, 3, 4);
    }
  }
  return c;
}

// the town's windows on the near ridge, for the dark: over the land, and never dimmed by it
function paintWindows() {
  const c = document.createElement('canvas');
  c.width = LAND_W;
  c.height = 54;
  const ctx = c.getContext('2d');
  for (let x = 6; x < LAND_W; x += 5 + Math.floor(hash(x, 91) * 34)) {
    const top = Math.round(24 + wave(x, [[2, 9, 1.1], [5, 5, 0.3], [13, 2, 2]])) + 5;
    ctx.fillStyle = hash(x, 93) > 0.3 ? '#ffd880' : '#fff0c0';
    ctx.fillRect(x, top + Math.floor(hash(x, 95) * 20), 2, 2);
  }
  return c;
}

const SALT_LAND = { far: 0xb4ccd8, cliff: 0xe8e4d4, haze: 0xf8f4e4, sea: 0xb0d0dc, seaLit: 0xeef8f8, ridge: 0xc4c0a4, ridgeDark: 0xb0ac90, ridgeLit: 0xdcd8c0, wall: 0xf0e8d8, roof: 0xc89878 };

export function freeRoad(scene, theme) {
  for (const key of scene.textures.getTextureKeys()) {
    if (!key.startsWith(`race:${theme.id}:`)) continue;
    const src = scene.textures.get(key).getSourceImage();
    forgetPainted(src);
    scene.textures.remove(key);
  }
}

export class RoadView {
  constructor(scene, track, race, { slow = false, chalk = false, joLivery = 'dante', flags = {} } = {}) {
    this.scene = scene;
    this.track = track;
    this.race = race;
    this.theme = track.theme;
    this.slow = slow;
    this.slowRing = [];
    this.ground = groundOf(track, this.theme.paint);
    this.light = lightOf(track);
    this.bandCache = new Map();
    this.lightStep = -1;
    const k = (part) => keyOf(this.theme, part);
    const dust = !!(flags.tyres_short && track.id === 'salt');
    const sable = !!(flags.sable_name && (track.id === 'salt' || track.id === 'coppa')); // (the clause on her bonnet, from the day it stood)
    this.atlasKey = k(`atlas:${track.id}:${joLivery}${dust ? ':dust' : ''}${sable ? ':sable' : ''}`);
    const entered = track.rivals || (track.rival ? [track.rival] : []);
    const nameOf = (r) => rearOf(r.id, r.livery);
    if (!scene.textures.exists(this.atlasKey)) buildAtlas(scene, this.atlasKey, [...propItems(track), ...carItems(joLivery, entered.map(nameOf), { dust, sable })]);
    this.riv = new Map(race.rivals.map((r) => [r, nameOf(r)]));
    this.frames = scene.textures.get(this.atlasKey).frames;
    this.dress = dressRoad(track);
    this.shadeSeg = track.segments.map((s, i, all) => {
      const rise = (all[i + 1]?.y ?? s.y) - s.y;
      if (rise > 0.02) return 2;
      if (track.id === 'salt') return 0; // (nothing on the Salt Road throws a shadow)
      return rise < -0.02 || hash(Math.floor(i / 2), 41) > 0.62 ? 1 : 0;
    });
    // under the quay's lamps the road is another colour: rows 3 and 4 of the bands, at night
    if (this.light.night) {
      for (const [a, b] of track.lit || []) {
        for (let d = a; d < b; d += SEG_LEN) {
          const i = Math.floor(d / SEG_LEN);
          this.shadeSeg[i] = [0, 1, 6].includes(i % QUAY_LAMP) ? 4 : 3;
        }
      }
      for (const l of track.lamps) this.pool5(Math.floor(l / SEG_LEN), 2, 3);
    }
    const G = groundRows(track);
    this.waterRow = G.water;
    this.wallRow = G.walls;
    this.chalk = chalk ? track.bends.map((b) => chalkAt(b)) : [];
    this.marks = Array.from({ length: track.segments.length }, () => null);
    // the player's own three, from the Night Before: on the road at the Gull Bend, both laps
    if (track.id === 'coppa') {
      const b = track.bends.find((q) => q.name === 'Gull Bend');
      const at = [[flags.mark_brake, b.from - 40], [flags.mark_turn, b.from + 8], [flags.mark_apex, b.from + 50]];
      for (const [has, d] of at) {
        if (!has) continue;
        for (const lap of [0, track.lapLen]) this.mark(d + lap, -b.side * 0.2, 0.7, 0xf2eedc, 0.1, 0.26);
      }
    }
    for (const o of track.things || []) {
      if (o.kind === 'pitbox') this.paintBox(o);
      if (o.kind === 'crossing') {
        // the rails, in the road's own planks
        for (const [k0, k1, c] of [[0, 1, 0x6a5a48], [0.18, 0.26, 0xc8c4bc], [0.74, 0.82, 0xc8c4bc]]) this.mark(o.d, 0, 2.3, c, k0, k1);
      }
    }
    this.gates = race.crossings;
    this.actors = [];
    this.tailOff = new Set();
    this.joOut = false;
    this.clockT = 0;
    this.airK = 0;
    this.airT = 0;
    this.joTint = 0xffffff;
    this.bg = this.theme.paint.haze;

    // the sky and the land: one layer a frame while the picture fades up, so the door has none to paint
    this.sky = scene.add.image(W / 2, HORIZON, this.atlasKey, 'stone@0').setOrigin(0.5, 1).setDepth(0).setVisible(false);
    this.sky2 = null;
    this.land = [];
    this.landX = 0;
    const skyOf = (name) => {
      const key = k(`sky:${name}`);
      if (!scene.textures.exists(key)) scene.textures.addCanvas(key, name === 'day' ? paintSky(this.theme.sky) : paintLightSky(LIGHTS[name].sky));
      return key;
    };
    const flat = track.id === 'salt' ? 0.35 : 1;
    const ridge = track.id === 'salt' ? SALT_LAND : this.theme.ridge;
    this.todo = [
      () => this.sky.setTexture(skyOf(this.light.from)).setDisplaySize(W + MARGIN * 2, HORIZON + 100).setVisible(true),
      ...(this.light.to !== this.light.from
        ? [() => {
            this.sky2 = scene.add.image(W / 2, HORIZON, skyOf(this.light.to)).setOrigin(0.5, 1).setDepth(0).setDisplaySize(W + MARGIN * 2, HORIZON + 100).setAlpha(0);
            this.lightStep = -1;
          }]
        : []),
      ...LAND_RATE.map((f, i) => () => {
        const key = k(`land${i}${flat === 1 ? '' : ':flat'}`);
        if (!scene.textures.exists(key)) scene.textures.addCanvas(key, paintLand(i, ridge, flat));
        const h = scene.textures.get(key).getSourceImage().height;
        this.land[i] = { ts: scene.add.tileSprite(-MARGIN, HORIZON, W + MARGIN * 2, h, key).setOrigin(0, 1).setDepth(1 + i), f };
        this.lightStep = -1;
      }),
      ...(this.light.night
        ? [() => {
            const key = k('windows');
            if (!scene.textures.exists(key)) scene.textures.addCanvas(key, paintWindows());
            this.windows = scene.add.tileSprite(-MARGIN, HORIZON, W + MARGIN * 2, 54, key).setOrigin(0, 1).setDepth(3).setAlpha(0);
            this.lightStep = -1;
          }]
        : []),
    ];
    this.todo.shift()(); // the sky at once: it is the cheapest, and the picture's background

    this.g = scene.add.graphics().setDepth(5);
    this.air = scene.add.graphics().setDepth(59);
    this.pool = Array.from({ length: POOL }, () => scene.add.image(-400, 0, this.atlasKey, 'stone@1').setOrigin(0.5, 1).setDepth(10).setVisible(false));
    this.poolUsed = 0;
    this.want = [];
    this.chalkSegs = new Set(this.chalk.map((d) => Math.floor(d / SEG_LEN)));
    this.slateKey = k(`slate:${track.id}`);
    this.slateText = '';
    if (this.frames['slate@0']) {
      if (!scene.textures.exists(this.slateKey)) scene.textures.createCanvas(this.slateKey, 96, 82);
      this.setSlate('');
    }
    this.litLamps = new Set();

    // Jo's car: the tyres stay on the road, the body moves on its springs
    this.tyres = scene.add.image(W / 2, CAR_Y, this.atlasKey, 'tyres-0@0').setOrigin(0.5, 1).setScale(CAR_SCALE).setDepth(60);
    this.body = scene.add.image(W / 2, CAR_Y, this.atlasKey, 'body0@0').setOrigin(0.5, 1).setScale(CAR_SCALE).setDepth(61);
    this.joTail = this.frames['tail-on@0'] ? scene.add.image(W / 2, CAR_Y, this.atlasKey, 'tail-on@0').setOrigin(0.5, 1).setScale(CAR_SCALE).setDepth(62).setVisible(false) : null;
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

  // a pool of light on the road, round a lamp: only makes a dark strip lighter
  pool5(i, reach, row) {
    for (let j = i - reach; j <= i + reach; j++) if (this.shadeSeg[j] !== undefined && this.shadeSeg[j] < row) this.shadeSeg[j] = row;
  }

  // something painted on the road: x its middle, w its width in road widths, k0..k1 of the 4 m strip
  mark(d, x, w, c, k0 = 0, k1 = 1) {
    const i = Math.floor(d / SEG_LEN);
    if (!this.marks[i]) this.marks[i] = [];
    this.marks[i].push({ l: x - w / 2, r: x + w / 2, c, k0, k1 });
  }

  // the box: white paint round a teal floor, a rectangle you can see coming; both laps
  paintBox(o) {
    for (const lap of [0, this.track.lapLen || 0]) {
      for (let d = o.d; d < o.d + o.len; d += SEG_LEN) {
        this.mark(d + lap, 0, 1.7, 0x2a6a6a);
        for (const side of [-1, 1]) this.mark(d + lap, side * 0.86, 0.06, 0xf2eedc);
      }
      this.mark(o.d + lap, 0, 1.78, 0xf2eedc, 0, 0.28);
      this.mark(o.d + o.len - SEG_LEN + lap, 0, 1.78, 0xf2eedc, 0.72, 1);
    }
  }

  // Teo's sump, on the road: dark, with the sky's shine on it so it can be seen coming
  addOil(o) {
    (this.oils ??= []).push(o);
    // (slices of a spill, narrow at its ends and never straight-edged: a patch of tar is what the road already has)
    const n = Math.ceil(o.len);
    for (let i = 0; i < n; i++) {
      const d = o.d + i;
      const k0 = (d % SEG_LEN) / SEG_LEN;
      const body = Math.sin(((i + 0.5) / n) * Math.PI) ** 0.6;
      const x = o.x + (hash(i, o.d) - 0.5) * o.wide * 0.3;
      this.mark(d, x, o.wide * body * (0.65 + hash(i, o.d + 1) * 0.35), 0x24202a, k0, k0 + 1 / SEG_LEN);
      if (i % 2) this.mark(d, x + (hash(i, o.d + 2) - 0.5) * o.wide * 0.4, o.wide * 0.14 * body, i % 4 === 1 ? 0x5a7a88 : 0x7a5a88, k0, k0 + 1 / SEG_LEN);
    }
  }

  setSlate(text) {
    if (!this.frames['slate@0'] || (text === this.slateText && this.slatePainted)) return;
    this.slateText = text;
    this.slatePainted = true;
    const tex = this.scene.textures.get(this.slateKey);
    paintSlate(tex.getContext(), 96, 82, text);
    tex.refresh();
  }

  // what the story does on the road (RaceScene hands over every event)
  react(e) {
    const rival = (id) => this.race.rivals.find((c) => c.id === id);
    switch (e.type) {
      case 'oil_drop':
        this.addOil(e);
        break;
      case 'aldo_dark': {
        const c = rival('aldo');
        this.tailOff.add(c);
        this.smoke(c.d, c.x, 4);
        this.setPool(false);
        break;
      }
      case 'gull_lamp':
        this.setPool(e.state === 'lit');
        if (e.state === 'lit') this.bloomT = 0;
        break;
      case 'wheel': {
        const c = rival(e.id);
        this.tailOff.add(c);
        const b = this.race.bendAt(c.d);
        this.smoke(c.d, c.x, 5);
        const side = b ? b.side : 1;
        this.wreckMarks(c, -side);
        this.actors.push({
          actor: true, frame: 'wheel', m: 0.7, d: c.d, x: c.x, lift: 0, v: c.v * 1.05, vx: side * 0.5, phase: 0,
          step(a, h) {
            a.d += a.v * h;
            a.v = Math.max(0, a.v - 6 * h);
            a.x = Math.max(-1.9, Math.min(1.9, a.x + a.vx * h));
            a.phase += h * (2.5 + a.v * 0.35);
            a.lift = Math.abs(Math.sin(a.phase)) * (0.15 + 0.9 * Math.min(1, a.v / 20));
          },
        });
        break;
      }
      case 'choice':
        if (e.how === 'stop') this.helpCassian();
        break;
      case 'pit':
        this.crewOut();
        break;
      default:
    }
  }

  // the Gull lamp's own pool on the road: it comes and goes with the lamp
  setPool(on) {
    const d = this.track.things?.find((o) => o.kind === 'gull_lamp')?.d;
    if (d === undefined) return;
    for (const g of this.track.lapLen ? [d, d + this.track.lapLen] : [d]) {
      const i = Math.floor(g / SEG_LEN);
      for (let j = i - 4; j <= i + 4; j++) this.shadeSeg[j] = on ? (Math.abs(j - i) < 3 ? 4 : 3) : j % 2;
    }
  }

  smoke(d, x, n) {
    for (let i = 0; i < n; i++) {
      const life = 1.1 + i * 0.3;
      this.actors.push({
        actor: true, frame: 'smoke', m: 1.4, d: d + (i - n / 2) * 0.7, x: x + (i % 2 ? 0.1 : -0.1), lift: 0.3, alpha: 0.9, t: -i * 0.08, life,
        step(a, h) {
          a.m += h * 2.2;
          a.lift += h * 1.1;
          a.alpha = Math.max(0, 0.9 * (1 - a.t / life));
        },
      });
    }
  }

  // where he went off, so it can be found at speed in the moment to choose: a column of smoke over the
  // straw he is going into, and a marshal on the verge just past it, waving the road down
  wreckMarks(c, side) {
    const at = c.d + 20;
    const x = side * 1.15;
    for (let i = 0; i < 12; i++) {
      const life = 2.2;
      this.actors.push({
        actor: true, frame: 'smoke', m: 2.4, d: at + (i % 3) - 1, x: x + (i % 2 ? 0.08 : -0.08), lift: 0.2, alpha: 0, t: -i * 0.4, life,
        step(a, h) {
          a.m += h * 2.2;
          a.lift += h * 2.6;
          a.alpha = Math.max(0, 0.85 * (1 - a.t / life));
        },
      });
    }
    this.actors.push({
      actor: true, frame: 'marshal', m: 1.8, d: c.d + 8, x: side * 1.45, t: 0, life: 8,
      step(a) {
        a.lift = Math.abs(Math.sin(a.t * 9)) * 0.14; // (both arms going: a man waving the road down)
      },
    });
  }

  // Jo pulls up, runs to him, is waved off; two marshals come. Everything within the 3.4 s the script holds
  helpCassian() {
    const c = this.race.rivals.find((q) => q.id === 'cassian');
    const jo = this.race.jo;
    if (!c) return;
    this.joOut = true;
    // (he may have stopped past him: the picture goes back up the road so you can see what you stopped for)
    this.camWant = Math.max(0, jo.d - c.d + 5);
    this.camHold = TUNE.stopHelp - 0.6;
    if (this.camWant > 0) {
      for (const frame of ['tyres-0', 'body-empty']) this.actors.push({ actor: true, frame, m: 1.56, d: jo.d - CAR_LEN / 2, x: jo.x, t: 0, life: TUNE.stopHelp + 0.2 });
    }
    const home = jo.d + 1;
    const to = c.d - 1.5;
    const toX = c.x + (jo.x < c.x ? -0.3 : 0.3);
    const ms = TUNE.stopHelp;
    const view = this;
    this.actors.push({
      actor: true, frame: 'jo0', m: 1.75, d: home, x: jo.x - 0.25, t: 0, life: ms,
      step(a) {
        const k = Math.min(1, a.t / (ms * 0.45)) - Math.max(0, (a.t - ms * 0.6) / (ms * 0.4));
        a.d = home + (to - home) * k;
        a.x = jo.x - 0.25 + (toX - jo.x + 0.25) * k;
        a.lift = Math.abs(Math.sin(a.t * 12)) * 0.12 * (k > 0 && k < 1 ? 1 : 0);
        if (a.t >= ms - 0.05) view.joOut = false;
      },
    });
    this.actors.push({
      actor: true, frame: 'cassian0', m: 1.8, d: c.d + 0.5, x: c.x, t: 0, life: 30,
      step(a) {
        a.frame = Math.floor(a.t * 4) % 2 ? 'cassian0' : 'cassian1';
      },
    });
    for (const side of [-1, 1]) {
      this.actors.push({
        actor: true, frame: 'marshal', m: 1.8, d: c.d + 3 + side, x: c.x + side * 2.2, t: 0, life: 30,
        step(a) {
          const k = Math.max(0, Math.min(1, (a.t - 1.2) / 1.6));
          a.x = c.x + side * (2.2 - 1.9 * k);
          a.alpha = k > 0 ? 1 : 0;
          a.lift = k > 0 && k < 1 ? Math.abs(Math.sin(a.t * 11)) * 0.1 : 0;
        },
      });
    }
  }

  // the crew comes over the wall to the car in the box, and goes back
  crewOut() {
    const jo = this.race.jo;
    const ms = this.race.script.holdT;
    for (const [frame, x] of [['crew', 0.55], ['crew', -0.55]]) {
      const home = 1.4;
      this.actors.push({
        actor: true, frame, m: 1.75, d: jo.d + 2.5, x: home, t: 0, life: ms,
        step(a) {
          const k = Math.min(1, a.t / 0.5) - Math.max(0, (a.t - (ms - 0.4)) / 0.4);
          a.x = home + (jo.x + x - home) * k;
          a.lift = k > 0 && k < 1 ? Math.abs(Math.sin(a.t * 14)) * 0.1 : 0;
        },
      });
    }
  }

  stepActors(h) {
    if (!this.actors.length) return;
    this.actors = this.actors.filter((a) => {
      a.t = (a.t ?? 0) + h;
      if (a.step && a.t >= 0) a.step(a, h);
      return !a.life || a.t < a.life;
    });
    this.actors.sort((a, b) => a.d - b.d);
  }

  // the day moves on: new bands, the second sky coming up, the land dimmed. In steps, so a frame rarely pays
  updateLight(jd) {
    const step = this.light.from === this.light.to ? 0 : Math.round(lightK(this.track, jd) * STEPS);
    if (step === this.lightStep) return;
    this.lightStep = step;
    const L = this.light.at(step);
    this.L = L;
    if (!this.bandCache.has(step)) this.bandCache.set(step, paintBands(this.ground, L));
    this.bands = this.bandCache.get(step);
    if (this.sky2) this.sky2.setAlpha(step / STEPS);
    for (const l of this.land) if (l) l.ts.setTint(L.land);
    if (this.windows) this.windows.setAlpha(Math.min(1, L.dark * 1.2));
    this.scene.cameras.main.setBackgroundColor(L.dark > 0.5 ? L.nightHaze : L.haze);
    const row = this.shadeSeg[Math.max(0, Math.floor(jd / SEG_LEN))] ?? 0;
    this.joTint = L.dark ? mix(0xffffff, mix(L.spriteAmbient, L.warm, row >= 3 ? 1 : 0.6), L.dark) : 0xffffff;
    this.fadeFrom = FADE_FROM - (FADE_FROM - 105) * L.dark;
    this.fadeTo = FADE_TO - (FADE_TO - 190) * L.dark;
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
    if (moving) {
      this.clockT += dt / 1000;
      this.stepActors(dt / 1000);
      if (this.camHold > 0) this.camHold -= dt / 1000;
    }
    const wantBack = this.camHold > 0 ? this.camWant : 0;
    this.camBack = (this.camBack || 0) + (wantBack - (this.camBack || 0)) * ease(220);
    if (this.camBack < 0.05 && !wantBack) this.camBack = 0;
    const camD = jd - CAM.back - this.camBack;
    this.updateLight(jd);

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
    this.drawOil(strips);
    this.drawThings(strips, camD);
    this.drawBloom(dt);
    this.drawLand(dt, speedK, moving);
    this.drawCar(dt, speedK, jd, moving);
    this.drawDust(dt, c, moving);
    this.drawAir(dt, c, moving);
  }

  // the draft you can see: streaks of air coming back round his tail at you, and more of them when she goes
  drawAir(dt, c, moving) {
    const g = this.air.clear();
    const on = c.state === 'run' && (c.inDraft || c.slingT > 0) ? 1 : 0;
    this.airK += (on - this.airK) * (1 - Math.exp(-dt / 160));
    if (this.airK < 0.04) return;
    if (moving) this.airT += (dt / 1000) * (c.slingT > 0 ? 2.4 : 1.1);
    const r = c.inDraft && c.draftOf && c.draftOf.scrX !== undefined ? c.draftOf : null;
    const vx = r ? r.scrX : W / 2;
    const vy = r ? r.scrY : HORIZON + 30;
    const hot = c.slingT > 0;
    // (a few short dashes on rays out of his tail, square pixels, faint: air going by, not scratches on the glass)
    for (let i = 0; i < (hot ? 12 : 6); i++) {
      const ang = i * 2.399963;
      const ph = (this.airT + i * 0.283) % 1;
      const reach = 30 + ph * ph * 300;
      const cx = Math.cos(ang);
      const cy = Math.sin(ang) * 0.5;
      const dots = hot ? 4 : 3;
      const gap = 6 + ph * (hot ? 18 : 10);
      g.fillStyle(hot ? 0x88e8ff : 0xe8f4ff, this.airK * (hot ? 0.45 : 0.3) * Math.sin(ph * Math.PI));
      for (let k = 0; k < dots; k++) g.fillRect(Math.round(vx + cx * (reach + k * gap)), Math.round(vy + cy * (reach + k * gap)), 2, 2);
    }
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
    this.dark = this.L.dark > 0.3;
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
    const row = this.shadeSeg[idx];
    const B = this.bands[k][row];
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
    const water = this.waterRow[idx];
    if (water) for (const w of water) quad(B.water[alt], w.side * w.from, w.side * 40);
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
      if (this.chalkSegs.has(idx)) quad(this.L.dark ? mul(0xf2eedc, spriteTint(this.L, n.z, row, 0.6)) : 0xf2eedc, -0.86, 0.86);
    } else if (bend) {
      quad(B.kerb[alt], -1.1, -1);
      quad(B.kerb[alt], 1, 1.1);
    } else if (this.dark) {
      // whitewashed stones along the edge: at night you read the road by them, a long way past the lights
      quad(B.edge, -1.05, -1);
      quad(B.edge, 1, 1.05);
    }
    const marks = this.marks[idx];
    if (marks && n.z < 200) {
      const T = this.L.dark ? spriteTint(this.L, n.z, row, 0.5) : 0xffffff;
      for (const m of marks) {
        const ya = y1 + (yClamp - y1) * m.k0;
        const yb = y1 + (yClamp - y1) * m.k1;
        const xa = f.x + (nx - f.x) * m.k0;
        const xb = f.x + (nx - f.x) * m.k1;
        const wa = f.halfW + (nw - f.halfW) * m.k0;
        const wb = f.halfW + (nw - f.halfW) * m.k1;
        g.fillStyle(T === 0xffffff ? m.c : mul(m.c, T));
        g.fillTriangle(xa + m.l * wa, ya, xa + m.r * wa, ya, xb + m.r * wb, yb);
        g.fillTriangle(xa + m.l * wa, ya, xb + m.r * wb, yb, xb + m.l * wb, yb);
      }
    }
    const walls = this.wallRow[idx];
    if (walls) {
      for (const w of walls) {
        const xf = f.x + w.x * f.halfW;
        const xn = nx + w.x * nw;
        const hf = w.h * f.scale;
        const hn = w.h * (f.scale + (n.scale - f.scale) * cut);
        const capK = 0.22;
        // courses of dressed stone, staggered strip to strip, and the whitewash along the top
        const courses = n.z < 60 ? 4 : 2;
        for (let q = 0; q < courses; q++) {
          const a = (1 - capK) * (q / courses);
          const b = (1 - capK) * ((q + 1) / courses);
          g.fillStyle(B.wallStone[(q + idx) % 2]);
          g.fillTriangle(xf, y1 - hf * b, xf, y1 - hf * a, xn, yClamp - hn * a);
          g.fillTriangle(xf, y1 - hf * b, xn, yClamp - hn * a, xn, yClamp - hn * b);
        }
        g.fillStyle(alt ? B.wallCap : B.edge);
        g.fillTriangle(xf, y1 - hf, xf, y1 - hf * (1 - capK), xn, yClamp - hn * (1 - capK));
        g.fillTriangle(xf, y1 - hf, xn, yClamp - hn * (1 - capK), xn, yClamp - hn);
      }
    }
    // the line, in chequers across the road
    const L = this.track.length;
    if (seg.d <= L && seg.d + SEG_LEN > L && !this.track.gate?.scripted) {
      for (let c = -8; c < 8; c++) {
        quad(c % 2 === 0 ? 0xf2e6cc : 0x14101a, c / 8, (c + 1) / 8);
      }
    }
  }

  // the nearest things have the pool first; then painted far to near, so the images'
  // own order is the depth and nothing needs sorting
  drawThings(strips, camD) {
    const maxN = (this.slow ? SLOW_POOL : POOL) * 3;
    let cars = this.race.rivals.filter((c) => c.d > camD + 2 && c.d < camD + 240).sort((a, b) => a.d - b.d);
    if (this.actors.length) cars = [...cars, ...this.actors.filter((a) => a.d > camD + 2 && a.d < camD + 240)].sort((a, b) => a.d - b.d);
    this.placeDynamic();
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
      if (n >= POOL - 1) break;
      if (!want[k + 2]) n += this.place(n, want[k], want[k + 1]);
      else n += want[k].actor ? this.placeActor(n, want[k], want[k + 1], want[k + 2]) : this.placeCar(n, want[k], want[k + 1], want[k + 2]);
    }
    for (let i = n; i < this.poolUsed; i++) this.pool[i].setVisible(false);
    this.poolUsed = n;
    this.stats.sprites = n;
  }

  onScreen(t, s) {
    const hPx = t.m * s.scale;
    if (hPx < 5) return false; // (a bale at 150 m is a speck: the pool has better uses)
    const near = this.frames[`${this.frameOf(t)}@0`];
    if (!near || (t.train && !t.on)) return false;
    const x = s.x + t.x * s.halfW;
    const halfW = (hPx * near.width) / near.height / 2;
    return x + halfW >= -MARGIN && x - halfW <= W + MARGIN;
  }

  // one image of the pool on a strip: scaled, cut off at the crest, sunk in the haze
  place(n, t, s) {
    const tall = t.m > 4 ? 1 : 0;
    const nearK = t.ob || !NEAR_FADES.test(t.frame) ? 1 : Math.min(1, (s.z - NEAR_GONE[tall]) / (NEAR_FULL[tall] - NEAR_GONE[tall]));
    if (nearK <= 0) return 0;
    const hPx = t.m * s.scale;
    const x = s.x + t.x * s.halfW;
    const near = this.frames[`${this.frameOf(t)}@0`];
    const y = s.y + this.pitch;
    const clip = s.clip + this.pitch;
    const shown = y > clip ? hPx - (y - clip) : hPx;
    if (shown <= 1) return 0;
    const f = this.frameOf(t);
    let name = `${f}@0`;
    if (hPx < near.height * 0.32 && this.frames[`${f}@2`]) name = `${f}@2`;
    else if (hPx < near.height * 0.66 && this.frames[`${f}@1`]) name = `${f}@1`;
    const row = this.shadeSeg[s.seg.i] ?? 0;
    const glow = EMISSIVE.has(f);
    // (the light is on the road: the further off it, the less of it reaches)
    const spread = Math.max(0, Math.min(1, 1.45 - Math.abs(t.x) * 0.42));
    const tint = glow || !this.L.dark ? 0xffffff : spriteTint(this.L, s.z, row, REFLECTIVE.has(f) ? 0.7 : 0, spread);
    if (t.slate && s.z < NEAR_SLATE) this.show(this.pool[n], '__BASE', x, y, hPx, shown, s.z, false, tint, this.slateKey, true);
    else this.show(this.pool[n], name, x, y, hPx, shown, s.z, t.flip, tint, this.atlasKey, glow || row >= 3);
    if (nearK < 1) this.pool[n].setAlpha(this.pool[n].alpha * nearK);
    if (f === 'gullLit') this.gullAt = { x, y: y - hPx * 0.8, h: hPx, seen: this.clockT };
    // a house's lit windows, over a wall the dark has taken
    if (this.L.dark > 0.15 && f.startsWith('shed') && shown >= hPx) {
      this.show(this.pool[n + 1], name.replace('@', 'w@'), x, y, hPx, hPx, 1, false);
      this.pool[n + 1].setAlpha(Math.min(1, this.L.dark * 1.3));
      return 2;
    }
    return 1;
  }

  // what is on the road for the crossing this frame: which way the arm is, the lamps' turn, where the train is
  placeDynamic() {
    if (!this.gates?.length) return;
    for (const o of this.gates) {
      const t = this.crossT ?? (this.crossT = this.dress.flat().find((q) => q.train));
      t.on = o.state === 'shut';
      if (t.on) t.x = -7.5 + 15 * (o.t / TUNE.crossingShut);
    }
  }

  frameOf(t) {
    if (t.frame === 'lamp') return this.litLamps.has(t.lamp) || this.light.night ? 'lampLit' : 'lamp';
    if (t.gull) return this.race.script?.lamp === 'lit' ? 'gullLit' : 'gullDark';
    if (t.gate !== undefined) {
      const o = this.gates.find((q) => q.d === t.gate);
      if (o.state === 'shut') return 'gate2';
      if (o.state === 'bell') return o.t < TUNE.crossingBell - 1.1 ? 'gate0' : o.t < TUNE.crossingBell - 0.5 ? 'gate1' : 'gate2';
      return 'gate0';
    }
    if (t.post !== undefined) {
      const o = this.gates.find((q) => q.d === t.post);
      if (o.state === 'open') return 'crossOff';
      return Math.floor(this.clockT * 3.2) % 2 ? 'crossA' : 'crossB';
    }
    return t.frame;
  }

  show(img, name, x, y, hPx, shown, z, flip = false, tint = 0xffffff, key = this.atlasKey, keepLit = false) {
    if (!img.visible) img.setVisible(true);
    if (img.texture.key !== key) img.setTexture(key, name);
    else if (img.frame.name !== name) img.setFrame(name);
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
    const alpha = keepLit || z <= this.fadeFrom ? 1 : Math.max(0, 1 - (z - this.fadeFrom) / (this.fadeTo - this.fadeFrom));
    if (img.alpha !== alpha) img.setAlpha(alpha);
    if (img.tintTopLeft !== tint) img.setTint(tint);
  }

  // where a thing between two strips stands, or null
  between(obj, s, f) {
    const k = f === s ? 0 : Math.max(0, Math.min(1, (obj.d - s.seg.d) / SEG_LEN));
    const z = s.z + (f.z - s.z) * k;
    if (z < 1.5) return null;
    const scale = (s.scale * s.z) / z;
    return { k, z, scale, x: s.x + (f.x - s.x) * k + obj.x * scale * ROAD_M, y: s.y + (f.y - s.y) * k + this.pitch, clip: s.clip + this.pitch };
  }

  // a rival: the frame for what he is doing, and his lamps over it, which the dark does not touch.
  // Returns how many of the pool it used
  placeCar(n, c, s, farther) {
    const at = this.between(c, s, farther || s);
    if (!at) return 0;
    const { z, scale, x, y, clip } = at;
    const hPx = CAR_M.height * scale;
    if (hPx < 2) return 0;
    const shown = y > clip ? hPx - (y - clip) : hPx;
    if (shown <= 1) return 0;
    const name = this.riv.get(c);
    // she points where she is going: the wheel in his hands, what the road is doing
    const bend = this.race.bendAt(c.d);
    const wantYaw = ((c.x - c.prevX) / STEP) * 1.6 + (bend && c.v > 10 ? -bend.side * 0.6 : 0);
    c.viewYaw = (c.viewYaw ?? 0) + (wantYaw - (c.viewYaw ?? 0)) * 0.18;
    const tellFor = c.tellAt !== undefined ? this.race.t - c.tellAt : Infinity;
    const looking = tellFor >= 0 && tellFor < TUNE.blockTell + 0.2 && c.state === 'run';
    let base = `rear-${name}`;
    if (c.out && this.frames[`${base}-broke@0`]) base += '-broke';
    else if (looking && this.frames[`${base}-look@0`]) base += '-look';
    else if (Math.abs(c.viewYaw) > 0.45) base += c.viewYaw > 0 ? '-R' : '-L';
    const big = hPx >= 40 || !this.frames[`${base}@1`];
    const row = this.shadeSeg[s.seg.i] ?? 0;
    const tint = this.L.dark ? spriteTint(this.L, z, row, 0.35) : 0xffffff; // (paint reads a little further than a verge)
    this.show(this.pool[n], `${base}@${big ? 0 : 1}`, x, y, hPx, shown, z, false, tint, this.atlasKey, !big);
    c.scrX = x;
    c.scrY = y - hPx * (1 - LAMP_Y);
    // the lamps: on at night until the story puts them out; bright on the brake; twice, plainly, in the tell
    const flash = looking && tellFlash(tellFor, TUNE.blockTell);
    const lit = (c.braking && c.v > 0.5) || flash;
    const on = this.L.dark > 0.2 && !this.tailOff.has(c);
    if (this.tailOff.has(c) || (!lit && !on) || shown < hPx) return 1;
    // (held in view by a minimum size: two sparks down the road are how you know where he is at night)
    const grow = Math.max(flash ? 2.2 : 1, Math.min(4, (flash ? 40 : 24) / Math.max(1, hPx)));
    const tailH = hPx * grow;
    const frame = `tail-${lit ? 'lit' : 'on'}@${big && grow < 1.4 ? 0 : 1}`;
    this.show(this.pool[n + 1], frame, x, y + hPx * (1 - LAMP_Y) * (grow - 1), tailH, tailH, 1, false);
    return 2;
  }

  placeActor(n, a, s, farther) {
    const at = this.between(a, s, farther || s);
    if (!at || (a.alpha !== undefined && a.alpha <= 0)) return 0;
    const hPx = a.m * at.scale;
    const y = at.y - (a.lift || 0) * at.scale;
    if (hPx < 2 || (at.y > at.clip && hPx - (at.y - at.clip) <= 1)) return 0;
    const tint = a.frame === 'smoke' || !this.L.dark ? 0xffffff : spriteTint(this.L, at.z, this.shadeSeg[s.seg.i] ?? 0, 0.2);
    this.show(this.pool[n], `${a.frame}@0`, at.x, y, hPx, hPx, at.z, false, tint, this.atlasKey, true);
    if (a.alpha !== undefined) this.pool[n].setAlpha(a.alpha);
    return 1;
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
    this.body.setFrame(this.joOut && this.frames['body-empty@0'] ? 'body-empty@0' : `body${yawF}${c.braking && c.v > 0.5 ? '-lit' : ''}@0`);
    if (this.body.tintTopLeft !== this.joTint) {
      this.body.setTint(this.joTint);
      this.tyres.setTint(this.joTint);
    }
    this.body.setPosition(x, CAR_Y + Math.round(this.squat * 2) + buzzY);
    // (the camera has gone back up the road: she is out there with everything else)
    const away = this.camBack > 0.3;
    this.body.setVisible(!away);
    this.tyres.setVisible(!away);
    this.body.setAngle(c.state === 'spin' ? this.yaw * 3 : this.lean * -3);
    const blink = c.ghost > 0 && Math.floor(c.ghost * 10) % 2 ? 0.45 : 1;
    this.body.setAlpha(blink);
    this.tyres.setAlpha(blink);
    if (this.joTail) {
      const lamps = this.L.dark > 0.2;
      this.joTail.setVisible(lamps && !away);
      if (lamps) this.joTail.setPosition(x, this.body.y).setAngle(this.body.angle).setAlpha(blink).setFrame(c.braking && c.v > 0.5 ? 'tail-lit@0' : 'tail-on@0');
    }
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
      // (whole-pixel steps, in size and in alpha: a puff is as hard-edged as the car it came off)
      const age = 520 - p.life;
      p.setAlpha(p.life > 340 ? 1 : p.life > 160 ? 0.66 : 0.33).setScale(p.size + Math.floor(age / 170));
      p.setPosition(Math.round(p.x0 + (p.vx * age) / 1000), Math.round(p.y0 + (p.vy * age) / 1000));
      if (p.life <= 0) p.setVisible(false);
    }
  }

  puff(off, size = 1, tint = 0xd8d4cc) {
    const p = this.dust[this.dustNext];
    this.dustNext = (this.dustNext + 1) % this.dust.length;
    p.life = 520;
    p.vx = off * 0.9 + (Math.random() - 0.5) * 40;
    p.vy = 30 + Math.random() * 30;
    p.size = size > 1.2 ? 2 : 1;
    p.x0 = Math.round(W / 2 + this.carX + off);
    p.y0 = CAR_Y - 6;
    p.setVisible(true).setTint(mul(tint, this.joTint)).setScale(p.size).setAlpha(1).setPosition(p.x0, p.y0);
  }

  burst(n, tint) {
    for (let i = 0; i < n; i++) this.puff((i % 2 ? 1 : -1) * (30 + i * 12), 1.4, tint);
  }

  sparkAt(side = 1) {
    this.sparkLife = 120;
    this.spark.setVisible(true).setPosition(W / 2 + this.carX + side * 70, CAR_Y - 50).setScale(2);
  }

  // a spill too far off to paint in slices: a band of oil's colours, two pixels deep at least, on the strip it lies on
  drawOil(strips) {
    if (!this.oils?.length) return;
    const g = this.g;
    const P = this.pitch;
    for (const o of this.oils) {
      const s = strips.find((q) => q.seg.d <= o.d + o.len / 2 && q.seg.d + SEG_LEN > o.d + o.len / 2);
      if (!s || !s.visible || s.z < OIL_SHEEN[0] || s.z > OIL_SHEEN[1]) continue;
      const y = Math.round(s.y + P);
      if (y > s.clip + P) continue;
      // (wider than the spill itself, as a sheen is: the sky in it carries further than the oil does)
      const half = Math.max(8, Math.round(o.wide * 0.9 * s.halfW));
      const x = Math.round(s.x + o.x * s.halfW);
      const T = this.L.dark ? spriteTint(this.L, s.z, this.shadeSeg[s.seg.i] ?? 0, 0.8) : 0xffffff;
      g.fillStyle(mul(0x1a1622, T)).fillRect(x - half, y - 1, half * 2, 3);
      const tall = s.z > 60 ? 3 : 2; // (a little more glint at 100 m, where it has to be read)
      // the shine on top of it, two rows of the sky's colours broken up: it glints, where tar would not
      const SHEEN = [0xc8a8f0, 0x9af0f8, 0xffffff, 0x9af0f8, 0xf0c8f0];
      for (let k = -half, i = 0; k < half; k += 2, i++) g.fillStyle(mul(SHEEN[i % 5], T)).fillRect(x + k, y - tall - ((i >> 1) % 2), 2, tall);
    }
  }

  // the Gull lamp's light, lit for the first time in the Coppa: it comes up and stays, the one light that matters
  drawBloom(dt) {
    const gl = (this.bloom ??= this.scene.add.graphics().setDepth(11).setBlendMode('ADD'));
    gl.clear();
    if (this.bloomT !== undefined) this.bloomT += dt / 1000;
    const a = this.gullAt;
    if (!a || a.seen !== this.clockT || this.race.script?.lamp !== 'lit') return;
    const up = this.bloomT === undefined ? 1 : Math.min(1, this.bloomT / 0.25);
    const burst = this.bloomT === undefined ? 0 : Math.max(0, 1 - this.bloomT / GULL_BLOOM);
    const r0 = Math.max(10, a.h * 0.32) * (1 + burst * 1.6);
    // rings in whole rows, two pixels at a time: a glow as hard-edged as the picture
    for (const [k, al] of [[1, 0.1], [0.66, 0.16], [0.36, 0.3]]) {
      const r = r0 * k;
      gl.fillStyle(0xffd88a, al * up * (1 + burst * 1.4));
      for (let y = -r; y <= r; y += 2) {
        const w = Math.round(Math.sqrt(r * r - y * y));
        gl.fillRect(Math.round(a.x - w), Math.round(a.y + y), w * 2, 2);
      }
    }
  }

  lightLamp(d) {
    this.litLamps.add(d);
  }

  // what is painted, for the budgets
  textureBytes() {
    const out = {};
    for (const key of this.scene.textures.getTextureKeys()) {
      if (!key.startsWith('race:') || (key.includes(':atlas:') && key !== this.atlasKey)) continue; // (another road's atlas is not this race's bill: it goes when the door is left)
      const src = this.scene.textures.get(key).getSourceImage();
      out[key] = src.width * src.height * 4;
    }
    return out;
  }
}
