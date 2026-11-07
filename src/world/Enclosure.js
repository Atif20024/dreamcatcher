// Enclosure (plan 2.3.5, critique F5.1): rooms read as rooms. An interior
// gets a painted back wall (plaster, a panelled wainscot, a picture rail,
// posts, lamp-lit falloff) behind the play layer, and a foreground frame
// (a ceiling beam band with brackets, side pillars, door architraves) in
// front of it, so stepping inside is a visible event. An exterior may take
// foreground foliage along its bottom edge for depth.
//
// room.enclosure = { backWall: 'plaster'|'panelled', wainscot: true,
//   posts: 6 (every n tiles), ceiling: true, pillars: true,
//   frames: [{ x, y, w, h }] (tiles: door architraves),
//   fgFoliage: [{ x, w }] (tiles, exteriors) }
import { mix, rgba, hex, stamp, gradientV, foliage } from '../art/paint.js';

const T = 32;

function rand(seed) {
  let s = (seed * 7919 + 17) % 233280;
  const f = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return { frac: f, realInRange: (a, b) => a + f() * (b - a), between: (a, b) => Math.floor(a + f() * (b - a + 1)) };
}

// a cheap low-frequency wash: a small noise canvas scaled up smoothly
export function washCanvas(w, h, seed = 1, cell = 48) {
  const sw = Math.max(2, Math.ceil(w / cell) + 1);
  const sh = Math.max(2, Math.ceil(h / cell) + 1);
  const small = document.createElement('canvas');
  small.width = sw;
  small.height = sh;
  const sctx = small.getContext('2d');
  const img = sctx.createImageData(sw, sh);
  const r = rand(seed);
  for (let i = 0; i < sw * sh; i++) {
    const v = 96 + r.frac() * 64;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  sctx.putImageData(img, 0, 0);
  const big = document.createElement('canvas');
  big.width = w;
  big.height = h;
  const ctx = big.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(small, 0, 0, sw, sh, 0, 0, sw * cell, sh * cell);
  return big;
}

// the main floor row of an interior (the most common top-exposed floor row)
export function floorRow(grid) {
  const counts = new Map();
  for (let y = 1; y < grid.length; y++)
    for (let x = 0; x < grid[y].length; x++) if (grid[y][x] === '#' && grid[y - 1][x] !== '#') counts.set(y, (counts.get(y) || 0) + 1);
  let best = grid.length - 1;
  let n = -1;
  for (const [y, c] of counts) if (c > n || (c === n && y > best)) [best, n] = [y, c];
  return best;
}

// brick (a club's cellar wall: courses, a stagger, a few soot-dark bricks) or
// painted cinder blocks (backstage), over the plaster gradient
function paintMasonry(ctx, W, H, P, kind) {
  const r = rand(kind.length * 13 + W);
  const brick = kind === 'brick';
  const bw = brick ? 22 : 40;
  const bh = brick ? 10 : 20;
  const base = P.wall ?? 0x8a4a34;
  for (let y = 0, row = 0; y < H; y += bh, row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let x = -off; x < W; x += bw) {
      const v = r.frac();
      const c = v < 0.08 ? mix(base, P.deep, 0.45) : v < 0.2 ? mix(base, P.lit, 0.12) : mix(base, P.deep, v * 0.18);
      ctx.fillStyle = hex(c);
      ctx.fillRect(x + 1, y + 1, bw - 2, bh - 2);
      ctx.fillStyle = rgba(P.lit, 0.08);
      ctx.fillRect(x + 1, y + 1, bw - 2, 1);
    }
    ctx.fillStyle = rgba(P.deep, brick ? 0.55 : 0.35);
    ctx.fillRect(0, y, W, 1);
  }
  // damp at the foot, soot at the top
  gradientV(ctx, 0, 0, W, H, [[0, P.deep, 0.45], [0.3, P.deep, 0], [0.85, P.deep, 0], [1, P.deep, 0.35]]);
}

// stage drapes: deep velvet folds, lit on their crowns
function paintDrapes(ctx, W, H, P) {
  const cloth = P.cloth ?? 0x5a1a2a;
  for (let x = 0; x < W; x += 28) {
    const g = ctx.createLinearGradient(x, 0, x + 28, 0);
    g.addColorStop(0, hex(mix(cloth, P.deep, 0.55)));
    g.addColorStop(0.45, hex(mix(cloth, P.lit, 0.12)));
    g.addColorStop(1, hex(mix(cloth, P.deep, 0.65)));
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 28, H);
  }
  gradientV(ctx, 0, 0, W, H, [[0, P.deep, 0.5], [0.4, P.deep, 0], [1, P.deep, 0.3]]);
}

export function paintBackWall(ctx, room, P, lights = []) {
  const enc = room.enclosure || {};
  const grid = room.grid;
  const W = grid[0].length * T;
  const H = grid.length * T;
  const fy = floorRow(grid) * T;
  const wall = P.wall ?? 0xc8b08a;
  // plaster: warm at the top where the lamps are, heavier at the foot
  gradientV(ctx, 0, 0, W, H, [[0, mix(wall, P.deep, 0.35), 1], [0.35, wall, 1], [1, mix(wall, P.deep, 0.3), 1]]);
  // wallpaper: a faint stripe and a small diamond repeat above the rail
  const rail = fy - Math.round(T * 1.7);
  // phase 3b: a club's brick, a stage's drapes, a backstage's painted blocks
  if (enc.backWall === 'brick' || enc.backWall === 'blocks') paintMasonry(ctx, W, H, P, enc.backWall);
  if (enc.backWall === 'curtain') paintDrapes(ctx, W, H, P);
  if (!enc.backWall || enc.backWall === 'panelled') {
    for (let x = 0; x < W; x += 16) {
      ctx.fillStyle = rgba(mix(wall, P.deep, 0.5), 0.07);
      ctx.fillRect(x, 0, 6, rail);
      for (let y = 10; y < rail; y += 22) stamp(ctx, x + 11, y + ((x / 16) % 2) * 11, 1.4, P.accent ?? 0xa86a4a, 0.22, 0.4);
    }
  }
  // the wash: blotches of wear in the plaster
  const wash = washCanvas(W, H, 7, 56);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.5;
  ctx.drawImage(wash, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  // posts: timber uprights holding the room up
  const every = enc.posts || 0;
  if (every) {
    for (let x = every * T; x < W - T; x += every * T) {
      const g = ctx.createLinearGradient(x - 9, 0, x + 9, 0);
      g.addColorStop(0, hex(mix(P.wood, P.lit, 0.25)));
      g.addColorStop(0.4, hex(P.wood));
      g.addColorStop(1, hex(mix(P.wood, P.deep, 0.55)));
      ctx.fillStyle = g;
      ctx.fillRect(x - 9, 0, 18, fy);
    }
  }
  // wainscot: panels with a lit top rail and shaded recesses
  if (enc.wainscot !== false) {
    const wood = mix(P.wood, P.deep, 0.1);
    gradientV(ctx, 0, rail, W, fy - rail, [[0, mix(wood, P.lit, 0.12), 1], [1, mix(wood, P.deep, 0.35), 1]]);
    const pw = 58;
    for (let x = 6; x < W - 20; x += pw + 8) {
      ctx.fillStyle = rgba(P.deep, 0.35);
      ctx.fillRect(x, rail + 10, pw, fy - rail - 22);
      ctx.fillStyle = rgba(P.lit, 0.16);
      ctx.fillRect(x + 1, rail + 11, pw - 2, 1);
      ctx.fillRect(x + 1, rail + 11, 1, fy - rail - 24);
      ctx.fillStyle = rgba(mix(wood, P.lit, 0.08), 1);
      ctx.fillRect(x + 4, rail + 14, pw - 8, fy - rail - 30);
    }
    ctx.fillStyle = hex(mix(wood, P.lit, 0.3));
    ctx.fillRect(0, rail - 4, W, 5);
    ctx.fillStyle = rgba(P.deep, 0.5);
    ctx.fillRect(0, rail + 1, W, 2);
    // the skirting board
    ctx.fillStyle = hex(mix(wood, P.deep, 0.35));
    ctx.fillRect(0, fy - 10, W, 10);
    ctx.fillStyle = rgba(P.lit, 0.2);
    ctx.fillRect(0, fy - 10, W, 1);
  }
  // picture rail high up
  ctx.fillStyle = rgba(mix(P.wood, P.lit, 0.2), 0.9);
  ctx.fillRect(0, Math.round(T * 3.2), W, 3);
  // lamp light pooling on the wall (lighter), then the corners in shadow
  ctx.globalCompositeOperation = 'lighter';
  for (const l of lights) {
    const g = ctx.createRadialGradient(l.x, l.y, 4, l.x, l.y, l.r * 1.6);
    g.addColorStop(0, rgba(l.color, 0.22));
    g.addColorStop(1, rgba(l.color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(l.x - l.r * 1.6, l.y - l.r * 1.6, l.r * 3.2, l.r * 3.2);
  }
  ctx.globalCompositeOperation = 'source-over';
  const v = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.25, W / 2, H * 0.55, Math.max(W, H) * 0.75);
  v.addColorStop(0, rgba(P.deep, 0));
  v.addColorStop(1, rgba(P.deep, 0.55));
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

// foreground frame: a ceiling band, side pillars, door architraves
export function paintFgFrame(ctx, room, P) {
  const enc = room.enclosure || {};
  const grid = room.grid;
  const w = grid[0].length;
  const h = grid.length;
  const solid = (x, y) => grid[y] && grid[y][x] === '#';
  const wood = mix(P.wood, P.deep, 0.35);
  if (enc.ceiling) {
    // the ceiling's underside row per column; the beam hangs from it
    for (let x = 0; x < w; x++) {
      let y = 0;
      while (y < h && solid(x, y)) y++;
      if (y === 0 || y >= h - 2) continue;
      const by = y * T;
      gradientV(ctx, x * T, by - 4, T, 20, [[0, mix(wood, P.lit, 0.12), 1], [0.7, wood, 1], [1, mix(wood, P.deep, 0.5), 1]]);
      ctx.fillStyle = rgba(P.lit, 0.25);
      ctx.fillRect(x * T, by + 15, T, 1);
      // brackets every 5 tiles
      if (x % 5 === 2) {
        ctx.fillStyle = hex(wood);
        ctx.beginPath();
        ctx.moveTo(x * T + 4, by + 16);
        ctx.lineTo(x * T + 28, by + 16);
        ctx.lineTo(x * T + 16, by + 34);
        ctx.closePath();
        ctx.fill();
        stamp(ctx, x * T + 16, by + 22, 1.5, P.lit, 0.4, 0.3);
      }
    }
  }
  if (enc.pillars) {
    // just inside each side wall, full height of the open space
    for (const side of ['L', 'R']) {
      let wx = side === 'L' ? 0 : w - 1;
      const step = side === 'L' ? 1 : -1;
      const mid = Math.floor(h / 2);
      while (wx >= 0 && wx < w && solid(wx, mid)) wx += step;
      const px = side === 'L' ? wx * T - 6 : (wx + 1) * T - 18;
      const g = ctx.createLinearGradient(px, 0, px + 24, 0);
      g.addColorStop(0, hex(mix(wood, P.lit, 0.2)));
      g.addColorStop(0.5, hex(wood));
      g.addColorStop(1, hex(mix(wood, P.deep, 0.6)));
      ctx.fillStyle = g;
      ctx.fillRect(px, 0, 24, h * T);
      ctx.fillStyle = rgba(P.deep, 0.4);
      for (let y = T; y < h * T; y += 4 * T) ctx.fillRect(px, y, 24, 3);
    }
  }
  for (const f of enc.frames || []) {
    const x0 = f.x * T;
    const y0 = f.y * T;
    const fw = (f.w || 2) * T;
    const fh = (f.h || 3) * T;
    const g = ctx.createLinearGradient(0, y0 - 14, 0, y0 + 4);
    g.addColorStop(0, hex(mix(wood, P.lit, 0.25)));
    g.addColorStop(1, hex(wood));
    ctx.fillStyle = g;
    ctx.fillRect(x0 - 12, y0 - 14, fw + 24, 16);
    for (const sx of [x0 - 10, x0 + fw - 2]) {
      const gs = ctx.createLinearGradient(sx, 0, sx + 12, 0);
      gs.addColorStop(0, hex(mix(wood, P.lit, 0.25)));
      gs.addColorStop(1, hex(mix(wood, P.deep, 0.5)));
      ctx.fillStyle = gs;
      ctx.fillRect(sx, y0, 12, fh);
    }
    stamp(ctx, x0 + fw / 2, y0 - 6, 3, P.accent ?? 0xc8963a, 0.9, 0.3);
  }
  const r = rand(room.id ? room.id.length * 31 : 3);
  for (const f of enc.fgFoliage || []) {
    const cx = (f.x + (f.w || 4) / 2) * T;
    const by = (f.y ?? h) * T;
    foliage(ctx, cx, by - 10, ((f.w || 4) * T) / 2, 34, P.fgLeaf ?? 0x1e2a22, r, { density: 1.2 });
  }
}
