// Painted backdrop generators (plan 2.4): each paints ONE layer of a room's
// backdrop onto a canvas once, tileable in x (period W ≤ 2× the viewport), so
// the BackdropDirector shows it as a TileSprite. Content sits on the canvas's
// bottom edge (the horizon); everything above it is clear.
//   paintBackdropLayer(kind, palette, seed) → canvas
//   paintSky(sky) → canvas (stretched to the view)
//   paintLandmark(kind, palette) → canvas (one image, not tiled)
// Layers wash toward the sky colour with distance (aerial perspective).
import { mix, rgba, hex, stamp, dab, foliage, grain, gradientV } from '../paint.js';
import { pfbm } from '../materials/painters.js';

export const LAYER_W = 1024;

function rand(seed) {
  let s = (seed * 7919 + 17) % 233280;
  const f = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return { frac: f, realInRange: (a, b) => a + f() * (b - a), between: (a, b) => Math.floor(a + f() * (b - a + 1)) };
}

function cv(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// paint into a 3W canvas at offset W, then fold both overflows back in: the
// result tiles seamlessly whatever the painter did near its edges
function tileable(W, H, painter) {
  const big = cv(W * 3, H);
  const bctx = big.getContext('2d');
  bctx.translate(W, 0);
  painter(bctx, W, H);
  const out = cv(W, H);
  const o = out.getContext('2d');
  o.drawImage(big, -W, 0);
  o.drawImage(big, 0, 0);
  o.drawImage(big, -2 * W, 0);
  return out;
}

// the silhouette of a ridge: periodic noise so it wraps
function ridge(ctx, W, H, base, amp, col, seed, period = W) {
  ctx.fillStyle = typeof col === 'string' ? col : hex(col);
  ctx.beginPath();
  ctx.moveTo(-2, H);
  for (let x = -2; x <= W + 2; x += 4) {
    const n = pfbm(((x % W) + W) % W, 0, period, seed, 4, period / 3);
    ctx.lineTo(x, H - base - n * amp);
  }
  ctx.lineTo(W + 2, H);
  ctx.closePath();
  ctx.fill();
}

function house(ctx, x, ground, w, h, P, r, lit = 0.5) {
  const body = mix(P.house, P.sky, P.haze ?? 0);
  ctx.fillStyle = hex(body);
  ctx.fillRect(x, ground - h, w, h);
  // lit left wall edge, roof
  ctx.fillStyle = rgba(P.rim ?? P.light, 0.18);
  ctx.fillRect(x, ground - h, 2, h);
  const rh = Math.round(w * (0.35 + r.frac() * 0.25));
  ctx.fillStyle = hex(mix(P.roof, P.sky, P.haze ?? 0));
  ctx.beginPath();
  ctx.moveTo(x - 4, ground - h);
  ctx.lineTo(x + w / 2, ground - h - rh);
  ctx.lineTo(x + w + 4, ground - h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = rgba(P.rim ?? P.light, 0.22);
  ctx.beginPath();
  ctx.moveTo(x - 4, ground - h);
  ctx.lineTo(x + w / 2, ground - h - rh);
  ctx.lineTo(x + w / 2 + 2, ground - h - rh + 3);
  ctx.lineTo(x - 1, ground - h);
  ctx.fill();
  if (r.frac() < 0.6) {
    ctx.fillStyle = hex(mix(P.roof, P.sky, P.haze ?? 0));
    ctx.fillRect(x + w * 0.7, ground - h - rh * 0.8, 6, rh * 0.6);
  }
  // windows: a few warm, most dark
  const rows = Math.max(1, Math.floor(h / 22));
  const cols = Math.max(1, Math.floor(w / 16));
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++) {
      const wx = x + 5 + j * 16;
      const wy = ground - h + 8 + i * 22;
      if (wx + 6 > x + w - 3) continue;
      const on = r.frac() < lit;
      ctx.fillStyle = on ? hex(P.window) : rgba(P.deep, 0.35);
      ctx.fillRect(wx, wy, 6, 9);
      if (on) {
        ctx.fillStyle = rgba(P.window, 0.18);
        ctx.fillRect(wx - 3, wy - 3, 12, 15);
      }
    }
}

const LAYERS = {
  // rolling hills with a far town on them: spire, roofs, a few lights
  hills_town(P, seed) {
    const H = 240;
    return tileable(LAYER_W, H, (ctx, W) => {
      const r = rand(seed);
      ridge(ctx, W, H, 70, 90, mix(P.hill, P.sky, 0.55), seed + 1);
      // the town on the near ridge
      for (let x = 0; x < W; x += r.between(28, 52)) {
        const g = H - 60 - pfbm(x % W, 0, W, seed + 2, 4, W / 3) * 50;
        house(ctx, x, g + 10, r.between(18, 34), r.between(18, 40), { ...P, haze: 0.5 }, r, 0.25);
      }
      ridge(ctx, W, H, 40, 60, mix(P.hill, P.sky, 0.35), seed + 2);
      // a spire
      const sx = W * 0.62;
      ctx.fillStyle = hex(mix(P.house, P.sky, 0.45));
      ctx.fillRect(sx, H - 150, 14, 90);
      ctx.beginPath();
      ctx.moveTo(sx - 3, H - 150);
      ctx.lineTo(sx + 7, H - 196);
      ctx.lineTo(sx + 17, H - 150);
      ctx.fill();
      ctx.fillStyle = hex(P.window);
      ctx.fillRect(sx + 4, H - 130, 6, 10);
    });
  },
  // a row of town houses: the lane's street front, lit windows, chimneys
  town_row(P, seed) {
    const H = 300;
    return tileable(LAYER_W, H, (ctx, W) => {
      const r = rand(seed);
      let x = 0;
      while (x < W) {
        const w = r.between(70, 120);
        const h = r.between(110, 190);
        house(ctx, x, H, w, h, P, r, 0.45);
        x += w + r.between(4, 30);
      }
      gradientV(ctx, 0, H - 90, W, 90, [[0, P.sky, 0], [1, P.deep, 0.35]]);
    });
  },
  // a band of trees: painted canopies over trunks, tileable
  tree_band(P, seed) {
    const H = 280;
    return tileable(LAYER_W, H, (ctx, W) => {
      const r = rand(seed);
      for (let x = 20; x < W; x += r.between(90, 150)) {
        const h = r.between(150, 230);
        ctx.fillStyle = hex(mix(P.trunk ?? 0x3a2a2a, P.sky, P.haze ?? 0.3));
        ctx.fillRect(x - 5, H - h * 0.55, 10, h * 0.55);
        foliage(ctx, x, H - h * 0.62, r.between(48, 70), r.between(44, 66), mix(P.leaf, P.sky, P.haze ?? 0.3), r, { density: 0.7 });
      }
    });
  },
  // the near hedge and fence line: darkest thing behind the terrain
  hedge_line(P, seed) {
    const H = 120;
    return tileable(LAYER_W, H, (ctx, W) => {
      const r = rand(seed);
      for (let x = 0; x < W; x += r.between(60, 110)) foliage(ctx, x, H - 30, r.between(40, 70), r.between(24, 36), mix(P.leaf, P.deep, 0.35), r, { density: 0.8 });
      ctx.fillStyle = hex(mix(P.deep, P.leaf, 0.2));
      for (let x = 6; x < W; x += 24) ctx.fillRect(x, H - 52, 4, 52);
      ctx.fillRect(0, H - 44, W, 3);
      ctx.fillRect(0, H - 24, W, 3);
    });
  },
  // a far ridge only (open country)
  far_ridge(P, seed) {
    const H = 200;
    return tileable(LAYER_W, H, (ctx, W) => {
      ridge(ctx, W, H, 40, 120, mix(P.hill, P.sky, 0.6), seed + 4);
      ridge(ctx, W, H, 20, 70, mix(P.hill, P.sky, 0.4), seed + 5);
    });
  },
};

export const BACKDROP_KINDS = Object.keys(LAYERS);

const cache = new Map();
export function paintBackdropLayer(kind, palette, seed = 1) {
  const key = `${kind}|${seed}|${JSON.stringify(palette)}`;
  if (cache.has(key)) return cache.get(key);
  const fn = LAYERS[kind];
  if (!fn) throw new Error(`backdrop: no layer kind "${kind}"`);
  const c = fn(palette, seed);
  const g = c.getContext('2d');
  // aerial haze toward the horizon and grain
  gradientV(g, 0, c.height * 0.4, c.width, c.height * 0.6, [[0, palette.sky, 0], [1, palette.mist ?? palette.sky, palette.mistA ?? 0.2]]);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = rgba(palette.sky, palette.fade ?? 0);
  g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = 'source-over';
  grain(g, 0, 0, c.width, c.height, 0.05, seed);
  cache.set(key, c);
  return c;
}

// sky: { top, mid, bottom, sun?: {x, y, r, color}, stars?: n, clouds?: n, seed }
export function paintSky(sky) {
  const key = `sky|${JSON.stringify(sky)}`;
  if (cache.has(key)) return cache.get(key);
  const W = 512;
  const H = 540;
  const c = cv(W, H);
  const ctx = c.getContext('2d');
  gradientV(ctx, 0, 0, W, H, [[0, sky.top, 1], [0.55, sky.mid ?? sky.bottom, 1], [1, sky.bottom, 1]]);
  const r = rand(sky.seed || 3);
  for (let i = 0; i < (sky.stars || 0); i++) {
    const y = r.frac() * H * 0.5;
    stamp(ctx, r.frac() * W, y, r.frac() < 0.1 ? 1.4 : 0.8, 0xfff6e0, 0.9 * (1 - y / (H * 0.55)), 0.3);
  }
  if (sky.sun) {
    const s = sky.sun;
    const g = ctx.createRadialGradient(s.x, s.y, 2, s.x, s.y, s.r * 4);
    g.addColorStop(0, rgba(s.color, 0.9));
    g.addColorStop(0.15, rgba(s.color, 0.5));
    g.addColorStop(1, rgba(s.color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    stamp(ctx, s.x, s.y, s.r, mix(s.color, 0xffffff, 0.5), 1, 0.15);
  }
  // long painted cloud strokes, lit from below by the low sun
  for (let i = 0; i < (sky.clouds || 0); i++) {
    const y = 60 + r.frac() * H * 0.45;
    const x = r.frac() * W;
    const len = 60 + r.frac() * 140;
    for (let k = 0; k < 10; k++) {
      dab(ctx, x + (k / 10) * len, y + (r.frac() - 0.5) * 6, 18 + r.frac() * 16, 4 + r.frac() * 4, 0, mix(sky.cloud ?? sky.mid, sky.top, 0.3), 0.35, 0.7);
      dab(ctx, x + (k / 10) * len, y + 4, 14, 2.5, 0, sky.cloudLit ?? 0xf2b48a, 0.25, 0.7);
    }
  }
  grain(ctx, 0, 0, W, H, 0.03, 5);
  cache.set(key, c);
  return c;
}

// a named landmark painted once (one per room at most)
export function paintLandmark(kind, P) {
  const key = `lm|${kind}|${JSON.stringify(P)}`;
  if (cache.has(key)) return cache.get(key);
  const c = cv(220, 420);
  const ctx = c.getContext('2d');
  if (kind === 'bell_tower') {
    const body = mix(P.house, P.sky, 0.25);
    ctx.fillStyle = hex(body);
    ctx.fillRect(70, 120, 80, 300);
    ctx.fillStyle = rgba(P.light, 0.15);
    ctx.fillRect(70, 120, 6, 300);
    ctx.fillStyle = hex(mix(P.roof, P.sky, 0.2));
    ctx.beginPath();
    ctx.moveTo(60, 122);
    ctx.lineTo(110, 10);
    ctx.lineTo(160, 122);
    ctx.fill();
    // the belfry opening, lit warm (the lamps came on)
    ctx.fillStyle = hex(P.window);
    ctx.beginPath();
    ctx.moveTo(92, 200);
    ctx.lineTo(92, 160);
    ctx.quadraticCurveTo(110, 136, 128, 160);
    ctx.lineTo(128, 200);
    ctx.fill();
    stamp(ctx, 110, 180, 30, P.window, 0.3, 0.8);
    ctx.fillStyle = hex(mix(P.deep, P.house, 0.4));
    ctx.beginPath();
    ctx.arc(110, 186, 10, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(100, 186, 20, 8);
    for (let y = 240; y < 400; y += 50) {
      ctx.fillStyle = hex(P.window);
      ctx.fillRect(104, y, 12, 18);
    }
    grain(ctx, 0, 0, 220, 420, 0.05, 2);
  }
  cache.set(key, c);
  return c;
}
