// Decor sprites (the edge-fringe rule layer, plan 2.3.3): small painted
// pieces the decor rules scatter along lips, undersides and wall bases.
// Each returns { c: canvas, ax, ay } where (ax, ay) is the anchor in px:
//   top pieces (tufts, flowers, puddles) anchor on their base line
//   hanging pieces (roots, ivy, drips, webs) anchor on their top line
// Painted once per palette and cached by the baker.
import { mix, rgba, hex, stamp, dab, clump } from '../paint.js';
import { canvas } from './painters.js';

function rng(seed) {
  let s = (seed * 7919 + 13) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const R = (r) => ({ frac: r, realInRange: (a, b) => a + r() * (b - a), between: (a, b) => Math.floor(a + r() * (b - a + 1)) });

const P0 = { grass: 0x6a8a3a, grassLit: 0xb8c860, grassDeep: 0x3a5a2a, lit: 0xf2e0b0, deep: 0x1a1420, stone: 0x8a8070, root: 0x5a4030, moss: 0x5a7a3a, flower: [0xe8d070, 0xe89a8a, 0xb8a8e8], water: 0x2a3a58, sky: 0xe8a070 };

function blades(ctx, x0, base, n, h, P, r, lean = 0) {
  for (let i = 0; i < n; i++) {
    const x = x0 + (r() - 0.5) * 14;
    const len = h * (0.5 + r() * 0.6);
    const bend = (r() - 0.5) * 6 + lean;
    const col = mix(P.grassDeep, P.grassLit, Math.min(1, 0.25 + r() * 0.85));
    ctx.strokeStyle = hex(col);
    ctx.lineWidth = 1 + (r() < 0.3 ? 0.6 : 0);
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.quadraticCurveTo(x + bend * 0.3, base - len * 0.6, x + bend, base - len);
    ctx.stroke();
  }
}

const PAINT = {
  tuft(v, P) {
    const c = canvas(36, 26);
    const ctx = c.getContext('2d');
    const r = rng(10 + v);
    blades(ctx, 18, 26, 9 + v * 3, 12 + v * 4, { ...P, grassLit: P.grassDeep }, r, -1);
    blades(ctx, 18, 26, 8 + v * 2, 10 + v * 4, P, r, 1);
    // a sunlit tip or two
    ctx.fillStyle = rgba(mix(P.grassLit, 0xfff0b0, 0.5), 0.8);
    for (let i = 0; i < 3; i++) ctx.fillRect(8 + r() * 20, 26 - 10 - r() * 8, 1, 1);
    return { c, ax: 18, ay: 24 };
  },
  flower(v, P) {
    const c = canvas(22, 26);
    const ctx = c.getContext('2d');
    const r = rng(30 + v);
    blades(ctx, 11, 26, 5, 10, P, r);
    const col = P.flower[v % P.flower.length];
    for (let i = 0; i < 2 + (v % 2); i++) {
      const x = 6 + r() * 10;
      const y = 8 + r() * 8;
      ctx.strokeStyle = hex(P.grassDeep);
      ctx.beginPath();
      ctx.moveTo(x, 26);
      ctx.lineTo(x + (r() - 0.5) * 2, y);
      ctx.stroke();
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        stamp(ctx, x + Math.cos(a) * 1.8, y + Math.sin(a) * 1.8, 1.6, col, 0.95, 0.3);
      }
      stamp(ctx, x, y, 1, 0xf8e8a0, 1, 0.2);
    }
    return { c, ax: 11, ay: 24 };
  },
  pebble(v, P) {
    const c = canvas(24, 10);
    const ctx = c.getContext('2d');
    const r = rng(50 + v);
    for (let i = 0; i < 3 + v; i++) {
      const x = 3 + r() * 18;
      const rx = 1.5 + r() * 2.5;
      ctx.fillStyle = rgba(P.deep, 0.5);
      ctx.beginPath();
      ctx.ellipse(x + 0.6, 9, rx + 0.6, 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
      const g = ctx.createRadialGradient(x - rx * 0.4, 9 - rx, 0.3, x, 9 - rx * 0.6, rx * 1.3);
      g.addColorStop(0, hex(mix(P.stone, P.lit, 0.5)));
      g.addColorStop(1, hex(mix(P.stone, P.deep, 0.4)));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, 9 - rx * 0.6, rx, rx * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    return { c, ax: 12, ay: 9 };
  },
  roots(v, P) {
    const c = canvas(32, 34);
    const ctx = c.getContext('2d');
    const r = rng(70 + v);
    for (let i = 0; i < 3 + v; i++) {
      let x = 4 + r() * 24;
      let y = 0;
      ctx.strokeStyle = rgba(mix(P.root, P.deep, r() * 0.4), 0.9);
      ctx.lineWidth = 1.4 - i * 0.15;
      ctx.beginPath();
      ctx.moveTo(x, y);
      const len = 10 + r() * 22;
      while (y < len) {
        y += 3;
        x += (r() - 0.5) * 3;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    return { c, ax: 16, ay: 0 };
  },
  ivy(v, P) {
    const c = canvas(28, 52);
    const ctx = c.getContext('2d');
    const r = rng(90 + v);
    for (let s = 0; s < 2; s++) {
      let x = 8 + r() * 12;
      const len = 22 + r() * 26;
      ctx.strokeStyle = rgba(P.grassDeep, 0.9);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      for (let y = 0; y < len; y += 4) {
        x += (r() - 0.5) * 2.5;
        ctx.lineTo(x, y);
        if (r() < 0.8) {
          const side = r() < 0.5 ? -1 : 1;
          dab(ctx, x + side * 2.5, y, 2.6, 1.8, side * 0.5, mix(P.grassDeep, P.grassLit, r() * 0.8), 0.95, 0.35);
        }
      }
      ctx.stroke();
    }
    return { c, ax: 14, ay: 0 };
  },
  drip(v, P) {
    const c = canvas(16, 20);
    const ctx = c.getContext('2d');
    dab(ctx, 8, 2, 7, 3, 0, P.moss, 0.85, 0.4);
    ctx.fillStyle = rgba(mix(P.moss, P.deep, 0.3), 0.9);
    for (let i = 0; i < 3; i++) ctx.fillRect(4 + i * 4, 3, 1, 4 + ((v + i) % 3) * 4);
    stamp(ctx, 8, 14 + v, 1.2, 0xa8c8e0, 0.7, 0.3);
    return { c, ax: 8, ay: 0 };
  },
  puddle(v, P) {
    const c = canvas(56, 8);
    const ctx = c.getContext('2d');
    ctx.fillStyle = rgba(P.deep, 0.6);
    ctx.beginPath();
    ctx.ellipse(28, 4, 26, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createLinearGradient(4, 0, 52, 0);
    g.addColorStop(0, rgba(P.water, 0.95));
    g.addColorStop(0.5, rgba(mix(P.water, P.sky, 0.55), 0.95));
    g.addColorStop(1, rgba(P.water, 0.95));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(28, 3.6, 24, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(0xfff2d0, 0.6);
    ctx.fillRect(20 + v * 4, 3, 8, 1);
    return { c, ax: 28, ay: 3 };
  },
  web(v, P) {
    const c = canvas(28, 28);
    const ctx = c.getContext('2d');
    ctx.strokeStyle = rgba(0xe8e0d8, 0.32);
    ctx.lineWidth = 0.8;
    for (let a = 0; a <= 4; a++) {
      const t = (a / 4) * (Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(t) * 26, Math.sin(t) * 26);
      ctx.stroke();
    }
    for (let rr = 6; rr < 26; rr += 6) {
      ctx.beginPath();
      for (let a = 0; a <= 4; a++) {
        const t = (a / 4) * (Math.PI / 2);
        const q = rr * (0.85 + ((a + v) % 2) * 0.12);
        if (a === 0) ctx.moveTo(Math.cos(t) * q, Math.sin(t) * q);
        else ctx.lineTo(Math.cos(t) * q, Math.sin(t) * q);
      }
      ctx.stroke();
    }
    void P;
    return { c, ax: 0, ay: 0, sided: true };
  },
  dust(v, P) {
    const c = canvas(26, 8);
    const ctx = c.getContext('2d');
    const r = rng(110 + v);
    for (let i = 0; i < 14; i++) stamp(ctx, 2 + r() * 22, 6 + r() * 2, 0.9 + r() * 1.2, i % 3 ? mix(P.deep, P.lit, 0.35) : P.lit, 0.45, 0.6);
    return { c, ax: 13, ay: 7 };
  },
  leaves(v, P) {
    const c = canvas(34, 8);
    const ctx = c.getContext('2d');
    const r = rng(130 + v);
    const cols = [0xc8783a, 0xd8a050, 0x9a5a30, mix(P.grassDeep, 0xc8a050, 0.5)];
    for (let i = 0; i < 6 + v * 2; i++) dab(ctx, 3 + r() * 28, 5 + r() * 2.5, 2.2, 1.1, r() * 3, cols[i % cols.length], 0.95, 0.3);
    return { c, ax: 17, ay: 6 };
  },
  moss_edge(v, P) {
    const c = canvas(30, 22);
    const ctx = c.getContext('2d');
    const r = R(rng(150 + v));
    for (let i = 0; i < 6; i++) clump(ctx, 4 + r.frac() * 20, 4 + r.frac() * (6 + v * 3), 3 + r.frac() * 3, mix(P.moss, P.grassLit, r.frac() * 0.6), 0.95, r, 4);
    return { c, ax: 15, ay: 2 };
  },
  weed(v, P) {
    const c = canvas(14, 14);
    const ctx = c.getContext('2d');
    const r = rng(170 + v);
    blades(ctx, 7, 14, 4 + v, 9, P, r);
    return { c, ax: 7, ay: 13 };
  },
};

export const DECOR_KINDS = Object.keys(PAINT);

// 'tuft_2' → PAINT.tuft(2)
export function paintDecor(key, palette = {}) {
  const m = String(key).match(/^(.*?)(?:_(\d+))?$/);
  const kind = m[1];
  const v = Number(m[2] || 0);
  const fn = PAINT[kind];
  if (!fn) return null;
  return fn(v, { ...P0, ...palette });
}
