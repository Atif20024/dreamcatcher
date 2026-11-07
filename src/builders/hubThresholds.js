// The station's thresholds (room transitions advice §3): where the screen
// changes rooms, a wall with a doorway in it, drawn in code at real scale
// (1 m = 44 px; Jo is 80 px).
//
//   doorway(scene, { x, top, floor, under, left, right })
//     Each side of the wall is that room's own architecture (`left`/`right`:
//     a FACES style): from the hall, the hall's green tile wainscot and cream
//     stone, pilasters either side of a moulded doorway, its lintel and the
//     way's name over it; from the train shed, iron and glass on riveted
//     columns; from the street, the façade's stone. Under the concourse
//     (`under`: the undercroft's floor line) the wall carries on down with a
//     round arch, voussoirs and a keystone, over the passage.
//     The camera stops at the wall (HubScene.camBounds), so a room shows only
//     the 3 m frame of its own doorway at the screen's edge. Past the frame,
//     for the views that can see further (the roof, the narrow gate room), a
//     face carries the same wall on, covering the next room. setSide('left' |
//     'right') swaps the two sides at the full dark of the dip.
import { D } from './depths.js';
import { uiText } from '../ui/text.js';

const DEEP = 0x16121c;
const SPAN = 1500; // a face is wider than the widest view (the roof vista at 0.8)
export const FRAME_W = 96; // the doorway's frame: pilaster to pilaster, 2.2 m
const OPEN_W = 56; // the opening: 1.3 m
const OPEN_H = 132; // 3 m to the lintel
const CORNICE = 224; // over the concourse floor
const SLAB = 64; // the concourse floor's depth (rows 26-27), left to the terrain
// the concourse slab and the undercroft's pale wall as the terrain paints
// them, so a face carries the floor line and the lower level on without a break
const SLAB_COL = 0xc4c0ba;
const UNDER_COL = 0xd0cbc4;

// each room's side of a wall
//   kind: 'stone' (ashlar over a dado) | 'glass' (glazing on iron columns)
export const FACES = {
  // the station's front from the street: the façade's stone, the hall's lamps beyond
  stationFront: { kind: 'stone', upper: 0x8a8592, lit: 0xb2acb6, dado: 0x6e6a78, dadoLit: 0x8a8592, trim: 0x5a5562, beyond: 0x2a2026, glow: 0xf2b45a },
  // the hall: cream stone over a green tile wainscot, brass on the trim
  hallFront: { kind: 'stone', upper: 0xe8dcc0, lit: 0xfaf0dc, dado: 0x2e6a4a, dadoLit: 0x3a7a56, trim: 0x3a7a56, beyond: 0x2c3654, glow: 0x6a7aa0, sign: 'WAY OUT' },
  hallEnd: { kind: 'stone', upper: 0xe8dcc0, lit: 0xfaf0dc, dado: 0x2e6a4a, dadoLit: 0x3a7a56, trim: 0x3a7a56, beyond: 0x2a3038, glow: 0x8a9ab0, sign: 'TO THE PLATFORMS' },
  // the train shed: iron and glass, dark-green riveted columns
  shedEnd: { kind: 'glass', upper: 0x34444e, lit: 0x5a7080, dado: 0x2e4a3a, dadoLit: 0x3e5e4a, trim: 0x2e4a3a, beyond: 0x9a7a52, glow: 0xf2c078, sign: 'WAY OUT' },
  shedGate: { kind: 'glass', upper: 0x34444e, lit: 0x5a7080, dado: 0x2e4a3a, dadoLit: 0x3e5e4a, trim: 0x2e4a3a, beyond: 0x0e0c12, glow: 0x3a3448, sign: 'STAFF ONLY' },
  gateBack: { kind: 'glass', upper: 0x2a343c, lit: 0x4a5a68, dado: 0x2a3a30, dadoLit: 0x3a4e40, trim: 0x2a3a30, beyond: 0x2a3038, glow: 0xf2c078, sign: 'PLATFORMS' },
};

// a half circle's points, from the left springing over to the right
function semicircle(cx, spring, r, n = 16) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (i / n) * Math.PI;
    pts.push({ x: cx + Math.cos(a) * r, y: spring + Math.sin(a) * r });
  }
  return pts;
}

// a round-headed opening, filled
function archFill(g, x0, x1, floor, spring, col, alpha = 1) {
  const r = (x1 - x0) / 2;
  g.fillStyle(col, alpha);
  g.fillPoints([{ x: x0, y: floor }, ...semicircle(x0 + r, spring, r), { x: x1, y: floor }], true);
}

// voussoirs round an arch, every other one lit, and a keystone at the crown
function voussoirs(g, cx, spring, r, depth, col, lit) {
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI + (i / n) * Math.PI + 0.02;
    const a1 = Math.PI + ((i + 1) / n) * Math.PI - 0.02;
    const pt = (a, rr) => ({ x: cx + Math.cos(a) * rr, y: spring + Math.sin(a) * rr });
    g.fillStyle(i % 2 ? col : lit, 1);
    g.fillPoints([pt(a0, r), pt(a0, r + depth), pt(a1, r + depth), pt(a1, r)], true);
  }
  g.fillStyle(lit, 1);
  g.fillPoints([{ x: cx - 6, y: spring - r + 2 }, { x: cx + 6, y: spring - r + 2 }, { x: cx + 9, y: spring - r - depth - 5 }, { x: cx - 9, y: spring - r - depth - 5 }], true);
  g.fillStyle(DEEP, 0.35);
  g.fillRect(cx + 6, spring - r - depth - 5, 2, depth + 7);
}

// rivets down an iron member: a lit dot over a dark one
function rivets(g, x, y0, y1, step = 10) {
  for (let y = y0; y < y1; y += step) {
    g.fillStyle(DEEP, 0.6);
    g.fillRect(x, y + 1, 2, 2);
    g.fillStyle(0x8aa090, 0.6);
    g.fillRect(x, y, 2, 1);
  }
}

// the wall's material over [x0, x1] × [y0, y1] above the concourse: stone
// ashlar or glazing, a dado to 1.3 m, the cornice
function wallAbove(g, f, x0, x1, top, floor) {
  const w = x1 - x0;
  if (f.kind === 'glass') {
    // glazing: a pale wash, mullions every 16 px, transoms every 40
    g.fillStyle(f.upper, 1);
    g.fillRect(x0, top, w, floor - top);
    g.fillStyle(f.lit, 0.35);
    for (let x = x0 + 3; x < x1; x += 16) g.fillRect(x, top + 14, 12, floor - top - 14);
    g.fillStyle(f.dado, 1);
    for (let x = x0; x < x1; x += 16) g.fillRect(x, top, 3, floor - top);
    for (let y = top + 40; y < floor; y += 40) g.fillRect(x0, y, w, 3);
  } else {
    g.fillStyle(f.upper, 1);
    g.fillRect(x0, top, w, floor - top);
    g.fillStyle(DEEP, 0.12);
    for (let y = floor - CORNICE - 24; y > top; y -= 24) {
      g.fillRect(x0, y, w, 1);
      for (let x = x0 + ((y / 24) % 2 ? 0 : 24); x < x1; x += 48) g.fillRect(x, y, 1, 24);
    }
  }
  // the dado: green tile (the hall), panelled iron (the shed), plain stone (outside)
  g.fillStyle(f.dado, 1);
  g.fillRect(x0, floor - 56, w, 56);
  g.fillStyle(f.dadoLit, 1);
  g.fillRect(x0, floor - 60, w, 4);
  g.fillStyle(DEEP, 0.18);
  for (let y = floor - 48; y < floor; y += 8) g.fillRect(x0, y, w, 1);
  for (let x = x0 + 8; x < x1; x += 8) g.fillRect(x, floor - 56, 1, 56);
  // the cornice: a lit band with dentils under it
  g.fillStyle(f.lit, 1);
  g.fillRect(x0, floor - CORNICE - 12, w, 12);
  g.fillStyle(f.trim, 1);
  for (let x = x0 + 3; x < x1; x += 10) g.fillRect(x, floor - CORNICE, 5, 5);
}

// a pilaster (stone) or a riveted column (iron) from the floor to the cornice
function pier(g, f, x, w, floor) {
  if (f.kind === 'glass') {
    g.fillStyle(f.dado, 1);
    g.fillRect(x, floor - CORNICE, w, CORNICE);
    g.fillStyle(f.dadoLit, 1);
    g.fillRect(x, floor - CORNICE, 2, CORNICE);
    rivets(g, x + w / 2 - 1, floor - CORNICE + 8, floor - 8);
    g.fillRect(x - 3, floor - CORNICE - 4, w + 6, 6); // the flared head
    g.fillRect(x - 2, floor - 10, w + 4, 10); // the base
  } else {
    g.fillStyle(f.lit, 1);
    g.fillRect(x, floor - CORNICE, w, CORNICE);
    g.fillStyle(DEEP, 0.18);
    g.fillRect(x + w - 2, floor - CORNICE, 2, CORNICE);
    g.fillStyle(f.trim, 1);
    g.fillRect(x - 3, floor - CORNICE - 2, w + 6, 8); // the capital
    g.fillRect(x - 2, floor - 12, w + 4, 12); // the plinth
  }
}

// the doorway as seen from one side: the wall round it, pilasters either side,
// the moulded opening onto the light beyond, its lintel and its sign; and
// under the floor, the undercroft's arch
function elevation(scene, g, f, x, top, floor, under) {
  const x0 = x - FRAME_W / 2;
  const x1 = x + FRAME_W / 2;
  wallAbove(g, f, x0, x1, top, floor);
  const P = 14;
  pier(g, f, x0, P, floor);
  pier(g, f, x1 - P, P, floor);
  // the opening, the room beyond's light low on its floor
  const ox0 = x - OPEN_W / 2;
  const ox1 = x + OPEN_W / 2;
  // the moulded architrave round it
  g.fillStyle(f.trim, 1);
  g.fillRect(ox0 - 6, floor - OPEN_H - 6, OPEN_W + 12, OPEN_H + 6);
  g.fillStyle(f.lit, 1);
  g.fillRect(ox0 - 3, floor - OPEN_H - 3, OPEN_W + 6, 2);
  g.fillRect(ox0 - 3, floor - OPEN_H - 3, 2, OPEN_H + 3);
  g.fillStyle(f.beyond, 1);
  g.fillRect(ox0, floor - OPEN_H, OPEN_W, OPEN_H);
  g.fillStyle(f.glow, 0.2);
  g.fillRect(ox0 + 4, floor - 88, OPEN_W - 8, 88);
  g.fillStyle(f.glow, 0.55);
  g.fillRect(ox0, floor - 3, OPEN_W, 3);
  // the lintel, the sign over it
  g.fillStyle(f.kind === 'glass' ? f.dado : f.lit, 1);
  g.fillRect(ox0 - 10, floor - OPEN_H - 20, OPEN_W + 20, 14);
  if (f.kind === 'glass') rivets(g, ox0 - 6, floor - OPEN_H - 16, floor - OPEN_H - 8, 4);
  g.fillStyle(DEEP, 0.25);
  g.fillRect(ox0 - 10, floor - OPEN_H - 7, OPEN_W + 20, 1);
  const objs = [];
  if (f.sign) {
    g.fillStyle(0x1a1a22, 1);
    g.fillRect(x0 + 2, floor - OPEN_H - 46, FRAME_W - 4, 22);
    g.fillStyle(0xc4a25c, 1);
    g.fillRect(x0 + 2, floor - OPEN_H - 46, FRAME_W - 4, 1);
    g.fillRect(x0 + 2, floor - OPEN_H - 25, FRAME_W - 4, 1);
    objs.push(uiText(scene, x, floor - OPEN_H - 35, f.sign, { size: 'small', color: '#f2e6cc', backing: 0x1a1a22 }).setOrigin(0.5).setDepth(g.depth + 0.1));
  }
  if (under) {
    // the undercroft: the wall carries on down under the concourse slab, a
    // 1.1 m × 2.7 m round arch over the passage
    const u0 = floor + SLAB;
    g.fillStyle(UNDER_COL, 1);
    g.fillRect(x0, u0, FRAME_W, under - u0);
    g.fillStyle(DEEP, 0.15);
    for (let y = u0 + 16; y < under; y += 16) g.fillRect(x0, y, FRAME_W, 1);
    const r = 24;
    const spring = under - 96;
    archFill(g, x - r, x + r, under, spring, f.beyond);
    archFill(g, x - r + 4, x + r - 4, under, spring + 10, f.glow, 0.18);
    voussoirs(g, x, spring, r, 12, 0xb8b2aa, 0xeae4da);
    g.fillStyle(f.trim, 1);
    g.fillRect(x - r - 4, spring, 4, under - spring);
    g.fillRect(x + r, spring, 4, under - spring);
  }
  return objs;
}

// past the frame: the same wall carried on over [x0, x1], for the views that
// can see beyond it, its piers every 3.6 m, the undercroft's arcade below
function face(g, f, x0, x1, top, floor, under, bottom, dir) {
  wallAbove(g, f, x0, x1, top, floor);
  for (let k = 0; k * 160 < x1 - x0; k++) pier(g, f, dir > 0 ? x0 + k * 160 : x1 - 14 - k * 160, 14, floor);
  // the concourse slab, the lower level, the base
  g.fillStyle(SLAB_COL, 1);
  g.fillRect(x0, floor, x1 - x0, SLAB);
  g.fillStyle(DEEP, 0.3);
  g.fillRect(x0, floor + SLAB - 3, x1 - x0, 3);
  const low = under || floor + SLAB + 160;
  g.fillStyle(UNDER_COL, 1);
  g.fillRect(x0, floor + SLAB, x1 - x0, low - floor - SLAB);
  for (let k = 0; k * 96 + 40 < x1 - x0; k++) {
    const cx = dir > 0 ? x0 + 48 + k * 96 : x1 - 48 - k * 96;
    archFill(g, cx - 12, cx + 12, low - 30, low - 108, 0x8a8690, 0.6);
  }
  g.fillStyle(SLAB_COL, 1);
  g.fillRect(x0, low, x1 - x0, bottom - low);
}

export function doorway(scene, { x, top, floor, under = null, bottom, left, right }) {
  // a face covers the next room's people and props, under the place's night
  // grade (depth 11, so it is lit like the terrain it carries on) and under
  // Jo, who never stands past the frame with the screen up
  const front = D.PLAYER - 1.1;
  const back = D.INTERACT - 3; // the doorway's own frame: Jo walks in front of it
  const sides = {};
  for (const [side, f] of [['left', FACES[left]], ['right', FACES[right]]]) {
    const dir = side === 'left' ? 1 : -1;
    const bk = scene.add.graphics().setDepth(back);
    const objs = [bk, ...elevation(scene, bk, f, x, top, floor, under)];
    const fr = scene.add.graphics().setDepth(front);
    const fx0 = side === 'left' ? x + FRAME_W / 2 : x - FRAME_W / 2 - SPAN;
    face(fr, f, fx0, fx0 + SPAN, top, floor, under, bottom, dir);
    objs.push(fr);
    sides[side] = objs;
  }
  return {
    x,
    sides,
    setSide(s) {
      for (const o of sides.left) o.setVisible(s === 'left');
      for (const o of sides.right) o.setVisible(s === 'right');
    },
  };
}
