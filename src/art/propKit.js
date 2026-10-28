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
