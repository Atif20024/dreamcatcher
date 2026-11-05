// What stands along the Calvessa road, painted in code into RoadView's atlas: stone
// pines and cypress, broom, telegraph poles, straw, boards, the lamp, the farmer's
// cart, the banners over the start and the line. Lit from the upper left; whole
// pixels; the near size of each is what the eye gets at about 10 px a metre.
import { mix, shade, hex } from '../../../art/paint.js';
import { stamp, stampW } from './carArt.js';

const OUTLINE = 0x1a1420;
const rect = (ctx, c, x, y, w, h) => {
  ctx.fillStyle = hex(c);
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};
const oval = (ctx, c, cx, cy, rx, ry) => {
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / (ry + 0.5)) ** 2)));
    rect(ctx, c, cx - w, cy + y, w * 2, 1);
  }
};
const lcg = (seed) => {
  let s = seed >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
};

// an umbrella of needles on a bare leaning trunk: the tree of this coast
const pine = (seed, lean) => (ctx, w, h) => {
  const r = lcg(seed);
  const top = 46;
  for (let y = top; y < h; y++) {
    const k = (y - top) / (h - top);
    const x = w / 2 + lean * (1 - k);
    const tw = 3 + Math.round(k * 3);
    rect(ctx, 0x4a3a2e, x - tw, y, tw * 2, 1);
    rect(ctx, 0x7a6048, x - tw, y, 2, 1);
    if (r() < 0.25) rect(ctx, 0x32281f, x - 1 + Math.round(r() * 4 - 2), y, 3, 1);
  }
  for (const [dx, dy] of [[-16, -14], [15, -11], [-4, -18]]) {
    for (let i = 0; i < 16; i++) rect(ctx, 0x4a3a2e, w / 2 + lean + (dx * i) / 16, top + 6 + (dy * i) / 16, 3, 2);
  }
  const blobs = Array.from({ length: 15 }, () => [8 + r() * (w - 16), 20 + r() * 20, 8 + Math.round(r() * 9), 5 + Math.round(r() * 5)]);
  for (const [x, y, rx, ry] of blobs) oval(ctx, 0x22352c, x, y + 4, rx + 1, ry + 1);
  for (const [x, y, rx, ry] of blobs) oval(ctx, 0x34523a, x, y + 1, rx, ry);
  for (const [x, y, rx, ry] of blobs) oval(ctx, 0x54744a, x - rx * 0.3, y - ry * 0.4, rx * 0.55, Math.max(1, ry * 0.5));
  // needles, only where there is canopy to carry them
  for (let i = 0; i < 90; i++) {
    const [x, y, rx, ry] = blobs[Math.floor(r() * blobs.length)];
    rect(ctx, r() < 0.5 ? 0x7a9458 : 0x1c2c26, x + (r() - 0.5) * rx * 1.5, y + (r() - 0.5) * ry * 1.5, 2, 1);
  }
};

const cypress = (seed) => (ctx, w, h) => {
  const r = lcg(seed);
  for (let y = 2; y < h - 6; y++) {
    const k = (y - 2) / (h - 8);
    const hw = Math.round(((w / 2 - 2) * Math.sin(Math.min(1, k * 1.25) * Math.PI * 0.62)) * (k > 0.9 ? 0.8 : 1)) + 1;
    rect(ctx, 0x1e2e28, w / 2 - hw, y, hw * 2, 1);
    rect(ctx, 0x34503e, w / 2 - hw, y, Math.max(1, hw), 1);
    if (r() < 0.5) rect(ctx, 0x4e6a4a, w / 2 - hw + r() * hw, y, 2, 1);
  }
  rect(ctx, 0x3a2c22, w / 2 - 2, h - 6, 4, 6);
};

const broom = (seed) => (ctx, w, h) => {
  const r = lcg(seed);
  for (let i = 0; i < 9; i++) oval(ctx, i < 4 ? 0x3e5a34 : 0x567a3e, 6 + r() * (w - 12), h - 6 - r() * (h - 14), 5 + Math.round(r() * 3), 3 + Math.round(r() * 3));
  for (let i = 0; i < 26; i++) rect(ctx, r() < 0.8 ? 0xe8c83c : 0xf6e68a, 3 + r() * (w - 6), 2 + r() * (h - 8), 2, 2);
};

const pole = (ctx, w, h) => {
  rect(ctx, 0x4a3a2c, w / 2 - 2, 6, 5, h - 6);
  rect(ctx, 0x7e6448, w / 2 - 2, 6, 2, h - 6);
  rect(ctx, 0x241c18, w / 2 - 2, h - 18, 5, 18);
  for (const y of [10, 20]) {
    rect(ctx, 0x3e3024, 2, y, w - 4, 3);
    for (const x of [3, 9, w - 11, w - 5]) rect(ctx, 0xe8e4d8, x, y - 3, 3, 3);
  }
};

const bale = (ctx, w, h) => {
  const row = (y, x0, n, bw, bh) => {
    for (let i = 0; i < n; i++) {
      const x = x0 + i * bw;
      rect(ctx, OUTLINE, x, y, bw, bh);
      rect(ctx, 0xc8a850, x + 1, y + 1, bw - 2, bh - 2);
      rect(ctx, 0xe4cc78, x + 1, y + 1, bw - 2, 3);
      rect(ctx, 0x9a7c38, x + 1, y + bh - 4, bw - 2, 3);
      for (let k = 3; k < bw - 2; k += 3) rect(ctx, 0xb09040, x + k, y + 4, 1, bh - 8);
      rect(ctx, 0x6a4a28, x + Math.round(bw / 2), y + 1, 1, bh - 2);
    }
  };
  row(h - 14, 0, 2, w / 2, 14);
  row(h - 27, w / 4, 1, w / 2, 13);
};

// > on black, pointing the way the road goes (flipped for the other hand)
const chevron = (ctx, w, h) => {
  rect(ctx, 0x3a3028, w / 2 - 2, h - 8, 4, 8);
  rect(ctx, OUTLINE, 0, 0, w, h - 8);
  rect(ctx, 0xf0e8d8, 1, 1, w - 2, h - 10);
  const n = h - 10;
  for (let i = 0; i < n; i++) {
    const a = Math.abs(i - n / 2);
    for (const off of [4, 18]) rect(ctx, OUTLINE, off + (n / 2 - a) * 0.7, i + 1, 8, 1);
  }
};

// the brake board: the distance in the game's own type, and which way
const board = (dist, dir) => (ctx, w, h) => {
  const ph = h - 16;
  for (const x of [8, w - 12]) rect(ctx, 0x3a3028, x, ph - 2, 4, h - ph + 2);
  rect(ctx, OUTLINE, 0, 0, w, ph);
  rect(ctx, 0xf2e6cc, 2, 2, w - 4, ph - 4);
  rect(ctx, 0xb8302a, 2, 2, w - 4, 15);
  const cx = w / 2;
  for (let i = 0; i < 11; i++) {
    const a = Math.abs(i - 5);
    rect(ctx, 0xf2e6cc, cx + dir * (5 - a) * 1.4 - 5, 4 + i, 12, 1);
  }
  const text = String(dist);
  stamp(ctx, text, Math.round(cx - stampW(text, 2) / 2), 20, OUTLINE, 2);
};

const stone = (ctx, w, h) => {
  oval(ctx, OUTLINE, w / 2, h / 2, w / 2 - 1, h / 2 - 1);
  rect(ctx, OUTLINE, 1, h / 2, w - 2, h / 2);
  oval(ctx, 0xece4d0, w / 2, h / 2, w / 2 - 2, h / 2 - 2);
  rect(ctx, 0xece4d0, 2, h / 2, w - 4, h / 2 - 1);
  rect(ctx, 0xb0a48c, w - 5, 4, 3, h - 5);
  rect(ctx, 0xb8302a, 3, 5, w - 7, 3);
};

// the lamp: a checkpoint, unlit until Jo has passed it
const lamp = (lit) => (ctx, w, h) => {
  const c = w / 2;
  if (lit) {
    for (const [r, a] of [[12, 0.16], [8, 0.3]]) {
      ctx.fillStyle = `rgba(255,214,120,${a})`;
      for (let y = -r; y <= r; y++) {
        const hw = Math.round(Math.sqrt(r * r - y * y));
        ctx.fillRect(c - hw, 13 + y, hw * 2, 1);
      }
    }
  }
  rect(ctx, 0x241e22, c - 2, 18, 4, h - 18);
  rect(ctx, 0x4a4248, c - 2, 18, 1, h - 18);
  rect(ctx, 0x241e22, c - 4, h - 6, 8, 6);
  rect(ctx, 0x241e22, c - 6, 16, 12, 2);
  rect(ctx, lit ? 0xffe8a0 : 0x4a4438, c - 5, 7, 10, 9);
  rect(ctx, lit ? 0xfff8e0 : 0x6a6250, c - 4, 8, 3, 7);
  rect(ctx, 0x241e22, c - 1, 7, 2, 9);
  rect(ctx, 0x241e22, c - 6, 4, 12, 3);
  rect(ctx, 0x241e22, c - 2, 1, 4, 3);
};

// the farmer who did not hear: a hay cart from behind, stopped in the road
const cart = (ctx, w, h) => {
  const r = lcg(31);
  // the shadow, the wheels
  ctx.fillStyle = 'rgba(16,12,24,0.4)';
  ctx.fillRect(2, h - 4, w - 4, 4);
  for (const x of [8, w - 16]) {
    rect(ctx, OUTLINE, x - 1, h - 34, 10, 34);
    rect(ctx, 0x6a4a2c, x, h - 33, 8, 32);
    rect(ctx, 0x8a6a42, x + 1, h - 33, 2, 32);
    for (let y = h - 30; y < h; y += 8) rect(ctx, 0x4a3320, x, y, 8, 2);
  }
  rect(ctx, 0x2a2018, 16, h - 18, w - 32, 4); // the axle
  // the bed and its tailboard
  rect(ctx, OUTLINE, 3, h - 40, w - 6, 22);
  rect(ctx, 0x8a6238, 4, h - 39, w - 8, 20);
  for (let y = h - 37; y < h - 20; y += 5) rect(ctx, 0x6a4a2a, 4, y, w - 8, 1);
  rect(ctx, 0xa8824e, 4, h - 39, w - 8, 2);
  // a red rag on the tailboard: all the warning anybody got
  rect(ctx, 0xc8382c, w / 2 - 7, h - 37, 14, 12);
  rect(ctx, 0x8e241c, w / 2 + 2, h - 37, 5, 12);
  // the hay
  for (let i = 0; i < 26; i++) {
    const k = r();
    oval(ctx, 0x9a7c38, 8 + r() * (w - 16), h - 42 - k * 24, 7 + Math.round(r() * 5), 4 + Math.round(r() * 3));
  }
  for (let i = 0; i < 22; i++) oval(ctx, 0xd4b45c, 10 + r() * (w - 22), h - 46 - r() * 22, 5 + Math.round(r() * 4), 2 + Math.round(r() * 2));
  for (let i = 0; i < 60; i++) rect(ctx, r() < 0.6 ? 0xf0dc90 : 0x8a6c30, 6 + r() * (w - 12), 3 + r() * (h - 44), 3, 1);
  rect(ctx, 0x5a3e24, 4, h - 56, w - 8, 1); // the rope over it
};

const rope = (ctx, w, h) => {
  for (const x of [1, w - 4]) {
    rect(ctx, 0x4a3a2c, x, 2, 3, h - 2);
    rect(ctx, 0x8a7050, x, 2, 1, h - 2);
  }
  for (let x = 2; x < w - 2; x++) {
    const k = (x / w - 0.5) * 2;
    rect(ctx, 0xc8b890, x, 5 + Math.round(4 * (1 - k * k)), 1, 1);
  }
};

const wall = (ctx, w, h) => {
  rect(ctx, 0x3e3830, 0, 3, w, h - 3);
  const r = lcg(77);
  for (let row = 0, y = 4; y < h - 1; row++, y += 5) {
    for (let x = row % 2 ? -5 : 0; x < w; x += 9 + Math.round(r() * 3)) rect(ctx, r() < 0.3 ? 0xb4a88e : 0x8e8470, Math.max(0, x + 1), y, 8, 4);
  }
  for (let x = 2; x < w; x += 7 + Math.round(r() * 8)) {
    rect(ctx, 0x5a6a3a, x, 0, 2, 5);
    rect(ctx, 0x6e7e44, x + 2, 2, 2, 3);
  }
};

// Aldo in his jacket, at the start, arms folded
const aldo = (ctx, w, h) => {
  const c = w / 2;
  ctx.fillStyle = 'rgba(16,12,24,0.35)';
  ctx.fillRect(c - 10, h - 2, 22, 2);
  rect(ctx, 0x2a2430, c - 7, h - 26, 6, 25); // legs
  rect(ctx, 0x2a2430, c + 1, h - 26, 6, 25);
  rect(ctx, 0x14101a, c - 8, h - 3, 7, 3);
  rect(ctx, 0x14101a, c + 1, h - 3, 7, 3);
  rect(ctx, OUTLINE, c - 10, h - 50, 20, 26); // the jacket
  rect(ctx, 0x6a4a30, c - 9, h - 49, 18, 24);
  rect(ctx, 0x8a6442, c - 9, h - 49, 4, 24);
  rect(ctx, 0x4a3220, c - 8, h - 40, 16, 5); // folded arms
  rect(ctx, 0xc89a78, c - 7, h - 39, 4, 3);
  rect(ctx, 0xf0e8d8, c - 2, h - 49, 4, 7); // the shirt
  oval(ctx, 0xc89a78, c, h - 55, 5, 6); // the head
  rect(ctx, 0xa8785a, c + 2, h - 58, 3, 8);
  rect(ctx, 0x8a8478, c - 6, h - 62, 12, 4); // grey hair
  rect(ctx, 0x2a2024, c - 3, h - 56, 2, 1);
  rect(ctx, 0x2a2024, c + 2, h - 56, 2, 1);
};

// over the road: the start, its name and its bunting; the line, its chequers
const banner = (title, chequer) => (ctx, w, h) => {
  const flags = [0xb8302a, 0xf2e6cc, 0x1f7a78, 0xe0b040];
  for (const x of [0, w - 8]) {
    rect(ctx, OUTLINE, x, 0, 8, h);
    rect(ctx, 0x5a4634, x + 1, 0, 6, h);
    rect(ctx, 0x8a7050, x + 1, 0, 2, h);
  }
  const by = 6;
  const bh = 24;
  rect(ctx, OUTLINE, 6, by - 1, w - 12, bh + 2);
  if (chequer) {
    for (let y = 0; y < 3; y++) for (let x = 0; x * 8 < w - 14; x++) rect(ctx, (x + y) % 2 ? 0x14101a : 0xf2e6cc, 7 + x * 8, by + y * 8, 8, 8);
  } else {
    rect(ctx, 0xf2e6cc, 7, by, w - 14, bh);
    rect(ctx, 0xb8302a, 7, by, w - 14, 3);
    rect(ctx, 0xb8302a, 7, by + bh - 3, w - 14, 3);
    stamp(ctx, title, Math.round(w / 2 - stampW(title, 2) / 2), by + 5, 0x1a1420, 2);
  }
  // bunting under it, in a shallow droop
  const ty = by + bh + 2;
  for (let x = 8; x < w - 16; x += 10) {
    const k = (x / w - 0.5) * 2;
    const y = ty + Math.round(7 * (1 - k * k));
    rect(ctx, 0x4a3a2c, x, y, 10, 1);
    const c = flags[Math.round(x / 10) % flags.length];
    for (let i = 0; i < 7; i++) rect(ctx, i < 2 ? mix(c, 0xffffff, 0.2) : i > 4 ? shade(c, 0.8) : c, x + 1 + i * 0.5, y + 1 + i, 8 - i, 1);
  }
};

// the frames, and how tall each stands, m. `h` in dress entries comes from here
export const PROPS = {
  pine0: { m: 13 },
  pine1: { m: 11 },
  cypress: { m: 10 },
  broom: { m: 1.3 },
  pole: { m: 7 },
  bale: { m: 1.5 },
  chevron: { m: 1.9 },
  board150: { m: 3.4 },
  board100: { m: 3.4 },
  board50: { m: 3.4 },
  stone: { m: 0.8 },
  lamp: { m: 4.4 },
  lampLit: { m: 4.4 },
  cart: { m: 2.8 },
  rope: { m: 1 },
  wall: { m: 1.3 },
  aldo: { m: 1.8 },
  start: { m: 5.4 },
  line: { m: 5.4 },
};

export function propItems(track) {
  const item = (name, w, h, paint, lods = 3) => ({ name, w, h, paint, lods });
  const title = (track.title || '').split(' ')[0];
  const items = [
    item('pine0', 96, 128, pine(11, 5)),
    item('pine1', 88, 112, pine(23, -4)),
    item('cypress', 34, 112, cypress(5)),
    item('broom', 40, 22, broom(3), 2),
    item('pole', 34, 110, pole, 3),
    item('bale', 40, 27, bale, 3),
    item('chevron', 44, 30, chevron, 2),
    item('stone', 14, 16, stone, 2),
    item('lamp', 24, 96, lamp(false), 2),
    item('lampLit', 24, 96, lamp(true), 2),
    item('cart', 76, 84, cart, 2),
    item('rope', 64, 18, rope, 2),
    item('wall', 64, 22, wall, 2),
    item('aldo', 28, 66, aldo, 1),
    item('start', 192, 72, banner(title, false), 2),
    item('line', 192, 72, banner('', true), 2),
  ];
  for (const dist of [150, 100, 50]) {
    for (const [hand, dir] of [['R', 1], ['L', -1]]) items.push(item(`board${dist}${hand}`, 44, 52, board(dist, dir), 2));
  }
  return items;
}
