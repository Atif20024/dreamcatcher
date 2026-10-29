// The works Jo paints in THE MASTER'S LADDER, drawn at k steps done so the
// craft presenter can build them up stroke by stroke (src/play/craftPresenter
// def.work) and the room props can show them finished. Invented subjects in
// the manner of the age; no famous composition is copied.
//   paintAltarpiece   the master's altarpiece: a standing saint in a blue
//                     mantle on a gold ground (the drapery job: 5 steps)
//   paintPanel        Jo's test piece for the guild: a head and a hand in
//                     tempera on a small gessoed panel (6 steps)
//   paintVault        the chapel bay: a night sky of ultramarine sown with
//                     gilded stars round a figure in a blue mantle (8 steps)
import { mix, rgba, hex, stamp, dab, gradientV, grain } from '../../art/paint.js';

const LAPIS = 0x22408a;
const LAPIS_LT = 0x4a6ac8;
const GOLD = 0xd8a840;
const GOLD_LT = 0xf2d580;
const GESSO = 0xf0e8d6;
const SINOPIA = 0x9a3a2a;
const FLESH = 0xe0b898;
const VERMILION = 0xc8402a;

// a gabled panel outline (x, y, w, h)
function gable(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + w * 0.35);
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x + w, y + w * 0.35);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

// a standing figure in a mantle: head at (cx, top), feet at bottom
function figure(ctx, cx, top, fh, k, { mantle = LAPIS, gown = VERMILION, steps = [3, 4, 5], draw = SINOPIA }) {
  const head = fh * 0.1;
  const shoulders = top + head * 2.1;
  const hem = top + fh;
  const mw = fh * 0.34;
  const [sMantle, sFold, sLight] = steps;
  // the underdrawing: always under everything (it shows through the gesso)
  ctx.strokeStyle = rgba(draw, k >= sMantle ? 0.25 : 0.75);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(cx, top + head, head * 0.75, head, 0, 0, Math.PI * 2);
  ctx.moveTo(cx - mw * 0.35, shoulders);
  ctx.quadraticCurveTo(cx - mw * 0.7, top + fh * 0.6, cx - mw / 2, hem);
  ctx.lineTo(cx + mw / 2, hem);
  ctx.quadraticCurveTo(cx + mw * 0.7, top + fh * 0.6, cx + mw * 0.35, shoulders);
  ctx.moveTo(cx - mw * 0.1, shoulders + 6);
  ctx.quadraticCurveTo(cx + mw * 0.05, top + fh * 0.6, cx - mw * 0.05, hem - 2);
  ctx.stroke();
  if (k < sMantle) return;
  // the gown at the opening, then the mantle over it (ultramarine)
  ctx.fillStyle = hex(gown);
  ctx.fillRect(cx - mw * 0.08, shoulders + 4, mw * 0.16, fh * 0.75);
  ctx.fillStyle = hex(mantle);
  ctx.beginPath();
  ctx.moveTo(cx - head * 0.9, top + head * 0.4);
  ctx.quadraticCurveTo(cx - mw * 0.6, shoulders, cx - mw * 0.66, top + fh * 0.6);
  ctx.lineTo(cx - mw / 2, hem);
  ctx.lineTo(cx - mw * 0.06, hem);
  ctx.lineTo(cx - mw * 0.06, shoulders + 8);
  ctx.lineTo(cx + mw * 0.06, shoulders + 8);
  ctx.lineTo(cx + mw * 0.06, hem);
  ctx.lineTo(cx + mw / 2, hem);
  ctx.lineTo(cx + mw * 0.66, top + fh * 0.6);
  ctx.quadraticCurveTo(cx + mw * 0.6, shoulders, cx + head * 0.9, top + head * 0.4);
  ctx.closePath();
  ctx.fill();
  // the face and hands (flesh over green earth): drawn with the mantle
  stamp(ctx, cx, top + head * 1.05, head * 0.72, FLESH, 1, 0.15);
  stamp(ctx, cx - mw * 0.12, top + fh * 0.45, head * 0.3, FLESH, 1, 0.2);
  stamp(ctx, cx + mw * 0.1, top + fh * 0.47, head * 0.3, FLESH, 1, 0.2);
  if (k >= sFold) {
    // the folds: deep ultramarine valleys falling from the knee
    ctx.strokeStyle = hex(mix(mantle, 0x0a0a20, 0.45));
    ctx.lineWidth = Math.max(1.5, fh * 0.02);
    for (const f of [-0.42, -0.26, 0.26, 0.42]) {
      ctx.beginPath();
      ctx.moveTo(cx + f * mw * 0.8, top + fh * 0.42);
      ctx.quadraticCurveTo(cx + f * mw * 1.05, top + fh * 0.75, cx + f * mw * 0.95, hem - 1);
      ctx.stroke();
    }
    ctx.fillStyle = rgba(0x0a0a20, 0.25);
    ctx.fillRect(cx + mw * 0.1, shoulders + 6, mw * 0.3, fh * 0.7);
  }
  if (k >= sLight) {
    // the light: lead white worked into the blue along the ridges
    ctx.strokeStyle = hex(mix(mantle, 0xf0f0ff, 0.45));
    ctx.lineWidth = Math.max(1, fh * 0.012);
    for (const f of [-0.5, -0.34, 0.18, 0.34]) {
      ctx.beginPath();
      ctx.moveTo(cx + f * mw * 0.8, top + fh * 0.45);
      ctx.quadraticCurveTo(cx + f * mw * 1.0, top + fh * 0.72, cx + f * mw * 0.9, hem - 2);
      ctx.stroke();
    }
    // eyes and brow, a touch of vermilion on the lips
    ctx.fillStyle = hex(0x3a2a22);
    ctx.fillRect(cx - head * 0.35, top + head * 0.95, head * 0.22, 1.5);
    ctx.fillRect(cx + head * 0.12, top + head * 0.95, head * 0.22, 1.5);
    ctx.fillStyle = hex(VERMILION);
    ctx.fillRect(cx - head * 0.12, top + head * 1.45, head * 0.24, 1.2);
  }
}

// the master's altarpiece. Steps: 1 gesso, 2 gold ground, 3 the ultramarine
// mantle, 4 the fold, 5 the light (k = 0: the drawn-up panel)
export function paintAltarpiece(ctx, x, y, w, h, k) {
  ctx.save();
  gable(ctx, x, y, w, h);
  ctx.clip();
  // the bare poplar, then gesso
  ctx.fillStyle = hex(k >= 1 ? GESSO : 0xd8c4a0);
  ctx.fillRect(x, y, w, h);
  if (k < 1) for (let i = 0; i < 10; i++) ctx.fillRect(x, y + (i * h) / 10, w, 1);
  if (k >= 2) {
    // red bole under burnished gold, a tooled halo
    gradientV(ctx, x, y, w, h, [[0, GOLD_LT, 1], [0.5, GOLD, 1], [1, mix(GOLD, 0x8a5a2a, 0.3), 1]]);
    ctx.strokeStyle = rgba(0x8a5a2a, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.17, w * 0.15, 0, Math.PI * 2);
    ctx.stroke();
    for (let a = 0; a < 16; a++) stamp(ctx, x + w / 2 + Math.cos((a * Math.PI) / 8) * w * 0.13, y + h * 0.17 + Math.sin((a * Math.PI) / 8) * w * 0.13, 1, 0x8a5a2a, 0.6, 0.2);
  }
  // the floor (a green earth ground line)
  if (k >= 2) {
    ctx.fillStyle = hex(0x5a6a3a);
    ctx.fillRect(x, y + h * 0.9, w, h * 0.1);
  }
  figure(ctx, x + w / 2, y + h * 0.1, h * 0.8, k, { steps: [3, 4, 5] });
  ctx.restore();
  // the frame: gilded mouldings
  ctx.strokeStyle = hex(k >= 2 ? GOLD : 0xa08a68);
  ctx.lineWidth = 3;
  gable(ctx, x, y, w, h);
  ctx.stroke();
}

// Jo's test piece for the consuls: a head in three-quarter and a hand, the
// whole ladder of the craft on one small panel. Steps: 1 gesso, 2 the
// drawing, 3 green earth under the flesh, 4 the flesh, 5 the mantle in
// ultramarine, 6 the gold of the halo
export function paintPanel(ctx, w, h, k) {
  ctx.fillStyle = hex(0x6a4a2e);
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = hex(k >= 1 ? GESSO : 0xd8c4a0);
  ctx.fillRect(6, 6, w - 12, h - 12);
  const cx = w / 2;
  const cy = h * 0.4;
  const r = w * 0.18;
  if (k >= 6) {
    ctx.fillStyle = hex(GOLD);
    ctx.beginPath();
    ctx.arc(cx, cy - 2, r * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (k >= 5) {
    ctx.fillStyle = hex(LAPIS);
    ctx.beginPath();
    ctx.moveTo(cx - r * 1.4, h - 8);
    ctx.quadraticCurveTo(cx - r * 1.6, cy + r, cx - r * 0.9, cy - r * 0.6);
    ctx.quadraticCurveTo(cx, cy - r * 1.6, cx + r * 0.9, cy - r * 0.6);
    ctx.quadraticCurveTo(cx + r * 1.6, cy + r, cx + r * 1.4, h - 8);
    ctx.fill();
  }
  if (k >= 3) stamp(ctx, cx, cy, r, 0x7a8a5a, 1, 0.1);
  if (k >= 4) {
    stamp(ctx, cx + 1, cy, r * 0.95, FLESH, 1, 0.15);
    stamp(ctx, cx + r * 0.3, cy + r * 1.8, r * 0.4, FLESH, 1, 0.2);
  }
  if (k >= 2) {
    ctx.strokeStyle = rgba(SINOPIA, k >= 4 ? 0.5 : 0.9);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.8, r, 0, 0, Math.PI * 2);
    ctx.moveTo(cx - r * 0.35, cy - r * 0.1);
    ctx.lineTo(cx - r * 0.1, cy - r * 0.1);
    ctx.moveTo(cx + r * 0.15, cy - r * 0.1);
    ctx.lineTo(cx + r * 0.4, cy - r * 0.1);
    ctx.moveTo(cx + 2, cy);
    ctx.lineTo(cx + 5, cy + r * 0.35);
    ctx.moveTo(cx - r * 0.2, cy + r * 0.55);
    ctx.lineTo(cx + r * 0.2, cy + r * 0.55);
    ctx.stroke();
  }
  if (k < 1) for (let i = 0; i < 8; i++) {
    ctx.fillStyle = rgba(0x8a6a4a, 0.4);
    ctx.fillRect(6, 6 + (i * (h - 12)) / 8, w - 12, 1);
  }
}

// the chapel bay. k steps of n (8): 1 pounce the cartoon, 2 the wet plaster
// (intonaco), 3–4 the sky in ultramarine, 5 the gold stars, 6 the mantle,
// 7 the fold, 8 the face. opts.rival paints Dori's bay instead (his finished
// figures in rose and green under a red-bordered sky).
export function paintVault(ctx, w, h, k, n = 8, opts = {}) {
  const t = n ? k / n : 1;
  // the vault's curve: the bay is a lunette between two ribs
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h * 0.45);
  ctx.quadraticCurveTo(w / 2, -h * 0.35, w, h * 0.45);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.clip();
  // the rough arriccio with the red sinopia drawn on it
  ctx.fillStyle = hex(0xc8b89a);
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) stamp(ctx, (i * 97) % w, (i * 53) % h, 6, 0xb0a084, 0.25, 0.8);
  if (opts.rival) {
    gradientV(ctx, 0, 0, w, h, [[0, 0x2a3a7a, 1], [1, 0x4a5a9a, 1]]);
    for (let i = 0; i < 26; i++) stamp(ctx, (i * 131) % w, ((i * 71) % (h * 0.7)) + 6, 2, 0xe8e8f0, 0.9, 0.2);
    for (const fx of [0.3, 0.5, 0.7]) figure(ctx, w * fx, h * 0.2, h * 0.75, 9, { mantle: fx === 0.5 ? 0x8a3a5a : 0x3a6a4a, gown: 0xe8c8a0, steps: [1, 2, 3] });
    ctx.restore();
    border(ctx, w, h, 0x8a2a2a);
    return;
  }
  ctx.strokeStyle = rgba(SINOPIA, 0.8);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.32, 10, 13, 0, 0, Math.PI * 2);
  ctx.moveTo(w / 2 - 30, h * 0.45);
  ctx.lineTo(w / 2 - 44, h * 0.98);
  ctx.moveTo(w / 2 + 30, h * 0.45);
  ctx.lineTo(w / 2 + 44, h * 0.98);
  ctx.stroke();
  if (k >= 1) {
    // the cartoon pounced: charcoal dots through the pricked holes
    ctx.fillStyle = rgba(0x1a1418, 0.7);
    for (let a = 0; a < 40; a++) ctx.fillRect(w / 2 + Math.cos(a / 6.4) * 14, h * 0.32 + Math.sin(a / 6.4) * 16, 1.5, 1.5);
    for (let y = h * 0.45; y < h; y += 5) {
      ctx.fillRect(w / 2 - 30 - (y - h * 0.45) * 0.26, y, 1.5, 1.5);
      ctx.fillRect(w / 2 + 30 + (y - h * 0.45) * 0.26, y, 1.5, 1.5);
    }
  }
  if (k >= 2) {
    // the day's patch of fresh plaster, laid wet: smooth and dark with water
    ctx.fillStyle = rgba(0xe8e0d0, 0.85);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = rgba(0x8a8070, 0.15);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = rgba(0x1a1418, 0.5);
    for (let a = 0; a < 40; a++) ctx.fillRect(w / 2 + Math.cos(a / 6.4) * 14, h * 0.32 + Math.sin(a / 6.4) * 16, 1.5, 1.5);
  }
  if (k >= 3) {
    // the sky: ultramarine, laid half then whole (the precious blue)
    const reach = k >= 4 ? w : w * 0.5;
    gradientV(ctx, 0, 0, reach, h, [[0, LAPIS, 1], [1, mix(LAPIS, LAPIS_LT, 0.4), 1]]);
  }
  if (k >= 5) {
    // the stars: gold leaf, eight-pointed, laid on the blue
    for (let i = 0; i < 34; i++) {
      const sx = (i * 131 + 17) % w;
      const sy = ((i * 71) % (h * 0.8)) + 4;
      if (Math.abs(sx - w / 2) < 52 && sy > h * 0.2) continue;
      ctx.fillStyle = hex(GOLD_LT);
      ctx.beginPath();
      for (let p = 0; p < 16; p++) {
        const a = (p * Math.PI) / 8;
        const rr = p % 2 ? 1.6 : 4.2;
        ctx.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr);
      }
      ctx.fill();
    }
  }
  if (k >= 6) {
    // the figure in the blue mantle at the centre, a halo of gold
    ctx.fillStyle = hex(GOLD);
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.32, 18, 0, Math.PI * 2);
    ctx.fill();
    figure(ctx, w / 2, h * 0.22, h * 0.78, k >= 8 ? 9 : k >= 7 ? 4 : 3, { mantle: mix(LAPIS, LAPIS_LT, 0.35), steps: [3, 4, 9] });
    if (k < 8) {
      // the face waits: plaster there, for the master's own hand (Bice's)
      stamp(ctx, w / 2, h * 0.22 + h * 0.078 * 1.05, 9, 0xe8e0d0, 1, 0.1);
    }
  }
  ctx.restore();
  border(ctx, w, h, k >= 2 ? 0x8a6a3a : 0x9a8a70);
  void t;
  grain(ctx, 0, 0, w, h, 0.03, 11);
}

function border(ctx, w, h, col) {
  ctx.strokeStyle = hex(col);
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(3, h);
  ctx.lineTo(3, h * 0.45);
  ctx.quadraticCurveTo(w / 2, -h * 0.35, w - 3, h * 0.45);
  ctx.lineTo(w - 3, h);
  ctx.stroke();
  dab(ctx, w / 2, 4, 6, 4, 0, col, 1, 0.3);
}
