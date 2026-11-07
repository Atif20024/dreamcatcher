// What stands along the Calvessa road, painted in code into RoadView's atlas: stone
// pines and cypress, broom, telegraph poles, straw, boards, the lamp, the farmer's
// cart, the banners over the start and the line. Lit from the upper left; whole
// pixels; the near size of each is what the eye gets at about 10 px a metre. The
// shared things are every race's; the rest is what makes it that day and not another.
import { mix, shade, hex } from '../../../art/paint.js';
import { stamp, stampW } from './carArt.js';

const OUTLINE = 0x1a1420;
const TYRE_C = 0x1e1a22;
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
const banner = (title, chequer, sign = true) => (ctx, w, h) => {
  const flags = [0xb8302a, 0xf2e6cc, 0x1f7a78, 0xe0b040];
  for (const x of [0, w - 8]) {
    rect(ctx, OUTLINE, x, 0, 8, h);
    rect(ctx, 0x5a4634, x + 1, 0, 6, h);
    rect(ctx, 0x8a7050, x + 1, 0, 2, h);
  }
  const by = 6;
  const bh = sign ? 24 : 0;
  if (sign) rect(ctx, OUTLINE, 6, by - 1, w - 12, bh + 2);
  if (!sign) rect(ctx, 0x4a3a2c, 6, by, w - 12, 2);
  else if (chequer) {
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

// ---- the people ------------------------------------------------------------------
const person = ({ legs, coat, lit, skin = 0xc89a78, hair, cap, arm = 0 }) => (ctx, w, h) => {
  const c = w / 2;
  ctx.fillStyle = 'rgba(16,12,24,0.35)';
  ctx.fillRect(c - 10, h - 2, 22, 2);
  rect(ctx, legs, c - 7, h - 26, 6, 25);
  rect(ctx, legs, c + 1, h - 26, 6, 25);
  rect(ctx, 0x14101a, c - 8, h - 3, 7, 3);
  rect(ctx, 0x14101a, c + 1, h - 3, 7, 3);
  rect(ctx, OUTLINE, c - 10, h - 50, 20, 26);
  rect(ctx, coat, c - 9, h - 49, 18, 24);
  rect(ctx, lit, c - 9, h - 49, 4, 24);
  if (arm) {
    // an arm up: he is waving somebody on
    rect(ctx, OUTLINE, c + 8, h - 66 + arm * 2, 6, 20);
    rect(ctx, coat, c + 9, h - 65 + arm * 2, 4, 18);
    rect(ctx, skin, c + 9 + arm, h - 68 + arm * 2, 5, 4);
  }
  oval(ctx, skin, c, h - 55, 5, 6);
  rect(ctx, shade(skin, 0.8), c + 2, h - 58, 3, 8);
  if (hair) rect(ctx, hair, c - 6, h - 62, 12, 4);
  if (cap) {
    rect(ctx, cap, c - 7, h - 63, 14, 4);
    rect(ctx, shade(cap, 0.7), c - 8, h - 60, 16, 2);
  }
};
const FOLK = {
  ottavia: person({ legs: 0x3a4a5a, coat: 0x4a7a8a, lit: 0x6a9aa8, hair: 0x2a1c18 }), // the overalls
  tullio: person({ legs: 0x2a2430, coat: 0x8a7a62, lit: 0xa89a80, cap: 0x3a3a3a }), // the old man's cap
  nino: person({ legs: 0x4a3a2c, coat: 0xc8a850, lit: 0xe4cc78, hair: 0x4a2c18 }),
  crew: person({ legs: 0x3a4a5a, coat: 0x3a4a5a, lit: 0x5a6a7a, cap: 0xe8e0cc }),
  marshal: person({ legs: 0x2a2430, coat: 0xe8e0cc, lit: 0xf8f2e0, cap: 0xb8302a }),
  cassian0: person({ legs: 0x20202a, coat: 0x20202a, lit: 0x3a3a44, hair: 0xd8c070, arm: 1 }),
  cassian1: person({ legs: 0x20202a, coat: 0x20202a, lit: 0x3a3a44, hair: 0xd8c070, arm: -1 }),
  jo0: person({ legs: 0x2a3440, coat: 0x2a8a88, lit: 0x4aaaa8, hair: 0x4a2c18 }),
};

// the chair at the pit wall, and what is on it in the Coppa
const chair = (gloves) => (ctx, w, h) => {
  const c = w / 2;
  rect(ctx, OUTLINE, c - 11, h - 24, 22, 3);
  rect(ctx, 0x8a6a42, c - 10, h - 24, 20, 2);
  rect(ctx, OUTLINE, c - 11, h - 50, 22, 18);
  rect(ctx, 0x8a6a42, c - 10, h - 49, 20, 16);
  rect(ctx, 0xa88a58, c - 10, h - 49, 20, 3);
  for (const x of [c - 11, c + 8]) {
    rect(ctx, OUTLINE, x, h - 34, 3, 34);
    rect(ctx, 0x6a4a2c, x + 1, h - 34, 1, 34);
  }
  if (gloves) {
    // Aldo's: tan driving gloves, the cuffs turned over
    for (const x of [c - 8, c + 1]) {
      rect(ctx, OUTLINE, x - 1, h - 30, 9, 7);
      rect(ctx, 0xc89048, x, h - 29, 7, 5);
      rect(ctx, 0xe8c070, x, h - 29, 3, 2);
    }
  }
};

// a strip of people behind a rope: hats and shirts and the odd raised arm
const crowd = (seed) => (ctx, w, h) => {
  const r = lcg(seed);
  const shirts = [0xe8e0cc, 0xb8302a, 0x4a6a8a, 0xd8a840, 0x6a7a5a, 0xc89a78, 0x2a3a4a];
  const skins = [0xd8a884, 0xc89a78, 0xa87858];
  for (const [row, base, step] of [[0, h - 16, 9], [1, h - 7, 11]]) {
    for (let x = -2 + row * 4; x < w; x += step + Math.round(r() * 3)) {
      const y = base - Math.round(r() * 3);
      rect(ctx, shirts[Math.floor(r() * shirts.length)], x, y, 8, h - y);
      oval(ctx, skins[Math.floor(r() * skins.length)], x + 4, y - 4, 3, 4);
      if (r() < 0.45) rect(ctx, r() < 0.5 ? 0xe8dcc0 : 0x3a3028, x, y - 8, 9, 3); // a straw hat, a dark one
      if (r() < 0.15) rect(ctx, 0xf2e6cc, x + 8, y - 12, 2, 12); // an arm up
    }
  }
  rect(ctx, 0x4a3a2c, 0, h - 8, w, 2);
  for (let x = 0; x < w; x += 24) rect(ctx, 0x3a2c22, x, h - 12, 3, 12);
};

// a timber stand for the crossing: the Salt Road's one crowd in one place
const stand = (ctx, w, h) => {
  crowd(41)(ctx, w, h - 22);
  ctx.save();
  ctx.translate(0, 22);
  crowd(43)(ctx, w, h - 22);
  ctx.restore();
  rect(ctx, 0x6a4a2c, 0, h - 6, w, 6);
  rect(ctx, 0x8a6a42, 0, h - 6, w, 2);
  for (let x = 2; x < w; x += 22) rect(ctx, 0x3a2c22, x, h - 6, 4, 6);
};

// ---- the quay ----------------------------------------------------------------------
// an iron standard with a globe, every 28 m: what lights the quay and the pit straight
const quayLamp = (ctx, w, h) => {
  const c = w / 2;
  for (const [r, a] of [[10, 0.2], [6, 0.45]]) {
    ctx.fillStyle = `rgba(255,214,120,${a})`;
    for (let y = -r; y <= r; y++) {
      const hw = Math.round(Math.sqrt(r * r - y * y));
      ctx.fillRect(c - hw, 10 + y, hw * 2, 1);
    }
  }
  rect(ctx, 0x241e22, c - 1, 16, 3, h - 16);
  rect(ctx, 0x241e22, c - 3, h - 5, 7, 5);
  oval(ctx, 0xffe8a0, c, 10, 4, 4);
  rect(ctx, 0xfff8e0, c - 2, 8, 2, 3);
};

const bollard = (ctx, w, h) => {
  rect(ctx, OUTLINE, 2, 3, w - 4, h - 3);
  rect(ctx, 0x4a4650, 3, 4, w - 6, h - 4);
  rect(ctx, 0x6a6670, 3, 4, 2, h - 4);
  rect(ctx, OUTLINE, 0, 0, w, 4);
  rect(ctx, 0x5a5660, 1, 1, w - 2, 2);
};

// a fishing boat at the quay, mast and furled sail against the sky
const boat = (seed) => (ctx, w, h) => {
  const r = lcg(seed + 3);
  const hull = [0x2a5a6a, 0x8a3a2a, 0xd8d0bc][seed % 3];
  const m = w / 2 + Math.round(r() * 6 - 3);
  rect(ctx, OUTLINE, m - 2, 2, 5, h - 20);
  rect(ctx, 0x6a4a2c, m - 1, 3, 3, h - 21);
  // the yard and the sail furled along it, slanted as they stow them on this coast
  for (let i = 0; i < 40; i++) {
    const x = m - 22 + i * 1.1;
    const y = 34 - i * 0.55;
    rect(ctx, OUTLINE, x, y - 1, 2, 7);
    rect(ctx, seed % 2 ? 0xc8603a : 0xd8c8a4, x, y, 2, 5);
  }
  for (let i = 0; i < 26; i++) rect(ctx, 0x2a2018, m + 1 + i * 1.1, 8 + i * 2.2, 1, 1); // the stay
  // the hull: a round bow and a raised stem, not a plank
  for (let y = 0; y < 18; y++) {
    const inset = Math.round(((y / 18) ** 2) * 14);
    rect(ctx, OUTLINE, 1 + inset, h - 20 + y, w - 2 - inset * 2, 1);
    rect(ctx, y < 3 ? mix(hull, 0xffffff, 0.35) : y > 13 ? shade(hull, 0.6) : hull, 2 + inset, h - 20 + y, w - 4 - inset * 2, 1);
  }
  rect(ctx, shade(hull, 0.75), w - 8, h - 27, 5, 8); // the stem
  rect(ctx, 0x8a7a62, m - 10, h - 28, 16, 8); // the wheelhouse
  rect(ctx, 0x3a3440, m - 8, h - 26, 5, 3);
};

// the warehouses and the town: shutters and a lit window or two
// (windows: the same house, only its lit windows: over the wall at night, where the dark does not touch them)
const shed = (seed, windows = false) => (ctx, w, h) => {
  const r = lcg(seed + 5);
  const wallC = [0xc8b89a, 0xb49a78, 0xd8ccb0][seed % 3];
  if (!windows) {
    rect(ctx, OUTLINE, 0, 10, w, h - 10);
    rect(ctx, wallC, 1, 11, w - 2, h - 11);
    for (let i = 0; i < 80; i++) rect(ctx, mix(wallC, 0x4a3a2c, 0.2 + ((i * 37) % 25) / 100), ((i * 53) % 97) / 97 * w, 12 + (((i * 71) % 89) / 89) * (h - 14), 3 + (i % 6), 1);
    rect(ctx, 0xa86a4a, -1, 4, w + 2, 8);
    for (let x = 0; x < w; x += 7) rect(ctx, 0x8a4e38, x, 4, 2, 8);
    rect(ctx, 0xc8866a, 0, 4, w, 1);
  }
  const cols = Math.floor((w - 12) / 22);
  for (let c = 0; c < cols; c++) {
    for (let row = 0; row < 2; row++) {
      const x = 10 + c * 22;
      const y = 20 + row * 26;
      const lit = r() < 0.4;
      if (windows) {
        if (!lit) continue;
        rect(ctx, 0xffc868, x, y, 10, 16);
        rect(ctx, 0xfff0c0, x, y, 4, 7);
        continue;
      }
      rect(ctx, OUTLINE, x - 1, y - 1, 12, 18);
      rect(ctx, lit ? 0xe8c878 : 0x2a7a78, x, y, 10, 16);
      if (!lit) for (let k = 2; k < 16; k += 3) rect(ctx, 0x1e5a58, x, y + k, 10, 1); // shutters
    }
  }
};

// the rock on the inside of the cliff road
// (a cutting, in beds of limestone: its strata run with the road, broken at the top, tufts in the ledges)
const rock = (seed) => (ctx, w, h) => {
  const r = lcg(seed);
  const top = (x) => Math.round(h * 0.22 + 7 * Math.sin((x / w) * 6.3 + seed) + 4 * Math.sin((x / w) * 17 + seed * 2) + (x < 14 ? (14 - x) * 2 : 0) + (x > w - 14 ? (x - w + 14) * 2 : 0));
  const beds = [0x8e8270, 0x7a6e5c, 0x6a5e50, 0x847864, 0x5e5446];
  for (let x = 0; x < w; x += 2) {
    const t = top(x);
    rect(ctx, OUTLINE, x, t - 1, 2, 2);
    for (let y = t; y < h; y += 1) {
      const bed = Math.floor((y + Math.sin(x / 9) * 2) / 9);
      rect(ctx, beds[bed % beds.length], x, y, 2, 1);
    }
    rect(ctx, 0xa89a80, x, t, 2, 2);
  }
  for (let i = 0; i < 26; i++) {
    const x = r() * w;
    const y = top(x) + 4 + r() * (h - top(x) - 4);
    rect(ctx, 0x3e3628, x, y, 2 + r() * 12, 1); // the cracks along the beds
  }
  for (let i = 0; i < 14; i++) {
    const x = r() * w;
    rect(ctx, 0x4e6236, x, top(x) + r() * 18, 4, 2);
    rect(ctx, 0x6a7e44, x + 1, top(x) - 1, 3, 2);
  }
};

// ---- the salt -------------------------------------------------------------------------
const saltHeap = (seed) => (ctx, w, h) => {
  const r = lcg(seed);
  for (let y = 0; y < h; y++) {
    const hw = Math.round((w / 2) * Math.min(1, ((y + 1) / h) ** 0.8));
    rect(ctx, 0xf0ece0, w / 2 - hw, y, hw, 1);
    rect(ctx, 0xc8ccd4, w / 2, y, hw, 1);
  }
  for (let i = 0; i < 40; i++) rect(ctx, r() < 0.5 ? 0xffffff : 0xb4b8c4, w / 2 + (r() - 0.5) * w * 0.5, h * 0.4 + r() * h * 0.6, 2, 1);
};

// a salt-bitten tamarisk: the only tree that will stand here
const tamarisk = (seed) => (ctx, w, h) => {
  const r = lcg(seed);
  rect(ctx, 0x5a4a3a, w / 2 - 2, h - 18, 4, 18);
  for (let i = 0; i < 18; i++) oval(ctx, i < 9 ? 0x6a7a5a : 0x8e9a70, 8 + r() * (w - 16), 6 + r() * (h - 22), 5 + Math.round(r() * 5), 3 + Math.round(r() * 3));
  for (let i = 0; i < 24; i++) rect(ctx, 0xc8a0a0, 6 + r() * (w - 12), 3 + r() * (h - 18), 2, 2);
};

// the pumps that fill the pans
const windpump = (ctx, w, h) => {
  const c = w / 2;
  for (let y = 22; y < h; y++) {
    const k = (y - 22) / (h - 22);
    rect(ctx, 0x4a3a2c, c - 2 - k * 10, y, 2, 1);
    rect(ctx, 0x4a3a2c, c + k * 10, y, 2, 1);
    if (y % 14 === 0) rect(ctx, 0x4a3a2c, c - 2 - k * 10, y, 4 + k * 20, 1);
  }
  for (let a = 0; a < 8; a++) {
    const th = (a / 8) * Math.PI * 2;
    for (let k = 3; k < 18; k++) rect(ctx, a % 2 ? 0xe8e0cc : 0x8a7a62, c + Math.cos(th) * k - 1, 20 + Math.sin(th) * k - 1, 3, 3);
  }
  rect(ctx, OUTLINE, c - 2, 18, 4, 4);
};

// ---- the crossing ---------------------------------------------------------------------
// the arm across the road, in three states: up, coming down, down (a frame the width of the road and a bit)
const gate = (stage) => (ctx, w, h) => {
  const stripe = (x0, y0, x1, y1) => {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const c = Math.floor(i / 12) % 2 ? 0xc8302a : 0xf2e6cc;
      rect(ctx, OUTLINE, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k - 3, 3, 7);
      rect(ctx, c, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k - 2, 3, 5);
    }
  };
  const y = h - 26;
  const reach = w / 2 - 12;
  const [dx, dy] = stage === 0 ? [0.1, -1] : stage === 1 ? [0.7, -0.7] : [1, 0];
  const len = stage === 2 ? reach : Math.min(h - 34, stage === 1 ? 90 : 72);
  for (const [x, dir] of [[8, 1], [w - 10, -1]]) {
    stripe(x, y, x + dir * dx * len, y + dy * len);
    if (stage === 2) for (let k = 10; k < len; k += 22) rect(ctx, 0x8a7a62, x + dir * k, y + 3, 1, 10);
  }
};

const crossPost = (a, b) => (ctx, w, h) => {
  const c = w / 2;
  rect(ctx, OUTLINE, c - 2, 18, 5, h - 18);
  rect(ctx, 0xe8e0cc, c - 1, 18, 3, h - 18);
  for (let y = 22; y < h; y += 12) rect(ctx, 0x1a1420, c - 1, y, 3, 5);
  // the St Andrew's cross
  for (let i = 0; i < 28; i++) {
    rect(ctx, 0xf2e6cc, c - 14 + i, 34 + i * 0.5, 3, 2);
    rect(ctx, 0xf2e6cc, c + 14 - i, 34 + i * 0.5, 3, 2);
  }
  for (const [x, on] of [[c - 11, a], [c + 11, b]]) {
    if (on) {
      ctx.fillStyle = 'rgba(255,60,40,0.3)';
      for (let y = -10; y <= 10; y++) {
        const hw = Math.round(Math.sqrt(100 - y * y));
        ctx.fillRect(x - hw, 11 + y, hw * 2, 1);
      }
    }
    oval(ctx, OUTLINE, x, 11, 7, 7);
    oval(ctx, on ? 0xff4a30 : 0x4a1c18, x, 11, 6, 6);
    if (on) rect(ctx, 0xffd0b8, x - 3, 8, 3, 3);
  }
  rect(ctx, OUTLINE, c - 11, 10, 22, 2);
};

// the Salt Road's train, side on: an engine and two wagons going by behind the gate
const train = (ctx, w, h) => {
  const iron = 0x2a2a30;
  const wheelsAt = (xs) => {
    for (const x of xs) {
      oval(ctx, OUTLINE, x, h - 8, 7, 7);
      oval(ctx, 0x5a5660, x, h - 8, 5, 5);
      rect(ctx, 0xc8302a, x - 1, h - 9, 2, 2);
    }
  };
  // the engine at the front (the right, going across)
  const ex = w - 148;
  rect(ctx, iron, ex, h - 16, 140, 6);
  rect(ctx, iron, ex + 40, h - 42, 96, 26);
  rect(ctx, 0x4a4a52, ex + 40, h - 42, 96, 4);
  rect(ctx, iron, ex, h - 58, 44, 42); // the cab
  rect(ctx, 0x3a3a42, ex - 2, h - 60, 48, 4);
  rect(ctx, 0xf0c060, ex + 10, h - 52, 14, 12);
  rect(ctx, iron, ex + 112, h - 58, 10, 18); // the chimney
  rect(ctx, 0x3a3a42, ex + 110, h - 60, 14, 3);
  rect(ctx, 0xc8a840, ex + 74, h - 48, 8, 6); // the dome
  rect(ctx, 0xc8302a, ex + 136, h - 16, 6, 6);
  wheelsAt([ex + 56, ex + 80, ex + 104, ex + 14]);
  // two salt wagons
  for (let i = 0; i < 2; i++) {
    const x = i * 164;
    rect(ctx, 0x6a4a2c, x + 2, h - 40, 156, 24);
    rect(ctx, 0x8a6a42, x + 2, h - 40, 156, 3);
    for (let k = 10; k < 156; k += 24) rect(ctx, 0x4a3320, x + k, h - 40, 2, 24);
    for (let k = 4; k < 150; k += 10) oval(ctx, 0xf0ece0, x + 8 + k, h - 42, 7, 3);
    rect(ctx, iron, x, h - 16, 160, 5);
    wheelsAt([x + 24, x + 134]);
    stamp(ctx, 'SALINE', x + 58, h - 34, 0xf0ece0);
  }
  rect(ctx, iron, 160, h - 14, 6, 2);
  rect(ctx, iron, 324, h - 14, 6, 2);
};

// ---- the Coppa ------------------------------------------------------------------------
const pitCounter = (ctx, w, h) => {
  rect(ctx, OUTLINE, 0, 8, w, h - 8);
  rect(ctx, 0xd8ccb0, 1, 9, w - 2, h - 9);
  rect(ctx, 0xb8302a, 1, 9, w - 2, 5);
  rect(ctx, 0xf2e6cc, 1, 9, w - 2, 1);
  for (let x = 4; x < w; x += 18) {
    rect(ctx, 0x3a3440, x, 20, 12, 3); // a clipboard's shadow, a stopwatch's hook
    rect(ctx, 0x8a7a62, x + 3, h - 6, 6, 6);
  }
  for (let x = 6; x < w; x += 30) {
    rect(ctx, 0xc89048, x, 2, 4, 6); // tins and timing clocks along the top
    rect(ctx, 0xe8dcc0, x + 12, 4, 6, 4);
  }
};

const looseWheel = (ctx, w, h) => {
  oval(ctx, OUTLINE, w / 2, h / 2, w / 2 - 1, h / 2 - 1);
  oval(ctx, TYRE_C, w / 2, h / 2, w / 2 - 2, h / 2 - 2);
  oval(ctx, 0xc8c0a8, w / 2, h / 2, w / 4, h / 4);
  rect(ctx, OUTLINE, w / 2 - 2, h / 2 - 2, 4, 4);
};

const smoke = (ctx, w, h) => {
  const r = lcg(61);
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = `rgba(214,206,190,${0.18 + r() * 0.28})`;
    const x = w / 2 + (r() - 0.5) * w * 0.6;
    const y = h / 2 + (r() - 0.5) * h * 0.6;
    const R = 5 + r() * 8;
    for (let dy = -R; dy <= R; dy++) {
      const hw = Math.round(Math.sqrt(R * R - dy * dy));
      ctx.fillRect(Math.round(x - hw), Math.round(y + dy), hw * 2, 1);
    }
  }
};

// the Gull lamp: bigger than the checkpoints, on an iron bracket, with its own halo when it is lit
const gullLamp = (lit) => (ctx, w, h) => {
  const c = w / 2;
  if (lit) {
    for (const [r, a] of [[26, 0.12], [18, 0.22], [11, 0.4]]) {
      ctx.fillStyle = `rgba(255,214,120,${a})`;
      for (let y = -r; y <= r; y++) {
        const hw = Math.round(Math.sqrt(r * r - y * y));
        ctx.fillRect(c - hw, 28 + y, hw * 2, 1);
      }
    }
  }
  rect(ctx, 0x241e22, c - 3, 34, 6, h - 34);
  rect(ctx, 0x4a4248, c - 3, 34, 2, h - 34);
  rect(ctx, 0x241e22, c - 6, h - 8, 12, 8);
  rect(ctx, 0x241e22, c - 10, 32, 20, 3);
  rect(ctx, lit ? 0xffe8a0 : 0x2a2820, c - 8, 18, 16, 14);
  rect(ctx, lit ? 0xfff8e0 : 0x3a382e, c - 6, 19, 5, 12);
  rect(ctx, 0x241e22, c - 1, 18, 2, 14);
  rect(ctx, 0x241e22, c - 10, 14, 20, 4);
  rect(ctx, 0x241e22, c - 3, 9, 6, 5);
};

// the slate: blank from a long way off (near, RoadView draws the word on its own canvas)
export const paintSlate = (ctx, w, h, text = '') => {
  const ph = h - 18;
  ctx.clearRect(0, 0, w, h);
  rect(ctx, 0x3a3028, w / 2 - 3, ph - 2, 6, 20);
  rect(ctx, 0xc8b88a, 0, 0, w, ph);
  rect(ctx, 0x14141c, 3, 3, w - 6, ph - 6);
  if (!text) return;
  const k = text.length <= 5 ? 3 : 2;
  stamp(ctx, text, Math.round(w / 2 - stampW(text, k) / 2), Math.round(ph / 2 - (7 * k) / 2), 0xf2e6cc, k);
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
  bunting: { m: 5.4 },
  ottavia: { m: 1.75 },
  tullio: { m: 1.75 },
  nino: { m: 1.6 },
  marshal: { m: 1.8 },
  crew: { m: 1.75 },
  cassian0: { m: 1.8 },
  cassian1: { m: 1.8 },
  jo0: { m: 1.75 },
  chair: { m: 1.2 },
  chairGloves: { m: 1.2 },
  crowd0: { m: 2.2 },
  crowd1: { m: 2.2 },
  stand: { m: 4 },
  quayLamp: { m: 5.2 },
  bollard: { m: 0.8 },
  boat0: { m: 8 },
  boat1: { m: 8 },
  boat2: { m: 8 },
  shed0: { m: 9 },
  shed1: { m: 9 },
  shed2: { m: 9 },
  rock0: { m: 4.4 },
  saltHeap0: { m: 4 },
  saltHeap1: { m: 3 },
  tamarisk: { m: 3.6 },
  windpump: { m: 9 },
  gate0: { m: 5 },
  gate1: { m: 5 },
  gate2: { m: 5 },
  crossOff: { m: 3.8 },
  crossA: { m: 3.8 },
  crossB: { m: 3.8 },
  train: { m: 3.8 },
  pitCounter: { m: 1.6 },
  gullDark: { m: 6.4 },
  gullLit: { m: 6.4 },
  slate: { m: 3.8 },
  wheel: { m: 0.7 },
  smoke: { m: 2.2 },
};

// what never dims with the dark: it makes its own light
export const EMISSIVE = new Set(['lampLit', 'quayLamp', 'gullLit', 'crossA', 'crossB', 'slate']);
// what is whitewashed or painted to catch a headlight: it reads further down the road than the rest
export const REFLECTIVE = new Set(['chevron', 'stone', 'bale', 'board150R', 'board150L', 'board100R', 'board100L', 'board50R', 'board50L', 'start', 'line', 'crossOff', 'gate0', 'gate1', 'gate2', 'rope', 'pitCounter']);

const NAMES = { pinewood: 'PINEWOOD', harbour: 'HARBOUR', salt: 'SALT ROAD', coppa: 'COPPA CALVESSA', test: 'PINEWOOD' };

export function propItems(track) {
  const item = (name, w, h, paint, lods = 3) => ({ name, w, h, paint, lods });
  const id = track.id;
  const has = (...ids) => ids.includes(id);
  const items = [
    item('pole', 34, 110, pole, 3),
    item('bale', 40, 27, bale, 3),
    item('chevron', 44, 30, chevron, 2),
    item('stone', 14, 16, stone, 2),
    item('lamp', 24, 96, lamp(false), 2),
    item('lampLit', 24, 96, lamp(true), 2),
    item('rope', 64, 18, rope, 2),
    item('wall', 64, 22, wall, 2),
    item('start', 192, 72, banner(NAMES[id] || (track.title || '').split(' ')[0], false), 2),
    item('line', 192, 72, banner('', true), 2),
  ];
  for (const dist of [150, 100, 50]) {
    for (const [hand, dir] of [['R', 1], ['L', -1]]) items.push(item(`board${dist}${hand}`, 44, 52, board(dist, dir), 2));
  }
  if (has('pinewood', 'test', 'coppa', 'harbour')) {
    items.push(item('pine0', 96, 128, pine(11, 5)), item('pine1', 88, 112, pine(23, -4)), item('cypress', 34, 112, cypress(5)));
  }
  if (has('pinewood', 'test', 'coppa')) items.push(item('broom', 40, 22, broom(3), 2));
  if (has('pinewood', 'test')) items.push(item('aldo', 28, 66, aldo, 1));
  if (track.obstacles?.some((o) => o.kind === 'cart')) items.push(item('cart', 76, 84, cart, 2));
  if (has('harbour', 'salt', 'coppa')) {
    items.push(item('ottavia', 28, 66, FOLK.ottavia, 1), item('tullio', 28, 66, FOLK.tullio, 1), item('crowd0', 128, 40, crowd(7), 2), item('crowd1', 128, 40, crowd(19), 2));
    if (!has('harbour')) items.push(item('nino', 28, 62, FOLK.nino, 1), item('bunting', 192, 72, banner('', false, false), 2), item('slate', 96, 82, paintSlate, 1), item('chair', 28, 50, chair(false), 1));
  }
  if (has('harbour', 'coppa')) {
    items.push(item('quayLamp', 22, 96, quayLamp, 2), item('shed0', 128, 88, shed(0), 2), item('shed1', 128, 88, shed(1), 2), item('shed0w', 128, 88, shed(0, true), 2), item('shed1w', 128, 88, shed(1, true), 2), item('rock0', 112, 72, rock(3), 2), item('gullDark', 56, 128, gullLamp(false), 2), item('gullLit', 56, 128, gullLamp(true), 2));
  }
  if (has('harbour')) {
    items.push(item('bollard', 14, 16, bollard, 1), item('boat0', 72, 96, boat(0), 2), item('boat1', 72, 96, boat(1), 2), item('boat2', 72, 96, boat(2), 2), item('shed2', 128, 88, shed(2), 2), item('shed2w', 128, 88, shed(2, true), 2), item('smoke', 44, 44, smoke, 1));
  }
  if (has('salt', 'coppa')) items.push(item('saltHeap0', 96, 40, saltHeap(3), 2), item('saltHeap1', 72, 26, saltHeap(9), 2));
  if (has('salt')) {
    items.push(item('tamarisk', 44, 48, tamarisk(9), 2), item('windpump', 44, 96, windpump, 2), item('gate0', 192, 104, gate(0), 2), item('gate1', 192, 104, gate(1), 2), item('gate2', 192, 104, gate(2), 2));
    items.push(item('crossOff', 36, 70, crossPost(false, false), 2), item('crossA', 36, 70, crossPost(true, false), 2), item('crossB', 36, 70, crossPost(false, true), 2), item('train', 480, 64, train, 1), item('stand', 128, 62, stand, 2));
  }
  if (has('coppa')) {
    items.push(item('marshal', 28, 66, FOLK.marshal, 1), item('crew', 28, 66, FOLK.crew, 1), item('cassian0', 28, 68, FOLK.cassian0, 1), item('cassian1', 28, 68, FOLK.cassian1, 1), item('jo0', 28, 66, FOLK.jo0, 1), item('chairGloves', 28, 50, chair(true), 1), item('pitCounter', 128, 26, pitCounter, 2), item('wheel', 22, 22, looseWheel, 1), item('smoke', 44, 44, smoke, 1));
  }
  return items;
}
