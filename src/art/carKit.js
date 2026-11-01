// The car kit (THE LONG STRAIGHT): five cars, their wheels and the road's
// props, painted pixel by pixel in code at 1 m = 44 px and baked into the
// `cars` atlas by scripts/build-atlas.js. No Phaser, no canvas, so the build
// and `npm run lint:scale` can run it headless. Each image is { width, height,
// data } in the raster format of scripts/lib/raster.js.
//
// A car frame stands on its last row, nose to the right: 3.8 m = 167 px long,
// 1.1 m = 48 px to the scuttle. The wheels are not in it: they turn by distance
// travelled (RaceScene), so they are frames of their own.
import { px } from '../data/scale.js';

export const CAR_SIZE = Object.freeze({
  lenM: 3.8,
  scuttleM: 1.1, // the road to the top of the bodywork
  headM: 1.25, // the road to the top of the driver's head
  wheelM: 0.62,
  frameW: 175,
  frameH: 60,
  wheelX: [38, 136], // wheel centres, frame px
});
const WHEEL_R = Math.round(px(CAR_SIZE.wheelM) / 2); // 14

// ---- a tiny raster ------------------------------------------------------------
const img = (width, height) => ({ width, height, data: new Uint8Array(width * height * 4) });

function put(m, x, y, c, a = 255) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= m.width || y >= m.height) return;
  const o = (y * m.width + x) * 4;
  m.data[o] = (c >> 16) & 255;
  m.data[o + 1] = (c >> 8) & 255;
  m.data[o + 2] = c & 255;
  m.data[o + 3] = a;
}
const alpha = (m, x, y) => (x < 0 || y < 0 || x >= m.width || y >= m.height ? 0 : m.data[(y * m.width + x) * 4 + 3]);
const rgb = (m, x, y) => {
  const o = (y * m.width + x) * 4;
  return (m.data[o] << 16) | (m.data[o + 1] << 8) | m.data[o + 2];
};
const rect = (m, x, y, w, h, c, a) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(m, x + i, y + j, c, a);
};
function disc(m, cx, cy, r, c, a) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) put(m, cx + x, cy + y, c, a);
}
function line(m, x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) put(m, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c);
}
// a filled polygon, even-odd by scanline
function poly(m, pts, c) {
  const ys = pts.map((p) => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[(i + 1) % pts.length];
      if (ay <= y + 0.5 !== by <= y + 0.5) xs.push(ax + ((y + 0.5 - ay) / (by - ay)) * (bx - ax));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) put(m, x, y, c);
  }
}
const shade = (c, k) => {
  const f = (s) => Math.min(255, Math.round(((c >> s) & 255) * k));
  return (f(16) << 16) | (f(8) << 8) | f(0);
};
// the outline: any drawn pixel beside an empty one
function outline(m, c) {
  const edge = [];
  for (let y = 0; y < m.height; y++)
    for (let x = 0; x < m.width; x++) {
      if (!alpha(m, x, y)) continue;
      if (!alpha(m, x - 1, y) || !alpha(m, x + 1, y) || !alpha(m, x, y - 1) || !alpha(m, x, y + 1)) edge.push([x, y]);
    }
  for (const [x, y] of edge) put(m, x, y, c);
}
// light from above: a bright crown, the flank in shade, a dark belly
function modelBody(m, x0, x1) {
  for (let x = x0; x <= x1; x++) {
    let top = -1;
    let bot = -1;
    for (let y = 0; y < m.height; y++) {
      if (!alpha(m, x, y)) continue;
      if (top < 0) top = y;
      bot = y;
    }
    if (top < 0) continue;
    for (let y = top; y <= bot; y++) {
      const t = (y - top) / Math.max(1, bot - top);
      const k = y - top < 2 ? 1.14 : t < 0.5 ? 1 : t < 0.8 ? 0.84 : 0.62;
      put(m, x, y, shade(rgb(m, x, y), k));
    }
  }
}

const DIGITS = { 0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 3: ['111', '001', '011', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'], 7: ['111', '001', '010', '010', '010'], 9: ['111', '101', '111', '001', '111'] };
function digit(m, ch, x, y, c, k = 1) {
  DIGITS[ch].forEach((row, j) => [...row].forEach((b, i) => b === '1' && rect(m, x + i * k, y + j * k, k, k, c)));
}

// ---- the cars --------------------------------------------------------------------
export const LIVERIES = Object.freeze({
  heron: { body: 0xefe2c4, trim: 0x1f7a78, num: 7, numInk: 0xf2e6cc, head: 0x6a4630, shoulders: 0x2a8a88, goggles: true }, // Jo: the Heron 750, cream and teal
  dante: { body: 0xe8dcc0, trim: 0x1f7a78, num: 4, numInk: 0xf2e6cc, disc: 0xb8302a, head: 0xd8d0c0, shoulders: 0x2a8a88 }, // same chassis, red number
  roche: { body: 0x20202a, trim: 0xd8a840, num: 1, numInk: 0x20202a, disc: 0xd8a840, head: 0x101014, shoulders: 0x3a3a44, nose: 8, pipe: 3 }, // the Corsa: longer nose, bigger pipe
  aurelio: { body: 0xf0f0ec, trim: 0x2c5aa8, num: 3, numInk: 0xf0f0ec, head: 0xf4f4f4, shoulders: 0x2c5aa8, roundTail: true },
  varga: { body: 0xc89a2c, trim: 0x8a5a20, num: 9, numInk: 0xf2e6cc, head: 0x5a3a24, shoulders: 0x7a5a30, dented: true, spare: true },
});

function paintCar(L) {
  const m = img(CAR_SIZE.frameW, CAR_SIZE.frameH);
  const g = CAR_SIZE.frameH - 1; // the road
  const X0 = 2;
  const X1 = X0 + px(CAR_SIZE.lenM); // 169
  const top = g - px(CAR_SIZE.scuttleM); // the scuttle's height
  const nose = L.nose || 0;
  // the cigar: tail, deck, headrest, cockpit rim, scuttle, bonnet, nose, belly
  const tail = L.roundTail ? [[X0, g - 20], [X0 + 3, g - 28], [X0 + 12, g - 34]] : [[X0, g - 24], [X0 + 2, g - 32], [X0 + 14, g - 35]];
  const shell = [...tail, [X0 + 40, g - 41], [X0 + 58, g - 42], [X0 + 96, g - 42], [X0 + 106, top], [X0 + 122, g - 45], [X0 + 146 - nose, g - 36], [X1 - 8, g - 26], [X1, g - 18], [X1 - 2, g - 11], [X1 - 22, g - 8], [X0 + 26, g - 8], [X0 + 4, g - 13]];
  poly(m, shell, L.body);
  // the tail fin, the racing stripe along the flank
  if (!L.roundTail) poly(m, [[X0 + 2, g - 32], [X0 + 4, g - 44], [X0 + 16, g - 36]], L.body);
  for (let x = X0 + 2; x < X1 - 2; x++) {
    for (let y = g - 30; y < g - 25; y++) if (alpha(m, x, y)) put(m, x, y, L.trim);
  }
  modelBody(m, X0, X1);
  // dents and a patched bonnet (Bruno's)
  if (L.dented) {
    rect(m, X0 + 118, g - 40, 22, 11, shade(L.body, 0.72));
    for (let x = X0 + 119; x < X0 + 140; x += 4) put(m, x, g - 40, 0x4a3a20);
    disc(m, X0 + 70, g - 19, 3, shade(L.body, 0.6));
    disc(m, X0 + 30, g - 22, 2, shade(L.body, 0.6));
  }
  // the bonnet's louvres and its strap
  for (let i = 0; i < 4; i++) line(m, X0 + 126 + i * 5, g - 37 + i, X0 + 124 + i * 5, g - 31 + i, shade(L.body, 0.55));
  // the cockpit: a dark bite out of the deck
  poly(m, [[X0 + 58, g - 42], [X0 + 96, g - 42], [X0 + 92, g - 34], [X0 + 62, g - 34]], 0x1a1416);
  // the driver: shoulders, head, leather and goggles
  rect(m, X0 + 66, g - 45, 20, 11, L.shoulders);
  rect(m, X0 + 66, g - 45, 20, 2, shade(L.shoulders, 1.2));
  const hx = X0 + 76;
  const hy = g - 47;
  disc(m, hx, hy, 8, L.head);
  rect(m, hx - 8, hy + 1, 16, 2, shade(L.head, 0.7));
  disc(m, hx - 2, hy - 3, 2, shade(L.head, 1.35));
  if (L.goggles) {
    rect(m, hx + 1, hy - 2, 7, 4, 0x1a1416);
    rect(m, hx + 3, hy - 1, 3, 2, 0x88b8d8);
  } else {
    rect(m, hx + 3, hy - 1, 5, 3, 0xd8c8a8); // a face under the helmet
  }
  // the aero screen: two struts and a pale pane
  line(m, X0 + 100, g - 44, X0 + 94, g - 54, 0x4a4a52);
  poly(m, [[X0 + 96, g - 44], [X0 + 102, g - 44], [X0 + 95, g - 55], [X0 + 91, g - 53]], 0xa8c8d8);
  // the number roundel on the tail's flank
  disc(m, X0 + 38, g - 25, 10, L.disc ?? L.trim);
  disc(m, X0 + 38, g - 25, 8, L.disc ?? L.trim);
  const num = String(L.num);
  digit(m, num, X0 + 35, g - 30, L.numInk, 2);
  // the exhaust down the flank and out at the tail, chrome on a dark pipe
  const pipe = L.pipe || 2;
  rect(m, X0 - 1, g - 13, 60, pipe + 1, 0x38383e);
  rect(m, X0 - 1, g - 13, 60, 1, 0xc8c8d0);
  rect(m, X0 - 1, g - 13, 3, pipe + 1, 0x101014);
  // the lamp, the grille
  disc(m, X1 - 12, g - 25, 4, 0xd8c070);
  disc(m, X1 - 13, g - 26, 2, 0xfff6c8);
  rect(m, X1 - 3, g - 22, 2, 8, 0x38383e);
  // wheel arches: the wheels sit in these
  for (const wx of CAR_SIZE.wheelX) disc(m, wx, g - WHEEL_R, WHEEL_R + 2, 0x14101a);
  // Bruno's spare, strapped on the tail
  if (L.spare) {
    disc(m, X0 + 8, g - 37, 9, 0x24202a);
    disc(m, X0 + 8, g - 37, 5, 0x8a8478);
  }
  outline(m, 0x1a1420);
  return m;
}

// ---- wheels: 8 spokes repeat every 45°, so six frames 7.5° apart turn them ------
export const WHEEL_STEPS = 6;
export const WHEEL_DEG = 45 / WHEEL_STEPS;
const wheelSize = WHEEL_R * 2 + 2;
function paintWheel(deg, blur = false) {
  const m = img(wheelSize, wheelSize);
  const c = WHEEL_R + 1;
  disc(m, c, c, WHEEL_R, 0x1a1a20); // the tyre
  disc(m, c, c, WHEEL_R - 3, blur ? 0x8a8a92 : 0x3a3a42); // inside the rim
  if (blur) {
    disc(m, c, c, WHEEL_R - 6, 0x6a6a72); // spokes at speed: a grey blur
    line(m, c - WHEEL_R + 4, c, c + WHEEL_R - 4, c, 0xc0c0c8);
  } else {
    for (let i = 0; i < 8; i++) {
      const a = ((deg + i * 45) * Math.PI) / 180;
      line(m, c, c, c + Math.cos(a) * (WHEEL_R - 3), c + Math.sin(a) * (WHEEL_R - 3), 0xd0d0d8);
    }
  }
  disc(m, c, c, 2, 0xc8a24a); // the hub
  return m;
}

// ---- the road's props -----------------------------------------------------------
function bale() {
  const w = px(1.1);
  const h = px(0.55);
  const m = img(w, h);
  rect(m, 0, 0, w, h, 0xd8b050);
  for (let i = 0; i < 90; i++) {
    const x = (i * 37) % w;
    const y = (i * 53) % h;
    line(m, x, y, x + 4, y + ((i % 3) - 1), i % 2 ? 0xb88e38 : 0xf0d078);
  }
  rect(m, 8, 0, 2, h, 0x7a5a24);
  rect(m, w - 10, 0, 2, h, 0x7a5a24);
  rect(m, 0, h - 4, w, 4, 0x9a7a30);
  outline(m, 0x4a3a18);
  return m;
}
function cart() {
  const w = px(3);
  const h = px(1.7);
  const m = img(w, h);
  // a hay cart stopped on the road: the load, the bed, two wheels, the shafts
  poly(m, [[10, h - 28], [20, 8], [w - 40, 2], [w - 22, h - 30]], 0xc8a040);
  for (let i = 0; i < 140; i++) {
    const x = 14 + ((i * 41) % (w - 40));
    const y = 6 + ((i * 29) % (h - 36));
    if (alpha(m, x, y)) line(m, x, y, x + 5, y + ((i % 3) - 1), i % 2 ? 0xa88430 : 0xe8c868);
  }
  rect(m, 6, h - 30, w - 26, 8, 0x6a4a2c);
  rect(m, w - 22, h - 26, 22, 3, 0x6a4a2c);
  for (const cx of [32, w - 50]) {
    disc(m, cx, h - 15, 14, 0x4a321e);
    disc(m, cx, h - 15, 10, 0x8a6a44);
    disc(m, cx, h - 15, 2, 0x2a1a10);
  }
  outline(m, 0x2a1a10);
  return m;
}
function gantry() {
  const w = px(1.4);
  const h = px(4.2);
  const m = img(w, h);
  rect(m, w / 2 - 3, 0, 6, h, 0x4a4a52);
  rect(m, w / 2 - 3, 0, 2, h, 0x6a6a72);
  rect(m, 2, 6, w - 4, 62, 0x20202a);
  rect(m, 4, 8, w - 8, 2, 0x4a4a52);
  outline(m, 0x14101a);
  return m;
}
function board(text) {
  const w = px(1.1);
  const h = px(2);
  const m = img(w, h);
  rect(m, w / 2 - 2, 26, 4, h - 26, 0x3a3a42);
  rect(m, 0, 0, w, 30, 0xf2e6cc);
  rect(m, 0, 0, w, 3, 0xb8302a);
  rect(m, 0, 27, w, 3, 0xb8302a);
  let x = Math.round((w - text.length * 8 + 2) / 2);
  for (const ch of text) {
    digit(m, ch, x, 7, 0x1a1420, 2);
    x += 8;
  }
  outline(m, 0x14101a);
  return m;
}
function chevron() {
  const w = px(1.1);
  const h = px(1.4);
  const m = img(w, h);
  rect(m, w / 2 - 2, 26, 4, h - 26, 0x3a3a42);
  rect(m, 0, 0, w, 30, 0x14141c);
  for (let i = 0; i < 2; i++) poly(m, [[6 + i * 18, 3], [14 + i * 18, 3], [26 + i * 18, 15], [14 + i * 18, 27], [6 + i * 18, 27], [18 + i * 18, 15]], 0xf2e6cc);
  outline(m, 0x14101a);
  return m;
}
function wall() {
  const w = 96;
  const h = px(1);
  const m = img(w, h);
  rect(m, 0, 0, w, h, 0x8a8478);
  for (let r = 0; r < 4; r++) {
    rect(m, 0, r * 11, w, 1, 0x4a463e);
    for (let x = (r % 2) * 12; x < w; x += 24) rect(m, x, r * 11, 1, 11, 0x4a463e);
  }
  rect(m, 0, 0, w, 3, 0xb8b0a0);
  return m;
}
function checker() {
  const w = px(1.2);
  const h = px(2.4);
  const m = img(w, h);
  rect(m, 2, 0, 4, h, 0x4a4a52);
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) rect(m, 6 + x * 9, 2 + y * 9, 9, 9, (x + y) % 2 ? 0x14141c : 0xf2e6cc);
  return m;
}
function puff() {
  const m = img(24, 24);
  disc(m, 12, 13, 9, 0xd8c8a0, 150);
  disc(m, 8, 11, 6, 0xe8dcc0, 170);
  disc(m, 15, 9, 5, 0xf2e6cc, 190);
  return m;
}
function spark() {
  const m = img(14, 14);
  line(m, 7, 0, 7, 13, 0xfff0a8);
  line(m, 0, 7, 13, 7, 0xffd060);
  disc(m, 7, 7, 2, 0xffffff);
  return m;
}
function tail() {
  const m = img(5, 7);
  rect(m, 0, 0, 5, 7, 0xff3a2a);
  rect(m, 1, 1, 2, 3, 0xffb0a0);
  return m;
}
function lightLamp(c, on) {
  const m = img(20, 20);
  disc(m, 10, 10, 9, 0x14141c);
  disc(m, 10, 10, 7, on ? c : shade(c, 0.28));
  if (on) disc(m, 8, 8, 2, 0xffffff);
  return m;
}

// every frame of the `cars` atlas: name → image
export function carFrames() {
  const out = {};
  for (const [id, L] of Object.entries(LIVERIES)) out[`car-${id}`] = paintCar(L);
  for (let i = 0; i < WHEEL_STEPS; i++) out[`wheel-${i}`] = paintWheel(i * WHEEL_DEG);
  out['wheel-blur'] = paintWheel(0, true);
  out.bale = bale();
  out.cart = cart();
  out.gantry = gantry();
  for (const n of ['150', '100', '50']) out[`board-${n}`] = board(n);
  out.chevron = chevron();
  out.wall = wall();
  out.finish = checker();
  out.puff = puff();
  out.spark = spark();
  out.brakelamp = tail();
  out['light-red'] = lightLamp(0xe83a2a, true);
  out['light-green'] = lightLamp(0x4ae060, true);
  out['light-off'] = lightLamp(0xe83a2a, false);
  return out;
}
