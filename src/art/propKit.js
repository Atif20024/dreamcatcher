// The prop kit (round 2 WP2): the furniture and street things Jo stands next
// to, redrawn at the §7 scale (1 m = 44 px; src/data/scale.js) instead of the
// old shed-sized string art. Each painter builds a letter grid in cells of
// 2 px (the cast's pixel size), sized from real metres, and paints it with
// the shared shading pass (hubArt.paintRig: lit west edge, hue-shifted shade
// east, selective outline), so props and people read as one drawing.
//
// REDRAW maps the texture keys the scenes already use onto a painter. The
// texture creators (createPixelTexture, the hub's painted props) ask
// `redrawProp(scene, key)` first. The new texture carries a pivot that keeps
// its bottom-centre where the old image's was under the old default origin,
// so a scene that placed the old prop by its centre still stands the new
// one on the same floor, and one that used (0.5, 1) is unchanged.
import { px as mpx } from '../data/scale.js';

// ---- a tiny grid DSL ---------------------------------------------------------------
class G {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.c = Array.from({ length: h }, () => Array(w).fill('.'));
  }
  p(x, y, ch) {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.c[y][x] = ch;
    return this;
  }
  r(x, y, w, h, ch) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.p(x + i, y + j, ch);
    return this;
  }
  h_(x, y, w, ch) {
    return this.r(x, y, w, 1, ch);
  }
  v(x, y, h, ch) {
    return this.r(x, y, 1, h, ch);
  }
  rows() {
    return this.c.map((r) => r.join(''));
  }
}
const cells = (m) => Math.max(1, Math.round(mpx(m) / 2)); // metres → 2 px cells

// ---- painters (return rows; palettes use the letters below) ---------------------
// W wood, w wood shade, d dark, M metal, m metal shade, G glass, Y light,
// R accent, r accent shade, S stone, s stone shade, K knob/brass, k ink
const P = {
  // a park/platform bench: 1.8 m long, seat 0.45 m, back 0.85 m, iron ends
  bench(o = {}) {
    const w = cells(o.len || 1.8);
    const h = cells(0.86);
    const g = new G(w, h);
    const seat = h - cells(0.45);
    for (let y = 1; y < seat - 1; y += 3) g.h_(1, y, w - 2, 'W').h_(1, y + 1, w - 2, 'w');
    g.h_(0, seat, w, 'W').h_(0, seat + 1, w, 'w');
    for (const x of [1, w - 3]) {
      g.v(x, 0, h, 'M').v(x + 1, seat - 3, h - seat + 3, 'm');
      g.h_(x - 1, h - 1, 4, 'M');
    }
    g.r(1, seat - 2, 3, 1, 'M').r(w - 4, seat - 2, 3, 1, 'M'); // armrests
    return g;
  },
  // desk / table: top, apron, legs; a drawer pedestal on a desk
  desk(o = {}) {
    const w = cells(o.len || 1.4);
    const h = cells(o.high || 0.75);
    const g = new G(w, h);
    g.h_(0, 0, w, 'W').h_(0, 1, w, 'w').h_(1, 2, w - 2, 'd');
    g.r(1, 3, 2, h - 3, 'w').r(w - 3, 3, 2, h - 3, 'w');
    if (o.drawers !== false) {
      const pw = Math.round(w * 0.36);
      const x0 = w - pw - 1;
      g.r(x0, 3, pw, h - 3, 'W');
      for (let y = 3; y < h - 1; y += 4) g.h_(x0, y, pw, 'd').p(x0 + (pw >> 1), y + 2, 'K');
      g.h_(x0, h - 1, pw, 'd');
    }
    if (o.lamp) g.r(4, 0, 1, 1, 'Y');
    return g;
  },
  table(o = {}) {
    return P.desk({ ...o, len: o.len || 1.2, drawers: false });
  },
  // a café table: round top, one pedestal, a cross foot
  cafeTable(o = {}) {
    const w = cells(o.len || 0.7);
    const h = cells(0.75);
    const g = new G(w, h);
    g.h_(0, 0, w, 'M').h_(1, 1, w - 2, 'm');
    g.v(w >> 1, 2, h - 3, 'M').v((w >> 1) - 1, 2, h - 3, 'm');
    g.h_(2, h - 1, w - 4, 'M');
    return g;
  },
  chair() {
    const w = cells(0.45);
    const h = cells(0.9);
    const g = new G(w, h);
    const seat = h - cells(0.45);
    g.v(0, 0, h, 'W').v(1, 0, seat, 'w');
    for (let y = 2; y < seat - 1; y += 3) g.h_(1, y, 2, 'W');
    g.h_(0, seat, w, 'W').h_(0, seat + 1, w, 'w');
    g.v(w - 1, seat + 2, h - seat - 2, 'w');
    return g;
  },
  // a street lamp: 4.5 m (platform 3.5 m), a lantern on a fluted post
  lamp(o = {}) {
    const h = cells(o.m || 4.5);
    const w = 11;
    const g = new G(w, h);
    const c = 5;
    g.r(c - 2, 0, 5, 1, 'M').r(c - 3, 1, 7, 1, 'M');
    g.r(c - 3, 2, 7, 5, 'Y').v(c - 3, 2, 5, 'M').v(c + 3, 2, 5, 'M').v(c, 2, 5, 'm');
    g.r(c - 2, 7, 5, 1, 'M').r(c - 1, 8, 3, 1, 'm');
    g.v(c, 9, h - 9, 'M').v(c + 1, 12, h - 16, 'm');
    g.r(c - 1, 14, 3, 1, 'M');
    g.r(c - 2, h - 6, 5, 4, 'M').r(c - 3, h - 2, 7, 2, 'M').h_(c - 2, h - 4, 5, 'm');
    return g;
  },
  // a door: 0.95 × 2.1 m leaf in a frame (52 × 100 with the frame)
  door(o = {}) {
    const w = cells(o.wide || 1.15);
    const h = cells(o.high || 2.25);
    const g = new G(w, h);
    g.r(0, 0, w, h, 'F').r(2, 2, w - 4, h - 2, 'D');
    const x0 = 4;
    const iw = w - 8;
    if (o.revolve) {
      // a revolving door: brass frame, three glass wings, a canopy band
      g.r(2, 2, w - 4, 3, 'K');
      for (const x of [x0, (w >> 1) - 1, w - 6]) g.v(x, 5, h - 6, 'K');
      g.r(x0 + 1, 6, (w >> 1) - x0 - 2, h - 8, 'G').r((w >> 1), 6, w - 6 - (w >> 1), h - 8, 'G');
      g.h_(2, h - 2, w - 4, 'K');
      return g;
    }
    if (o.glass) g.r(x0, 4, iw, Math.round(h * 0.3), 'G').v(x0 + (iw >> 1), 4, Math.round(h * 0.3), 'D');
    else g.r(x0, 4, iw, Math.round(h * 0.3), 'd').r(x0 + 1, 5, iw - 2, Math.round(h * 0.3) - 2, 'D');
    g.r(x0, Math.round(h * 0.45), iw, Math.round(h * 0.45), 'd').r(x0 + 1, Math.round(h * 0.45) + 1, iw - 2, Math.round(h * 0.45) - 2, 'D');
    g.r(w - 5, Math.round(h * 0.5), 2, 2, 'K');
    if (o.bar) g.h_(3, Math.round(h * 0.5), w - 6, 'M');
    return g;
  },
  // a pillar box: 1.55 m
  postbox() {
    const w = 13;
    const h = cells(1.55);
    const g = new G(w, h);
    g.r(1, 0, w - 2, 2, 'R').r(0, 2, w, 2, 'R').r(1, 4, w - 2, h - 7, 'R');
    g.h_(2, 6, w - 4, 'k').h_(3, 7, w - 6, 'k');
    g.r(4, 11, 5, 3, 'Y').r(0, h - 3, w, 3, 'r');
    g.v(w - 3, 4, h - 7, 'r');
    return g;
  },
  // a cabinet / machine: a box with panel lines (filing cabinet, copier, slot)
  cabinet(o = {}) {
    const w = cells(o.len || 0.9);
    const h = cells(o.high || 1.3);
    const g = new G(w, h);
    g.r(0, 0, w, h, 'M').v(w - 2, 0, h, 'm').h_(0, h - 1, w, 'm');
    const n = o.drawers || 4;
    const dh = Math.floor((h - 2) / n);
    for (let i = 1; i < n; i++) g.h_(1, i * dh, w - 3, 'd');
    for (let i = 0; i < n; i++) g.r((w >> 1) - 2, i * dh + 2, 3, 1, 'K');
    return g;
  },
  copier() {
    const w = cells(1.3);
    const h = cells(1.2);
    const g = new G(w, h);
    g.r(2, 0, w - 4, 3, 'm').r(0, 3, w, h - 3, 'M').h_(0, 3, w, 'S');
    g.r(3, 6, 8, 3, 'k').r(4, 7, 2, 1, 'Y').r(7, 7, 2, 1, 'R');
    g.r(w - 10, 8, 8, 2, 'S').h_(1, Math.round(h * 0.6), w - 2, 'd').h_(1, h - 4, w - 2, 'd');
    g.r((w >> 1) - 2, Math.round(h * 0.6) + 2, 4, 1, 'K');
    return g;
  },
  slot() {
    const w = cells(0.8);
    const h = cells(1.7);
    const g = new G(w, h);
    g.r(1, 0, w - 2, 4, 'R').r(0, 4, w, h - 4, 'M').v(w - 2, 4, h - 4, 'm');
    g.r(2, 8, w - 5, 8, 'k').r(3, 9, 3, 6, 'Y').r(7, 9, 3, 6, 'Y').r(11, 9, Math.max(1, w - 15), 6, 'Y');
    g.r(2, 19, w - 5, 2, 'K').r(2, h - 10, w - 5, 4, 'k').v(w - 1, 10, 6, 'K');
    return g;
  },
  // an upright piano: 1.5 × 1.2 m
  piano() {
    const w = cells(1.5);
    const h = cells(1.2);
    const g = new G(w, h);
    g.r(0, 0, w, h - 2, 'W').h_(0, 0, w, 'w').r(2, 3, w - 4, Math.round(h * 0.4), 'w');
    const ky = Math.round(h * 0.55);
    g.r(0, ky, w, 3, 'S').h_(0, ky + 3, w, 'd');
    for (let x = 1; x < w - 1; x += 3) g.p(x, ky, 'k');
    g.v(1, h - 2, 2, 'w').v(w - 2, h - 2, 2, 'w');
    return g;
  },
  // a handcart: bed at 0.6 m, two wheels, shafts
  cart(o = {}) {
    const w = cells(o.len || 1.6);
    const h = cells(0.9);
    const g = new G(w, h);
    const bed = h - 9;
    g.r(0, bed - 5, w - 6, 5, 'W').h_(0, bed - 5, w - 6, 'w').v(0, bed - 9, 9, 'W').v(w - 7, bed - 9, 9, 'W');
    g.h_(w - 6, bed - 3, 6, 'w');
    const cx = Math.round(w * 0.4);
    g.r(cx - 3, bed, 7, 8, 'd').r(cx - 2, bed + 1, 5, 6, 'M').p(cx, bed + 3, 'K').p(cx + 1, bed + 4, 'K');
    g.v(w - 8, bed, h - bed, 'w');
    return g;
  },
  // a car: 4.3 × 1.45 m; a van 5 × 2 m
  car(o = {}) {
    const van = !!o.van;
    const w = cells(van ? 5 : 4.3);
    const h = cells(van ? 2 : 1.45);
    const g = new G(w, h);
    const sill = h - 5;
    const roof = van ? 0 : Math.round(h * 0.38);
    if (van) g.r(1, 0, w - 8, sill, 'R').r(w - 8, 6, 7, sill - 6, 'R').r(w - 7, 7, 5, 6, 'G');
    else {
      g.r(Math.round(w * 0.22), 0, Math.round(w * 0.5), roof, 'R');
      g.r(Math.round(w * 0.26), 2, Math.round(w * 0.2), roof - 2, 'G').r(Math.round(w * 0.5), 2, Math.round(w * 0.19), roof - 2, 'G');
      g.r(0, roof, w, sill - roof, 'R');
    }
    g.h_(0, sill - 4, w, 'r').r(w - 3, sill - 8, 3, 3, 'Y').r(0, sill - 8, 2, 3, 'R');
    g.r(0, sill, w, 2, 'd').h_(2, sill - 1, w - 4, 'S');
    for (const cx of [Math.round(w * 0.2), Math.round(w * 0.8)]) {
      g.r(cx - 5, sill - 3, 11, 8, 'k').r(cx - 3, sill - 1, 7, 5, 'M').r(cx - 1, sill + 1, 3, 1, 'm');
    }
    return g;
  },
  // an easel: 1.6 m with a canvas
  easel(o = {}) {
    const w = 18;
    const h = cells(1.6);
    const g = new G(w, h);
    for (let y = 0; y < h; y++) {
      g.p(8 - Math.floor(y / 8), y, 'W').p(9 + Math.floor(y / 8), y, 'w');
    }
    g.v(9, 4, h - 4, 'w');
    const cy = Math.round(h * 0.15);
    g.r(2, cy, 14, Math.round(h * 0.38), o.blank ? 'S' : 'Y').r(3, cy + 1, 12, Math.round(h * 0.38) - 2, o.blank ? 'S' : 'R');
    g.h_(1, cy + Math.round(h * 0.38), 16, 'W');
    return g;
  },
  // a bed: 2 m long, 0.5 m high
  bed(o = {}) {
    const w = cells(o.len || 2);
    const h = cells(o.high || 0.55);
    const g = new G(w, h);
    g.v(0, 0, h, 'W').v(w - 1, 3, h - 3, 'W');
    g.r(1, 3, w - 2, 4, 'S').r(2, 2, 6, 2, 'Y').r(1, 7, w - 2, 2, 'W');
    g.v(1, 9, h - 9, 'w').v(w - 2, 9, h - 9, 'w');
    return g;
  },
  // a pot-belly stove with its pipe stub
  stove() {
    const w = 15;
    const h = cells(0.9);
    const g = new G(w, h);
    g.r(5, 0, 4, 4, 'M').r(2, 4, 11, h - 7, 'M').r(1, 7, 13, h - 12, 'M').r(5, 10, 5, 4, 'Y').h_(1, h - 3, 13, 'm').v(2, h - 3, 3, 'm').v(12, h - 3, 3, 'm');
    return g;
  },
  // a town fountain: a 4 m basin 0.6 m high and a 2 m column
  fountain(o = {}) {
    const w = cells(o.len || 4);
    const h = cells(o.high || 2);
    const g = new G(w, h);
    const c = w >> 1;
    const bh = cells(0.6);
    g.r(c - 1, 0, 3, 2, 'S').r(c - 5, 2, 11, 2, 'S').r(c - 4, 4, 9, 1, 's').r(c - 2, 5, 5, h - bh - 5, 'S').v(c + 2, 5, h - bh - 5, 's');
    g.r(c - 9, Math.round(h * 0.45), 19, 2, 'S').h_(c - 8, Math.round(h * 0.45) + 2, 17, 's');
    g.r(c - 7, Math.round(h * 0.45) - 1, 15, 1, 'G');
    g.r(0, h - bh, w, bh, 'S').h_(0, h - bh, w, 's').r(2, h - bh + 2, w - 4, 2, 'G').h_(0, h - 1, w, 's');
    return g;
  },
  drinkFountain() {
    const g = new G(11, cells(1.0));
    g.r(1, 0, 9, 3, 'S').r(2, 1, 7, 1, 'G').r(3, 3, 5, g.h - 3, 'S').v(7, 3, g.h - 3, 's').r(2, g.h - 2, 7, 2, 's');
    return g;
  },
  // a valet / host stand: 1.2 m
  stand() {
    const g = new G(13, cells(1.2));
    g.r(0, 0, 13, 3, 'W').r(1, 3, 11, g.h - 5, 'R').v(10, 3, g.h - 5, 'r').r(0, g.h - 2, 13, 2, 'W').r(3, 5, 7, 2, 'K');
    return g;
  },
  lectern() {
    const g = new G(15, cells(1.2));
    g.r(0, 0, 15, 2, 'W').r(1, 2, 13, 2, 'w').r(5, 4, 5, g.h - 6, 'W').v(9, 4, g.h - 6, 'w').r(2, g.h - 2, 11, 2, 'W');
    return g;
  },
  washer() {
    const g = new G(cells(0.6), cells(0.85));
    const w = g.w;
    g.r(0, 0, w, g.h, 'S').h_(0, 4, w, 's').r(1, 1, 4, 2, 'k').r(w - 5, 1, 2, 2, 'K');
    const cx = w >> 1;
    const cy = Math.round(g.h * 0.6);
    for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) if (x * x + y * y <= 25) g.p(cx + x, cy + y, x * x + y * y > 15 ? 'M' : 'G');
    return g;
  },
  // a luggage trolley / hand truck: 1 m
  trolley() {
    const g = new G(30, cells(1.0));
    g.v(26, 0, g.h - 4, 'M').h_(22, 0, 6, 'M').r(1, g.h - 7, 26, 2, 'M').v(1, g.h - 12, 6, 'M');
    g.r(4, g.h - 5, 4, 4, 'k').r(20, g.h - 5, 4, 4, 'k');
    return g;
  },
  suitcase() {
    const g = new G(16, 12);
    g.r(5, 0, 6, 1, 'd').v(5, 0, 2, 'd').v(10, 0, 2, 'd').r(0, 2, 16, 10, 'W').h_(0, 6, 16, 'w').r(2, 3, 1, 8, 'K').r(13, 3, 1, 8, 'K');
    return g;
  },
};

// ---- palettes per dream (the colours the old props had) ---------------------------
const WOOD = { W: 0x8a6a4a, w: 0x5a4028, d: 0x3a2a1e, K: 0xd8b050 };
const IRON = { M: 0x3a3a44, m: 0x24242c };
const STREET = { M: 0x2a2a30, m: 0x18181e, Y: 0xf2c078 };
const pal = (...p) => Object.assign({}, ...p);

// key → [painter, options, palette]
export const REDRAW = {
  // the long evening (the play-plane furniture; houses/lamps on the house
  // rows belong to the backdrop pass, WP4)
  'ev-bench': ['bench', {}, pal(WOOD, IRON)],
  'ev-postbox': ['postbox', {}, { R: 0xc03a2a, r: 0x8a2a20, k: 0x1a1a20, Y: 0xf2d580 }],
  'ev-fountain': ['fountain', {}, { S: 0xe0d0b0, s: 0xb8a482, G: 0x88b8d8 }],
  'ev-chess': ['table', { len: 1.0 }, pal(WOOD, { d: 0x1a1a20 })],
  'ev-cart': ['cart', {}, pal(WOOD, IRON, { K: 0xe8a030 })],
  'ev-chair': ['chair', {}, WOOD],
  'ev-charpoy': ['bed', { len: 1.9, high: 0.5 }, pal(WOOD, { S: 0xd8c8a0, Y: 0xe8dcc0 })],
  // the writer
  'wr-desk': ['desk', {}, pal(WOOD, { Y: 0xf2d580 })],
  'wr-desk-big': ['desk', { len: 1.8 }, WOOD],
  'wr-table': ['table', {}, WOOD],
  'wr-bench': ['bench', {}, pal(WOOD, IRON)],
  'wr-chair': ['chair', {}, WOOD],
  'wr-lamp-post': ['lamp', {}, STREET],
  'wr-shop-door': ['door', { glass: true }, { F: 0x3a3a44, D: 0x6a3a2a, d: 0x4a2a1e, G: 0x9ab8c8, K: 0xd8b050 }],
  'wr-fire-door': ['door', { bar: true }, { F: 0x3a3a44, D: 0x8a2a24, d: 0x6a1e1a, M: 0xc8c8d0, K: 0xd8b050 }],
  'wr-machine': ['copier', {}, { M: 0xd8d4c8, m: 0x8a8a8a, S: 0xe8e4d8, d: 0x9a9a98, k: 0x2a2a30, Y: 0x7ad87a, R: 0xd84a3a, K: 0x5a5a62 }],
  'wr-cabinet': ['cabinet', { len: 0.9, high: 0.8, drawers: 2 }, { M: 0x7a8a7a, m: 0x5a6a5a, d: 0x3a4a3a, K: 0xd8d4c8 }],
  'wr-piano': ['piano', {}, { W: 0x3a2418, w: 0x2a1810, S: 0xf2ece0, d: 0x1a1210, k: 0x1a1a20 }],
  'wr-washer': ['washer', {}, { S: 0xe8e4d8, s: 0xb8b4a8, M: 0x8a8a94, G: 0x88a8c8, k: 0x2a2a30, K: 0xc03a2a }],
  'wr-lectern': ['lectern', {}, WOOD],
  // the painter (the house fronts, the café front and the trees are WP4)
  'pt-bench': ['bench', {}, { W: 0x9a9aa4, w: 0x6a6a72, M: 0x1f3a5f, m: 0x152a48 }],
  'pt-table': ['table', {}, pal(WOOD, { W: 0xc89a4a, w: 0x8a6a3a })],
  'pt-chair': ['chair', {}, { W: 0xe8c060, w: 0xb8903a }],
  'pt-desk': ['desk', {}, pal(WOOD, { W: 0x8a6a4a })],
  'pt-lamp': ['lamp', {}, { M: 0x1f3a5f, m: 0x152a48, Y: 0xf2d060 }],
  'pt-bed': ['bed', {}, { W: 0xc89a4a, w: 0x8a6a3a, S: 0xd84a3a, Y: 0xf2ece0 }],
  'pt-cot': ['bed', { len: 1.8, high: 0.45 }, { W: 0x8a8a94, w: 0x5a5a62, S: 0xd8d0c0, Y: 0xf2ece0 }],
  'pt-easel': ['easel', { blank: true }, { W: 0xb8884a, w: 0x7a5a32, S: 0xf2ece0, Y: 0xf2ece0, R: 0xe8e0d0 }],
  'pt-stove': ['stove', {}, { M: 0x2a2a30, m: 0x18181e, Y: 0xe8a030 }],
  'pt-stove_north': ['stove', {}, { M: 0x2a2a30, m: 0x18181e, Y: 0xe8a030 }],
  'pt-cart': ['cart', {}, pal(WOOD, IRON, { W: 0x9a7a4a })],
  'pt-fountain': ['fountain', { len: 3, high: 2 }, { S: 0xd8c8a0, s: 0xa8987a, G: 0x6a9ad8 }],
  // the gambler
  'gm-lamp-post': ['lamp', {}, pal(STREET, { Y: 0xf2b060 })],
  'gm-car': ['car', {}, { R: 0x6a2a3a, r: 0x4a1a28, G: 0x9ab0c8, Y: 0xf2e0a0, d: 0x1a1a20, S: 0xc8c8d0, k: 0x14141a, M: 0x5a5a62, m: 0x2a2a30 }],
  // (gm-van stays: it is a moving platform Jo rides, 27 px tall; a 2 m van
  // would be out of jump reach until the carpark is rebuilt — WP2 report)
  'gm-door': ['door', { revolve: true, wide: 2.0, high: 2.4 }, { F: 0x3a2a1a, D: 0x2a1a30, d: 0x1a1020, G: 0x4a3a5a, K: 0xe9b84a }],
  'gm-staffdoor': ['door', {}, { F: 0x2a2a30, D: 0x4a4a56, d: 0x32323c, K: 0xe9b84a }],
  'gm-firedoor': ['door', { bar: true }, { F: 0x2a2a30, D: 0x8a2a24, d: 0x6a1e1a, M: 0xc8c8d0, K: 0xe9b84a }],
  'gm-videopoker': ['slot', {}, { R: 0xa8243a, M: 0x2a2a36, m: 0x1a1a22, k: 0x0e0e14, Y: 0xe9b84a, K: 0xe84a5a }],
  'gm-piano': ['piano', {}, { W: 0x14141a, w: 0x0a0a0e, S: 0xf2ece0, d: 0x08080a, k: 0x1a1a20 }],
  'gm-valet': ['stand', {}, { W: 0x2a1a1a, R: 0xa8243a, r: 0x6e1e2c, K: 0xe9b84a }],
  'gm-fountain': ['fountain', { len: 3.6, high: 1.8 }, { S: 0xd8d0c0, s: 0xa8a090, G: 0x6ab8d8 }],
  // the musician / astronaut
  'mus-chair': ['chair', {}, { W: 0x6a4a32, w: 0x4a3222 }],
  'astro-desk': ['desk', {}, { W: 0xb8b8c0, w: 0x8a8a94, d: 0x4a4a54, K: 0x3a5a80 }],
  // the hub (doors, booths, kiosk and trains are WP3)
  'hub-bench': ['bench', {}, pal(WOOD, IRON)],
  'hub-desk': ['desk', { len: 1.8, high: 0.9 }, pal(WOOD, { W: 0x6a4a32, w: 0x4a3222 })],
  'hub-fountain': ['drinkFountain', {}, { S: 0xc8c0b0, s: 0x8a8478, G: 0x88b8d8 }],
  'hub-cart': ['trolley', {}, IRON],
  'hub-suitcase': ['suitcase', {}, { W: 0x8a5a3a, w: 0x6a4228, d: 0x3a2a1e, K: 0xd8b050 }],
};

export const REDRAW_KEYS = Object.keys(REDRAW);

// rows for a key (also used by the scale lint, headless)
export function propRows(key) {
  const r = REDRAW[key];
  if (!r) return null;
  return { rows: P[r[0]](r[1]).rows(), pal: r[2] };
}

// paint `key` with the kit if it has a redraw; `oldW/oldH` are the old
// image's size (for the pivot that keeps the old floor point)
// the shading pass is src/entities/hubArt.js paintRig; it registers itself
// here (a static import would pull Phaser into the headless lints)
let shadePainter = null;
export const usePainter = (fn) => (shadePainter = fn);

export function redrawProp(scene, key, oldW, oldH, paintRig = shadePainter) {
  const pr = propRows(key);
  if (!pr || !paintRig) return false;
  if (scene.textures.exists(key) && scene.textures.get(key).customData?.kit) return true;
  if (scene.textures.exists(key)) scene.textures.remove(key);
  paintRig(scene, key, pr.rows, pr.pal, 2);
  const tex = scene.textures.get(key);
  if (!tex || !tex.get) return true;
  const f = tex.get();
  const H = f.height || pr.rows.length * 2;
  if (oldH) {
    f.customPivot = true;
    f.pivotX = 0.5;
    f.pivotY = Math.min(1, (H - oldH / 2) / H);
  }
  tex.customData = { ...(tex.customData || {}), kit: true };
  return true;
}

// round 2 WP4: the Evening's street lamps stand at 4.5 m like every other
// street lamp (they belonged to the house rows, now at scale)
REDRAW['ev-lamp'] = ['lamp', {}, pal(STREET, { Y: 0xf2d580 })];
REDRAW_KEYS.push('ev-lamp');

// ---- the Long Evening at scale (owner: "last stop is out of proportions") ----------
// Everything Jo walks past in the Evening that was still old string art at
// knee height, from real metres. Sizes are in docs/redesign/round2/LAST_STOP_SCALE_REPORT.md
// and held by lint:scale (PROP_TABLE).
const disc = (g, cx, cy, rx, ry, ch) => {
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) g.p(cx + x, cy + y, ch);
};
const line = (g, x0, y0, x1, y1, ch, thick = 1) => {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) g.r(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), thick, thick, ch);
};
const wheel = (g, cx, cy, r, tyre, spoke, hub) => {
  disc(g, cx, cy, r, r, tyre);
  disc(g, cx, cy, r - 2, r - 2, '.');
  for (let a = 0; a < 8; a++) line(g, cx, cy, Math.round(cx + Math.cos((a * Math.PI) / 4) * (r - 1)), Math.round(cy + Math.sin((a * Math.PI) / 4) * (r - 1)), spoke);
  disc(g, cx, cy, Math.max(1, r >> 3), Math.max(1, r >> 3), hub);
};
Object.assign(P, {
  // a playground A-frame: 3 m wide, 2.3 m high, two seats at 0.45 m
  swingset() {
    const w = cells(3);
    const h = cells(2.3);
    const g = new G(w, h);
    const seat = h - cells(0.45);
    for (const x of [Math.round(w * 0.3), Math.round(w * 0.68)]) {
      g.v(x - 5, 2, seat - 2, 'r').v(x + 5, 2, seat - 2, 'r');
      g.r(x - 6, seat, 13, 2, 's');
    }
    for (const [top, a, b] of [[4, 0, 8], [w - 6, w - 2, w - 10]]) {
      line(g, top, 1, a, h - 2, 'F', 2);
      line(g, top, 1, b, h - 2, 'f', 2);
    }
    g.r(0, 0, w, 2, 'F').h_(0, 1, w, 'f');
    return g;
  },
  // a school gate: iron pales 1.5 m high, 2 m wide, between two posts
  gate() {
    const w = cells(2);
    const h = cells(1.5);
    const g = new G(w, h);
    for (let x = 4; x < w - 4; x += 4) g.v(x, 2, h - 2, 'G').p(x, 1, 'g');
    g.h_(0, 6, w, 'G').h_(0, h - 7, w, 'G');
    g.r(0, 0, 3, h, 'G').r(w - 3, 0, 3, h, 'G').v(2, 0, h, 'g').v(w - 1, 0, h, 'g');
    return g;
  },
  // an orchard fence, 1.1 m high, one rail come down
  fence() {
    const w = cells(2.4);
    const h = cells(1.1);
    const g = new G(w, h);
    g.h_(0, 5, w, 'F').h_(0, 6, w, 'f').h_(0, 14, 28, 'F').h_(0, 15, 28, 'f');
    line(g, 29, 14, 42, 21, 'F', 2);
    for (const x of [1, 26, w - 3]) g.r(x, 0, 3, h, 'F').v(x + 2, 0, h, 'f');
    return g;
  },
  // a clothes post: 2.3 m with a crosstree the line ties to
  post() {
    const w = cells(0.6);
    const h = cells(2.3);
    const g = new G(w, h);
    const c = w >> 1;
    g.r(c - 1, 0, 3, h, 'P').v(c + 1, 0, h, 'p');
    g.h_(0, 3, w, 'P').h_(0, 4, w, 'p');
    return g;
  },
  // a hung sheet: 1.35 × 1.1 m (the plain one with a blue border, the other striped)
  sheet(o = {}) {
    const w = cells(1.35);
    const h = cells(1.1);
    const g = new G(w, h);
    g.r(0, 0, w, h, 'W');
    if (o.striped) for (let y = 4; y < h; y += 7) g.r(0, y, w, 2, 'b');
    else g.h_(0, h - 3, w, 'b').h_(0, 1, w, 'w');
    g.v(w - 2, 0, h, 'w').v(Math.round(w * 0.4), 2, h - 4, 'w');
    return g;
  },
  // Bilal's tea stall: 2.4 m wide, 2.5 m under a striped canopy, the counter at 1.05 m
  teastall() {
    const w = cells(2.4);
    const h = cells(2.5);
    const g = new G(w, h);
    const counter = h - cells(1.05);
    g.r(2, 6, 2, h - 6, 'B').r(w - 4, 6, 2, h - 6, 'B');
    g.r(1, counter, w - 2, 2, 'B').r(2, counter + 2, w - 4, h - counter - 4, 'G').h_(2, counter + 6, w - 4, 'g').h_(2, h - 3, w - 4, 'B');
    g.r(1, h - 2, 3, 2, 'k').r(w - 4, h - 2, 3, 2, 'k');
    // the samovar and the glasses on the counter
    g.r(10, counter - 11, 7, 11, 'K').r(12, counter - 13, 3, 2, 'k').p(17, counter - 4, 'k');
    for (let x = 24; x < 42; x += 5) g.r(x, counter - 3, 3, 3, 'w');
    g.r(0, 0, w, 2, 'g');
    for (let x = 0; x < w; x++) g.v(x, 2, x % 8 < 4 ? 5 : 4, x % 8 < 4 ? 'G' : 'w');
    return g;
  },
  // the bicycle man's stall: 3 × 2.4 m, a real bicycle (1.7 m, 0.68 m wheels) on the stand
  bikestall() {
    const w = cells(3);
    const h = cells(2.4);
    const g = new G(w, h);
    g.r(0, 0, w, 3, 'T').h_(0, 3, w, 'd').r(2, 4, 2, h - 4, 'T').r(w - 4, 4, 2, h - 4, 'T');
    const cy = h - 8;
    const a = 21;
    const b = 45;
    wheel(g, a, cy, 7, 'k', 's', 's');
    wheel(g, b, cy, 7, 'k', 's', 's');
    line(g, a, cy, 30, cy, 'R');
    line(g, 30, cy, 27, cy - 11, 'R');
    line(g, 27, cy - 11, 40, cy - 11, 'R');
    line(g, 30, cy, 40, cy - 11, 'R');
    line(g, 40, cy - 13, b, cy, 'R');
    line(g, a, cy, 27, cy - 11, 'R');
    g.r(24, cy - 13, 6, 2, 'k').r(38, cy - 15, 5, 2, 's');
    // a spare wheel on the back wall
    wheel(g, 12, 15, 6, 'k', 's', 's');
    return g;
  },
  // a short narrowboat: 8.4 m, the cabin 1.1 m above a 0.9 m hull
  narrowboat() {
    const w = cells(8.4);
    const h = cells(2);
    const g = new G(w, h);
    const deck = h - cells(0.9);
    for (let y = deck; y < h; y++) {
      const inset = Math.round(((y - deck) / (h - deck)) * 8);
      g.h_(inset, y, w - inset * 2, y < deck + 4 ? 'R' : 'g');
    }
    g.h_(0, deck + 4, w, 'Y');
    g.r(22, 3, w - 44, deck - 3, 'G').r(20, 1, w - 40, 2, 'R');
    for (let x = 30; x < w - 34; x += 18) g.r(x, 7, 9, 7, 'w').v(x + 4, 7, 7, 'G');
    g.v(4, deck - 12, 12, 'g').h_(4, deck - 12, 12, 'g'); // the tiller
    g.r(w - 16, deck - 8, 2, 8, 'Y'); // the bow's brass
    return g;
  },
  // a rowing boat: 3.2 m long, 0.6 m deep
  rowboat() {
    const w = cells(3.2);
    const h = cells(0.6);
    const g = new G(w, h);
    for (let y = 0; y < h; y++) {
      const inset = Math.round(((y * y) / (h * h)) * 12);
      g.h_(inset, y, w - inset * 2, y < 2 ? 'w' : y < 7 ? 'B' : 'b');
    }
    g.r(0, 0, 2, 2, 'B').r(w - 2, 0, 2, 2, 'B');
    return g;
  },
  // a pigeon loft on legs: 2.4 × 2.4 m
  loft() {
    const w = cells(2.4);
    const h = cells(2.4);
    const g = new G(w, h);
    const legs = cells(0.7);
    const eave = 10;
    for (let y = 0; y < eave; y++) g.h_(Math.round(w / 2 - 3 - y * 2.3), y, Math.round(6 + y * 4.6), y % 3 === 2 ? 'b' : 'B');
    g.r(3, eave, w - 6, h - legs - eave, 'A');
    for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++) g.r(7 + j * 10, eave + 3 + i * 10, 6, 7, 'b').h_(6 + j * 10, eave + 10 + i * 10, 8, 'B');
    g.h_(3, h - legs - 1, w - 6, 'b');
    for (const x of [6, w - 8]) g.r(x, h - legs, 2, legs, 'b');
    return g;
  },
  // a water tank on its stand: 1.6 m wide, 2.4 m high
  tank() {
    const w = cells(1.6);
    const h = cells(2.4);
    const g = new G(w, h);
    const legs = cells(0.8);
    const b = h - legs;
    g.r(3, 0, w - 6, 2, 'T').r(1, 2, w - 2, 2, 'T').r(0, 4, w, b - 6, 'T').r(1, b - 2, w - 2, 2, 't');
    g.v(w - 3, 4, b - 6, 't');
    for (let y = 8; y < b - 2; y += 8) g.h_(0, y, w, 't');
    for (const x of [3, w - 5]) g.r(x, b, 2, legs, 'l');
    line(g, 4, b + 1, w - 5, h - 2, 'l');
    line(g, w - 4, b + 1, 4, h - 2, 'l');
    return g;
  },
  // a greenhouse: 3.2 m long, 2.4 m to the ridge
  greenhouse() {
    const w = cells(3.2);
    const h = cells(2.4);
    const g = new G(w, h);
    const eave = 18;
    for (let y = 0; y < eave; y++) {
      const half = 2 + (y * (w / 2 - 2)) / eave;
      g.h_(Math.round(w / 2 - half), y, Math.round(half * 2), y === 0 ? 'F' : 'g');
    }
    g.r(0, eave, w, h - eave, 'g');
    line(g, w >> 1, 0, 0, eave, 'F');
    line(g, w >> 1, 0, w - 1, eave, 'F');
    for (let x = 0; x < w; x += 14) g.v(x, eave, h - eave, 'F');
    g.v(w - 1, eave, h - eave, 'F').h_(0, eave, w, 'F').r(0, h - 5, w, 5, 'F');
    for (let x = 3; x < w - 3; x += 4) g.r(x, h - 9 - (x % 3) * 2, 2, 4 + (x % 3) * 2, 'p');
    g.v(w >> 1, 0, h, 'F');
    return g;
  },
  // a beehive on legs: 0.55 m wide, 0.95 m high
  hive() {
    const w = cells(0.55);
    const h = cells(0.95);
    const g = new G(w, h);
    g.r(0, 0, w, 2, 'y').r(1, 2, w - 2, h - 6, 'Y');
    for (let y = 6; y < h - 4; y += 4) g.h_(1, y, w - 2, 'y');
    g.r(4, h - 7, 4, 1, 'k').r(1, h - 4, 2, 4, 'k').r(w - 3, h - 4, 2, 4, 'k');
    return g;
  },
  // a scarecrow: a man's height (1.9 m on his pole) with a straw hat
  scarecrow() {
    const w = cells(1.2);
    const h = cells(1.9);
    const g = new G(w, h);
    const c = w >> 1;
    g.r(c - 1, 16, 3, h - 16, 'W').v(c + 1, 16, h - 16, 'w');
    g.r(c - 4, 0, 9, 3, 'H').r(1, 3, w - 2, 2, 'H');
    g.r(c - 3, 5, 7, 7, 'S').r(c - 2, 7, 1, 1, 'k').r(c + 2, 7, 1, 1, 'k');
    g.r(0, 13, w, 3, 'C').h_(0, 15, w, 'c');
    g.r(c - 5, 13, 11, 13, 'C').v(c + 4, 16, 10, 'c');
    return g;
  },
  // a garden shed: 3 m wide, 2.6 m high (its door is the 2.25 m one the street has)
  shed() {
    const w = cells(3);
    const h = cells(2.6);
    const g = new G(w, h);
    for (let y = 0; y < 5; y++) g.h_(0, y, w, y % 2 ? 'r' : 'R');
    g.r(1, 5, w - 2, h - 5, 'B');
    for (let x = 4; x < w; x += 5) g.v(x, 5, h - 5, 'b');
    g.r(5, 14, 9, 11, 'k').v(9, 14, 11, 'B').h_(5, 19, 9, 'B');
    return g;
  },
  // a tractor: 4 m long, 2.6 m to the cab roof, 1.6 m back wheels
  tractor() {
    const w = cells(4);
    const h = cells(2.6);
    const g = new G(w, h);
    g.r(36, h - 30, 46, 16, 'R').h_(36, h - 14, 46, 'r').r(74, h - 40, 3, 10, 'k');
    g.r(4, h - 30, 34, 8, 'r');
    for (const x of [8, 36]) g.r(x, 2, 2, h - 30, 'r');
    g.r(6, 0, 34, 3, 'R').r(10, 5, 26, h - 35, 'w');
    disc(g, 24, h - 17, 16, 16, 'k');
    disc(g, 24, h - 17, 9, 9, 'R');
    disc(g, 24, h - 17, 3, 3, 'k');
    disc(g, 72, h - 10, 9, 9, 'k');
    disc(g, 72, h - 10, 5, 5, 'R');
    return g;
  },
  // a farm cart: 3.6 m with its shafts, 1.2 m wheels, a load of hay
  horsecart() {
    const w = cells(3.6);
    const h = cells(1.5);
    const g = new G(w, h);
    const bed = h - 14;
    disc(g, 24, bed - 8, 22, 8, 'y');
    disc(g, 34, bed - 7, 16, 6, 'Y');
    g.r(0, bed - 6, 54, 8, 'B').h_(0, bed - 6, 54, 'b').h_(0, bed + 1, 54, 'b');
    line(g, 54, bed - 1, 78, bed - 5, 'b', 2);
    wheel(g, 27, h - 13, 12, 'k', 'b', 'b');
    return g;
  },
  // the mill: 6 m wide, 6.5 m high under its roof, a door you could carry a sack through
  mill() {
    const w = cells(6);
    const h = cells(6.5);
    const g = new G(w, h);
    const eave = 40;
    for (let y = 0; y < eave; y++) g.h_(Math.round(w / 2 - 4 - y * 1.55), y, Math.round(8 + y * 3.1), y % 4 === 3 ? 'r' : 'R');
    g.r(4, eave, w - 8, h - eave, 'S');
    for (let y = eave + 6, i = 0; y < h; y += 7, i++) {
      g.h_(4, y, w - 8, 's');
      for (let x = 8 + (i % 2) * 7; x < w - 4; x += 14) g.v(x, y - 6, 6, 's');
    }
    const win = (x, y) => g.r(x - 1, y - 1, 22, 35, 's').r(x, y, 20, 33, 'k').r(x + 2, y + 2, 16, 13, 'y').v(x + 10, y, 33, 's').h_(x, y + 16, 20, 's');
    win(22, eave + 8);
    win(w - 42, eave + 8);
    g.r((w >> 1) - 12, h - 50, 24, 50, 's').r((w >> 1) - 10, h - 48, 20, 48, 'k');
    g.h_(4, h - 2, w - 8, 's').h_(4, h - 1, w - 8, 's');
    return g;
  },
  // the mill wheel: 3.5 m across
  millwheel() {
    const d = cells(3.5) | 1;
    const r = d >> 1;
    const g = new G(d, d);
    for (let a = 0; a < 16; a++) {
      const t = (a * Math.PI) / 8;
      const c = Math.cos(t);
      const s = Math.sin(t);
      line(g, Math.round(r + c * (r - 7)), Math.round(r + s * (r - 7)), Math.round(r + c * (r - 1)), Math.round(r + s * (r - 1)), 'W', 2);
    }
    for (const R of [r - 2, r - 8]) for (let a = 0; a < 360; a++) g.r(Math.round(r + Math.cos((a * Math.PI) / 180) * R), Math.round(r + Math.sin((a * Math.PI) / 180) * R), 2, 2, 'W');
    for (let a = 0; a < 8; a++) line(g, r, r, Math.round(r + Math.cos((a * Math.PI) / 4) * (r - 8)), Math.round(r + Math.sin((a * Math.PI) / 4) * (r - 8)), 'W', 2);
    disc(g, r, r, 4, 4, 'w');
    return g;
  },
  // chillies drying: strings of them on a rail, 1.8 m long
  chillies() {
    const w = cells(1.8);
    const g = new G(w, 12);
    g.h_(0, 0, w, 's');
    for (let x = 2, i = 0; x < w - 2; x += 6, i++) {
      const ch = i % 2 ? 'R' : 'r';
      const n = 8 + (i % 3);
      g.r(x, 1, 2, n - 2, ch).p(x, n - 1, ch);
    }
    return g;
  },
  // an awning: 5 m of striped canvas, 0.7 m deep (the scene sets its width)
  awning() {
    const w = cells(5);
    const h = cells(0.7);
    const g = new G(w, h);
    for (let x = 0; x < w; x++) g.v(x, 2, h - 2 - (x % 8 === 0 || x % 8 === 7 ? 1 : 0), x % 16 < 8 ? 'R' : 'W');
    g.r(0, 0, w, 2, 'p');
    return g;
  },
  // a sheep: 1.3 m long, 0.95 m at the head
  sheep() {
    const w = cells(1.3);
    const h = cells(0.95);
    const g = new G(w, h);
    for (const x of [6, 9, 18, 21]) g.r(x, 13, 2, h - 13, 'k');
    disc(g, 12, 8, 11, 7, 'w');
    disc(g, 12, 12, 9, 3, 'W');
    g.r(23, 3, 5, 6, 'k').p(22, 3, 'k');
    return g;
  },
  // a goat: 1 m long, 0.85 m to the horns
  goat() {
    const w = cells(1);
    const h = cells(0.85);
    const g = new G(w, h);
    for (const x of [3, 5, 13, 15]) g.v(x, 11, h - 11, 'G');
    g.r(1, 6, 15, 7, 'g').h_(1, 12, 15, 'G').p(0, 5, 'g');
    g.r(14, 4, 3, 4, 'g').r(15, 2, 6, 5, 'g').p(19, 3, 'e').v(15, 7, 2, 'G');
    line(g, 15, 2, 12, 0, 'h');
    return g;
  },
  // a red deer stag: 1.6 m to the antlers, 1.5 m long
  deer() {
    const w = cells(1.5);
    const h = cells(1.6);
    const g = new G(w, h);
    const back = 15;
    for (const x of [5, 8, 22, 25]) g.r(x, back + 6, 2, h - back - 6, 'd');
    g.r(3, back, 25, 10, 'd').h_(4, back + 9, 22, 'w').r(2, back + 1, 2, 3, 'w');
    line(g, 25, back + 2, 27, 7, 'd', 4);
    g.r(26, 5, 6, 5, 'd').p(30, 6, 'e');
    line(g, 27, 5, 23, 0, 'a');
    line(g, 25, 2, 21, 2, 'a');
    line(g, 29, 5, 30, 0, 'a');
    return g;
  },
});
const EVENING_REDRAW = {
  'ev-swingset': ['swingset', {}, { F: 0x3a6a8a, f: 0x2a5068, r: 0x8a8a94, s: 0x8a5a34 }],
  'ev-gate': ['gate', {}, { G: 0x2e3a52, g: 0x1e2838 }],
  'ev-fence': ['fence', {}, { F: 0x8a6a4a, f: 0x5a4028 }],
  'ev-post': ['post', {}, { P: 0x6a4a32, p: 0x4a3222 }],
  'ev-sheet': ['sheet', {}, { W: 0xf2ece0, w: 0xd8d0c0, b: 0x88b8d8 }],
  'ev-sheet-b': ['sheet', { striped: true }, { W: 0xe8c060, w: 0xc89a3a, b: 0xc03a2a }],
  'ev-teastall': ['teastall', {}, { G: 0x2e6a4a, g: 0x1e4a34, B: 0x6a4a32, w: 0xf2e6cc, K: 0xc4a25c, k: 0x2a2a30 }],
  'ev-bikestall': ['bikestall', {}, { T: 0x6a4a32, d: 0x3a2a1e, k: 0x1a1a20, s: 0x8a8a94, R: 0xc03a2a }],
  'ev-narrowboat': ['narrowboat', {}, { G: 0x2e6a4a, g: 0x1e3a30, R: 0xc03a2a, w: 0xf2d580, Y: 0xd8b858 }],
  'ev-rowboat': ['rowboat', {}, { B: 0x8a5a34, b: 0x5a3a22, w: 0xf2e6cc }],
  'ev-loft': ['loft', {}, { B: 0x6a5a4a, A: 0x8a7a64, b: 0x3a2e24 }],
  'ev-tank': ['tank', {}, { T: 0x6a6e7a, t: 0x4a4c54, l: 0x3a3a44 }],
  'ev-greenhouse': ['greenhouse', {}, { g: 0xb8d8e0, F: 0xe8e4d8, p: 0x6a9a4a }],
  'ev-hive': ['hive', {}, { Y: 0xe8c060, y: 0xb8903a, k: 0x3a2a22 }],
  'ev-scarecrow': ['scarecrow', {}, { H: 0xc8a050, S: 0xe8d8b0, C: 0x6a4a5a, c: 0x4a3240, W: 0x8a6a4a, w: 0x5a4028, k: 0x1a1a20 }],
  'ev-shed': ['shed', {}, { B: 0x6a5a3a, b: 0x4a3a22, R: 0x8a8a94, r: 0x6a6a72, k: 0x2a2a30 }],
  'ev-tractor': ['tractor', {}, { R: 0xc03a2a, r: 0x8a2a20, k: 0x1a1a20, w: 0x88b8d8 }],
  'ev-horsecart': ['horsecart', {}, { B: 0x8a6a4a, b: 0x5a4028, k: 0x2a2a30, y: 0xc8a850, Y: 0xe8cc70 }],
  'ev-mill': ['mill', {}, { S: 0xc8b898, s: 0xa8987a, R: 0x6a3a2a, r: 0x4a2a20, k: 0x2a2230, y: 0xf2d580 }],
  'ev-wheel': ['millwheel', {}, { W: 0x5a4028, w: 0x3a2a1e }],
  'ev-chillies': ['chillies', {}, { s: 0xc8b890, r: 0xd83a2a, R: 0xa82a20 }],
  'ev-awning': ['awning', {}, { R: 0xc03a2a, W: 0xf2e6cc, p: 0x5a4a3a }],
  'ev-sheep': ['sheep', {}, { w: 0xe8e4d8, W: 0xc8c4b8, k: 0x2a2a30 }],
  'ev-goat': ['goat', {}, { g: 0xe8e0d0, G: 0xb8b0a0, h: 0x8a7a62, e: 0x1a1a20 }],
  'ev-deer': ['deer', {}, { d: 0x9a6a42, a: 0x6a5a4a, e: 0x1a1a20, w: 0xe8dcc8 }],
};
Object.assign(REDRAW, EVENING_REDRAW);
REDRAW_KEYS.push(...Object.keys(EVENING_REDRAW));
