// The building kit (round 2 WP4): house fronts, shopfronts and rows of them,
// in metres, at any scroll factor.
//
// The owner: "buildings and background don't match the now-bigger character".
// Every facade here is measured in metres (src/data/scale.js facadeMetrics):
// a storey is 3 m, a shop's ground floor 4 m, a door 2.2 m, a window
// 1.0 × 1.5 m on a 0.9 m sill, a roof rising 2.4 m over the eaves. On the
// play plane (s = 1) a storey is 132 px; on a backdrop layer at scroll factor
// s it is 132·s px (the depth rule, critique §7.1.2). Detail scales with the
// px-per-metre: at s 1 a window has a frame, panes, a sill, a lintel and
// shutters with slats; at s 0.12 it is a lit or dark slot.
//
// drawBuilding / drawRow paint onto any canvas (the parallax and the Evening
// horizon bands); paintFrontTexture / paintDoorTexture make play-plane props.
// Rows log their measured storey into ROW_LOG, which the `backdrop-scale`
// scenario checks against BACKDROP_ROWS.
import { facadeMetrics, frontPx, PX_PER_M } from '../data/scale.js';
import { mix, shade, hex, rgba, stamp, dab, grain, paintTexture } from './paint.js';

export const ROW_LOG = {};
export function logRow(id, s, storey) {
  const r = (ROW_LOG[id] ||= { s, storeys: [] });
  r.s = s;
  if (r.storeys.length < 64) r.storeys.push(storey);
}

const R = Math.round;
// a rect that wraps across a tile of width W (W = 0: no wrap)
function box(ctx, x, y, w, h, col, W = 0) {
  ctx.fillStyle = typeof col === 'number' ? hex(col) : col;
  ctx.fillRect(R(x), R(y), Math.max(1, R(x + w) - R(x)), Math.max(1, R(y + h) - R(y)));
  if (W && x + w > W) ctx.fillRect(R(x - W), R(y), Math.max(1, R(x + w) - R(x)), Math.max(1, R(y + h) - R(y)));
  if (W && x < 0) ctx.fillRect(R(x + W), R(y), Math.max(1, R(x + w) - R(x)), Math.max(1, R(y + h) - R(y)));
}
function grad(ctx, x, y, w, h, stops, horizontal, W = 0) {
  for (const dx of W && x + w > W ? [0, -W] : [0]) {
    const g = horizontal ? ctx.createLinearGradient(x + dx, 0, x + dx + w, 0) : ctx.createLinearGradient(0, y, 0, y + h);
    for (const [t, c, a] of stops) g.addColorStop(t, a === undefined ? hex(c) : rgba(c, a));
    ctx.fillStyle = g;
    ctx.fillRect(R(x + dx), R(y), Math.max(1, R(w)), Math.max(1, R(h)));
  }
}

// ---- one window ------------------------------------------------------------------
function windowAt(ctx, x, y, f, o, rand, W) {
  const w = f.winW * (o.winScale || 1);
  const h = f.winH * (o.tall ? 1.35 : 1);
  const k = f.k;
  const glass = o.lit ? mix(0xf8c870, 0xfff0c0, rand.frac() * 0.3) : mix(o.glass || 0x3a3448, 0x6a7a90, rand.frac() * 0.25);
  if (k >= 8) {
    // the reveal: a dark recess, then the frame
    box(ctx, x - k * 0.06, y - k * 0.06, w + k * 0.12, h + k * 0.08, mix(o.wall, 0x2a2030, 0.45), W);
  }
  box(ctx, x, y, w, h, glass, W);
  if (k >= 14) {
    // glazing bars, a pane catching the sky, a curtain
    const bar = mix(o.frame || 0xf2ece0, o.wall, 0.15);
    box(ctx, x + w / 2 - k * 0.025, y, Math.max(1, k * 0.05), h, bar, W);
    box(ctx, x, y + h * 0.45, w, Math.max(1, k * 0.05), bar, W);
    box(ctx, x, y, w, Math.max(1, k * 0.05), bar, W);
    if (!o.lit) box(ctx, x + w * 0.08, y + h * 0.08, w * 0.3, h * 0.25, rgba(0xd8e4f0, 0.22), W);
    if (rand.frac() < 0.4) box(ctx, x + (rand.frac() < 0.5 ? 0 : w * 0.65), y + k * 0.05, w * 0.35, h * 0.9, rgba(o.lit ? 0xe89a50 : 0xd8c8b0, 0.35), W);
  } else if (k >= 6 && !o.lit) {
    box(ctx, x, y, w, Math.max(1, h * 0.2), rgba(0xd8e4f0, 0.18), W);
  }
  if (k >= 6) {
    // the sill, lit on top, and a lintel's shadow
    box(ctx, x - k * 0.08, y + h, w + k * 0.16, Math.max(1, k * 0.08), mix(o.wall, 0xfff4e0, 0.45), W);
    box(ctx, x - k * 0.04, y - Math.max(1, k * 0.1), w + k * 0.08, Math.max(1, k * 0.1), mix(o.wall, 0xfff4e0, 0.25), W);
  }
  // shutters, some open (folded back) and some half shut
  if (o.shutter && k >= 6 && rand.frac() < (o.shutterOdds ?? 0.7)) {
    const sw = w * 0.5;
    const sc = o.shutter;
    for (const sx of [x - sw - k * 0.04, x + w + k * 0.04]) {
      box(ctx, sx, y - k * 0.02, sw, h + k * 0.04, sc, W);
      if (k >= 14) for (let yy = y + k * 0.1; yy < y + h; yy += Math.max(2, k * 0.12)) box(ctx, sx + 1, yy, sw - 2, 1, shade(sc, 0.75), W);
      box(ctx, sx, y - k * 0.02, Math.max(1, k * 0.04), h + k * 0.04, shade(sc, 1.25), W);
    }
  }
  // a flower box
  if (o.flowers && k >= 6 && rand.frac() < 0.35) {
    box(ctx, x - k * 0.05, y + h - k * 0.12, w + k * 0.1, Math.max(1, k * 0.16), 0x6a4a32, W);
    for (let i = 0; i < Math.max(2, w / Math.max(2, k * 0.12)); i++) {
      const fx = x + (i + 0.5) * Math.max(2, k * 0.12);
      if (fx > x + w) break;
      box(ctx, fx, y + h - k * 0.22, Math.max(1, k * 0.08), Math.max(1, k * 0.1), [0xd84a4a, 0xe86a8a, 0xf2d060][i % 3], W);
    }
  }
  return { x, y, w, h };
}

// ---- one building ------------------------------------------------------------------
// x, gy: the left foot of the facade on its ground line. o:
//   s, w (px), storeys (above the ground floor), ground: 'house'|'shop'|'plain'
//   wall, roof: 'pitched'|'parapet'|'flat', roofCol, shutter, balconies,
//   awning (colour), sign (colour), lit (0..1 odds a window is lit), wrapW
export function drawBuilding(ctx, x, gy, o, rand) {
  const f = facadeMetrics(o.s);
  const W = o.wrapW || 0;
  const k = f.k;
  const w = o.w || f.bay * (o.bays || 3);
  const groundH = o.ground === 'shop' ? f.shop : f.storey;
  const bodyH = groundH + o.storeys * f.storey;
  const top = gy - bodyH;
  const wall = o.wall || 0xe8d0a8;
  const out = { x, w, top, gy, windows: [], balconies: [], chimneys: [] };
  // the wall, lit from the west, shaded east, warm bounce near the ground
  grad(ctx, x, top, w, bodyH, [[0, mix(wall, 0xfff0d0, 0.22)], [0.5, wall], [1, mix(wall, 0x5a4060, 0.22)]], true, W);
  if (k >= 4) {
    grad(ctx, x, top, w, bodyH, [[0, 0x3a2a40, 0.14], [0.1, 0x3a2a40, 0], [0.85, 0xf0c090, 0], [1, 0xf0c090, 0.16]], false, W);
    // the hand in the plaster: soft blotches, a crack, a stain under a sill
    for (let i = 0; i < Math.max(2, (w * bodyH) / Math.max(200, 900 / (k / 10))); i++) {
      const bx = x + rand.frac() * w;
      const by = top + rand.frac() * bodyH;
      for (const dx of W && bx > W ? [-W] : [0]) stamp(ctx, bx + dx, by, k * (0.4 + rand.frac() * 1.2), rand.frac() < 0.5 ? shade(wall, 1.12) : shade(wall, 0.9), 0.18, 0.9);
    }
    if (k >= 10 && rand.frac() < 0.5) box(ctx, x + w * (0.2 + rand.frac() * 0.6), top + bodyH * 0.3, 1, k * 0.5, rgba(0x5a3a3a, 0.3), W);
  }
  // quoins on the corners
  if (k >= 10 && o.quoins !== false) {
    for (let yy = top; yy < gy - k * 0.3; yy += k * 0.6) {
      const qw = (Math.round((yy - top) / (k * 0.6)) % 2 ? 0.5 : 0.8) * k;
      box(ctx, x, yy, qw, k * 0.55, mix(wall, 0xfff4e0, 0.18), W);
      box(ctx, x + w - qw, yy, qw, k * 0.55, mix(wall, 0x6a5060, 0.12), W);
    }
  }
  // the ground floor
  const bays = Math.max(1, Math.round(w / f.bay));
  const bayW = w / bays;
  const door = o.doorBay ?? Math.floor(rand.frac() * bays);
  if (o.ground === 'shop') {
    // fascia sign, shop window(s), the shop door, maybe an awning
    const fy = gy - f.shop + k * 0.3;
    box(ctx, x + k * 0.2, fy, w - k * 0.4, k * 0.6, o.sign || 0x2e3a52, W);
    if (k >= 8) box(ctx, x + k * 0.2, fy, w - k * 0.4, Math.max(1, k * 0.06), rgba(0xfff4e0, 0.45), W);
    if (k >= 12) box(ctx, x + w * 0.25, fy + k * 0.22, w * 0.5, Math.max(1, k * 0.14), rgba(0xf2e6cc, 0.85), W);
    const wy = gy - k * 2.7;
    for (let b = 0; b < bays; b++) {
      const bx = x + b * bayW;
      if (b === door) {
        box(ctx, bx + (bayW - f.doorW) / 2, gy - f.door, f.doorW, f.door, shade(o.doorCol || 0x4a3428, 0.9), W);
        if (k >= 8) box(ctx, bx + (bayW - f.doorW) / 2 + k * 0.12, gy - f.door + k * 0.12, f.doorW - k * 0.24, f.door * 0.55, o.lit ? 0xf8d080 : 0x4a5a6a, W);
      } else {
        box(ctx, bx + k * 0.2, wy, bayW - k * 0.4, k * 2.2, o.lit ? mix(0xf8c870, 0xfff0c0, 0.3) : 0x3a4250, W);
        if (k >= 8) {
          box(ctx, bx + k * 0.2, wy, bayW - k * 0.4, Math.max(1, k * 0.08), mix(o.sign || 0x2e3a52, 0xffffff, 0.2), W);
          box(ctx, bx + k * 0.25, wy + k * 0.15, (bayW - k * 0.5) * 0.4, k * 0.9, rgba(0xe8eef8, 0.18), W);
          // goods on the shelf behind the glass
          for (let i = 0; i < 4; i++) box(ctx, bx + k * 0.35 + i * (bayW - k * 0.7) / 4, wy + k * 1.6, (bayW - k * 0.7) / 5, k * 0.45, [0xc8904a, 0xe8c070, 0xb86a3a, 0xd8b080][i], W);
        }
        box(ctx, bx + k * 0.15, wy + k * 2.2, bayW - k * 0.3, Math.max(1, k * 0.35), mix(wall, 0x3a2a30, 0.35), W); // stall riser
      }
    }
    if (o.awning) {
      const ay = fy + k * 0.7;
      const stripe = Math.max(2, k * 0.35);
      for (let ax = 0; ax < w; ax += stripe) box(ctx, x + ax, ay, Math.min(stripe, w - ax), k * 0.7, (ax / stripe) % 2 < 1 ? o.awning : 0xf2e6cc, W);
      box(ctx, x, ay + k * 0.7, w, Math.max(1, k * 0.12), shade(o.awning, 0.7), W);
      grad(ctx, x, ay + k * 0.82, w, k * 0.6, [[0, 0x2a2030, 0.3], [1, 0x2a2030, 0]], false, W);
    }
  } else {
    for (let b = 0; b < bays; b++) {
      const bx = x + b * bayW;
      if (b === door && o.ground !== 'plain') {
        const dx = bx + (bayW - f.doorW) / 2;
        box(ctx, dx - k * 0.12, gy - f.door - k * 0.12, f.doorW + k * 0.24, f.door + k * 0.12, mix(wall, 0xfff4e0, 0.3), W);
        box(ctx, dx, gy - f.door, f.doorW, f.door, o.doorCol || 0x5a3a2a, W);
        if (k >= 10) {
          box(ctx, dx + k * 0.1, gy - f.door + k * 0.12, f.doorW / 2 - k * 0.15, f.door * 0.4, shade(o.doorCol || 0x5a3a2a, 1.15), W);
          box(ctx, dx + f.doorW / 2 + k * 0.05, gy - f.door + k * 0.12, f.doorW / 2 - k * 0.15, f.door * 0.4, shade(o.doorCol || 0x5a3a2a, 0.85), W);
          box(ctx, dx + f.doorW * 0.78, gy - f.door * 0.48, Math.max(1, k * 0.06), Math.max(1, k * 0.06), 0xd8a840, W);
          box(ctx, dx - k * 0.1, gy - k * 0.12, f.doorW + k * 0.2, k * 0.12, mix(wall, 0x8a7a6a, 0.4), W); // the step
        }
      } else {
        out.windows.push(windowAt(ctx, bx + (bayW - f.winW) / 2, gy - f.sill - f.winH, f, { ...o, wall, lit: rand.frac() < (o.lit || 0) }, rand, W));
      }
    }
  }
  // upper storeys: string course, a window per bay, balconies
  for (let st = 0; st < o.storeys; st++) {
    const floorY = gy - groundH - st * f.storey;
    if (k >= 5) box(ctx, x, floorY - Math.max(1, k * 0.1), w, Math.max(1, k * 0.12), mix(wall, 0xfff4e0, 0.3), W);
    for (let b = 0; b < bays; b++) {
      const bx = x + b * bayW;
      const balcony = o.balconies && st < o.storeys && rand.frac() < 0.3;
      const win = windowAt(ctx, bx + (bayW - f.winW) / 2, floorY - f.sill - f.winH - (balcony ? f.sill * 0.55 : 0), f, { ...o, wall, tall: balcony, lit: rand.frac() < (o.lit || 0) }, rand, W);
      out.windows.push(win);
      if (balcony && k >= 4) {
        const bw = f.winW * 1.7;
        const bx0 = bx + (bayW - bw) / 2;
        box(ctx, bx0, floorY - k * 0.12, bw, Math.max(1, k * 0.14), 0x3a3a44, W);
        const rh = k * 1.0;
        box(ctx, bx0, floorY - rh, bw, Math.max(1, k * 0.06), 0x3a3a44, W);
        for (let r = 0; r <= 5; r++) box(ctx, bx0 + (r / 5) * (bw - 1), floorY - rh, Math.max(1, k * 0.04), rh, 0x3a3a44, W);
        if (rand.frac() < 0.5) for (let p = 0; p < 3; p++) dab(ctx, bx0 + bw * (0.2 + p * 0.3), floorY - k * 0.3, k * 0.22, k * 0.18, 0, [0xd84a4a, 0x5a8a4a, 0xe86a8a][p], 0.95, 0.3);
        out.balconies.push({ x: bx0 + bw / 2, y: floorY - rh, washing: rand.frac() < 0.5 });
      }
      // pigeons on a ledge
      if (k >= 6 && rand.frac() < 0.06) box(ctx, win.x + win.w * 0.3, win.y - k * 0.2, k * 0.25, k * 0.15, 0x8a8a98, W);
    }
  }
  // the top: a cornice, then a pitched roof or a parapet
  box(ctx, x - k * 0.15, top - f.cornice, w + k * 0.3, f.cornice, mix(wall, 0xfff4e0, 0.45), W);
  box(ctx, x - k * 0.15, top, w + k * 0.3, Math.max(1, k * 0.12), rgba(0x2a2030, 0.3), W);
  let roofTop = top - f.cornice;
  if (o.roof === 'pitched') {
    const rc = o.roofCol || 0xb85a3a;
    const rise = f.roof;
    const over = k * 0.3;
    const n = Math.max(2, R(rise / Math.max(1.5, k * 0.28)));
    for (let r = 0; r < n; r++) {
      const t = r / n;
      const yy = top - f.cornice - (t + 1 / n) * rise;
      const inset = t * rise * 0.9;
      box(ctx, x - over + inset, yy, w + 2 * over - 2 * inset, rise / n + 0.5, mix(rc, r % 2 ? 0x3a1a10 : 0xffd0a0, r % 2 ? 0.12 : 0.14 + t * 0.1), W);
      if (k >= 12) for (let tx = x - over + inset + (r % 2) * k * 0.15; tx < x + w + over - inset; tx += k * 0.3) box(ctx, tx, yy, 1, rise / n, rgba(0x3a1a10, 0.25), W);
    }
    roofTop = top - f.cornice - rise;
    // chimneys and a skylight or two
    const nch = Math.max(1, R(w / (k * 6)));
    for (let c = 0; c < nch; c++) {
      if (rand.frac() < 0.35) continue;
      const cx = x + w * (0.2 + 0.6 * ((c + rand.frac() * 0.5) / nch));
      const cw = k * 0.6;
      const chH = k * 1.2;
      const cy = roofTop + rise * 0.25;
      box(ctx, cx, cy - chH, cw, chH + rise * 0.2, mix(wall, 0x8a5a4a, 0.35), W);
      box(ctx, cx - k * 0.08, cy - chH, cw + k * 0.16, Math.max(1, k * 0.15), shade(mix(wall, 0x8a5a4a, 0.35), 0.75), W);
      out.chimneys.push({ x: cx + cw / 2, y: cy - chH });
    }
    if (k >= 10 && rand.frac() < 0.6) {
      const sx = x + w * (0.3 + rand.frac() * 0.4);
      box(ctx, sx, top - f.cornice - rise * 0.62, k * 0.8, rise * 0.32, o.lit && rand.frac() < 0.5 ? 0xf8c870 : 0x4a5a70, W);
    }
  } else {
    // a parapet with a coping, and roofline furniture
    const ph = k * 0.9;
    box(ctx, x, top - f.cornice - ph, w, ph, shade(wall, 0.96), W);
    box(ctx, x - k * 0.1, top - f.cornice - ph, w + k * 0.2, Math.max(1, k * 0.12), mix(wall, 0xfff4e0, 0.5), W);
    roofTop = top - f.cornice - ph;
    if (rand.frac() < 0.45) {
      const tx = x + w * (0.2 + rand.frac() * 0.5);
      box(ctx, tx, roofTop - k * 1.2, k * 1.2, k * 1.2, 0x6a6e7a, W); // a water tank
      box(ctx, tx + k * 0.1, roofTop - k * 1.2, k * 1.0, Math.max(1, k * 0.1), 0x8a8e9a, W);
    }
    if (rand.frac() < 0.4) {
      const cx = x + w * (0.6 + rand.frac() * 0.3);
      box(ctx, cx, roofTop - k * 1.2, k * 0.5, k * 1.2, mix(wall, 0x8a5a4a, 0.3), W);
      out.chimneys.push({ x: cx + k * 0.25, y: roofTop - k * 1.2 });
    }
  }
  out.roofTop = roofTop;
  if (o.logId) logRow(o.logId, o.s, f.storey);
  return out;
}

// The ground line in front of a row: a pavement with its kerb and a strip of
// road, so the row stands back from the plane Jo walks on instead of right
// behind him (the critique's "dollhouse" fix). `lift` px of it.
export function drawGroundLine(ctx, x0, x1, gy, lift, s, o = {}) {
  const k = PX_PER_M * s;
  const pave = o.pave || 0xb8a888;
  const road = o.road || 0x7a7068;
  // the pavement at the foot of the facades (furthest), then the kerb, then
  // the road nearer the viewer, darkening toward Jo's street
  grad(ctx, x0, gy, x1 - x0, lift, [[0, mix(pave, 0xfff4e0, 0.15)], [0.35, pave], [0.4, shade(pave, 0.7)], [0.45, road], [1, shade(road, 0.82)]], false);
  ctx.fillStyle = rgba(0x2a2030, 0.35);
  ctx.fillRect(R(x0), R(gy), R(x1 - x0), Math.max(1, R(k * 0.12))); // the shadow at the foot of the walls
  ctx.fillStyle = rgba(0xfff4e0, 0.35);
  ctx.fillRect(R(x0), R(gy + lift * 0.36), R(x1 - x0), 1); // the kerb's lit edge
  // flagstones on the pavement
  if (k >= 6) {
    ctx.fillStyle = rgba(0x2a2030, 0.18);
    for (let x = x0; x < x1; x += k * 1.2) ctx.fillRect(R(x), R(gy + 1), 1, Math.max(1, R(lift * 0.34)));
  }
  return gy + lift;
}

// a little person on the far pavement (a scale cue: 1.7 m at s)
export function drawFigure(ctx, x, gy, s, col, rand) {
  const k = PX_PER_M * s;
  const h = k * (1.55 + rand.frac() * 0.3);
  const w = Math.max(1, k * 0.42);
  ctx.fillStyle = hex(shade(col, 0.6));
  ctx.fillRect(R(x - w / 2), R(gy - h * 0.48), Math.max(1, R(w * 0.45)), R(h * 0.48)); // legs
  ctx.fillRect(R(x + w * 0.05), R(gy - h * 0.48), Math.max(1, R(w * 0.45)), R(h * 0.48));
  ctx.fillStyle = hex(col);
  ctx.fillRect(R(x - w / 2), R(gy - h * 0.86), Math.max(1, R(w)), R(h * 0.42)); // coat
  ctx.fillStyle = hex(0x6a4a3a);
  ctx.fillRect(R(x - w * 0.3), R(gy - h), Math.max(1, R(w * 0.6)), Math.max(1, R(h * 0.15))); // head
}

// a row of buildings from x0 to x1 standing on gy (in a tile of width wrapW)
export function drawRow(ctx, x0, x1, gy, s, rand, o = {}) {
  const f = facadeMetrics(s);
  const walls = o.walls || [0xe8d0a8, 0xd8b890, 0xe0c0a0, 0xf0d8b0];
  const out = [];
  let x = x0;
  while (x < x1 - f.bay * 0.8) {
    const bays = o.bays ? o.bays[0] + Math.floor(rand.frac() * (o.bays[1] - o.bays[0] + 1)) : 2 + Math.floor(rand.frac() * 3);
    let w = bays * f.bay + f.k * 0.6;
    if (o.close && x1 - (x + w) < f.bay * 2) w = x1 - x; // close the row exactly
    const storeys = o.storeys ? o.storeys[0] + Math.floor(rand.frac() * (o.storeys[1] - o.storeys[0] + 1)) : 2 + Math.floor(rand.frac() * 3);
    const b = drawBuilding(ctx, x, gy, {
      ...o,
      s,
      w,
      storeys,
      ground: o.ground ? o.ground(rand) : rand.frac() < 0.3 ? 'shop' : 'house',
      wall: walls[Math.floor(rand.frac() * walls.length)],
      roof: o.roof ? o.roof(rand) : rand.frac() < 0.55 ? 'pitched' : 'parapet',
      roofCol: o.roofCols ? o.roofCols[Math.floor(rand.frac() * o.roofCols.length)] : undefined,
      awning: o.awnings && rand.frac() < 0.5 ? o.awnings[Math.floor(rand.frac() * o.awnings.length)] : null,
      sign: o.signs ? o.signs[Math.floor(rand.frac() * o.signs.length)] : undefined,
    }, rand);
    out.push(b);
    x += w + (o.gap === undefined ? Math.max(0, f.k * 0.2) : o.gap);
  }
  return out;
}

// ---- play-plane fronts ---------------------------------------------------------------
// spec: FRONT_TABLE entry ({storeys, ground, bays, roof}); o: wall, roofCol,
// shutter, sign, awning, signText (painted letters are left to the scene).
export function paintFrontTexture(scene, key, spec, o = {}) {
  const f = facadeMetrics(1);
  const w = Math.round(spec.bays * f.bay + f.k * 0.8);
  const h = frontPx(spec, 1) + Math.round(f.k * 1.6); // + chimneys over the roof
  return paintTexture(scene, key, w + Math.round(f.k * 0.8), h, (ctx, W, H, rand) => {
    const b = drawBuilding(ctx, f.k * 0.4, H, {
      s: 1,
      w,
      bays: spec.bays,
      storeys: spec.storeys,
      ground: spec.ground,
      roof: spec.roof === false ? 'parapet' : 'pitched',
      quoins: true,
      balconies: false,
      flowers: true,
      shutterOdds: 1,
      doorBay: o.doorBay,
      ...o,
    }, rand);
    grain(ctx, 0, 0, W, H, 0.05, 41);
    void b;
  }, key);
}

// a front door at real size (1.0 × 2.2 m leaf) in a stone surround, for the
// doors the Evening's townsfolk go in and out of
export function paintDoorTexture(scene, key, o = {}) {
  const f = facadeMetrics(1);
  const k = f.k;
  const w = Math.round(f.doorW + k * 0.4);
  const h = Math.round(f.door + k * 0.25);
  return paintTexture(scene, key, w, h, (ctx, W, H, rand) => {
    const stone = o.stone || 0xd8c8a8;
    const leaf = o.leaf || 0x5a3a2a;
    grad(ctx, 0, 0, W, H, [[0, mix(stone, 0xfff4e0, 0.25)], [1, mix(stone, 0x6a5060, 0.2)]], true);
    // the leaf, two panels over two, a fanlight
    const lx = k * 0.2;
    const ly = k * 0.22;
    const lw = W - k * 0.4;
    const lh = H - ly;
    box(ctx, lx - 1, ly - 1, lw + 2, lh + 1, shade(leaf, 0.6));
    grad(ctx, lx, ly, lw, lh, [[0, shade(leaf, 1.2)], [1, shade(leaf, 0.85)]], true);
    box(ctx, lx + k * 0.06, ly + k * 0.06, lw - k * 0.12, k * 0.32, o.lit ? 0xf8d080 : 0x4a5a6a);
    for (const [px, py, pw, ph] of [[0.1, 0.2, 0.36, 0.33], [0.54, 0.2, 0.36, 0.33], [0.1, 0.6, 0.36, 0.33], [0.54, 0.6, 0.36, 0.33]]) {
      box(ctx, lx + lw * px, ly + lh * py, lw * pw, lh * ph, shade(leaf, 0.82));
      box(ctx, lx + lw * px, ly + lh * py, lw * pw, 1, shade(leaf, 1.3));
    }
    stamp(ctx, lx + lw * 0.86, ly + lh * 0.55, Math.max(1.5, k * 0.05), 0xd8a840, 1, 0.3);
    box(ctx, 0, H - Math.max(2, k * 0.08), W, Math.max(2, k * 0.08), shade(stone, 0.7));
    grain(ctx, 0, 0, W, H, 0.06, 19);
    void rand;
  }, key);
}
