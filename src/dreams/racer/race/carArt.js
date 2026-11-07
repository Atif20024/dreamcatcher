// The cars seen from behind, painted in code: a two-seat Italian racer of 1958 from
// a chase camera, so you look down on the tail, past the driver, along the bonnet to
// the front tyres. The side-on kit (src/art/carKit.js) stays for the garage and the
// pit lane; the two share a livery table.
//
// Frames are logical pixels (Jo's car is drawn at 2×, like the type):
//   body-<yaw>[-lit]   the bodywork, yaw -2..2 (nose left .. nose right), brake lamps lit or not
//   tyres-<0|1>        the rear tyres and the shadow, two phases of the tread
//   rear-<livery>[-L|-R|-look|-broke] a whole car for the road ahead: steering, a head turned to the mirror, a wheel gone
//   tail-on, tail-lit  just the two lamps and their glow, over a car: lit at night, flashed in the tell, never dimmed by the dark
import { LIVERIES } from '../../../art/carKit.js';
import { mix, shade, hex } from '../../../art/paint.js';
import SMALL from '../../../ui/fonts/small.js';

export const CAR_W = 112;
export const CAR_H = 92;
export const CAR_M = { width: 1.72, height: 1.45 }; // what a whole frame covers on the road, m
const CX = CAR_W / 2;
const G = CAR_H - 1; // the road
const OUTLINE = 0x1a1420;
const TYRE = 0x1e1a22;
const LAMP = { off: 0x6a1c18, on: 0xff5a38, glow: 0xffb090 };
const SKIN = 0xd8a884;
const JO_HELMET = 0x6a4630;
export const LAMP_Y = 70 / CAR_H; // how far down a frame the lamps sit

// who a rival is from behind: the side-on kit's colours, and what only shows from here
export const REAR = {
  aldo: { ...LIVERIES.dante, trim: 0xb8302a, num: 2, helmet: 0x8a8478, shoulders: 0x6a4a30 }, // the team's first car: cream, and red where Jo's is teal
  dante: { ...LIVERIES.dante, helmet: 0xe8e0d0 },
  brasca: { ...LIVERIES.varga, helmet: 0x5a3a24, dented: true },
  roche: { ...LIVERIES.roche, helmet: 0x101014, goldBand: true, pipes: 2 },
};
// a rival's id to the frame's name, where the data's livery is only the chassis it shares
export const rearOf = (id, livery) => (REAR[id] ? id : REAR[livery] ? livery : 'roche');
// what a rival's dot on the race strip is, and his car at a distance
export const DOT = { aldo: 0xf2e6cc, dante: 0x2a8a88, brasca: 0xd8a032, roche: 0xd8a840, teo: 0xd8a032, cassian: 0xd8a840 };

const rect = (ctx, c, x, y, w, h) => {
  ctx.fillStyle = hex(c);
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};
// an ellipse in whole pixel rows
const oval = (ctx, c, cx, cy, rx, ry) => {
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(1 - (y / (ry + 0.5)) ** 2));
    rect(ctx, c, cx - w, cy + y, w * 2, 1);
  }
};
// bitmap type on a painted thing: the game's own small font, never a canvas font
export function stamp(ctx, text, x, y, c, k = 1) {
  ctx.fillStyle = hex(c);
  let at = x;
  for (const ch of String(text).toUpperCase()) {
    const g = SMALL[ch];
    if (!g) {
      at += 4 * k;
      continue;
    }
    g.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) if (row[rx] === '#') ctx.fillRect(at + rx * k, y + ry * k, k, k);
    });
    at += (g[0].length + 1) * k;
  }
}
export const stampW = (text, k = 1) => [...String(text).toUpperCase()].reduce((w, ch) => w + ((SMALL[ch] ? SMALL[ch][0].length : 3) + 1) * k, -k);

// half the body's width at a row, from a camera above and behind: the tail panel is
// tall and near (the lower half of the frame), the deck and bonnet foreshorten to a
// short taper, and the driver stands up against the far end of it
const PLAN = [[18, 12], [22, 16], [28, 18], [36, 21], [44, 27], [52, 32], [58, 34], [72, 35], [78, 33], [83, 28]];
function halfWidth(y) {
  for (let i = 1; i < PLAN.length; i++) {
    const [y0, w0] = PLAN[i - 1];
    const [y1, w1] = PLAN[i];
    if (y <= y1) return w0 + ((w1 - w0) * (y - y0)) / (y1 - y0);
  }
  return 0;
}

function tyre(ctx, x, y, w, h, phase = -1) {
  rect(ctx, OUTLINE, x - 1, y, w + 2, h);
  rect(ctx, TYRE, x, y + 1, w, h - 2);
  rect(ctx, 0x3a3640, x + 2, y + 2, 2, h - 4);
  if (phase >= 0) for (let r = y + 2 + phase * 3; r < y + h - 2; r += 6) rect(ctx, 0x121016, x + 5, r, w - 6, 1);
}

// the rear tyres and the car's shadow: they stay on the road while the body moves on its springs
export function paintTyres(ctx, phase) {
  ctx.fillStyle = 'rgba(16,12,24,0.42)';
  for (let y = G - 8; y <= G; y++) {
    const w = 53 - (G - y);
    ctx.fillRect(CX - w, y, w * 2, 1);
  }
  rect(ctx, 0x14101a, CX - 32, G - 13, 64, 6); // the axle
  tyre(ctx, CX - 49, G - 34, 19, 34, phase);
  tyre(ctx, CX + 30, G - 34, 19, 34, phase);
}

// opts: look (the head turned to the mirror), empty (nobody in her), dust (last month's tyres), sable (the name on her), broke (a wheel gone)
export function paintBody(ctx, L, yaw = 0, lit = false, { look = 0, empty = false, dust = false, sable = false } = {}) {
  const shift = (y) => (yaw * 3 * (84 - y)) / 70; // the nose swings furthest
  const mid = (y) => CX + shift(y);
  const body = L.body;
  const lite = mix(body, 0xffffff, 0.34);
  const dark = shade(body, 0.74);
  const under = shade(body, 0.5);
  // a wing over a wheel: a pontoon of the bodywork, lit on top
  const wing = (x, y, rx, ry) => {
    oval(ctx, OUTLINE, x, y, rx + 1, ry + 1);
    oval(ctx, body, x, y, rx, ry);
    oval(ctx, lite, x - rx * 0.25, y - ry * 0.4, rx * 0.55, Math.max(1, ry * 0.35));
    rect(ctx, under, x - rx, y + ry - 1, rx * 2, 2);
  };
  // the front tyres under their wings, either side of the bonnet, turned with the wheel
  for (const side of [-1, 1]) {
    const fx = mid(30) + side * 27 + yaw * 2 - 5;
    tyre(ctx, fx, 30, 10, 15);
    if (yaw) rect(ctx, 0x0e0b12, fx + (yaw > 0 ? 7 : 1), 32, 2, 11);
    wing(fx + 5, 30, 8, 4);
  }
  // the deck row by row, rolling over into the tail panel; the flank shows as she turns
  for (let y = 18; y <= 83; y++) {
    const hw = Math.round(halfWidth(y));
    const x0 = Math.round(mid(y)) - hw;
    const rear = y >= 56;
    rect(ctx, OUTLINE, x0 - 1, y, hw * 2 + 2, 1);
    rect(ctx, rear ? (y > 76 ? under : mix(body, dark, 0.5)) : body, x0, y, hw * 2, 1);
    if (!rear) {
      rect(ctx, lite, x0 + 1, y, 3, 1); // lit from the upper left
      rect(ctx, dark, x0 + hw * 2 - 4, y, 4, 1);
    } else {
      rect(ctx, y > 76 ? dark : body, x0 + 2, y, 3, 1);
      rect(ctx, under, x0 + hw * 2 - 4, y, 4, 1);
    }
    if (yaw) {
      const w = Math.abs(yaw) * 2 + 1;
      rect(ctx, under, yaw > 0 ? x0 : x0 + hw * 2 - w, y, w, 1);
    }
  }
  rect(ctx, OUTLINE, mid(18) - 11, 17, 22, 1);
  // the tyres' dust thrown up the arches: the jar paid for last month's
  // the rear wings, over the big tyres
  for (const side of [-1, 1]) {
    wing(mid(54) + side * 37, 55, 12, 7);
    if (dust) {
      oval(ctx, 0x9a8a6c, mid(54) + side * 37, 59, 11, 3);
      for (let k = -9; k <= 9; k += 3) rect(ctx, 0xc8b894, mid(54) + side * 37 + k, 57 + (Math.abs(k) % 2), 2, 1);
    }
  }
  // the stripe down the middle, hump to tail; the deck's edge catches the light where it rolls over
  for (let y = 18; y <= 24; y++) rect(ctx, L.trim, mid(y) - 3, y, 6, 1);
  rect(ctx, lite, mid(55) - 29, 55, 58, 1);
  rect(ctx, L.trim, mid(59) - 34, 59, 68, 2);
  if (L.goldBand) rect(ctx, L.trim, mid(62) - 33, 62, 66, 2);
  if (sable) {
    // the oil company's yellow, as a band across her tail: small, and nowhere near the driver
    rect(ctx, OUTLINE, mid(58) - 35, 57, 70, 6);
    rect(ctx, 0xe0b040, mid(58) - 34, 58, 68, 4);
    rect(ctx, 0xf6d98a, mid(58) - 34, 58, 68, 1);
  }
  // the screen ahead of him, the dark of the cockpit round him, the hump behind his head
  const c = mid(30);
  rect(ctx, 0xbcd8e0, c - 12, 20, 24, 2);
  rect(ctx, 0xe8f4f4, c - 12, 20, 8, 1);
  oval(ctx, OUTLINE, c, 32, 15, 8);
  const hr = mid(46);
  rect(ctx, OUTLINE, hr - 7, 38, 14, 18);
  rect(ctx, body, hr - 6, 38, 12, 17);
  rect(ctx, lite, hr - 6, 38, 3, 17);
  rect(ctx, dark, hr + 3, 38, 3, 17);
  rect(ctx, L.trim, hr - 2, 42, 4, 13);
  if (empty) {
    tailPanel(ctx, L, mid, lit);
    return;
  }
  // the driver: shoulders in his jersey, a leather helmet, the goggles' strap across the back of it
  oval(ctx, OUTLINE, c, 31, 14, 8);
  oval(ctx, L.shoulders, c, 31, 13, 7);
  rect(ctx, shade(L.shoulders, 0.72), c + 6, 28, 6, 8);
  rect(ctx, mix(L.shoulders, 0xffffff, 0.22), c - 10, 26, 6, 3);
  const hy = c + yaw + look * 6;
  const helmet = L.helmet ?? JO_HELMET;
  oval(ctx, OUTLINE, hy, 16, 9, 9);
  oval(ctx, helmet, hy, 16, 8, 8);
  oval(ctx, mix(helmet, 0xffffff, 0.28), hy - 3, 12, 3, 2);
  rect(ctx, shade(helmet, 0.7), hy + 3, 15, 4, 6);
  rect(ctx, 0xe8dcc0, hy - 8, 17, 16, 2); // the strap
  if (look) {
    // the face comes right round: the one pale thing on a dark car, big enough to read from four lengths back
    const fx = hy + look * 9;
    oval(ctx, OUTLINE, fx, 15, 8, 10);
    oval(ctx, SKIN, fx, 15, 7, 9);
    rect(ctx, 0x14101a, fx - 6, 11, 12, 4);
    rect(ctx, 0xbcd8e0, fx - 4 + look * 2, 12, 4, 2);
  }
  tailPanel(ctx, L, mid, lit);
}

// the tail panel: the number in its disc, the two lamps, the pipe, and what he has hit
function tailPanel(ctx, L, mid, lit) {
  const t = mid(68);
  oval(ctx, OUTLINE, t, 69, 8, 8);
  oval(ctx, L.disc ?? L.trim, t, 69, 7, 7);
  stamp(ctx, String(L.num), Math.round(t) - 2, 66, L.numInk ?? 0xf2e6cc);
  for (const side of [-1, 1]) {
    const lx = t + side * 24;
    if (lit) oval(ctx, LAMP.glow, lx, 70, 6, 5);
    oval(ctx, OUTLINE, lx, 70, 4, 3);
    oval(ctx, lit ? LAMP.on : LAMP.off, lx, 70, 3, 2);
    if (lit) rect(ctx, 0xffe8d0, lx - 1, 69, 2, 1);
  }
  rect(ctx, OUTLINE, t + 12, 80, 14, 6);
  rect(ctx, 0x8a7a5c, t + 13, 81, 11, 4);
  rect(ctx, 0x14101a, t + 21, 81, 3, 4);
  if (L.pipes === 2) {
    rect(ctx, OUTLINE, t - 26, 80, 14, 6);
    rect(ctx, 0xd8c070, t - 24, 81, 11, 4);
    rect(ctx, 0x14101a, t - 24, 81, 3, 4);
  }
  if (L.dented) {
    // Brasca's history: a primer-grey wing, creases in the panel, a tail that has met a wall
    oval(ctx, 0x8a8478, t - 37, 55, 9, 5);
    oval(ctx, 0xa8a294, t - 39, 53, 4, 2);
    rect(ctx, shade(L.body, 0.45), t - 30, 63, 12, 2);
    rect(ctx, shade(L.body, 0.45), t - 26, 66, 7, 1);
    rect(ctx, mix(L.body, 0xffffff, 0.3), t - 28, 65, 9, 1);
    rect(ctx, shade(L.body, 0.45), t + 14, 74, 16, 2);
    rect(ctx, shade(L.body, 0.45), t + 20, 62, 2, 7);
    rect(ctx, OUTLINE, t + 26, 76, 8, 8); // the corner stove in
    rect(ctx, 0xb8b0a0, t - 35, 79, 20, 1); // a loose strip of trim
    rect(ctx, 0xb8b0a0, t - 15, 80, 6, 1);
  }
}

// the two lamps by themselves, to lie over a car's frame: whole-pixel rings, no blur
function paintTail(ctx, lit) {
  const rings = lit ? [[15, 'rgba(255,70,40,0.22)'], [10, 'rgba(255,80,50,0.5)'], [6, '#ff5a38'], [3, '#ffe8d0']] : [[6, 'rgba(255,60,40,0.22)'], [4, '#c8302a'], [2, '#ff7a58']];
  for (const side of [-1, 1]) {
    for (const [r, c] of rings) {
      ctx.fillStyle = c;
      for (let y = -r; y <= r; y++) {
        const w = Math.round(Math.sqrt(r * r - y * y));
        ctx.fillRect(CX + side * 24 - w, 70 + y, w * 2, 1);
      }
    }
  }
}

// a car with a wheel gone, nose down on the corner: the Coppa's last lap
function paintBroke(ctx, L) {
  ctx.fillStyle = 'rgba(16,12,24,0.42)';
  ctx.fillRect(CX - 44, G - 6, 88, 6);
  tyre(ctx, CX - 49, G - 34, 19, 34, 0);
  rect(ctx, 0x14101a, CX + 16, G - 13, 30, 5); // the bare hub, on the road
  ctx.save();
  ctx.translate(CX, G);
  ctx.rotate(0.13);
  ctx.translate(-CX, -G + 3);
  paintBody(ctx, L, 0, false, { empty: true });
  ctx.restore();
}

// everything a track's cars need, as atlas items: { name, w, h, paint, lods }
// (rivalIds: [id, livery]. dust, sable: Jo's car on this day)
export function carItems(joLivery, rivals = [], { dust = false, sable = false } = {}) {
  const L = { ...(LIVERIES[joLivery] || LIVERIES.dante), helmet: JO_HELMET };
  const items = [];
  for (const yaw of [-2, -1, 0, 1, 2]) {
    for (const lit of [false, true]) items.push({ name: `body${yaw}${lit ? '-lit' : ''}`, w: CAR_W, h: CAR_H, paint: (ctx) => paintBody(ctx, L, yaw, lit, { dust, sable }) });
  }
  for (const phase of [0, 1]) items.push({ name: `tyres-${phase}`, w: CAR_W, h: CAR_H, paint: (ctx) => paintTyres(ctx, phase) });
  if (!rivals.length) return items;
  items.push({ name: 'body-empty', w: CAR_W, h: CAR_H, paint: (ctx) => paintBody(ctx, L, 0, false, { empty: true, dust, sable }) });
  for (const lit of [false, true]) items.push({ name: lit ? 'tail-lit' : 'tail-on', w: CAR_W, h: CAR_H, lods: 2, paint: (ctx) => paintTail(ctx, lit) });
  const whole = (R, yaw, opts) => (ctx) => {
    paintTyres(ctx, 0);
    paintBody(ctx, R, yaw, false, opts);
  };
  for (const name of new Set(rivals)) {
    const R = REAR[name];
    items.push({ name: `rear-${name}`, w: CAR_W, h: CAR_H, lods: 2, paint: whole(R, 0) });
    items.push({ name: `rear-${name}-L`, w: CAR_W, h: CAR_H, lods: 2, paint: whole(R, -1) });
    items.push({ name: `rear-${name}-R`, w: CAR_W, h: CAR_H, lods: 2, paint: whole(R, 1) });
    if (R.goldBand) {
      items.push({ name: `rear-${name}-look`, w: CAR_W, h: CAR_H, lods: 2, paint: whole(R, 0, { look: 1 }) });
      items.push({ name: `rear-${name}-broke`, w: CAR_W, h: CAR_H, lods: 2, paint: (ctx) => paintBroke(ctx, R) });
    }
  }
  return items;
}
