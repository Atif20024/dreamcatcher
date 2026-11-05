// The cars seen from behind, painted in code: a two-seat Italian racer of 1958 from
// a chase camera, so you look down on the tail, past the driver, along the bonnet to
// the front tyres. The side-on kit (src/art/carKit.js) stays for the garage and the
// pit lane; the two share a livery table.
//
// Frames are logical pixels (Jo's car is drawn at 2×, like the type):
//   body-<yaw>[-lit]   the bodywork, yaw -2..2 (nose left .. nose right), brake lamps lit or not
//   tyres-<0|1>        the rear tyres and the shadow, two phases of the tread
//   rear-<livery>[-lit] a whole car for the road ahead (rivals)
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

export function paintBody(ctx, L, yaw = 0, lit = false) {
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
  // the rear wings, over the big tyres
  for (const side of [-1, 1]) wing(mid(54) + side * 37, 55, 12, 7);
  // the stripe down the middle, hump to tail; the deck's edge catches the light where it rolls over
  for (let y = 18; y <= 24; y++) rect(ctx, L.trim, mid(y) - 3, y, 6, 1);
  rect(ctx, lite, mid(55) - 29, 55, 58, 1);
  rect(ctx, L.trim, mid(59) - 34, 59, 68, 2);
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
  // the driver: shoulders in his jersey, a leather helmet, the goggles' strap across the back of it
  oval(ctx, OUTLINE, c, 31, 14, 8);
  oval(ctx, L.shoulders, c, 31, 13, 7);
  rect(ctx, shade(L.shoulders, 0.72), c + 6, 28, 6, 8);
  rect(ctx, mix(L.shoulders, 0xffffff, 0.22), c - 10, 26, 6, 3);
  const hy = c + yaw;
  const helmet = L.helmet ?? 0x6a4630;
  oval(ctx, OUTLINE, hy, 16, 9, 9);
  oval(ctx, helmet, hy, 16, 8, 8);
  oval(ctx, mix(helmet, 0xffffff, 0.28), hy - 3, 12, 3, 2);
  rect(ctx, shade(helmet, 0.7), hy + 3, 15, 4, 6);
  rect(ctx, 0xe8dcc0, hy - 8, 17, 16, 2); // the strap
  // the tail panel: the number in its disc, the two lamps, the pipe
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
}

// everything a track's cars need, as atlas items: { name, w, h, paint, lods }
export function carItems(joLivery, rivalLiveries = []) {
  const L = LIVERIES[joLivery] || LIVERIES.dante;
  const items = [];
  for (const yaw of [-2, -1, 0, 1, 2]) {
    for (const lit of [false, true]) items.push({ name: `body${yaw}${lit ? '-lit' : ''}`, w: CAR_W, h: CAR_H, paint: (ctx) => paintBody(ctx, L, yaw, lit) });
  }
  for (const phase of [0, 1]) items.push({ name: `tyres-${phase}`, w: CAR_W, h: CAR_H, paint: (ctx) => paintTyres(ctx, phase) });
  for (const id of new Set(rivalLiveries)) {
    const R = LIVERIES[id] || LIVERIES.roche;
    for (const lit of [false, true]) {
      items.push({
        name: `rear-${id}${lit ? '-lit' : ''}`,
        w: CAR_W,
        h: CAR_H,
        lods: 2,
        paint: (ctx) => {
          paintTyres(ctx, 0);
          paintBody(ctx, R, 0, lit);
        },
      });
    }
  }
  return items;
}
