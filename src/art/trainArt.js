// The train kit, painted (round 2 WP3, critique §7.3). One carriage drawn
// at full scale (1 m = 44 px, src/art/trainKit.js) in three views:
//
//   carriageEnd   the buffer end, head-on: 123 × 172 (hub bays)
//   carriageSide  side-on: 880 × 172, wheels and bogies as separate parts
//                 so they turn (dream arrivals, the Painter's night train)
//   bayVista      one hub bay seen down its platform: the shed, the track,
//                 the platform and its lamps in one-point perspective, and
//                 (a separate layer) the rest of the train receding into
//                 steam, so it can pull away with the end
//
// plus the station's big furniture at the §7 sizes: the platform lamp, the
// buffer stop, the platform gate, the ticket booth, the newspaper kiosk,
// the telephone box, the revolving and double doors, and the pigeon.
//
// Same light as the rest of the station: one low sun in the west (lit left
// edges, shade falling right), lamplight warm, iron dark green.
import { hex, rgba, mix, stamp, dab, gradientV, grain, paintTexture } from './paint.js';
import { block, cyl, bar, cshadow, glow, pane, letters, lit, dim } from './hubArt.js';
import { TRAIN, STATION } from './trainKit.js';
import { px } from '../data/scale.js';

const SUN = 0xfff0c8;
const INK = 0x14141c;
const IRON = 0x3a3a44;
const GREEN = 0x2e5a44;
const BRASS = 0xc4a25c;
const LAMP = 0xf2d580;
const WARM = 0xf2c078;
const STONE = 0xd8cbb0;

function rr(ctx, x, y, w, h, r = 2) {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.lineTo(x + w - k, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + k);
  ctx.lineTo(x + w, y + h - k);
  ctx.quadraticCurveTo(x + w, y + h, x + w - k, y + h);
  ctx.lineTo(x + k, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - k);
  ctx.lineTo(x, y + k);
  ctx.quadraticCurveTo(x, y, x + k, y);
  ctx.closePath();
}
const line = (ctx, x0, y0, x1, y1, c, a = 1, w = 1) => {
  ctx.strokeStyle = rgba(c, a);
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
};
const poly = (ctx, pts, fill) => {
  ctx.fillStyle = fill;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
};
const fill = (ctx, c, a = 1) => (ctx.fillStyle = rgba(c, a));

// ---- the dream's mark, on a roundel -----------------------------------------
// 8 × 8: E = the window colour (bright), e = the trim colour
const MARKS = {
  cloche: ['........', '...EE...', '..EEEE..', '.EEEEEE.', '.EEEEEE.', '.EEEEEE.', 'eeeeeeee', '........'],
  trumpet: ['......E.', '.....EE.', 'EEEEEEE.', 'E.e..EEE', 'EEEEEEE.', '.....EE.', '......E.', '........'],
  stripe: ['........', 'EEEEEEEE', 'eeeeeeee', '........', 'EEEEEEEE', 'eeeeeeee', '........', '........'],
  quill: ['.......E', '......EE', '.....EE.', '....EE..', '...EE...', '..ee....', '.e......', 'e.......'],
  sun: ['E..E..E.', '.E.E.E..', '..EEE...', 'EEEeEEE.', '..EEE...', '.E.E.E..', 'E..E..E.', '........'],
  wings: ['E......E', 'EE....EE', 'EEE..EEE', '.EEEEEE.', '..EeeE..', '...EE...', '........', '........'],
  spade: ['...E....', '..EEE...', '.EEEEE..', 'EEEEEEE.', 'EEEEEEE.', '.E.e.E..', '...e....', '..eee...'],
  cross: ['..EEE...', '..EEE...', 'EEEEEEE.', 'EEEEEEE.', 'EEEEEEE.', '..EEE...', '..EEE...', '........'],
  palette: ['.EEEE...', 'EEeEEE..', 'EEEEeE..', 'EeEEEE..', 'EEEE.E..', '.EEEEE..', '........', '........'],
  chart: ['.......E', '......EE', '.E...EE.', 'EEE.EE..', 'E.EEE...', '...E....', 'eeeeeeee', '........'],
  star: ['...E....', '...E....', 'EEEEEEE.', '.EEEEE..', '..EEE...', '.EE.EE..', 'E.....E.', '........'],
};
export function mark(ctx, cx, cy, d, livery, o = {}) {
  const { dead = false } = o;
  const ring = dead ? 0x4a4a52 : livery.trim;
  const field = dead ? 0x2a2a30 : dim(livery.body, 0.45);
  const ink = dead ? 0x5a5a62 : mix(livery.window, 0xffffff, 0.25);
  stamp(ctx, cx + 1, cy + 1, d / 2 + 1, INK, 0.4, 0.3);
  ctx.fillStyle = hex(ring);
  ctx.beginPath();
  ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hex(field);
  ctx.beginPath();
  ctx.arc(cx, cy, d / 2 - 1.5, 0, Math.PI * 2);
  ctx.fill();
  const rows = MARKS[livery.emblem] || MARKS.stripe;
  const cell = Math.max(1, Math.floor((d - 4) / 8));
  const x0 = Math.round(cx - cell * 4);
  const y0 = Math.round(cy - cell * 4);
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      const ch = rows[y][x];
      if (ch === '.') continue;
      ctx.fillStyle = hex(ch === 'E' ? ink : ring);
      ctx.fillRect(x0 + x * cell, y0 + y * cell, cell, cell);
    }
  ctx.fillStyle = rgba(SUN, 0.35);
  ctx.fillRect(cx - d / 2 + 2, cy - 1, 1, 2);
}

// a lit carriage window: the warm saloon, seat backs, a head or two
function saloon(ctx, x, y, w, h, o = {}) {
  const { on = true, people = 1, seed = 1 } = o;
  if (!on) {
    pane(ctx, x, y, w, h, { warm: 0, base: 0x1e1e26 });
    return;
  }
  pane(ctx, x, y, w, h, { warm: 0.75, base: 0x4a3a40 });
  // the ceiling light strip and the luggage rack's shadow
  fill(ctx, 0xfff6dc, 0.55);
  ctx.fillRect(x + 1, y + 1, w - 2, 1);
  fill(ctx, INK, 0.25);
  ctx.fillRect(x + 1, y + Math.round(h * 0.22), w - 2, 1);
  // seat backs: dark moquette humps along the bottom
  const n = Math.max(1, Math.round(w / 15));
  for (let i = 0; i < n; i++) {
    const sx = x + 2 + i * (w / n);
    fill(ctx, 0x5a2a30, 0.85);
    rr(ctx, sx, y + h * 0.62, w / n - 4, h * 0.4, 2);
    ctx.fill();
  }
  // passengers: a head and shoulders above a seat back
  for (let i = 0; i < people; i++) {
    const px0 = x + 4 + ((seed * 37 + i * 53) % Math.max(4, w - 10));
    fill(ctx, 0x2a2026, 0.8);
    ctx.beginPath();
    ctx.arc(px0 + 2.5, y + h * 0.42, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(px0, y + h * 0.5, 6, h * 0.2);
  }
}

// =====================================================================================
// the buffer end, head-on: 123 × 172, the rail at the bottom edge
// =====================================================================================
export function paintCarriageEnd(ctx, w, h, livery, o = {}) {
  const { dead = false, emptyDoor = true } = o;
  const body = dead ? 0x34343c : livery.body;
  const trim = dead ? 0x44444c : livery.trim;
  const cx = w / 2;
  const floor = h - TRAIN.floor; // 121
  const roofY = 22;
  // --- underframe, wheels and rails (mostly down in the pit)
  fill(ctx, 0x16141c, 1);
  ctx.fillRect(8, floor, w - 16, h - floor);
  for (const s of [-1, 1]) {
    const rx = cx + s * px(1.435 / 2);
    // the wheel, end-on: a dark disc edge with a bright tread
    block(ctx, rx - 4, h - TRAIN.wheel, 8, TRAIN.wheel - 2, 0x2a2a30, { r: 3 });
    fill(ctx, 0x8a8a92, 0.8);
    ctx.fillRect(rx - 3, h - 4, 6, 2);
    // the rail head
    bar(ctx, rx - 5, h - 3, 10, 3, 0x7a7a82);
  }
  // bogie frame and springs between the wheels
  bar(ctx, cx - 40, h - 30, 80, 6, 0x24242c);
  for (const s of [-1, 1]) block(ctx, cx + s * 22 - 4, h - 36, 8, 10, 0x2e2e36, { r: 1 });
  // --- the body: slight tumblehome, a curved roof
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(4, floor + 9);
  ctx.lineTo(2, roofY + 10);
  ctx.quadraticCurveTo(2, roofY - 4, 14, roofY - 12);
  ctx.quadraticCurveTo(cx, -4, w - 14, roofY - 12);
  ctx.quadraticCurveTo(w - 2, roofY - 4, w - 2, roofY + 10);
  ctx.lineTo(w - 4, floor + 9);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, hex(lit(body, 0.28)));
  g.addColorStop(0.3, hex(body));
  g.addColorStop(1, hex(dim(body, 0.38)));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.clip();
  // the roof: grimy grey above the gutter, lit on its west shoulder
  gradientV(ctx, 0, 0, w, roofY - 2, [[0, 0x6a6a70], [1, 0x48484f]]);
  fill(ctx, SUN, 0.35);
  ctx.fillRect(10, roofY - 13, 22, 1);
  bar(ctx, 0, roofY - 2, w, 3, dim(body, 0.5)); // the rain gutter
  // livery bands: a trim line at the window head and the waist
  bar(ctx, 0, 34, w, 3, trim);
  bar(ctx, 0, floor - 30, w, 3, trim);
  // soot and brake dust towards the bottom
  gradientV(ctx, 0, floor - 24, w, 34, [[0, INK, 0], [1, INK, 0.35]]);
  ctx.restore();
  // body outline: cut on the shade side
  ctx.strokeStyle = rgba(INK, 0.7);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w - 4, floor + 9);
  ctx.lineTo(w - 2, roofY + 10);
  ctx.quadraticCurveTo(w - 2, roofY - 4, w - 14, roofY - 12);
  ctx.stroke();
  // --- the gangway: bellows frame, a sliding end door (painted open: the
  // door itself is a separate image so it can slide)
  const gw = px(1.15);
  const gx = Math.round(cx - gw / 2);
  const gTop = 28;
  block(ctx, gx - 3, gTop - 3, gw + 6, floor - gTop + 3, 0x1e1e24, { r: 3, litK: 0.15 });
  for (let y = gTop + 2; y < floor; y += 4) {
    fill(ctx, 0x34343c, 0.9);
    ctx.fillRect(gx - 2, y, 3, 2);
    ctx.fillRect(gx + gw - 1, y, 3, 2);
  }
  // the vestibule behind the door: warm light, a far door, a floor
  const dw = px(0.8);
  const dx = Math.round(cx - dw / 2);
  const dTop = floor - px(1.95);
  if (emptyDoor) {
    gradientV(ctx, dx, dTop, dw, floor - dTop, dead ? [[0, 0x16161c], [1, 0x0e0e12]] : [[0, 0xfff0c8], [0.5, 0xf2c078], [1, 0x8a6a40]]);
    if (!dead) {
      // the corridor runs away: two lit side walls, the next door small
      poly(ctx, [[dx, dTop], [dx + 10, dTop + 18], [dx + 10, floor - 18], [dx, floor]], rgba(0xb8885a, 0.6));
      poly(ctx, [[dx + dw, dTop], [dx + dw - 10, dTop + 18], [dx + dw - 10, floor - 18], [dx + dw, floor]], rgba(0x7a5a3a, 0.6));
      fill(ctx, 0x6a4a30, 0.7);
      ctx.fillRect(dx + 13, dTop + 24, dw - 26, floor - dTop - 42);
      fill(ctx, 0xfff6dc, 0.6);
      ctx.fillRect(dx + 15, dTop + 27, dw - 30, 10);
    }
  }
  fill(ctx, BRASS, 0.9); // threshold plate
  ctx.fillRect(dx - 1, floor - 1, dw + 2, 2);
  // grab handles either side of the gangway
  for (const s of [gx - 7, gx + gw + 5]) cyl(ctx, s, floor - 70, 2, 46, BRASS);
  // --- end windows, one each side of the gangway
  const ww = 26;
  const wTop = 40;
  const wH = 36;
  for (const wx of [9, w - 9 - ww]) {
    block(ctx, wx - 2, wTop - 2, ww + 4, wH + 4, dim(body, 0.5), { r: 3, litK: 0.1 });
    saloon(ctx, wx, wTop, ww, wH, { on: !dead, people: wx < cx ? 1 : 0, seed: wx });
    fill(ctx, SUN, 0.25);
    ctx.fillRect(wx, wTop + wH + 2, ww, 1);
  }
  // --- the destination blind above the gangway (the scene writes on it)
  const bw = 84;
  const bx = Math.round(cx - bw / 2);
  block(ctx, bx - 2, 5, bw + 4, 21, 0x14141a, { r: 2, litK: 0.1 });
  fill(ctx, dead ? 0x1a1a20 : 0x221e1a, 1);
  ctx.fillRect(bx, 7, bw, 17);
  if (!dead) {
    fill(ctx, WARM, 0.12);
    ctx.fillRect(bx, 7, bw, 17);
  }
  // --- the dream's mark, low on the west panel; a route plate on the east
  mark(ctx, 21, floor - 15, 18, livery, { dead });
  block(ctx, w - 31, floor - 22, 18, 12, dead ? 0x2a2a30 : 0xf2e6cc, { r: 1 });
  if (o.num) letters(ctx, String(o.num), w - 22, floor - 16, 10, dead ? 0x5a5a62 : 0x1f3a5f, { shadow: 0 });
  // --- tail lamps: lit red in the lower corners, a white marker over each
  for (const lx of [9, w - 9]) {
    block(ctx, lx - 5, floor - 6, 10, 10, IRON, { r: 4 });
    stamp(ctx, lx, floor - 1, 3.5, dead ? 0x3a2a2a : 0xff5040, 1, 0.3);
    if (!dead) {
      glow(ctx, lx, floor - 1, 9, 0xff6a50, 0.35);
      stamp(ctx, lx - 1, floor - 2, 1.2, 0xffe0d0, 1, 0.2);
    }
  }
  // --- the buffer beam and buffers (1.06 m), the coupling between them
  const by = h - px(1.06);
  bar(ctx, 3, by - 9, w - 6, 16, 0x9a2a24);
  fill(ctx, 0xf2e6cc, 0.85); // the warning chevrons
  for (let x = 6; x < w - 8; x += 12) {
    poly(ctx, [[x, by + 6], [x + 6, by - 8], [x + 10, by - 8], [x + 4, by + 6]], rgba(0xf2d040, 0.9));
  }
  for (const s of [-1, 1]) {
    const bxx = cx + s * px(1.75 / 2);
    cyl(ctx, bxx - 5, by - 4, 10, 10, 0x2a2a30);
    stamp(ctx, bxx, by + 1, px(0.45) / 2, 0x3a3a42, 1, 0.12);
    stamp(ctx, bxx - 2, by - 1, 3, 0x9a9aa2, 0.9, 0.5);
  }
  // the screw coupling and two brake hoses
  bar(ctx, cx - 3, by - 2, 6, 10, 0x2a2a30);
  ctx.strokeStyle = rgba(0x1a1a20, 1);
  ctx.lineWidth = 2;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * 14, by + 6);
    ctx.quadraticCurveTo(cx + s * 18, by + 20, cx + s * 10, by + 26);
    ctx.stroke();
  }
  grain(ctx, 0, 0, w, h, 0.035, 41);
}

// the sliding end door: 0.8 × 1.95 m, a droplight window, a brass handle
export function paintGangwayDoor(ctx, w, h, livery, o = {}) {
  const { dead = false } = o;
  const body = dead ? 0x2e2e36 : dim(livery.body, 0.25);
  block(ctx, 0, 0, w, h, body, { r: 1, litK: 0.2 });
  saloon(ctx, 5, 6, w - 10, 30, { on: !dead, people: 0 });
  fill(ctx, INK, 0.3);
  ctx.fillRect(4, 44, w - 8, 1);
  ctx.fillRect(4, h - 26, w - 8, 1);
  fill(ctx, SUN, 0.25);
  ctx.fillRect(4, 45, w - 8, 1);
  ctx.fillRect(1, 1, 1, h - 2);
  cyl(ctx, w - 6, 50, 2, 14, BRASS);
}

// =====================================================================================
// side-on: 880 × 172 (the body; the wheels and bogie frames are parts)
// =====================================================================================
export const SIDE = {
  bogieX: [Math.round(TRAIN.len / 2 - px(14.2) / 2), Math.round(TRAIN.len / 2 + px(14.2) / 2)], // 128, 752
  axle: Math.round(px(2.6) / 2), // ±57 from the bogie centre
  doorX: [66, TRAIN.len - 66], // door centres, one per vestibule
};
export function paintCarriageSide(ctx, w, h, livery, o = {}) {
  const { dead = false, tail = false, head = false, people = 9, seed = 3 } = o;
  const body = dead ? 0x34343c : livery.body;
  const trim = dead ? 0x44444c : livery.trim;
  const floor = h - TRAIN.floor; // 121
  const skirt = h - px(0.95); // 130
  const cant = 16;
  // underframe: a dark girder, battery and brake boxes between the bogies
  bar(ctx, 20, skirt - 2, w - 40, 7, 0x1e1e24);
  for (const [x0, bw] of [[240, 70], [350, 46], [470, 90], [600, 40]]) {
    block(ctx, x0, skirt + 4, bw, 15, 0x26262e, { r: 1, litK: 0.15 });
    fill(ctx, SUN, 0.12);
    ctx.fillRect(x0 + 2, skirt + 6, bw - 4, 1);
  }
  // the body side
  const g = ctx.createLinearGradient(0, cant, 0, skirt);
  g.addColorStop(0, hex(lit(body, 0.22)));
  g.addColorStop(0.45, hex(body));
  g.addColorStop(1, hex(dim(body, 0.3)));
  ctx.fillStyle = g;
  rr(ctx, 3, cant, w - 6, skirt - cant, 7);
  ctx.fill();
  // the roof: a curve seen from the side, ventilators along it
  gradientV(ctx, 8, 2, w - 16, cant, [[0, 0x7a7a80], [0.6, 0x5a5a62], [1, 0x44444c]]);
  rr(ctx, 8, 2, w - 16, cant + 2, 8);
  ctx.save();
  ctx.clip();
  gradientV(ctx, 8, 2, w - 16, cant + 2, [[0, 0x7a7a80], [0.6, 0x5a5a62], [1, 0x44444c]]);
  ctx.restore();
  fill(ctx, SUN, 0.4);
  ctx.fillRect(16, 3, w - 32, 1);
  for (let x = 70; x < w - 60; x += 82) {
    block(ctx, x, 0, 16, 5, 0x5a5a62, { r: 2, litK: 0.4 });
  }
  bar(ctx, 3, cant - 1, w - 6, 3, dim(body, 0.55)); // the gutter
  // the livery: a trim band at the window heads and one along the waist
  const wTop = floor - px(0.95) - px(0.85); // 42
  const wBot = floor - px(0.95); // 79
  bar(ctx, 3, wTop - 6, w - 6, 3, trim);
  bar(ctx, 3, wBot + 7, w - 6, 4, trim);
  // vestibule doors: 50 × 88 from the floor, a droplight, a handle, a step
  for (const dxc of SIDE.doorX) {
    const x0 = dxc - TRAIN.doorW / 2;
    fill(ctx, INK, 0.55);
    ctx.fillRect(x0 - 1, floor - TRAIN.doorH - 1, TRAIN.doorW + 2, TRAIN.doorH + 1);
    block(ctx, x0, floor - TRAIN.doorH, TRAIN.doorW, TRAIN.doorH, dim(body, 0.12), { r: 1, litK: 0.18 });
    fill(ctx, INK, 0.4);
    ctx.fillRect(dxc, floor - TRAIN.doorH, 1, TRAIN.doorH); // the meeting line of the leaves
    saloon(ctx, x0 + 6, floor - TRAIN.doorH + 8, TRAIN.doorW / 2 - 9, 28, { on: !dead, people: 0 });
    saloon(ctx, dxc + 3, floor - TRAIN.doorH + 8, TRAIN.doorW / 2 - 9, 28, { on: !dead, people: 0 });
    cyl(ctx, dxc - 5, floor - 46, 2, 12, BRASS);
    cyl(ctx, dxc + 3, floor - 46, 2, 12, BRASS);
    // a door-open light over it and the step below
    stamp(ctx, dxc, floor - TRAIN.doorH - 5, 2.5, dead ? 0x3a3a3a : 0xf2a040, 1, 0.3);
    bar(ctx, x0 - 2, floor, TRAIN.doorW + 4, 4, 0x2a2a30);
    fill(ctx, BRASS, 0.8);
    ctx.fillRect(x0 - 2, floor, TRAIN.doorW + 4, 1);
  }
  // saloon windows between the vestibules: 1.45 × 0.85 m, sill 0.95 m
  const ww = px(1.45);
  const a = SIDE.doorX[0] + TRAIN.doorW / 2 + 22;
  const b = SIDE.doorX[1] - TRAIN.doorW / 2 - 22;
  const n = Math.floor((b - a) / (ww + 18));
  const pitch = (b - a) / n;
  for (let i = 0; i < n; i++) {
    const x0 = Math.round(a + i * pitch + (pitch - ww) / 2);
    block(ctx, x0 - 2, wTop - 2, ww + 4, wBot - wTop + 4, dim(body, 0.5), { r: 4, litK: 0.1 });
    saloon(ctx, x0, wTop, ww, wBot - wTop, { on: !dead, people: (seed + i) % 3 === 0 ? 0 : 1 + ((i + seed) % 2), seed: seed + i });
    // the top-light and the panel seam between bays
    fill(ctx, INK, 0.5);
    ctx.fillRect(x0, wTop + 7, ww, 1);
    fill(ctx, INK, 0.18);
    ctx.fillRect(Math.round(a + i * pitch), cant + 2, 1, skirt - cant - 4);
  }
  // rivets along the waist and the solebar
  fill(ctx, SUN, 0.35);
  for (let x = 12; x < w - 12; x += 9) {
    ctx.fillRect(x, wBot + 14, 1, 1);
    ctx.fillRect(x, skirt - 5, 1, 1);
  }
  // the dream's mark mid-panel, the station's name and a coach number
  mark(ctx, w / 2, wBot + 26, 22, livery, { dead });
  letters(ctx, 'CROSSROADS', w / 2 - 120, wBot + 26, 10, dead ? 0x5a5a62 : livery.trim, { shadow: 0.4 });
  letters(ctx, `${livery.coach || 'E 104'}`, w / 2 + 120, wBot + 26, 10, dead ? 0x5a5a62 : livery.trim, { shadow: 0.4 });
  // ends: gangway bellows; on the last coach, a red tail lamp
  for (const [ex, end] of [[0, head], [w - 7, tail]]) {
    block(ctx, ex, cant + 6, 7, floor - cant - 6, 0x1e1e24, { r: 1, litK: 0.1 });
    if (end && !dead) {
      const lx = ex < 10 ? 6 : w - 6;
      stamp(ctx, lx, floor - 10, 4, 0xff5040, 1, 0.3);
      glow(ctx, lx, floor - 10, 12, 0xff6a50, 0.4);
    }
  }
  // the lower body takes the soot
  gradientV(ctx, 3, wBot + 12, w - 6, skirt - wBot - 12, [[0, INK, 0], [1, INK, 0.3]]);
  // outline: under and east
  fill(ctx, INK, 0.6);
  ctx.fillRect(6, skirt, w - 12, 1);
  grain(ctx, 0, 0, w, h, 0.03, 23 + seed);
}

// a wheel, side-on, to turn: 0.92 m with spokes and a bright tyre
export function paintWheel(ctx, w) {
  const r = w / 2;
  stamp(ctx, r, r, r, 0x2a2a30, 1, 0.04);
  ctx.strokeStyle = hex(0x9a9aa2);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(r, r, r - 1.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = rgba(0x5a5a62, 1);
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(r + Math.cos(a) * 4, r + Math.sin(a) * 4);
    ctx.lineTo(r + Math.cos(a) * (r - 4), r + Math.sin(a) * (r - 4));
    ctx.stroke();
  }
  stamp(ctx, r, r, 5, 0x6a6a72, 1, 0.2);
  // a white balance mark so the turning reads
  fill(ctx, 0xf2e6cc, 0.9);
  ctx.fillRect(r - 1, 3, 2, 5);
}

// the bogie side frame: springs, axleboxes, a brake block, in front of the wheels
export function paintBogie(ctx, w, h) {
  const c = w / 2;
  const ax = Math.round(px(2.6) / 2);
  bar(ctx, 6, 8, w - 12, 7, 0x2a2a32);
  fill(ctx, SUN, 0.3);
  ctx.fillRect(6, 8, w - 12, 1);
  for (const s of [-1, 1]) {
    block(ctx, c + s * ax - 7, 12, 14, 14, 0x34343c, { r: 2 }); // axlebox
    for (let i = 0; i < 3; i++) bar(ctx, c + s * ax - 6, 2 + i * 3, 12, 2, 0x5a5a62); // the spring
    block(ctx, c + s * (ax - 22) - 3, 14, 6, 12, 0x24242a, { r: 1 }); // brake block
  }
  block(ctx, c - 14, 0, 28, 9, 0x26262e, { r: 1 }); // the bolster
}

// =====================================================================================
// a hub bay seen down its platform (224 wide, the concourse floor at the
// bottom edge), one-point perspective. The end plane holds the carriage end
// and the platform mouth; z grows into the shed.
// =====================================================================================
export const BAY = {
  w: 224,
  h: 300,
  vx: 152, // the vanishing point (bay-local x)
  eye: 70, // the eye above the concourse (1.6 m)
  endX: [16, 16 + TRAIN.width], // the carriage end, 16..139
  platformX: 146, // the platform's edge, next to the train
  D: 8, // metres from the eye to the end plane
};
// project a point on the end plane at depth d (m) into bay-local px
const proj = (x, y, d) => {
  const s = 1 / (1 + d / BAY.D);
  const vy = BAY.h - BAY.eye;
  return [BAY.vx + (x - BAY.vx) * s, vy + (y - vy) * s];
};

export function paintBayVista(ctx, w, h, o = {}) {
  const { lamps = true, seed = 1, empty = false } = o;
  const vy = h - BAY.eye;
  // the shed beyond: smoke-blue dark, warmer low down where the lamps are
  gradientV(ctx, 0, 0, w, h, [[0, 0x1a1a2a], [0.55, 0x2a2638], [0.8, 0x3a3240], [1, 0x2a2430]]);
  // the far end: an arch of night sky with a signal or two
  const [ax0, ay0] = proj(-120, h - 560, 120);
  const [ax1] = proj(BAY.w + 160, h, 120);
  const aw = ax1 - ax0;
  gradientV(ctx, ax0, ay0, aw, vy - ay0 + 4, [[0, 0x2a3a5a], [1, 0x4a4a68]]);
  stamp(ctx, BAY.vx - 8, vy - 3, 1.5, 0xff4030, 1, 0.3);
  stamp(ctx, BAY.vx + 10, vy - 6, 1.5, 0x40ff80, 1, 0.3);
  // roof: glazing between iron ribs, converging; a pendant lamp on each rib
  for (let d = 0; d <= 120; d += d < 30 ? 6 : 12) {
    const [l, t] = proj(-80, h - 300, d);
    const [r] = proj(BAY.w + 80, h - 300, d);
    const thick = Math.max(1, 6 / (1 + d / BAY.D));
    bar(ctx, l, t, r - l, thick, 0x24242e, { alpha: 0.95 });
    if (lamps && d > 0 && d < 100) {
      const [lx, ly] = proj(BAY.platformX + 40, h - 210, d);
      glow(ctx, lx, ly, 14 / (1 + d / 20), LAMP, 0.5);
      stamp(ctx, lx, ly, 2.2 / (1 + d / 30), 0xfff6dc, 1, 0.4);
    }
  }
  // purlins running away to the far end
  for (const x of [-80, 40, 160, 300]) {
    const [x0, y0] = proj(x, h - 300, 0);
    line(ctx, x0, y0, BAY.vx + (x - BAY.vx) * 0.0625, vy + (h - 300 - vy) * 0.0625, 0x24242e, 0.8, 1);
  }
  // the track bed under the train: ballast, sleepers, two rails converging
  const railY = h + TRAIN.pit;
  const tb = (x, d) => proj(x, railY, d);
  const [l0, b0] = tb(BAY.endX[0] - 6, 0);
  const [r0] = tb(BAY.endX[1] + 6, 0);
  const [lf, bf] = tb(BAY.endX[0] - 6, 150);
  const [rf] = tb(BAY.endX[1] + 6, 150);
  poly(ctx, [[l0, b0], [r0, b0], [rf, bf], [lf, bf]], hex(0x2a2622));
  for (let d = 0.3; d < 150; d += 0.65 * (1 + d / 12)) {
    const [s0, sy] = tb(BAY.endX[0] + 4, d);
    const [s1] = tb(BAY.endX[1] - 4, d);
    line(ctx, s0, sy, s1, sy, 0x4a3a2e, 0.9, Math.max(1, 3 / (1 + d / BAY.D)));
  }
  const cx = (BAY.endX[0] + BAY.endX[1]) / 2;
  for (const s of [-1, 1]) {
    const [x0, y0] = tb(cx + s * px(1.435 / 2), 0);
    const [x1, y1] = tb(cx + s * px(1.435 / 2), 150);
    line(ctx, x0, y0, x1, y1, 0x9a9aa2, 0.95, 2);
  }
  if (empty) {
    // the oil stain where the train stood, and the buffer stop's shadow
    const [sx, sy] = tb(cx, 4);
    dab(ctx, sx, sy, 34, 5, 0, 0x0a0a10, 0.75, 0.6);
    dab(ctx, sx + 14, sy + 2, 12, 3, 0, 0x101018, 0.6, 0.5);
  }
  // the platform: stone, a white coping, a yellow line, converging
  const P = (x, d) => proj(x, h, d);
  const [p0x, p0y] = P(BAY.platformX, 0);
  const [p1x] = P(BAY.w + 120, 0);
  const [q0x, q0y] = P(BAY.platformX, 160);
  const [q1x] = P(BAY.w + 120, 160);
  const pg = ctx.createLinearGradient(0, vy, 0, h);
  pg.addColorStop(0, hex(0x5a5048));
  pg.addColorStop(1, hex(mix(STONE, 0x2a2430, 0.25)));
  poly(ctx, [[p0x, p0y], [p1x, p0y], [q1x, q0y], [q0x, q0y]], pg);
  // the platform face down to the rails, in shadow
  const [f0x, f0y] = proj(BAY.platformX, railY, 0);
  const [f1x, f1y] = proj(BAY.platformX, railY, 160);
  poly(ctx, [[p0x, p0y], [q0x, q0y], [f1x, f1y], [f0x, f0y]], hex(0x1e1a20));
  const edge = (x, c, a, wd) => {
    const [x0, y0] = P(x, 0);
    const [x1, y1] = P(x, 160);
    line(ctx, x0, y0, x1, y1, c, a, wd);
  };
  edge(BAY.platformX + 1, 0xe8e0d0, 0.9, 2);
  edge(BAY.platformX + 12, 0xf2d040, 0.85, 2);
  // flagstone joints across the platform
  for (let d = 1; d < 120; d += 1.2 * (1 + d / 10)) {
    const [x0, y0] = P(BAY.platformX, d);
    const [x1] = P(BAY.w + 120, d);
    line(ctx, x0, y0, x1, y0, 0x2a2430, 0.35, 1);
  }
  // platform lamps receding (the near one is a real prop on the play plane)
  for (let d = 12; d < 120; d += 12) {
    const [bx, by] = P(BAY.platformX + 60, d);
    const [, ty] = proj(BAY.platformX + 60, h - px(3.5), d);
    const s = 1 / (1 + d / BAY.D);
    line(ctx, bx, by, bx, ty, 0x22222a, 1, Math.max(1, 4 * s));
    if (lamps) {
      glow(ctx, bx, ty, 26 * s + 3, LAMP, 0.45);
      stamp(ctx, bx, ty, Math.max(1, 4 * s), 0xfff6dc, 1, 0.4);
      // its pool on the stone
      dab(ctx, bx - 6 * s, by, 30 * s + 3, 5 * s + 1, 0, LAMP, 0.18, 0.7);
    } else stamp(ctx, bx, ty, Math.max(1, 4 * s), 0x4a4a52, 1, 0.3);
  }
  // a few people far down the platform, and a porter's barrow
  if (lamps && !empty) {
    for (const [d, x] of [[22, 34], [38, 20], [56, 46]]) {
      const [fx, fy] = P(BAY.platformX + x, d + (seed % 3) * 2);
      const s = 1 / (1 + (d + (seed % 3) * 2) / BAY.D);
      fill(ctx, 0x1e1a24, 0.85);
      ctx.fillRect(fx - 4 * s, fy - 70 * s, 8 * s, 70 * s);
      ctx.beginPath();
      ctx.arc(fx, fy - 74 * s, 4 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // haze where the shed swallows the far end
  for (let i = 0; i < 9; i++) dab(ctx, BAY.vx - 40 + i * 12, vy - 4 - (i % 3) * 5, 26, 10, 0, 0xc8c0d0, 0.12, 0.9);
  // the iron screen that frames the bay: two columns and a lattice girder
  for (const x of [0, w - 8]) {
    cyl(ctx, x, 14, 8, h - 14, GREEN, { litK: 0.4 });
    bar(ctx, x - 1, h - 8, 10, 8, dim(GREEN, 0.3));
  }
  bar(ctx, 0, 0, w, 14, GREEN);
  for (let x = 4; x < w - 8; x += 12) {
    line(ctx, x, 3, x + 6, 11, dim(GREEN, 0.5), 0.9, 1);
    line(ctx, x + 6, 3, x, 11, dim(GREEN, 0.5), 0.9, 1);
  }
  fill(ctx, SUN, 0.35);
  ctx.fillRect(0, 0, w, 1);
  grain(ctx, 0, 0, w, h, 0.03, 90 + seed);
}

// the rest of the train, receding along the platform side (its own layer:
// it scales about the vanishing point when the train pulls away)
export function paintBayTrain(ctx, w, h, livery, o = {}) {
  const { dead = false, seed = 1 } = o;
  const body = dead ? 0x2e2e36 : livery.body;
  const trim = dead ? 0x3e3e46 : livery.trim;
  const railY = h + TRAIN.pit;
  const X = BAY.endX[1];
  const top = railY - px(3.55); // the cantrail
  const floor = railY - TRAIN.floor;
  const coach = 20.6;
  for (let k = 5; k >= 0; k--) {
    const d0 = k * coach;
    const d1 = d0 + 20;
    const s0 = 1 / (1 + d0 / BAY.D);
    // the side face
    const [ax, at] = proj(X, top, d0);
    const [, ab] = proj(X, railY - px(0.95), d0);
    const [bx, bt] = proj(X, top, d1);
    const [, bb] = proj(X, railY - px(0.95), d1);
    const g = ctx.createLinearGradient(ax, 0, bx, 0);
    g.addColorStop(0, hex(dim(body, 0.15)));
    g.addColorStop(1, hex(mix(dim(body, 0.5), 0x2a2638, 0.5)));
    poly(ctx, [[ax, at], [bx, bt], [bx, bb], [ax, ab]], g);
    // the roof shoulder above it, curving away
    const [rx0, ry0] = proj(X - 14, top - px(0.35), d0);
    const [rx1, ry1] = proj(X - 14, top - px(0.35), d1);
    poly(ctx, [[ax, at], [rx0, ry0], [rx1, ry1], [bx, bt]], hex(0x4a4a52));
    // underframe and bogies in the dark under the floor line
    const [, ub0] = proj(X, railY, d0);
    const [, ub1] = proj(X, railY, d1);
    poly(ctx, [[ax, ab], [bx, bb], [bx, ub1], [ax, ub0]], hex(0x121016));
    // the waist band
    const [, w0] = proj(X, floor - px(0.6), d0);
    const [, w1] = proj(X, floor - px(0.6), d1);
    line(ctx, ax, w0, bx, w1, trim, 0.8, Math.max(1, 3 * s0));
    // windows: lit, getting smaller; a door at each end throws light out
    for (let d = d0 + 2.2; d < d1 - 2; d += 2.05) {
      const [x0, y0] = proj(X, floor - px(1.8), d);
      const [x1, y1] = proj(X, floor - px(1.8), d + 1.45);
      const [, yb0] = proj(X, floor - px(0.95), d);
      const [, yb1] = proj(X, floor - px(0.95), d + 1.45);
      poly(ctx, [[x0, y0], [x1, y1], [x1, yb1], [x0, yb0]], dead ? hex(0x1a1a20) : hex(mix(WARM, 0xfff0c8, 0.3)));
      if (!dead) dab(ctx, (x0 + x1) / 2 + 4, yb0 + 4, 8 * s0 + 2, 3 * s0 + 1, 0, WARM, 0.25, 0.8);
    }
    for (const dd of [d0 + 0.6, d1 - 1.6]) {
      const [x0, y0] = proj(X, floor - px(2), dd);
      const [x1, y1] = proj(X, floor - px(2), dd + 1);
      const [, yb0] = proj(X, floor, dd);
      const [, yb1] = proj(X, floor, dd + 1);
      poly(ctx, [[x0, y0], [x1, y1], [x1, yb1], [x0, yb0]], hex(dim(body, 0.35)));
      if (!dead) {
        poly(ctx, [[x0 + 1, y0 + 2], [x1, y1 + 2], [x1, y1 + (yb1 - y1) * 0.4], [x0 + 1, y0 + (yb0 - y0) * 0.4]], hex(WARM));
      }
    }
  }
  // the engine, far down: a dark front and its lamp, steam over it
  if (!dead) {
    const [ex, ey] = proj(X - 60, floor - px(2.6), 6 * coach);
    stamp(ctx, ex, ey, 3, 0xfff6dc, 1, 0.4);
    glow(ctx, ex, ey, 12, LAMP, 0.4);
  }
  grain(ctx, 0, 0, w, h, 0.02, 120 + seed);
}

// =====================================================================================
// station furniture at the §7 sizes
// =====================================================================================
// a platform lamp: 3.5 m, a swan-neck bracket, a glass lantern, the
// platform's number on an enamel plate at eye level
export function paintPlatformLamp(ctx, w, h, o = {}) {
  const { on = true, num = '' } = o;
  const c = Math.round(w / 2);
  cshadow(ctx, c, h, 24, 0.3, 2);
  // the base: a fluted foot
  block(ctx, c - 6, h - 16, 12, 16, 0x2a2a32, { r: 1 });
  bar(ctx, c - 7, h - 17, 14, 3, 0x3a3a44);
  // the post
  cyl(ctx, c - 2, 20, 5, h - 36, 0x2a2a32, { litK: 0.5 });
  for (let y = 60; y < h - 30; y += 34) bar(ctx, c - 3, y, 7, 2, 0x3a3a44);
  // the crown and the lantern hung from it
  block(ctx, c - 6, 16, 12, 5, 0x2a2a32, { r: 2 });
  if (on) glow(ctx, c, 12, 18, LAMP, 0.4);
  block(ctx, c - 6, 1, 12, 15, IRON, { r: 2 });
  ctx.fillStyle = hex(on ? LAMP : 0x4a4a52);
  ctx.fillRect(c - 4, 3, 8, 11);
  if (on) stamp(ctx, c - 1, 7, 4, 0xfff6dc, 0.95, 0.5);
  fill(ctx, IRON, 0.9);
  ctx.fillRect(c, 3, 1, 11);
  ctx.fillRect(c - 3, 0, 6, 2);
  // the number plate at 1.7 m
  if (num) {
    const py = h - px(1.9);
    block(ctx, c - 8, py, 16, 16, 0xf2e6cc, { r: 2, litK: 0.1 });
    ctx.strokeStyle = rgba(0x1f3a5f, 1);
    ctx.lineWidth = 1;
    ctx.strokeRect(c - 6.5, py + 1.5, 13, 13);
    letters(ctx, String(num), c, py + 8, 10, 0x1f3a5f, { shadow: 0 });
  }
}

// a buffer stop: a heavy timber beam on a steel frame, two buffers at
// 1.06 m, a red lamp on top (its foot is the rail)
export function paintBufferStop(ctx, w, h, o = {}) {
  const { on = true } = o;
  const c = w / 2;
  const by = h - px(1.06);
  // the frame legs, raked back
  for (const s of [-1, 1]) block(ctx, c + s * 46 - 5, by - 2, 10, h - by + 2, 0x2a2a30, { r: 1 });
  // the beam: red and white bands
  bar(ctx, 6, by - 10, w - 12, 18, 0xa82a24);
  for (let x = 10; x < w - 14; x += 18) {
    fill(ctx, 0xf2e6cc, 0.9);
    ctx.fillRect(x, by - 9, 9, 16);
  }
  fill(ctx, SUN, 0.35);
  ctx.fillRect(6, by - 10, w - 12, 1);
  // buffers: steel heads on short barrels, lit on their west rims
  for (const s of [-1, 1]) {
    const x = c + s * px(1.75 / 2);
    const r = px(0.45) / 2;
    cyl(ctx, x - 4, by - 4, 8, 8, 0x4a4a52);
    ctx.fillStyle = hex(0x8a8a92);
    ctx.beginPath();
    ctx.arc(x, by, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hex(0x6a6a72);
    ctx.beginPath();
    ctx.arc(x + 1, by + 1, r - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgba(SUN, 0.7);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, by, r - 1, Math.PI * 0.8, Math.PI * 1.45);
    ctx.stroke();
  }
  // the lamp on top
  block(ctx, c - 5, by - 22, 10, 12, IRON, { r: 2 });
  stamp(ctx, c, by - 16, 3.5, on ? 0xff4030 : 0x4a2a2a, 1, 0.3);
  if (on) glow(ctx, c, by - 16, 12, 0xff5040, 0.4);
}

// the platform gate: a frame with two posts; the leaves are separate
export function paintGateFrame(ctx, w, h) {
  for (const x of [0, w - 7]) {
    cyl(ctx, x, 6, 7, h - 6, GREEN, { litK: 0.45 });
    stamp(ctx, x + 3.5, 5, 4, BRASS, 1, 0.2);
    stamp(ctx, x + 2.5, 4, 1.5, lit(BRASS, 0.6), 1, 0.4);
  }
  cshadow(ctx, w / 2, h, w, 0.25, 2);
}
export function paintGateLeaf(ctx, w, h) {
  // dark green iron: rails top and bottom, bars, a brass ring for the latch
  bar(ctx, 0, 0, w, 4, GREEN);
  bar(ctx, 0, h - 8, w, 4, GREEN);
  bar(ctx, 0, Math.round(h * 0.45), w, 3, GREEN);
  for (let x = 2; x < w; x += 5) cyl(ctx, x, 2, 2, h - 8, dim(GREEN, 0.2));
  // spear tops
  fill(ctx, BRASS, 0.9);
  for (let x = 2; x < w; x += 5) ctx.fillRect(x, 0, 2, 2);
  stamp(ctx, w - 4, h * 0.5, 2.5, BRASS, 1, 0.3);
}

// a free-standing ticket booth: 2.6 m, two windows over a 1.1 m counter,
// the fascia lettered TICKETS, a cornice and a clock
export function paintTicketBooth(ctx, w, h, o = {}) {
  const { on = true } = o;
  const WOOD = 0x6a4a32;
  const counter = h - px(STATION.ticketBooth.counterM);
  cshadow(ctx, w / 2, h, w * 1.15, 0.32, 3);
  block(ctx, 2, 18, w - 4, h - 18, WOOD, { r: 2 });
  // the cornice and the fascia
  bar(ctx, 0, 0, w, 6, 0x4a3222);
  block(ctx, 3, 6, w - 6, 14, GREEN, { r: 1 });
  fill(ctx, SUN, 0.35);
  ctx.fillRect(0, 0, w, 1);
  letters(ctx, 'TICKETS', w / 2, 13, 10, 0xf2d580, { shadow: 0.6 });
  // two windows with a pilaster between, the lit office behind
  const ww = (w - 22) / 2;
  for (const x of [7, 15 + ww]) {
    pane(ctx, x, 26, ww, counter - 30, { warm: on ? 0.75 : 0.05, bars: 2 });
    if (on) glow(ctx, x + ww / 2, 40, ww * 0.6, WARM, 0.2);
    // the speaking grille and the money slot
    fill(ctx, INK, 0.45);
    ctx.fillRect(x + ww / 2 - 6, counter - 18, 12, 6);
    ctx.fillRect(x + ww / 2 - 9, counter - 3, 18, 3);
  }
  cyl(ctx, 7 + ww, 22, 8, counter - 22, dim(WOOD, 0.2));
  // the counter ledge and the panelled front under it
  bar(ctx, 0, counter, w, 5, 0x4a3222);
  fill(ctx, SUN, 0.45);
  ctx.fillRect(0, counter, w, 1);
  for (let i = 0; i < 4; i++) {
    const x = 8 + i * ((w - 16) / 4);
    fill(ctx, INK, 0.25);
    ctx.fillRect(x, counter + 10, (w - 16) / 4 - 6, h - counter - 18);
    fill(ctx, SUN, 0.2);
    ctx.fillRect(x, counter + 10, 1, h - counter - 18);
  }
  // a small clock on the pilaster
  stamp(ctx, 11 + ww, 30, 5, 0xf2e6cc, 1, 0.1);
  line(ctx, 11 + ww, 30, 11 + ww, 27, INK, 1, 1);
  line(ctx, 11 + ww, 30, 13 + ww, 31, INK, 1, 1);
}

// a newspaper kiosk: 2.5 m, a striped awning, the day's papers racked under
// the counter, a board in front for the headline (the scene writes it)
export function paintKiosk(ctx, w, h) {
  const WOOD = 0x3a4a3a;
  cshadow(ctx, w / 2, h, w * 1.2, 0.32, 3);
  // the roof: a shallow dome with a finial
  block(ctx, 6, 6, w - 12, 8, 0x2a3a2e, { r: 4 });
  stamp(ctx, w / 2, 4, 3, BRASS, 1, 0.2);
  // the awning
  for (let x = 0; x < w; x += 10) {
    const c = (x / 10) % 2 ? 0xf2e6cc : 0x2e6a4a;
    const g = ctx.createLinearGradient(0, 14, 0, 26);
    g.addColorStop(0, hex(lit(c, 0.2)));
    g.addColorStop(1, hex(dim(c, 0.3)));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, 14);
    ctx.lineTo(x + 10, 14);
    ctx.lineTo(x + 10, 24);
    ctx.lineTo(x + 5, 27);
    ctx.lineTo(x, 24);
    ctx.closePath();
    ctx.fill();
  }
  // the booth
  block(ctx, 4, 27, w - 8, h - 27, WOOD, { r: 1 });
  pane(ctx, 10, 30, w - 20, 26, { warm: 0.75, bars: 3 });
  glow(ctx, w / 2, 40, 30, WARM, 0.2);
  // the counter at 1.0 m, magazines fanned on it
  const counter = h - px(1.0);
  bar(ctx, 0, counter, w, 4, 0x2a2a20);
  const cols = [0xc03a2a, 0xf2d580, 0x88b8d8, 0xe8e0d0, 0xc88ad8, 0xe8e0d0];
  for (let i = 0; i < 6; i++) {
    block(ctx, 6 + i * ((w - 12) / 6), counter - 7, (w - 12) / 6 - 2, 7, cols[i], { r: 0.5 });
  }
  // racks of papers on the front (the headline board sits on the roof,
  // hung by the scene)
  for (let r = 0; r < 2; r++)
    for (let i = 0; i < 5; i++) {
      const x = 8 + i * ((w - 16) / 5);
      const y = counter + 8 + r * 16;
      fill(ctx, 0xe8e0d0, 1);
      ctx.fillRect(x, y, (w - 16) / 5 - 4, 12);
      fill(ctx, INK, 0.5);
      ctx.fillRect(x + 2, y + 2, (w - 16) / 5 - 10, 2);
      ctx.fillRect(x + 2, y + 6, (w - 16) / 5 - 8, 1);
      ctx.fillRect(x + 2, y + 8, (w - 16) / 5 - 12, 1);
    }
  bar(ctx, 2, h - 6, w - 4, 6, dim(WOOD, 0.3));
}

// a red telephone box: 2.3 × 0.9 m, a crown roof, glazing bars, the lit sign
export function paintPhoneBox(ctx, w, h) {
  const RED = 0xa82a2a;
  cshadow(ctx, w / 2, h, w * 1.4, 0.3, 2);
  block(ctx, 1, 10, w - 2, h - 10, RED, { r: 1 });
  block(ctx, 3, 3, w - 6, 9, RED, { r: 4 }); // the domed roof
  block(ctx, w / 2 - 4, 0, 8, 4, RED, { r: 2 });
  // the TELEPHONE sign band, lit
  fill(ctx, 0xf2e6cc, 0.95);
  ctx.fillRect(4, 13, w - 8, 5);
  fill(ctx, INK, 0.7);
  for (let x = 6; x < w - 6; x += 3) ctx.fillRect(x, 15, 2, 1);
  // the door's glazing: three by six small panes with a lamp-lit inside
  const gx = 6;
  const gy = 22;
  const gw = w - 12;
  const gh = h - 40;
  pane(ctx, gx, gy, gw, gh, { warm: 0.45, base: 0x3a4a52 });
  fill(ctx, RED, 1);
  for (let i = 1; i < 3; i++) ctx.fillRect(gx + Math.round((gw * i) / 3) - 1, gy, 2, gh);
  for (let j = 1; j < 6; j++) ctx.fillRect(gx, gy + Math.round((gh * j) / 6) - 1, gw, 2);
  // the handle and the plinth
  cyl(ctx, w - 6, h / 2, 2, 10, 0x2a2a30);
  bar(ctx, 0, h - 6, w, 6, dim(RED, 0.3));
}

// the brass revolving door: drum 2.0 × 2.4 m, a canopy band, curved glass;
// the turning wings are a separate image
export function paintRevolvingDoor(ctx, w, h) {
  cshadow(ctx, w / 2, h, w * 1.1, 0.3, 3);
  // the drum: dark interior glimpsed through curved glass
  gradientV(ctx, 6, 14, w - 12, h - 20, [[0, 0x3a3440], [1, 0x241e28]]);
  glow(ctx, w / 2, h * 0.5, w * 0.45, WARM, 0.22);
  const g = ctx.createLinearGradient(6, 0, w - 6, 0);
  g.addColorStop(0, rgba(0xffffff, 0.25));
  g.addColorStop(0.25, rgba(0xffffff, 0.06));
  g.addColorStop(0.75, rgba(0xffffff, 0.02));
  g.addColorStop(1, rgba(0xffffff, 0.14));
  ctx.fillStyle = g;
  ctx.fillRect(6, 14, w - 12, h - 20);
  // the brass: canopy, posts at the drum's edges, a kick ring at the floor
  block(ctx, 0, 0, w, 14, BRASS, { r: 2, litK: 0.4 });
  letters(ctx, 'IN', w / 2, 7, 10, 0x2a2230, { shadow: 0 });
  cyl(ctx, 0, 12, 7, h - 12, BRASS, { litK: 0.5 });
  cyl(ctx, w - 7, 12, 7, h - 12, BRASS, { litK: 0.5 });
  bar(ctx, 0, h - 6, w, 6, dim(BRASS, 0.2));
  cyl(ctx, w / 2 - 2, 14, 4, h - 20, dim(BRASS, 0.1)); // the spindle
}
export function paintDoorWings(ctx, w, h) {
  // one wing seen flat: brass frame, glass, a push bar
  block(ctx, 0, 0, w, h, BRASS, { r: 1, litK: 0.4 });
  pane(ctx, 3, 3, w - 6, h - 6, { warm: 0.35, base: 0x5a7a8a });
  bar(ctx, 2, h * 0.5, w - 4, 3, lit(BRASS, 0.2));
}

// a pair of station doors, 1.8 × 2.6 m: panelled oak, a fanlight, brass
export function paintDoubleDoor(ctx, w, h) {
  const OAK = 0x5a3e28;
  cshadow(ctx, w / 2, h, w * 1.1, 0.3, 3);
  block(ctx, 0, 0, w, h, 0xc8bb9c, { r: 2 }); // the stone architrave
  // the fanlight
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(6, 26);
  ctx.arc(w / 2, 26, w / 2 - 6, Math.PI, 0);
  ctx.closePath();
  ctx.clip();
  pane(ctx, 6, 4, w - 12, 24, { warm: 0.55, bars: 4 });
  ctx.restore();
  bar(ctx, 6, 26, w - 12, 3, 0x8a7a5a);
  // two leaves
  const lw = (w - 14) / 2;
  for (const x of [6, 8 + lw]) {
    block(ctx, x, 29, lw, h - 31, OAK, { r: 1 });
    for (const [py, ph] of [[34, 32], [72, h - 80]]) {
      fill(ctx, INK, 0.3);
      ctx.fillRect(x + 4, py, lw - 8, ph);
      fill(ctx, lit(OAK, 0.25), 1);
      ctx.fillRect(x + 5, py + 1, lw - 10, ph - 2);
      fill(ctx, SUN, 0.25);
      ctx.fillRect(x + 4, py, 1, ph);
    }
  }
  fill(ctx, INK, 0.6);
  ctx.fillRect(w / 2 - 1, 29, 2, h - 31);
  for (const s of [-1, 1]) cyl(ctx, w / 2 + s * 4 - 1, 62, 2, 12, BRASS);
}

// a pigeon: 0.32 m, 16 × 13, grey with an iridescent neck
export function paintPigeon(ctx) {
  dab(ctx, 7.5, 7.5, 6, 3.6, -0.15, 0x8a8a98, 1, 0.12); // body
  dab(ctx, 3, 6.5, 3, 1.6, 0.3, 0x5a5a68, 1, 0.2); // tail
  stamp(ctx, 12, 4, 2.6, 0x9a9aa8, 1, 0.12); // head
  dab(ctx, 10.5, 6.5, 1.8, 2, 0, 0x6a8a7a, 0.9, 0.3); // the green-violet neck
  fill(ctx, 0x6a6a78, 1);
  ctx.fillRect(5, 7, 5, 1); // wing bars
  ctx.fillRect(6, 9, 4, 1);
  fill(ctx, 0xd8a840, 1);
  ctx.fillRect(14, 4, 2, 1); // beak
  fill(ctx, 0xe86a40, 1);
  ctx.fillRect(12, 3, 1, 1); // eye
  fill(ctx, 0xc86a5a, 1);
  ctx.fillRect(7, 11, 1, 2); // feet
  ctx.fillRect(9, 11, 1, 2);
  fill(ctx, SUN, 0.5);
  ctx.fillRect(10, 2, 2, 1);
}

// ---- texture makers -----------------------------------------------------------------
const lv = (l) => `${(l.body >>> 0).toString(16)}-${(l.trim >>> 0).toString(16)}-${l.emblem || ''}`;
export function carriageEndTex(scene, livery, o = {}) {
  const key = `hub-carriage-end-${o.dead ? 'dark' : lv(livery)}-${o.num || 0}`;
  if (!scene.textures.exists(key)) paintTexture(scene, key, TRAIN.width, TRAIN.height, (ctx, w, h) => paintCarriageEnd(ctx, w, h, livery, o), key);
  return key;
}
export function gangwayDoorTex(scene, livery, o = {}) {
  const key = `hub-gangway-door-${o.dead ? 'dark' : lv(livery)}`;
  if (!scene.textures.exists(key)) paintTexture(scene, key, px(0.8), px(1.95), (ctx, w, h) => paintGangwayDoor(ctx, w, h, livery, o), key);
  return key;
}
export function carriageSideTex(scene, livery, o = {}) {
  const key = `train-carriage-side-${o.dead ? 'dark' : lv(livery)}${o.tail ? '-tail' : ''}${o.head ? '-head' : ''}`;
  if (!scene.textures.exists(key)) paintTexture(scene, key, TRAIN.len, TRAIN.height, (ctx, w, h) => paintCarriageSide(ctx, w, h, livery, o), key);
  return key;
}
export function wheelTex(scene) {
  if (!scene.textures.exists('train-wheel')) paintTexture(scene, 'train-wheel', TRAIN.wheel, TRAIN.wheel, (ctx, w) => paintWheel(ctx, w), 'train-wheel');
  return 'train-wheel';
}
export function bogieTex(scene) {
  const w = px(2.6) + 40;
  if (!scene.textures.exists('train-bogie')) paintTexture(scene, 'train-bogie', w, 28, (ctx, ww, hh) => paintBogie(ctx, ww, hh), 'train-bogie');
  return 'train-bogie';
}
export function bayVistaTex(scene, o = {}) {
  const key = `hub-bay-vista-${o.empty ? 'empty' : o.lamps === false ? 'dark' : 'lit'}-${o.seed || 1}`;
  if (!scene.textures.exists(key)) paintTexture(scene, key, BAY.w, BAY.h, (ctx, w, h) => paintBayVista(ctx, w, h, o), key);
  return key;
}
export function bayTrainTex(scene, livery, o = {}) {
  const key = `hub-bay-train-${o.dead ? 'dark' : lv(livery)}`;
  if (!scene.textures.exists(key)) paintTexture(scene, key, BAY.w, BAY.h + TRAIN.pit, (ctx, w, h) => paintBayTrain(ctx, w, h - TRAIN.pit, livery, o), key);
  return key;
}
// station furniture, keyed by the names the lint measures (trainKit.js)
const FURNITURE = {
  'hub-platform-lamp': [STATION.lampPlatform, (ctx, w, h) => paintPlatformLamp(ctx, w, h, { on: true })],
  'hub-platform-lamp-off': [STATION.lampPlatform, (ctx, w, h) => paintPlatformLamp(ctx, w, h, { on: false })],
  'hub-buffer-stop': [STATION.bufferStop, (ctx, w, h) => paintBufferStop(ctx, w, h, { on: true })],
  'hub-platform-gate': [STATION.platformGate, paintGateFrame],
  'hub-ticket-booth': [STATION.ticketBooth, (ctx, w, h) => paintTicketBooth(ctx, w, h)],
  'hub-news-kiosk': [STATION.kiosk, paintKiosk],
  'hub-phone-box': [STATION.phoneBox, paintPhoneBox],
  'hub-revolving-door': [STATION.revolvingDoor, paintRevolvingDoor],
  'hub-double-door': [STATION.doubleDoor, paintDoubleDoor],
};
export function stationTex(scene, key, o = {}) {
  if (key === 'hub-platform-lamp' && o.num !== undefined) {
    const k = `hub-platform-lamp-${o.on === false ? 'off' : 'on'}-${o.num}`;
    if (!scene.textures.exists(k)) paintTexture(scene, k, px(STATION.lampPlatform.w), px(STATION.lampPlatform.m), (ctx, w, h) => paintPlatformLamp(ctx, w, h, o), k);
    return k;
  }
  const f = FURNITURE[key];
  if (!scene.textures.exists(key)) paintTexture(scene, key, px(f[0].w), px(f[0].m), f[1], key);
  return key;
}
export function gateLeafTex(scene) {
  if (!scene.textures.exists('hub-gate-leaf')) paintTexture(scene, 'hub-gate-leaf', px(0.72), px(0.95), (ctx, w, h) => paintGateLeaf(ctx, w, h), 'hub-gate-leaf');
  return 'hub-gate-leaf';
}
export function doorWingTex(scene) {
  if (!scene.textures.exists('hub-door-wing')) paintTexture(scene, 'hub-door-wing', px(0.9), px(2.15), (ctx, w, h) => paintDoorWings(ctx, w, h), 'hub-door-wing');
  return 'hub-door-wing';
}
// an open side door: the lit vestibule seen through it (50 × 88)
export function doorwayTex(scene) {
  if (scene.textures.exists('train-doorway')) return 'train-doorway';
  return paintTexture(
    scene,
    'train-doorway',
    TRAIN.doorW,
    TRAIN.doorH,
    (ctx, w, h) => {
      gradientV(ctx, 0, 0, w, h, [[0, 0xfff0c8], [0.45, 0xf2c078], [1, 0x8a6a40]]);
      // the vestibule: the far door's window, a grab pole, the floor
      fill(ctx, 0x6a4a30, 0.55);
      ctx.fillRect(10, 8, w - 20, h - 14);
      fill(ctx, 0xfff6dc, 0.7);
      ctx.fillRect(13, 12, w - 26, 26);
      cyl(ctx, w - 9, 4, 3, h - 6, BRASS);
      fill(ctx, 0x4a3422, 0.8);
      ctx.fillRect(0, h - 5, w, 5);
      fill(ctx, INK, 0.5);
      ctx.fillRect(0, 0, 2, h);
      ctx.fillRect(w - 2, 0, 2, h);
    },
    'train-doorway'
  );
}

export function pigeonTex(scene) {
  if (!scene.textures.exists('hub-pigeon-16')) paintTexture(scene, 'hub-pigeon-16', 16, 13, (ctx) => paintPigeon(ctx), 'hub-pigeon-16');
  return 'hub-pigeon-16';
}
