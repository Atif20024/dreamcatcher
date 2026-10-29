// The station's thresholds (room transitions advice §3): where the screen
// changes rooms, a wall with a doorway in it, drawn in code at real scale
// (1 m = 44 px; Jo is 80 px).
//
//   doorway(scene, { x, top, bottom, openings, left, right })
//     A cutaway, as in a side-on house: standing left of the wall Jo sees its
//     left face (`left`: a FACES style), which covers everything past the
//     doorway, and through the doorway only the light of the room beyond; on
//     the right, the right face covers everything behind him. The room on each
//     side ends at the wall. setSide('left' | 'right') swaps the two at the
//     full dark of the dip. `openings`: one per floor the wall crosses
//     ({ floor, w, h }: the concourse door, a low arch in the undercroft).
import { D } from './depths.js';
import { uiText } from '../ui/text.js';

const DEEP = 0x16121c;
const SPAN = 1500; // a face is wider than the widest view (the roof vista at 0.8)

// each face of a wall: its material, its trim round the doorway, the light
// seen through the doorway from this side, what hangs on it
export const FACES = {
  // the station's front from the street: stone, the hall's lamps in its windows
  stationFront: { base: 0x8a8592, lit: 0xb2acb6, low: 0x5a5562, joints: 'ashlar', trim: 0x8a8592, beyond: 0x2a2026, beyondGlow: 0xf2b45a, windows: 'lit', quoins: true },
  // the front wall from inside the hall: plaster over oak, the wet street in its windows
  hallFront: { base: 0x6a5c56, lit: 0x8a7a70, low: 0x3a3036, joints: 'panels', trim: 0x6a4a36, beyond: 0x2c3654, beyondGlow: 0x6a7aa0, windows: 'night' },
  // the hall's end wall: cream stone, the way to the trains over the door
  hallEnd: { base: 0xb8ae9c, lit: 0xd8d0c0, low: 0x6a6258, joints: 'ashlar', trim: 0x8a7a68, beyond: 0x2a3038, beyondGlow: 0x8a9ab0, sign: 'TO THE TRAINS', signX: 110 },
  // the train shed's end walls: sooty brick, iron pilasters
  shedEnd: { base: 0x4a3632, lit: 0x6a4a40, low: 0x2e2224, joints: 'brick', trim: 0x2a2630, beyond: 0x6a5440, beyondGlow: 0xf2c078, sign: 'WAY OUT', signX: 90, pilasters: true },
  shedGate: { base: 0x4a3632, lit: 0x6a4a40, low: 0x2e2224, joints: 'brick', trim: 0x2a2630, beyond: 0x0e0c12, beyondGlow: 0x3a3448, sign: 'STAFF ONLY', signX: 120, pilasters: true },
  // the same wall from the service gate's side: bare brick, the shed's lamps through the arch
  gateBack: { base: 0x3a2c2a, lit: 0x5a4038, low: 0x241a1c, joints: 'brick', trim: 0x2a2630, beyond: 0x2a3038, beyondGlow: 0xf2c078 },
};

// a round-headed opening: jambs from the floor up to `spring`, a half circle over
function archPath(g, x0, x1, floor, spring) {
  const r = (x1 - x0) / 2;
  g.beginPath();
  g.moveTo(x0, floor);
  g.lineTo(x0, spring);
  g.arc(x0 + r, spring, r, Math.PI, 0, false);
  g.lineTo(x1, floor);
  g.closePath();
}

// voussoirs round an arch, a keystone at the crown
function voussoirs(g, cx, spring, r, depth, col, lit) {
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI + (i / n) * Math.PI;
    const a1 = Math.PI + ((i + 1) / n) * Math.PI - 0.03;
    g.fillStyle(i % 2 ? col : lit, 1);
    g.beginPath();
    g.arc(cx, spring, r + depth, a0, a1, false);
    g.arc(cx, spring, r, a1, a0, true);
    g.closePath();
    g.fillPath();
  }
  g.fillStyle(lit, 1);
  g.fillRect(cx - 9, spring - r - depth - 4, 18, depth + 8);
}

// a tall round-headed window: lit amber from inside, or the wet night outside
function tallWindow(g, x, y, w, h, lit) {
  g.fillStyle(DEEP, 1);
  archPath(g, x - 4, x + w + 4, y + h + 4, y + w / 2 - 4);
  g.fillPath();
  g.fillStyle(lit ? 0xf2b45a : 0x2c3654, lit ? 0.75 : 1);
  archPath(g, x, x + w, y + h, y + w / 2);
  g.fillPath();
  if (!lit) {
    // rain on the glass
    g.fillStyle(0x8aa0c8, 0.35);
    for (let i = 0; i < 9; i++) g.fillRect(x + 4 + ((i * 37) % (w - 8)), y + w / 2 + ((i * 53) % (h - w)), 1, 14);
  }
  g.fillStyle(DEEP, 0.9);
  g.fillRect(x + w / 2 - 1, y + w / 2 - 6, 3, h - w / 2 + 6);
  for (let yy = y + w; yy < y + h; yy += 44) g.fillRect(x, yy, w, 2);
  g.fillStyle(0xb2acb6, 1);
  g.fillRect(x - 8, y + h + 4, w + 16, 6); // the sill
}

// one face of the wall over [x0, x1] (dir: +1 it runs right from the doorway,
// -1 left), from the roof's underside to the bottom of the world
function face(g, f, x0, x1, top, bottom, floor, dir) {
  const w = x1 - x0;
  g.fillStyle(f.base, 1);
  g.fillRect(x0, top, w, bottom - top);
  g.fillStyle(DEEP, 0.3);
  if (f.joints === 'ashlar') {
    for (let y = top + 24; y < floor; y += 24) {
      g.fillRect(x0, y, w, 1);
      for (let xx = x0 + ((y / 24) % 2 ? 0 : 32); xx < x1; xx += 64) g.fillRect(xx, y - 23, 1, 23);
    }
  } else if (f.joints === 'brick') {
    for (let y = top + 8; y < floor; y += 8) g.fillRect(x0, y, w, 1);
    g.fillStyle(0x000000, 0.12);
    for (let i = 0; i < 40; i++) g.fillRect(x0 + ((i * 97) % w), top + ((i * 61) % (floor - top)), 18, 7);
  } else if (f.joints === 'panels') {
    // oak panelling to 2 m with a rail
    g.fillStyle(f.trim, 1);
    g.fillRect(x0, floor - 88, w, 88);
    g.fillStyle(f.lit, 1);
    g.fillRect(x0, floor - 92, w, 6);
    g.fillStyle(DEEP, 0.35);
    for (let xx = dir > 0 ? x0 + 12 : x1 - 60; xx > x0 && xx < x1 - 40; xx += dir * 60) g.fillRect(xx, floor - 80, 48, 72);
  }
  // quoins up the doorway's edge
  if (f.quoins) {
    for (let y = top; y < floor; y += 24) {
      const qw = (y / 24) % 2 ? 22 : 34;
      g.fillStyle((y / 24) % 2 ? f.lit : f.base, 1);
      g.fillRect(dir > 0 ? x0 : x1 - qw, y, qw, 23);
    }
  }
  // iron pilasters every 6 m
  if (f.pilasters) {
    for (let k = 1; k * 264 < w; k++) {
      const px = dir > 0 ? x0 + k * 264 : x1 - k * 264 - 14;
      g.fillStyle(0x2a2630, 1);
      g.fillRect(px, top, 14, floor - top);
      g.fillStyle(0x6a6070, 0.6);
      g.fillRect(px, top, 2, floor - top);
    }
  }
  // the cornice under the roof, the string course at the floor, the plinth below
  g.fillStyle(f.lit, 1);
  g.fillRect(x0, top, w, 12);
  g.fillStyle(f.low, 1);
  for (let xx = x0 + 6; xx < x1; xx += 14) g.fillRect(xx, top + 12, 7, 6);
  g.fillStyle(f.lit, 1);
  g.fillRect(x0, floor, w, 10);
  g.fillStyle(f.low, 1);
  g.fillRect(x0, floor + 10, w, bottom - floor - 10);
  g.fillStyle(DEEP, 0.4);
  for (let y = floor + 40; y < bottom; y += 36) g.fillRect(x0, y, w, 3);
  // tall windows: 1.6 m wide, 6 m tall
  if (f.windows) {
    for (let k = 0; k < 6; k++) {
      const wx = dir > 0 ? x0 + 140 + k * 260 : x1 - 210 - k * 260;
      if (wx < x0 + 40 || wx > x1 - 110) continue;
      tallWindow(g, wx, floor - 330, 70, f.windows === 'lit' ? 264 : 228, f.windows === 'lit');
    }
  }
}

// the doorway's mouth seen from one side: the trim, the light beyond, voussoirs
function mouth(g, f, x, o) {
  const x0 = x - o.w / 2;
  const x1 = x + o.w / 2;
  const spring = o.floor - o.h + o.w / 2;
  g.fillStyle(f.trim, 1);
  g.fillRect(x0 - 8, o.floor - o.h - 16, o.w + 16, o.h + 16);
  g.fillStyle(f.beyond, 1);
  archPath(g, x0, x1, o.floor, spring);
  g.fillPath();
  // the light of the room beyond, low on its floor
  g.fillStyle(f.beyondGlow, 0.22);
  g.fillRect(x0 + 6, o.floor - Math.min(96, o.h - 20), o.w - 12, Math.min(92, o.h - 24));
  g.fillStyle(f.beyondGlow, 0.5);
  g.fillRect(x0, o.floor - 3, o.w, 3);
  voussoirs(g, x, spring, o.w / 2, 12, f.trim, f.lit);
}

export function doorway(scene, { x, top, bottom, openings, left, right }) {
  const front = D.PLAYER + 4; // the face covers Jo only where he never stands with the screen up
  const back = D.INTERACT - 3;
  const w = Math.max(...openings.map((o) => o.w));
  const sides = {};
  for (const [side, f] of [['left', FACES[left]], ['right', FACES[right]]]) {
    const dir = side === 'left' ? 1 : -1;
    const x0 = side === 'left' ? x + w / 2 : x - w / 2 - SPAN;
    const x1 = x0 + SPAN;
    const floor = Math.min(...openings.map((o) => o.floor));
    const fr = scene.add.graphics().setDepth(front);
    face(fr, f, x0, x1, top, bottom, floor, dir);
    // the wall carries on over each doorway and between the floors: only the
    // openings (and their trim) are cut out of it
    const bx0 = x - w / 2 - 8;
    const cuts = openings.map((o) => [o.floor - o.h - 16, o.floor, o.w]).sort((a, b) => a[0] - b[0]);
    let y = top;
    fr.fillStyle(f.base, 1);
    for (const [c0, c1, ow] of cuts) {
      if (c0 > y) fr.fillRect(bx0, y, w + 16, c0 - y);
      // a narrower opening: the wall either side of its trim
      const side = (w - ow) / 2;
      if (side > 0) {
        fr.fillRect(bx0, c0, side, c1 - c0);
        fr.fillRect(bx0 + w + 16 - side, c0, side, c1 - c0);
      }
      y = Math.max(y, c1);
    }
    if (y < bottom) fr.fillRect(bx0, y, w + 16, bottom - y);
    fr.fillStyle(f.lit, 1);
    fr.fillRect(bx0, top, w + 16, 12);
    const bk = scene.add.graphics().setDepth(back);
    for (const o of openings) mouth(bk, f, x, o);
    const objs = [fr, bk];
    if (f.sign) {
      const sx = side === 'left' ? x0 + f.signX : x1 - f.signX;
      const t = uiText(scene, sx, floor - 200, f.sign, { size: 'small', color: '#f2e6cc', backing: 0x1a1a22 }).setOrigin(0.5).setDepth(front + 0.1);
      objs.push(t);
    }
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
