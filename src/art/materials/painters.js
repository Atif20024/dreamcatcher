// Terrain material painters (plan 2.3, critique F5.1): every material is
// painted, not tinted. A material sheet holds the pieces the StaticBaker
// composites per tile:
//   lip[v]     a top-exposed tile (the lit surface + what lies under it)
//   body[v]    a buried tile
//   under[v]   overlay for an exposed underside (overhang shadow, roots, drips)
//   edgeL/edgeR overlays for exposed sides (lit left face, shaded right face)
//   capL/capR  masks that round a lip where it ends at a drop
//   innerTL/innerTR  shadow where a lip tucks under a higher block
//   step       a contact shadow where a lip meets a higher wall (L, mirrored for R)
//   oneway[v]  a thin ledge/plank; slopes per legend role
// Light comes from the top-left. Noise is periodic in 32 px so tiles of the
// same material join without seams; variants differ by features (stones,
// pebbles, knots), not by their ground tone. Canvas only (browser).
import { mix, shade, rgba, hex, stamp, dab, gradientV } from '../paint.js';

export const T = 32;

export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// ---- periodic value noise -----------------------------------------------------------
function h2(x, y, s) {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263 + (s | 0) * 1274126177;
  h = (h ^ (h >>> 13)) * 1274126177;
  h ^= h >>> 16;
  return ((h >>> 0) % 100000) / 100000;
}
const sm = (t) => t * t * (3 - 2 * t);
export function pnoise(x, y, P, s = 0) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = sm(x - xi);
  const yf = sm(y - yi);
  const w = (v) => ((v % P) + P) % P;
  const a = h2(w(xi), w(yi), s);
  const b = h2(w(xi + 1), w(yi), s);
  const c = h2(w(xi), w(yi + 1), s);
  const d = h2(w(xi + 1), w(yi + 1), s);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}
// fbm periodic over `period` px
export function pfbm(x, y, period, s = 0, oct = 3, base = 8) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  for (let i = 0; i < oct; i++) {
    const cells = Math.max(1, Math.round((period / base) * 2 ** i));
    sum += amp * pnoise((x / period) * cells, (y / period) * cells, cells, s + i * 17);
    norm += amp;
    amp *= 0.5;
  }
  return sum / norm;
}

// per-pixel tone: base colour × (1 + (n - .5) * amount), periodic
function toneFill(ctx, w, h, base, { amount = 0.22, seed = 1, scale = 8, warm = 0, oy = 0 } = {}) {
  const img = ctx.createImageData(w, h);
  const d = img.data;
  const r0 = (base >> 16) & 255, g0 = (base >> 8) & 255, b0 = base & 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = pfbm(x, y + oy, T, seed, 3, scale) - 0.5;
      const m = 1 + n * amount * 2;
      const k = (y * w + x) * 4;
      d[k] = Math.max(0, Math.min(255, r0 * m + warm * n * 20));
      d[k + 1] = Math.max(0, Math.min(255, g0 * m));
      d[k + 2] = Math.max(0, Math.min(255, b0 * (m - 0.02) - warm * n * 10));
      d[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

// a seeded rand per (variant, kind)
function rng(seed) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// a rounded stone: lit top-left, shade bottom-right, a dark seat under it
function stone(ctx, x, y, rx, ry, col, P, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = rgba(P.deep, 0.55);
  ctx.beginPath();
  ctx.ellipse(x + 0.8, y + 1.2, rx + 0.8, ry + 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(x - rx * 0.4, y - ry * 0.5, 0.5, x, y, Math.max(rx, ry) * 1.2);
  g.addColorStop(0, hex(mix(col, P.lit, 0.55)));
  g.addColorStop(0.55, hex(col));
  g.addColorStop(1, hex(mix(col, P.deep, 0.45)));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba(mix(P.lit, 0xffffff, 0.3), 0.5);
  ctx.fillRect(Math.round(x - rx * 0.5), Math.round(y - ry * 0.7), Math.max(1, Math.round(rx * 0.6)), 1);
  ctx.restore();
}

// ---- material kinds ---------------------------------------------------------------
// Each kind paints body(ctx, v) and lip(ctx, v) on a 32×32 canvas; under()
// and the edges are generic and take the palette.
const KINDS = {
  // a town lane: cobbles on top, rubble and packed earth below
  cobble: {
    body(ctx, v, P) {
      toneFill(ctx, T, T, P.body, { amount: 0.16, seed: 3, scale: 6, warm: 0.6 });
      const r = rng(11 + v * 7);
      for (let i = 0; i < 3 + v; i++) stone(ctx, 4 + r() * 24, 5 + r() * 22, 1.5 + r() * 2.2, 1.2 + r() * 1.6, mix(P.body, P.stone, 0.6), P, 0.65);
      for (let i = 0; i < 6; i++) stamp(ctx, r() * 32, r() * 32, 1.2, P.deep, 0.35, 0.6);
    },
    lip(ctx, v, P) {
      KINDS.cobble.body(ctx, v, P);
      // the cobble course: a band of rounded setts, the lit surface of the lane
      gradientV(ctx, 0, 0, T, 14, [[0, P.mortar, 1], [1, P.mortar, 0.9]]);
      const r = rng(5 + v * 13);
      const off = (v * 7) % 10;
      for (let x = -off; x < T + 10; x += 10 + Math.round(r() * 2)) {
        const c = mix(P.stone, r() < 0.5 ? P.lit : P.deep, r() * 0.25);
        stone(ctx, x + 5, 5.5, 4.6, 3.6, c, P);
        stone(ctx, x + 10 - (v % 2) * 3, 11.5, 4, 2.6, mix(c, P.deep, 0.15), P, 0.92);
      }
      // a moss thread in the joints on some variants
      if (v % 2) for (let i = 0; i < 4; i++) stamp(ctx, 3 + r() * 26, 9 + r() * 3, 1.3, P.moss, 0.55, 0.5);
      // the top edge catches the lamp light
      ctx.fillStyle = rgba(P.lit, 0.35);
      ctx.fillRect(0, 0, T, 1);
    },
  },
  // a meadow: a living grass band over dark loam with pebbles and roots
  meadow: {
    body(ctx, v, P) {
      toneFill(ctx, T, T, P.body, { amount: 0.2, seed: 7, scale: 5, warm: 1 });
      const r = rng(17 + v * 5);
      // strata: faint lighter bands
      ctx.fillStyle = rgba(P.lit, 0.05);
      ctx.fillRect(0, 9 + v * 3, T, 3);
      for (let i = 0; i < 2 + (v % 3); i++) stone(ctx, 3 + r() * 26, 4 + r() * 24, 1.4 + r() * 1.8, 1 + r() * 1.3, P.stone, P, 0.8);
      if (v === 2) {
        // a root thread
        ctx.strokeStyle = rgba(P.root, 0.55);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(r() * 10, 0);
        ctx.bezierCurveTo(10, 10, 20, 8, 22 + r() * 8, 22);
        ctx.stroke();
      }
      for (let i = 0; i < 10; i++) stamp(ctx, r() * 32, r() * 32, 0.9, i % 2 ? P.deep : P.lit, 0.25, 0.6);
    },
    lip(ctx, v, P) {
      KINDS.meadow.body(ctx, v, P);
      const r = rng(3 + v * 19);
      // the turf: a soft band whose lower edge is ragged (roots of the grass)
      const edge = [];
      for (let x = 0; x <= T; x++) edge.push(8 + Math.sin((x + v * 9) * 0.55) * 1.5 + pnoise(x / 4, v, 8, 9) * 3);
      ctx.fillStyle = hex(P.grassDeep);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      edge.forEach((e, x) => ctx.lineTo(x, e + 1.5));
      ctx.lineTo(T, 0);
      ctx.fill();
      const g = ctx.createLinearGradient(0, 0, 0, 10);
      g.addColorStop(0, hex(P.grassLit));
      g.addColorStop(0.45, hex(P.grass));
      g.addColorStop(1, hex(P.grassDeep));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      edge.forEach((e, x) => ctx.lineTo(x, e));
      ctx.lineTo(T, 0);
      ctx.fill();
      // blade strokes inside the band
      for (let i = 0; i < 26; i++) {
        const x = r() * T;
        const len = 2 + r() * 4;
        ctx.strokeStyle = rgba(r() < 0.6 ? P.grassLit : P.grassDeep, 0.7);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 2 + r() * 5);
        ctx.lineTo(x + (r() - 0.6) * 2, 2 + r() * 5 - len);
        ctx.stroke();
      }
      ctx.fillStyle = rgba(mix(P.grassLit, 0xfff0b0, 0.4), 0.55);
      ctx.fillRect(0, 0, T, 1);
    },
  },
  // dressed stone blocks (walls, ledges, the green's retaining wall), moss on top
  stone: {
    body(ctx, v, P) {
      toneFill(ctx, T, T, P.body, { amount: 0.14, seed: 21, scale: 6, warm: 0.4 });
      // two courses, staggered joints; each block lit top-left
      const r = rng(31 + v * 3);
      const courses = [[0, 15], [16, 31]];
      courses.forEach(([y0, y1], ci) => {
        const j = ((v * 11 + ci * 16) % 24) + 4;
        const blocks = [[-T + j, j], [j + 1, T + j]];
        for (const [x0, x1] of blocks) {
          const tone = r() < 0.5 ? 0.05 : -0.04;
          ctx.fillStyle = rgba(tone > 0 ? P.lit : P.deep, Math.abs(tone) * 2);
          ctx.fillRect(x0 + 1, y0 + 1, x1 - x0 - 1, y1 - y0 - 1);
          ctx.fillStyle = rgba(P.lit, 0.28);
          ctx.fillRect(x0 + 1, y0 + 1, x1 - x0 - 1, 1);
          ctx.fillRect(x0 + 1, y0 + 1, 1, y1 - y0 - 1);
          ctx.fillStyle = rgba(P.deep, 0.35);
          ctx.fillRect(x0 + 1, y1 - 1, x1 - x0 - 1, 1);
        }
        ctx.fillStyle = rgba(P.mortar, 0.9);
        ctx.fillRect(0, y1, T, 1);
        ctx.fillRect(j, y0, 1, y1 - y0);
      });
      for (let i = 0; i < 3; i++) stamp(ctx, r() * 32, r() * 32, 1.6, P.deep, 0.25, 0.7);
      if (v === 3) for (let i = 0; i < 5; i++) stamp(ctx, 4 + r() * 24, 18 + r() * 12, 1.2, P.moss, 0.35, 0.6);
    },
    lip(ctx, v, P) {
      KINDS.stone.body(ctx, v, P);
      // coping: a smoother cap stone with a lit bevel and moss creeping over
      gradientV(ctx, 0, 0, T, 7, [[0, mix(P.stone, P.lit, 0.5), 1], [0.6, P.stone, 1], [1, mix(P.stone, P.deep, 0.4), 1]]);
      ctx.fillStyle = rgba(P.deep, 0.6);
      ctx.fillRect(0, 7, T, 1);
      const r = rng(41 + v);
      for (let i = 0; i < 7; i++) {
        const x = r() * T;
        dab(ctx, x, 1 + r() * 2, 3 + r() * 3, 1.6, 0, mix(P.moss, P.grassLit, r() * 0.5), 0.8, 0.4);
      }
      ctx.fillStyle = rgba(mix(P.lit, 0xffffff, 0.3), 0.5);
      ctx.fillRect(0, 0, T, 1);
    },
  },
  // interior floorboards: a plank face on top, joists and darkness under
  boards: {
    body(ctx, v, P) {
      // under the floor: dark, with the odd joist end and a seam of light
      toneFill(ctx, T, T, mix(P.body, P.deep, 0.35), { amount: 0.1, seed: 33, scale: 6, warm: 0.4 });
      const r = rng(51 + v);
      if (v === 0) {
        gradientV(ctx, 12, 0, 8, T, [[0, mix(P.wood, P.deep, 0.35), 0.8], [1, mix(P.wood, P.deep, 0.6), 0.8]]);
        ctx.fillStyle = rgba(P.lit, 0.12);
        ctx.fillRect(12, 0, 1, T);
      }
      for (let i = 0; i < 3; i++) stamp(ctx, r() * 32, r() * 32, 1.5, P.deep, 0.25, 0.7);
    },
    lip(ctx, v, P) {
      KINDS.boards.body(ctx, v, P);
      // the floor: one plank face 10 px thick with grain, nail heads and a lit nosing
      const r = rng(61 + v * 7);
      gradientV(ctx, 0, 0, T, 11, [[0, mix(P.wood, P.lit, 0.45), 1], [0.25, P.wood, 1], [1, mix(P.wood, P.deep, 0.3), 1]]);
      ctx.strokeStyle = rgba(P.deep, 0.25);
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const y = 3 + r() * 6;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(10, y + (r() - 0.5) * 2, 20, y + (r() - 0.5) * 2, T, y);
        ctx.stroke();
      }
      const joint = 6 + ((v * 9) % 20);
      ctx.fillStyle = rgba(P.deep, 0.7);
      ctx.fillRect(joint, 0, 1, 11);
      ctx.fillStyle = rgba(P.lit, 0.3);
      ctx.fillRect(joint + 1, 0, 1, 11);
      stamp(ctx, joint + 3, 5, 0.9, P.deep, 0.9, 0.2);
      stamp(ctx, joint - 3, 5, 0.9, P.deep, 0.9, 0.2);
      if (v === 1) dab(ctx, 22, 5, 2.2, 1.2, 0, P.deep, 0.35, 0.5); // a knot
      ctx.fillStyle = rgba(P.deep, 0.75);
      ctx.fillRect(0, 11, T, 2);
      ctx.fillStyle = rgba(mix(P.lit, 0xffffff, 0.2), 0.65);
      ctx.fillRect(0, 0, T, 1);
    },
  },
  // interior walls and ceilings: lime plaster with brick showing where it fell away
  plaster: {
    body(ctx, v, P) {
      toneFill(ctx, T, T, P.body, { amount: 0.1, seed: 71, scale: 10, warm: 0.5 });
      const r = rng(81 + v * 5);
      if (v === 3) {
        // a patch of bare brick
        const x0 = 6 + r() * 8;
        const y0 = 6 + r() * 8;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(x0 + 7, y0 + 6, 7, 5, 0.2, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = hex(P.brick);
        ctx.fillRect(0, 0, T, T);
        ctx.fillStyle = rgba(P.mortar, 0.9);
        for (let y = 0; y < T; y += 6) {
          ctx.fillRect(0, y, T, 1);
          for (let x = ((y / 6) % 2) * 6; x < T; x += 12) ctx.fillRect(x, y, 1, 6);
        }
        ctx.restore();
        ctx.strokeStyle = rgba(P.deep, 0.3);
        ctx.beginPath();
        ctx.ellipse(x0 + 7, y0 + 6, 7, 5, 0.2, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = 0; i < 3; i++) stamp(ctx, r() * 32, r() * 32, 2.5, P.deep, 0.08, 0.8);
    },
    lip(ctx, v, P) {
      KINDS.plaster.body(ctx, v, P);
      gradientV(ctx, 0, 0, T, 6, [[0, mix(P.wood, P.lit, 0.4), 1], [1, P.wood, 1]]);
      ctx.fillStyle = rgba(P.deep, 0.6);
      ctx.fillRect(0, 6, T, 1);
    },
  },
};

// ---- generic overlays ---------------------------------------------------------------
function under(ctx, v, P, kind) {
  // the overhang: deepening shadow at the bottom edge, plus kind detail
  gradientV(ctx, 0, T - 12, T, 12, [[0, P.deep, 0], [1, P.deep, 0.75]]);
  ctx.fillStyle = rgba(P.deep, 0.9);
  ctx.fillRect(0, T - 2, T, 2);
  const r = rng(91 + v);
  if (kind === 'meadow' || kind === 'cobble') {
    // root tips and crumbs at the lip of the overhang
    for (let i = 0; i < 3; i++) {
      const x = 3 + r() * 26;
      ctx.strokeStyle = rgba(P.root, 0.8);
      ctx.beginPath();
      ctx.moveTo(x, T - 4);
      ctx.lineTo(x + (r() - 0.5) * 3, T - 1);
      ctx.stroke();
    }
  } else if (kind === 'boards' || kind === 'plaster') {
    // a ceiling beam face
    gradientV(ctx, 0, T - 9, T, 9, [[0, mix(P.wood, P.lit, 0.15), 1], [1, mix(P.wood, P.deep, 0.5), 1]]);
    ctx.fillStyle = rgba(P.deep, 0.6);
    ctx.fillRect(0, T - 10, T, 1);
    ctx.fillStyle = rgba(P.lit, 0.2);
    ctx.fillRect(0, T - 9, T, 1);
  }
}

function edge(ctx, side, P) {
  if (side === 'L') {
    const g = ctx.createLinearGradient(0, 0, 6, 0);
    g.addColorStop(0, rgba(P.lit, 0.45));
    g.addColorStop(1, rgba(P.lit, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 6, T);
    ctx.fillStyle = rgba(P.deep, 0.6);
    ctx.fillRect(0, 0, 1, T);
  } else {
    const g = ctx.createLinearGradient(T - 8, 0, T, 0);
    g.addColorStop(0, rgba(P.deep, 0));
    g.addColorStop(1, rgba(P.deep, 0.65));
    ctx.fillStyle = g;
    ctx.fillRect(T - 8, 0, 8, T);
    ctx.fillStyle = rgba(P.deep, 0.9);
    ctx.fillRect(T - 1, 0, 1, T);
  }
}

// rounded lip end: a mask (destination-out) + a rim
function capMask(side) {
  const c = canvas(T, T);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.beginPath();
  if (side === 'L') {
    ctx.moveTo(0, 0);
    ctx.lineTo(5, 0);
    ctx.quadraticCurveTo(0, 0, 0, 5);
  } else {
    ctx.moveTo(T, 0);
    ctx.lineTo(T - 5, 0);
    ctx.quadraticCurveTo(T, 0, T, 5);
  }
  ctx.closePath();
  ctx.fill();
  return c;
}

function inner(ctx, side, P) {
  const x = side === 'L' ? 0 : T - 10;
  const g = ctx.createRadialGradient(side === 'L' ? 0 : T, 0, 0, side === 'L' ? 0 : T, 0, 12);
  g.addColorStop(0, rgba(P.deep, 0.55));
  g.addColorStop(1, rgba(P.deep, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x, 0, 10, 10);
}

function step(ctx, P) {
  // a lip meeting a higher wall on its left: contact shadow cast down-right
  const g = ctx.createLinearGradient(0, 0, 10, 0);
  g.addColorStop(0, rgba(P.deep, 0.5));
  g.addColorStop(1, rgba(P.deep, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 10, 12);
}

function oneway(ctx, v, P, kind) {
  ctx.clearRect(0, 0, T, T);
  const wood = P.wood ?? mix(P.body, 0x6a4a30, 0.6);
  if (kind === 'stone' || kind === 'cobble') {
    gradientV(ctx, 0, 0, T, 10, [[0, mix(P.stone, P.lit, 0.4), 1], [0.5, P.stone, 1], [1, mix(P.stone, P.deep, 0.5), 1]]);
    ctx.fillStyle = rgba(P.deep, 0.6);
    ctx.fillRect(0, 10, T, 1);
    ctx.fillRect((v * 11) % 30, 0, 1, 10);
  } else {
    gradientV(ctx, 0, 0, T, 9, [[0, mix(wood, P.lit, 0.45), 1], [0.3, wood, 1], [1, mix(wood, P.deep, 0.45), 1]]);
    ctx.fillStyle = rgba(P.deep, 0.7);
    ctx.fillRect(0, 9, T, 1);
    ctx.fillRect((v * 13) % 30, 0, 1, 9);
    // a bracket under some planks
    if (v === 0) {
      ctx.fillStyle = rgba(mix(wood, P.deep, 0.5), 1);
      ctx.beginPath();
      ctx.moveTo(14, 10);
      ctx.lineTo(18, 10);
      ctx.lineTo(18, 20);
      ctx.closePath();
      ctx.fill();
    }
  }
  if (kind === 'meadow') for (let i = 0; i < 5; i++) dab(ctx, 3 + i * 6, 1, 3, 1.4, 0, P.grass, 0.8, 0.4);
}

function slope(ctx, role, base, P) {
  ctx.drawImage(base, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  const pts = { slope_r: [[0, T], [T, 0], [T, T]], slope_l: [[0, 0], [T, T], [0, T]], slope_r_low: [[0, T], [T, T / 2], [T, T]], slope_r_high: [[0, T / 2], [T, 0], [T, T], [0, T]] }[role];
  ctx.moveTo(...pts[0]);
  for (const p of pts.slice(1)) ctx.lineTo(...p);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  const line = { slope_r: [0, T, T, 0], slope_l: [0, 0, T, T], slope_r_low: [0, T, T, T / 2], slope_r_high: [0, T / 2, T, 0] }[role];
  ctx.strokeStyle = rgba(P.lit, 0.85);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(line[0], line[1]);
  ctx.lineTo(line[2], line[3]);
  ctx.stroke();
}

// the full sheet for one material definition
export function paintMaterialSheet(mat) {
  const kind = KINDS[mat.kind] ? mat.kind : 'stone';
  const K = KINDS[kind];
  const P = { lit: 0xf2e0b0, deep: 0x1a1420, mortar: 0x3a3028, stone: 0x8a8070, moss: 0x5a7a3a, root: 0x5a4030, grass: 0x6a8a3a, grassLit: 0xb8c860, grassDeep: 0x3a5a2a, wood: 0x7a5232, brick: 0x8a4a34, body: 0x5a4a3a, ...mat.palette };
  const n = mat.variants || 4;
  const make = (fn) => {
    const c = canvas(T, T);
    fn(c.getContext('2d'));
    return c;
  };
  const sheet = {
    id: mat.id,
    kind,
    P,
    lip: [],
    body: [],
    under: [],
    oneway: [],
    slope: {},
    edgeL: make((ctx) => edge(ctx, 'L', P)),
    edgeR: make((ctx) => edge(ctx, 'R', P)),
    capL: capMask('L'),
    capR: capMask('R'),
    innerTL: make((ctx) => inner(ctx, 'L', P)),
    innerTR: make((ctx) => inner(ctx, 'R', P)),
    stepL: make((ctx) => step(ctx, P)),
  };
  for (let v = 0; v < n; v++) {
    sheet.body.push(make((ctx) => K.body(ctx, v, P)));
    sheet.lip.push(make((ctx) => K.lip(ctx, v, P)));
  }
  for (let v = 0; v < 3; v++) {
    sheet.under.push(make((ctx) => under(ctx, v, P, kind)));
    sheet.oneway.push(make((ctx) => oneway(ctx, v, P, kind)));
  }
  for (const role of ['slope_r', 'slope_l', 'slope_r_low', 'slope_r_high']) sheet.slope[role] = make((ctx) => slope(ctx, role, sheet.lip[0], P));
  sheet.stepR = make((ctx) => {
    ctx.translate(T, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(sheet.stepL, 0, 0);
  });
  return sheet;
}

export const MATERIAL_KINDS = Object.keys(KINDS);
void shade;
