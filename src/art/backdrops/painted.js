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
import { drawRow, drawGroundLine } from '../buildingKit.js';
import { facadeMetrics } from '../../data/scale.js';

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

  // ---- the city (ported from builders/parallax.js for the Musician) ----------
  // Every row is the building kit's (src/art/buildingKit.js) at the depth
  // rule: a storey is 132·s px for the layer's scroll factor s (ROW_S), and a
  // row nearer than the far skyline stands behind a ground line. Their s is
  // declared in src/data/scale.js BACKDROP_ROWS ('painted.<kind>').
  // the far skyline: 4–13 storeys, parapets and water tanks, a few lit windows
  city(P, seed) {
    return skylineRow(P, seed, 'city', [4, 13], 0.2);
  },
  // the same city in the rain: lower, colder, streaked, washed in mist
  rain_city(P, seed) {
    const c = skylineRow(P, seed, 'rain_city', [3, 9], 0.16);
    rainOver(c.getContext('2d'), c.width, c.height, P, seed, 0.18);
    return c;
  },
  // the theatre district: shopfronts and a marquee, behind its pavement
  theatre(P, seed) {
    const s = ROW_S.theatre;
    const f = facadeMetrics(s);
    const lift = Math.round(f.k * 1.8);
    const H = Math.ceil(f.shop + f.storey * 3 + f.roof + f.k * 1.5 + lift);
    const c = cv(LAYER_W, H);
    const ctx = c.getContext('2d');
    const r = rand(seed);
    const C = rowCols(P);
    drawGroundLine(ctx, 0, LAYER_W, H - lift, lift, s, { pave: mix(P.house, 0xffffff, 0.12), road: mix(P.house, P.deep, 0.3) });
    const blds = drawRow(ctx, 0, LAYER_W, H - lift, s, r, {
      ...C, wrapW: LAYER_W, close: true, storeys: [1, 3], bays: [2, 4], lit: 0.32,
      ground: () => 'shop', awnings: [P.accent ?? 0x2e7d9a, mix(P.rim ?? P.light, P.deep, 0.4)], roof: (q) => (q.frac() < 0.4 ? 'pitched' : 'parapet'), logId: 'painted.theatre',
    });
    // one front is the theatre: its marquee bulbs over the shop floor
    const b = blds.reduce((m, x) => (x.w > m.w ? x : m), blds[0]);
    if (b) {
      const my = H - lift - f.shop - f.k * 0.2;
      ctx.fillStyle = hex(mix(P.deep, P.house, 0.4));
      ctx.fillRect(b.x + 4, my, b.w - 8, f.k * 0.9);
      for (let x = b.x + 8; x < b.x + b.w - 8; x += 5) stamp(ctx, x, my + 2, 1.4, P.window, 0.95, 0.2);
      ctx.fillStyle = hex(mix(P.window, 0xffffff, 0.3));
      ctx.fillRect(b.x + 12, my + 5, b.w - 24, f.k * 0.4);
    }
    grain(ctx, 0, 0, LAYER_W, H, 0.04, seed);
    return c;
  },
  // the alley's far wall: brick backs with iron fire escapes zigzagging up
  fire_escape(P, seed) {
    const s = ROW_S.fire_escape;
    const f = facadeMetrics(s);
    const lift = Math.round(f.k * 1.2);
    const H = Math.ceil(f.storey * 5 + f.roof + lift + f.k);
    const c = cv(LAYER_W, H);
    const ctx = c.getContext('2d');
    const r = rand(seed);
    const brick = mix(P.house, 0x6a3020, 0.35);
    drawGroundLine(ctx, 0, LAYER_W, H - lift, lift, s, { pave: mix(P.house, 0x8a8078, 0.3), road: mix(P.house, P.deep, 0.5) });
    const blds = drawRow(ctx, 0, LAYER_W, H - lift, s, r, {
      walls: [brick, mix(brick, P.deep, 0.15), mix(brick, 0x8a5040, 0.2)], roofCols: [mix(brick, P.deep, 0.4)], wrapW: LAYER_W, close: true, gap: 0,
      storeys: [3, 4], bays: [3, 5], lit: 0.25, quoins: false, ground: () => 'plain', roof: () => 'parapet', logId: 'painted.fire_escape',
    });
    // iron: a landing per storey, a flight between, rails; lit edges toward the lamp
    const iron = mix(P.deep, P.house, 0.25);
    for (const b of blds) {
      if (b.w < f.bay * 2.5) continue;
      const x0 = b.x + b.w * 0.25;
      const w = Math.min(b.w * 0.5, f.bay * 2.2);
      for (let k = 1; k <= 3; k++) {
        const y = H - lift - f.storey * k;
        if (y < b.top + f.k) break;
        ctx.fillStyle = hex(iron);
        ctx.fillRect(x0, y, w, Math.max(2, f.k * 0.12));
        ctx.fillRect(x0, y - f.k * 0.9, w, 1);
        for (let x = x0; x <= x0 + w; x += Math.max(3, f.k * 0.3)) ctx.fillRect(x, y - f.k * 0.9, 1, f.k * 0.9);
        // the flight down to the landing below, alternating sides
        ctx.strokeStyle = hex(iron);
        ctx.lineWidth = Math.max(1.5, f.k * 0.1);
        ctx.beginPath();
        const right = k % 2 === 0;
        ctx.moveTo(right ? x0 + w : x0, y);
        ctx.lineTo(right ? x0 + w * 0.2 : x0 + w * 0.8, y + f.storey - 2);
        ctx.stroke();
        ctx.fillStyle = rgba(P.rim ?? P.light, 0.25);
        ctx.fillRect(x0, y, w, 1);
      }
    }
    grain(ctx, 0, 0, LAYER_W, H, 0.05, seed + 3);
    return c;
  },
  // a festival crowd: heads and shoulders against the stage wash, raised
  // arms, a few phone lights (the nearest layer in front of the stage)
  crowd(P, seed) {
    const H = 120;
    return tileable(LAYER_W, H, (ctx, W) => {
      const r = rand(seed);
      for (let band = 0; band < 3; band++) {
        const col = mix(P.deep, P.sky, 0.32 - band * 0.12);
        const base = H - 6 - (2 - band) * 22;
        for (let x = -10; x < W + 10; x += 13 + r.between(0, 8)) {
          const hh = 10 + r.frac() * 6;
          ctx.fillStyle = hex(col); // (a stamp below leaves its gradient as the fill)
          ctx.beginPath();
          ctx.arc(x, base - 26 - hh * 0.3, 7 + r.frac() * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(x - 11, base - 22, 22, H - base + 22);
          if (r.frac() < 0.14) {
            ctx.fillRect(x + 6, base - 58, 4, 34);
            if (r.frac() < 0.5) stamp(ctx, x + 8, base - 60, 2, 0xd8f0ff, 0.9, 0.2);
          }
        }
        ctx.fillStyle = hex(col);
        ctx.fillRect(-10, base - 2, W + 20, H - base + 2);
      }
      gradientV(ctx, 0, 0, W, 40, [[0, P.sky, 0], [1, P.deep, 0]]);
    });
  },
};

// the scroll factor each building row is painted for (the depth rule); a
// dream places the layer at this f (src/data/scale.js BACKDROP_ROWS)
export const ROW_S = { city: 0.12, rain_city: 0.12, theatre: 0.3, fire_escape: 0.5 };

function rowCols(P) {
  const main = mix(P.house, P.sky, P.haze ?? 0.15);
  return {
    walls: [main, mix(main, 0xffffff, 0.06), mix(main, P.window, 0.08), mix(main, P.deep, 0.1)],
    roofCols: [mix(main, P.deep, 0.2), mix(main, P.roof ?? 0x5a3040, 0.3)],
    glass: mix(main, P.deep, 0.35),
    signs: [mix(P.window, main, 0.3), mix(main, P.deep, 0.3)],
  };
}

function skylineRow(P, seed, kind, [lo, hi], lit) {
  const s = ROW_S[kind];
  const f = facadeMetrics(s);
  const H = Math.ceil(f.storey * (hi + 1) + f.roof + f.k * 2);
  const c = cv(LAYER_W, H);
  const ctx = c.getContext('2d');
  const r = rand(seed);
  drawRow(ctx, 0, LAYER_W, H, s, r, {
    ...rowCols(P), wrapW: LAYER_W, close: true, gap: 0, storeys: [lo, hi], bays: [3, 7], lit, quoins: false,
    roof: (q) => (q.frac() < 0.25 ? 'pitched' : 'parapet'), ground: () => 'plain', logId: `painted.${kind}`,
  });
  // water tanks and masts on the parapets: what stops a skyline reading as bars
  for (let x = r.between(20, 80); x < LAYER_W - 20; x += r.between(120, 220)) {
    ctx.fillStyle = hex(mix(P.house, P.deep, 0.3));
    let top = H;
    const d = ctx.getImageData(x, 0, 1, H).data;
    for (let y = 0; y < H; y++) if (d[y * 4 + 3] > 200) {
      top = y;
      break;
    }
    if (top >= H - 10) continue;
    if (r.frac() < 0.6) {
      ctx.fillRect(x - 6, top - 14, 12, 10);
      ctx.fillRect(x - 5, top - 4, 2, 4);
      ctx.fillRect(x + 3, top - 4, 2, 4);
    } else {
      ctx.fillRect(x, top - 26, 2, 26);
      stamp(ctx, x + 1, top - 27, 1.5, 0xd05040, 0.9, 0.2);
    }
  }
  grain(ctx, 0, 0, LAYER_W, H, 0.04, seed + 1);
  return c;
}

// rain streaks and a mist band over a painted layer (in place)
function rainOver(ctx, W, H, P, seed, alpha) {
  const r = rand(seed + 9);
  ctx.strokeStyle = rgba(mix(P.sky, 0xffffff, 0.4), alpha);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < (W * H) / 900; i++) {
    const x = r.frac() * W;
    const y = r.frac() * H;
    ctx.moveTo(x, y);
    ctx.lineTo(x - 3, y + 9);
  }
  ctx.stroke();
  gradientV(ctx, 0, H * 0.45, W, H * 0.55, [[0, P.mist ?? P.sky, 0], [1, P.mist ?? P.sky, 0.3]]);
}

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
