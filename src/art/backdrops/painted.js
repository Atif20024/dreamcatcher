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

  // ---- Fioralba (THE MASTER'S LADDER) -----------------------------------------
  // the hills behind the city: long soft ridges washed toward the sky, rows
  // of cypress up the slopes, olive dots, a villa or a chapel on a crest
  rn_hills(P, seed) {
    const H = 260;
    return tileable(LAYER_W, H, (ctx, W) => {
      const r = rand(seed);
      ridge(ctx, W, H, 120, 70, mix(P.hill, P.sky, 0.62), seed + 1);
      ridge(ctx, W, H, 70, 80, mix(P.hill, P.sky, 0.42), seed + 2);
      // olive groves: grey-green dots in terraced rows on the near ridge
      for (let y = H - 70; y < H - 8; y += 9)
        for (let x = r.between(0, 10); x < W; x += r.between(9, 16)) {
          const top = H - 70 - pfbm(x % W, 0, W, seed + 2, 4, W / 3) * 80;
          if (y < top + 6 || r.frac() < 0.35) continue;
          ctx.fillStyle = hex(mix(P.leaf, P.sky, 0.45 + r.frac() * 0.1));
          ctx.beginPath();
          ctx.ellipse(x, y, 3.2, 2.4, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      // cypress avenues up the slopes: dark flames, lit on the west side
      for (let x = r.between(40, 120); x < W - 20; x += r.between(150, 260)) {
        const n = r.between(3, 6);
        for (let i = 0; i < n; i++) {
          const cx = x + i * 11;
          const gy = H - 50 - pfbm(cx % W, 0, W, seed + 2, 4, W / 3) * 80 + 30 + i * 3;
          const h = 26 + r.frac() * 10;
          ctx.fillStyle = hex(mix(P.leaf, P.sky, 0.32));
          ctx.beginPath();
          ctx.moveTo(cx, gy - h);
          ctx.quadraticCurveTo(cx + 5, gy - h * 0.55, cx + 3, gy);
          ctx.lineTo(cx - 3, gy);
          ctx.quadraticCurveTo(cx - 5, gy - h * 0.55, cx, gy - h);
          ctx.fill();
          ctx.fillStyle = rgba(P.rim ?? P.light, 0.18);
          ctx.fillRect(cx - 2, gy - h * 0.7, 1, h * 0.6);
        }
        // a villa at the head of the avenue: ochre walls, a terracotta roof
        const vx = x + n * 11 + 8;
        const vy = H - 50 - pfbm(vx % W, 0, W, seed + 2, 4, W / 3) * 80 + 28;
        ctx.fillStyle = hex(mix(P.house, P.sky, 0.35));
        ctx.fillRect(vx, vy - 14, 26, 14);
        ctx.fillStyle = hex(mix(P.roof, P.sky, 0.3));
        ctx.fillRect(vx - 2, vy - 17, 30, 3);
        ctx.fillStyle = hex(mix(P.deep, P.sky, 0.5));
        for (let k = 0; k < 3; k++) ctx.fillRect(vx + 4 + k * 8, vy - 10, 2, 4);
      }
    });
  },
  // the far city: terracotta roofs packed close, ochre and cream walls,
  // slim tower-houses standing out of the roofline (s 0.12)
  rn_skyline(P, seed) {
    const s = ROW_S.rn_skyline;
    const f = facadeMetrics(s);
    const H = Math.ceil(f.storey * 9 + f.roof + f.k * 2);
    const c = cv(LAYER_W, H);
    const ctx = c.getContext('2d');
    const r = rand(seed);
    const C = rnCols(P);
    // tower-houses first (behind the roofs): 7–9 storeys, battlemented tops
    for (let x = r.between(30, 90); x < LAYER_W - 30; x += r.between(110, 230)) {
      const w = f.bay * 1.4;
      const h = f.storey * r.between(6, 8);
      ctx.fillStyle = hex(C.walls[r.between(0, C.walls.length - 1)]);
      ctx.fillRect(x, H - h, w, h);
      ctx.fillStyle = rgba(P.rim ?? P.light, 0.22);
      ctx.fillRect(x, H - h, 1, h);
      for (let b = 0; b < 3; b++) ctx.fillRect(x + b * (w / 3), H - h - f.k * 0.8, w / 6, f.k * 0.8);
      ctx.fillStyle = hex(mix(P.deep, P.house, 0.4));
      for (let y = H - h + f.k; y < H - f.storey; y += f.storey) ctx.fillRect(x + w * 0.4, y, Math.max(1, w * 0.2), f.k * 0.9);
    }
    drawRow(ctx, 0, LAYER_W, H, s, r, {
      ...C, wrapW: LAYER_W, close: true, gap: 0, storeys: [1, 3], bays: [2, 5], lit: 0.04, quoins: false,
      roof: () => 'pitched', ground: () => 'plain', logId: 'painted.rn_skyline',
    });
    grain(ctx, 0, 0, LAYER_W, H, 0.04, seed + 1);
    return c;
  },
  // a near street of the city: arcaded ground floors (loggias), shuttered
  // windows, low terracotta roofs, behind its paving (s 0.3)
  rn_row(P, seed) {
    const s = ROW_S.rn_row;
    const f = facadeMetrics(s);
    const lift = Math.round(f.k * 1.6);
    const H = Math.ceil(f.storey * 4 + f.roof + f.k * 2 + lift);
    const c = cv(LAYER_W, H);
    const ctx = c.getContext('2d');
    const r = rand(seed);
    drawGroundLine(ctx, 0, LAYER_W, H - lift, lift, s, { pave: mix(P.house, 0xd8c8a8, 0.4), road: mix(P.house, P.deep, 0.25) });
    drawRow(ctx, 0, LAYER_W, H - lift, s, r, {
      ...rnCols(P), wrapW: LAYER_W, close: true, storeys: [2, 3], bays: [3, 5], lit: 0.05, shutter: mix(P.leaf, P.house, 0.3), shutterOdds: 0.8, flowers: true,
      ground: (q) => (q.frac() < 0.45 ? 'arcade' : 'house'), roof: () => 'pitched', logId: 'painted.rn_row',
    });
    grain(ctx, 0, 0, LAYER_W, H, 0.04, seed);
    return c;
  },
};

// Fioralba's walls: ochre, sienna, cream and pale stone; terracotta roofs
function rnCols(P) {
  const hz = P.haze ?? 0.15;
  const w = (c) => mix(c, P.sky, hz);
  return {
    walls: [w(0xd8b078), w(0xc89060), w(0xe8d4a8), w(0xd0a070), w(0xb8a088)],
    roofCols: [w(0xb85a34), w(0xa04a2e), w(0xc86a40)],
    glass: w(0x3a3040),
  };
}

// the scroll factor each building row is painted for (the depth rule); a
// dream places the layer at this f (src/data/scale.js BACKDROP_ROWS)
export const ROW_S = { city: 0.12, rain_city: 0.12, theatre: 0.3, fire_escape: 0.5, rn_skyline: 0.12, rn_row: 0.3 };

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
  if (RN_LANDMARKS[kind]) {
    const c = RN_LANDMARKS[kind](P);
    cache.set(key, c);
    return c;
  }
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

// ---- Fioralba's landmarks (THE MASTER'S LADDER), painted at s 0.12 ----------
// k = 44 × 0.12 px a metre: the campanile is 84 m, the cathedral's dome is
// half built in its timber centering, a treadwheel crane on the works.
const LK = 44 * 0.12;
const RN_LANDMARKS = {
  campanile(P) {
    const W = 120;
    const H = Math.round(86 * LK) + 4;
    const c = cv(W, H);
    const ctx = c.getContext('2d');
    const tw = 12 * LK;
    const x0 = (W - tw) / 2;
    const stone = mix(0xe8dcc0, P.sky, 0.28);
    const band = mix(0x7a9a7a, P.sky, 0.3);
    const rose = mix(0xd8a090, P.sky, 0.3);
    const top = H - 72 * LK;
    // the shaft: stone in courses, banded every storey, lit on the west
    ctx.fillStyle = hex(stone);
    ctx.fillRect(x0, top, tw, H - top);
    for (let y = top + 6; y < H; y += 9 * LK) {
      ctx.fillStyle = hex(band);
      ctx.fillRect(x0, y, tw, 2);
      ctx.fillStyle = hex(rose);
      ctx.fillRect(x0 + 3, y + 6, tw - 6, 1);
    }
    ctx.fillStyle = rgba(P.rim ?? P.light, 0.3);
    ctx.fillRect(x0, top, 2, H - top);
    ctx.fillStyle = rgba(P.deep, 0.22);
    ctx.fillRect(x0 + tw - 4, top, 4, H - top);
    // windows growing larger toward the top: single, paired, the open belfry
    const arch = (x, y, w, h) => {
      ctx.fillStyle = hex(mix(P.deep, P.sky, 0.25));
      ctx.fillRect(x, y + w / 2, w, h - w / 2);
      ctx.beginPath();
      ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
      ctx.fill();
    };
    arch(x0 + tw / 2 - 2, H - 34 * LK, 4, 12);
    arch(x0 + tw / 2 - 6, H - 50 * LK, 4, 16);
    arch(x0 + tw / 2 + 2, H - 50 * LK, 4, 16);
    arch(x0 + 6, top + 8, tw / 2 - 9, 34);
    arch(x0 + tw / 2 + 3, top + 8, tw / 2 - 9, 34);
    // the bell, dark in the belfry
    ctx.fillStyle = hex(mix(0xb08a3a, P.sky, 0.3));
    ctx.beginPath();
    ctx.arc(x0 + tw / 2, top + 30, 5, Math.PI, 0);
    ctx.fill();
    // the cornice and the low terracotta spire
    ctx.fillStyle = hex(mix(stone, 0xffffff, 0.15));
    ctx.fillRect(x0 - 4, top - 4, tw + 8, 5);
    ctx.fillStyle = hex(mix(0xb85a34, P.sky, 0.3));
    ctx.beginPath();
    ctx.moveTo(x0 - 2, top - 4);
    ctx.lineTo(W / 2, top - 12 * LK);
    ctx.lineTo(x0 + tw + 2, top - 4);
    ctx.fill();
    ctx.fillStyle = rgba(P.rim ?? P.light, 0.25);
    ctx.beginPath();
    ctx.moveTo(x0 - 2, top - 4);
    ctx.lineTo(W / 2, top - 12 * LK);
    ctx.lineTo(W / 2, top - 4);
    ctx.fill();
    grain(ctx, 0, 0, W, H, 0.05, 3);
    return c;
  },
  dome_works(P) {
    const W = 340;
    const H = 440;
    const c = cv(W, H);
    const ctx = c.getContext('2d');
    const k = LK;
    const cx = W * 0.56;
    const marble = mix(0xf0e8d8, P.sky, 0.25);
    const green = mix(0x5a7a6a, P.sky, 0.3);
    const brick = mix(0xc0623a, P.sky, 0.28);
    const deep = mix(P.deep, P.sky, 0.35);
    // the nave's long roof (left) and the tribunes round the crossing
    const naveTop = H - 14 * k;
    ctx.fillStyle = hex(marble);
    ctx.fillRect(0, naveTop, cx - 20 * k, H - naveTop);
    for (let x = 4; x < cx - 20 * k; x += 7 * k) {
      ctx.fillStyle = hex(green);
      ctx.fillRect(x, naveTop + 4, 1.5, H - naveTop - 4);
    }
    ctx.fillStyle = hex(brick);
    ctx.beginPath();
    ctx.moveTo(-4, naveTop);
    ctx.lineTo(cx - 20 * k, naveTop - 6 * k);
    ctx.lineTo(cx - 20 * k, naveTop);
    ctx.fill();
    for (const dx of [-24, 24]) {
      const tx = cx + dx * k;
      ctx.fillStyle = hex(marble);
      ctx.fillRect(tx - 8 * k, H - 18 * k, 16 * k, 18 * k);
      ctx.fillStyle = hex(brick);
      ctx.beginPath();
      ctx.arc(tx, H - 18 * k, 8 * k, Math.PI, 0);
      ctx.fill();
    }
    // the octagonal drum: two faces in light, one in shade, round windows
    const dw = 44 * k;
    const dTop = H - 18 * k - 14 * k;
    ctx.fillStyle = hex(marble);
    ctx.fillRect(cx - dw / 2, dTop, dw, 14 * k + 2);
    ctx.fillStyle = rgba(P.deep, 0.18);
    ctx.fillRect(cx + dw * 0.18, dTop, dw * 0.32, 14 * k + 2);
    ctx.fillStyle = hex(green);
    for (const fx of [-0.5, -0.18, 0.18, 0.5]) ctx.fillRect(cx + fx * dw - 1, dTop, 2, 14 * k);
    for (const fx of [-0.34, 0, 0.34]) {
      ctx.fillStyle = hex(deep);
      ctx.beginPath();
      ctx.arc(cx + fx * dw, dTop + 7 * k, 2.6 * k, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = hex(marble);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // the dome as far as it is built: a pointed shell in brick herringbone,
    // white ribs, the top edge ragged where the courses stop
    const full = 36 * k;
    const built = 0.62;
    const yAt = (t) => dTop - full * t; // t: 0 at the drum, 1 at the eye
    const halfAt = (t) => (dw / 2) * Math.sqrt(Math.max(0, 1 - t * t)) * (1 - 0.15 * t);
    ctx.fillStyle = hex(brick);
    ctx.beginPath();
    ctx.moveTo(cx - dw / 2, dTop);
    for (let t = 0; t <= built; t += 0.02) ctx.lineTo(cx - halfAt(t), yAt(t));
    for (let x = -1; x <= 1; x += 0.1) ctx.lineTo(cx + x * halfAt(built), yAt(built) + (Math.abs(Math.sin(x * 9)) * 3));
    for (let t = built; t >= 0; t -= 0.02) ctx.lineTo(cx + halfAt(t), yAt(t));
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = rgba(P.deep, 0.2);
    ctx.fillRect(cx + 4 * k, 0, W, H);
    ctx.strokeStyle = rgba(0x6a2a1a, 0.35);
    ctx.lineWidth = 1;
    for (let y = dTop; y > yAt(built) - 4; y -= 3) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y + ((y / 3) % 2 ? 2 : -2));
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = hex(marble);
    ctx.lineWidth = 2.5;
    for (const fx of [-1, -0.45, 0, 0.45, 1]) {
      ctx.beginPath();
      for (let t = 0; t <= built; t += 0.02) {
        const px = cx + fx * halfAt(t) * (Math.abs(fx) === 1 ? 0.98 : 1);
        if (t === 0) ctx.moveTo(px, yAt(t));
        else ctx.lineTo(px, yAt(t));
      }
      ctx.stroke();
    }
    // the timber centering and scaffold standing in the open top
    const wood = mix(0x8a6a3a, P.sky, 0.25);
    const yB = yAt(built);
    const hb = halfAt(built);
    ctx.strokeStyle = hex(wood);
    ctx.lineWidth = 1.2;
    for (let x = -hb; x <= hb; x += 3 * k) {
      ctx.beginPath();
      ctx.moveTo(cx + x, yB + 2);
      ctx.lineTo(cx + x * 0.6, yB - 9 * k);
      ctx.stroke();
    }
    for (let y = yB; y > yB - 10 * k; y -= 3 * k) {
      ctx.beginPath();
      ctx.moveTo(cx - hb * 0.9, y);
      ctx.lineTo(cx + hb * 0.9, y);
      ctx.stroke();
    }
    // the treadwheel crane: a mast, a jib, the wheel, the rope and a stone
    const mx = cx - 4 * k;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx, yB);
    ctx.lineTo(mx, yB - 22 * k);
    ctx.lineTo(mx + 16 * k, yB - 20 * k);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(mx - 3 * k, yB - 6 * k, 4 * k, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mx + 16 * k, yB - 20 * k);
    ctx.lineTo(mx + 16 * k, yB - 8 * k);
    ctx.stroke();
    ctx.fillStyle = hex(marble);
    ctx.fillRect(mx + 16 * k - 3, yB - 8 * k, 6, 4);
    // light from the west on the whole mass
    ctx.globalCompositeOperation = 'source-atop';
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, rgba(P.rim ?? P.light, 0.22));
    g.addColorStop(0.6, rgba(P.rim ?? P.light, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    grain(ctx, 0, 0, W, H, 0.05, 7);
    return c;
  },
};
