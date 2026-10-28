// Terrain (plan 2.3): a room's grid + material(s) → painted static layers
// and collision. The pure rules (terrainRules.js) decide which pieces each
// tile wears and where the fringe grows; this file paints them into canvases
// (StaticBaker turns those into chunk textures) and builds merged static
// bodies (one per horizontal run of solid tiles, not one per tile).
//
//   const t = Terrain.paint(room, lib, { props, propsExtra, palette })   // canvases + live list
//   const c = Terrain.colliders(scene, roomGraphEntry)                    // physics groups
//   Terrain.surfaceAt(room, lib)(tx, ty)                                  // 'grass' | 'stone' | 'wood'…
import { roleOf, isSolidChar } from '../builders/legend.js';
import { classifyRoom, evaluateDecor, materialMap, seedOf, gridView } from './terrainRules.js';
import { canvas as mkCanvas, T } from '../art/materials/painters.js';
import { paintDecor } from '../art/materials/decor.js';
import { paintProp } from '../art/props.js';
import { paintBackWall, paintFgFrame, washCanvas } from './Enclosure.js';
import { mix, rgba, hex, stamp, gradientV } from '../art/paint.js';

const decorCache = new Map();
function decor(key, palette) {
  const k = `${key}|${JSON.stringify(palette)}`;
  if (!decorCache.has(k)) decorCache.set(k, paintDecor(key, palette));
  return decorCache.get(k);
}

// a room-wide prop placement → its draw rect in room px
export function propRect(p, def) {
  const [ax, ay] = def.anchor || [0.5, 1];
  const sc = p.scale || 1;
  // x: tile column centre; y: for floor props (anchor y = 1) the floor row's top edge
  const px = (p.x + 0.5) * T + (p.dx || 0);
  const py = (ay === 1 ? p.y * T : (p.y + 0.5) * T) + (p.dy || 0);
  return { x: px - def.w * sc * ax, y: py - def.h * sc * ay, w: def.w * sc, h: def.h * sc, cx: px, cy: py };
}

function drawSpecial(ctx, role, x, y, sheet) {
  const P = sheet.P;
  const px = x * T;
  const py = y * T;
  if (role === 'oneway') {
    ctx.drawImage(sheet.oneway[(x + y) % sheet.oneway.length], px, py);
  } else if (role === 'ladder') {
    const wood = P.wood ?? 0x7a5232;
    for (const rx of [6, 22]) {
      const g = ctx.createLinearGradient(px + rx, 0, px + rx + 4, 0);
      g.addColorStop(0, hex(mix(wood, P.lit, 0.3)));
      g.addColorStop(1, hex(mix(wood, P.deep, 0.4)));
      ctx.fillStyle = g;
      ctx.fillRect(px + rx, py, 4, T);
    }
    for (const ry of [6, 22]) {
      ctx.fillStyle = hex(mix(wood, P.lit, 0.1));
      ctx.fillRect(px + 8, py + ry, 16, 3);
      ctx.fillStyle = rgba(P.deep, 0.5);
      ctx.fillRect(px + 8, py + ry + 3, 16, 1);
    }
  } else if (role === 'hazard') {
    // hazards are the reserved red-orange (F5.1): thorns on a dark base
    ctx.fillStyle = rgba(0x2a1418, 0.9);
    ctx.fillRect(px, py + 24, T, 8);
    for (let i = 0; i < 4; i++) {
      const sx = px + 2 + i * 8;
      ctx.fillStyle = hex(i % 2 ? 0xd8542a : 0xe8743a);
      ctx.beginPath();
      ctx.moveTo(sx, py + 28);
      ctx.lineTo(sx + 3, py + 12 + (i % 2) * 4);
      ctx.lineTo(sx + 7, py + 28);
      ctx.fill();
      ctx.fillStyle = rgba(0xffd0a0, 0.6);
      ctx.fillRect(sx + 2, py + 15 + (i % 2) * 4, 1, 6);
    }
  } else if (role === 'liquid') {
    gradientV(ctx, px, py, T, T, [[0, 0x3a5a7a, 0.85], [1, 0x1a2a40, 0.95]]);
    ctx.fillStyle = rgba(0xd8e8f0, 0.5);
    ctx.fillRect(px, py + 2, T, 1);
  } else if (role.startsWith('slope')) {
    ctx.drawImage(sheet.slope[role], px, py);
  }
}

export const Terrain = {
  // paint every static layer of one room; returns canvases + live things
  paint(room, lib, { propsExtra = {}, palette = {}, decorIds = [] } = {}) {
    const grid = room.grid;
    const v = gridView(grid);
    const W = v.w * T;
    const H = v.h * T;
    const matAt = materialMap(room);
    const seed = seedOf(room.id);
    const mats = new Set([room.material, ...(room.regions || []).map((r) => r.material)]);
    const P = { ...lib.sheet(room.material).P, ...palette };

    // ---- the mid layer: terrain ----
    const mid = mkCanvas(W, H);
    const m = mid.getContext('2d');
    const tile = mkCanvas(T, T);
    const tc = tile.getContext('2d');
    const tiles = classifyRoom(grid, { seed, variants: 4 });
    const solidMask = mkCanvas(W, H);
    const sm = solidMask.getContext('2d');
    for (const c of tiles) {
      const sheet = lib.sheet(matAt(c.x, c.y));
      if (c.role === 'climbable') {
        tc.clearRect(0, 0, T, T);
        tc.drawImage(sheet.body[c.variant % sheet.body.length], 0, 0);
        tc.fillStyle = rgba(sheet.P.deep, 0.45);
        for (const gx of [7, 15, 23]) tc.fillRect(gx, 0, 2, T);
        tc.fillStyle = rgba(sheet.P.lit, 0.25);
        for (const gx of [9, 17, 25]) tc.fillRect(gx, 0, 1, T);
        m.drawImage(tile, c.x * T, c.y * T);
        sm.fillRect(c.x * T, c.y * T, T, T);
        continue;
      }
      tc.globalCompositeOperation = 'source-over';
      tc.clearRect(0, 0, T, T);
      tc.drawImage((c.top ? sheet.lip : sheet.body)[c.variant % sheet.lip.length], 0, 0);
      if (c.bottom) tc.drawImage(sheet.under[c.variant % sheet.under.length], 0, 0);
      if (c.left) tc.drawImage(sheet.edgeL, 0, 0);
      if (c.right) tc.drawImage(sheet.edgeR, 0, 0);
      if (c.innerTL) tc.drawImage(sheet.innerTL, 0, 0);
      if (c.innerTR) tc.drawImage(sheet.innerTR, 0, 0);
      if (c.stepL) tc.drawImage(sheet.stepL, 0, 0);
      if (c.stepR) tc.drawImage(sheet.stepR, 0, 0);
      if (c.capL || c.capR) {
        tc.globalCompositeOperation = 'destination-out';
        if (c.capL) tc.drawImage(sheet.capL, 0, 0);
        if (c.capR) tc.drawImage(sheet.capR, 0, 0);
        tc.globalCompositeOperation = 'source-over';
      }
      m.drawImage(tile, c.x * T, c.y * T);
      sm.fillRect(c.x * T, c.y * T, T, T);
    }
    // subsoil: buried stones and roots laid across tile edges at room scale,
    // so the ground reads as one deep mass, not a stack of tiles
    m.save();
    m.globalCompositeOperation = 'source-atop';
    for (const c of tiles) {
      if (c.top || c.role !== 'solid') continue;
      const kind = lib.def(matAt(c.x, c.y)).kind;
      if (kind !== 'cobble' && kind !== 'meadow') continue;
      const sh = lib.sheet(matAt(c.x, c.y)).P;
      const hsh = (k) => ((c.x * 73856093) ^ (c.y * 19349663) ^ (k * 83492791)) >>> 0;
      if (hsh(1) % 100 < 45) {
        const x = c.x * T + (hsh(2) % 32);
        const y = c.y * T + (hsh(3) % 32);
        const rx = 3 + (hsh(4) % 7);
        const ry = 2 + (hsh(5) % 4);
        m.fillStyle = rgba(sh.deep, 0.5);
        m.beginPath();
        m.ellipse(x + 1, y + 1.5, rx + 1, ry + 1, 0, 0, Math.PI * 2);
        m.fill();
        const g = m.createRadialGradient(x - rx * 0.4, y - ry * 0.6, 0.5, x, y, rx * 1.2);
        g.addColorStop(0, hex(mix(sh.stone, sh.lit, 0.35)));
        g.addColorStop(1, hex(mix(sh.stone, sh.deep, 0.45)));
        m.fillStyle = g;
        m.beginPath();
        m.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        m.fill();
      }
      if (kind === 'meadow' && c.depth <= 2 && hsh(6) % 100 < 30) {
        const x = c.x * T + (hsh(7) % 32);
        m.strokeStyle = rgba(sh.root, 0.6);
        m.lineWidth = 1.2;
        m.beginPath();
        m.moveTo(x, c.y * T - 4);
        m.bezierCurveTo(x + 6, c.y * T + 10, x - 6, c.y * T + 18, x + 4, c.y * T + 28 + (hsh(8) % 20));
        m.stroke();
      }
      // a faint stratum line every few rows, wandering
      if (c.depth === 2 && hsh(9) % 100 < 60) {
        m.fillStyle = rgba(sh.lit, 0.06);
        m.fillRect(c.x * T, c.y * T + (hsh(10) % 20), T, 3);
      }
    }
    m.restore();
    // weight: each solid mass darkens with depth below the local ground line.
    // The line is the lowest surface among nearby columns (a wall standing on
    // the ground is a lit face, not a deeper hole), so no column reads darker
    // than its neighbours.
    m.save();
    m.globalCompositeOperation = 'source-atop';
    const tops = [];
    for (let x = 0; x < v.w; x++) {
      tops[x] = [];
      for (let y = 0; y < v.h; y++) if (v.solid(x, y) && !v.solid(x, y - 1)) tops[x].push(y);
    }
    for (let x = 0; x < v.w; x++) {
      for (const y of tops[x]) {
        let run = 0;
        while (y + run < v.h && v.solid(x, y + run)) run++;
        let line = y;
        for (let dx = -3; dx <= 3; dx++) for (const ny of tops[x + dx] || []) if (ny >= y && ny <= y + 4 && ny < y + run) line = Math.max(line, ny);
        const top = line * T + 10;
        const bot = (y + run) * T;
        if (bot - top < 8) continue;
        const g = m.createLinearGradient(0, top, 0, top + 4 * T);
        g.addColorStop(0, rgba(P.deep, 0));
        g.addColorStop(1, rgba(P.deep, 0.5));
        m.fillStyle = g;
        m.fillRect(x * T, top, T, Math.min(bot - top, 4 * T));
        if (bot > top + 4 * T) {
          m.fillStyle = rgba(P.deep, 0.5);
          m.fillRect(x * T, top + 4 * T, T, bot - top - 4 * T);
        }
      }
    }
    m.restore();
    // a low-frequency wash so the ground reads as one painted mass, not a grid
    const wash = washCanvas(W, H, seed % 997, 64);
    const wc = wash.getContext('2d');
    wc.globalCompositeOperation = 'destination-in';
    wc.drawImage(solidMask, 0, 0);
    m.globalCompositeOperation = 'overlay';
    m.globalAlpha = 0.55;
    m.drawImage(wash, 0, 0);
    m.globalAlpha = 1;
    m.globalCompositeOperation = 'source-over';
    // the non-solid roles
    for (let y = 0; y < v.h; y++)
      for (let x = 0; x < v.w; x++) {
        const role = v.role(x, y);
        if (role === 'empty' || isSolidChar(grid[y][x])) continue;
        drawSpecial(m, role, x, y, lib.sheet(matAt(x, y)));
      }

    // ---- decor (fringe) ----
    const fg = mkCanvas(W, H);
    const f = fg.getContext('2d');
    const rules = lib.rulesFor([...mats], [...(room.decor || []), ...decorIds]);
    const placed = evaluateDecor(rules, grid, { seed, materialAt: matAt });
    const decorPal = (x, y) => lib.sheet(matAt(x, Math.min(v.h - 1, y + 1))).P;
    for (const d of placed) {
      const art = decor(d.key, { ...decorPal(d.x, d.y), ...palette });
      if (!art) continue;
      const ctx = d.layer === 'fg' ? f : m;
      let px = (d.x + 0.5) * T - art.ax;
      let py;
      const hanging = /^(roots|ivy|drip|web|moss_edge)/.test(d.key);
      if (d.key.startsWith('web')) {
        // into the corner, mirrored for the right wall
        py = d.y * T;
        ctx.save();
        if (d.side === 'right') {
          ctx.translate((d.x + 1) * T, py);
          ctx.scale(-1, 1);
          ctx.drawImage(art.c, 0, 0);
        } else ctx.drawImage(art.c, d.x * T, py);
        ctx.restore();
        continue;
      }
      if (d.key.startsWith('moss_edge')) {
        px = d.side === 'left' ? d.x * T - art.ax + 4 : (d.x + 1) * T - art.ax - 4;
        py = d.y * T;
      } else if (hanging) py = (d.y + 1) * T - 2;
      else if (['pebble', 'dust'].some((k) => d.key.startsWith(k))) {
        px = d.side === 'left' ? d.x * T + 2 : (d.x + 1) * T - art.c.width - 2;
        py = (d.y + 1) * T - art.ay - 1;
      } else py = d.y * T - art.ay + 2;
      // a little jitter so a row of tufts is not a fence
      const j = ((d.x * 7 + d.y * 3) % 9) - 4;
      ctx.drawImage(art.c, Math.round(px + j), Math.round(py));
    }

    // ---- back layer (enclosure back wall, props behind) and props ----
    const back = mkCanvas(W, H);
    const b = back.getContext('2d');
    const live = [];
    const lights = [];
    for (const p of room.props || []) {
      const art = paintProp(p.prop, { ...palette, ...(p.palette || {}) }, propsExtra);
      if (!art) continue;
      const r = propRect(p, art.def);
      if (art.def.light && p.lit !== false) lights.push({ x: r.x + art.def.light.x * (p.scale || 1), y: r.y + art.def.light.y * (p.scale || 1), r: art.def.light.r, color: art.def.light.color, prop: p });
    }
    for (const l of room.lights || []) lights.push({ x: (l.x + 0.5) * T, y: (l.y + 0.5) * T, r: l.r || 120, color: l.color || 0xffc070 });
    if (room.enclosure && room.enclosure.backWall) paintBackWall(b, room, { ...P, ...(room.enclosure.palette || {}) }, lights);
    for (const p of room.props || []) {
      const art = paintProp(p.prop, { ...palette, ...(p.palette || {}) }, propsExtra);
      if (!art) continue;
      const r = propRect(p, art.def);
      if (p.live || art.def.live || p.when || p.unless) {
        live.push({ ...p, rect: r, def: art.def, canvas: art.c });
        continue;
      }
      const layer = p.layer || 'mid';
      // 'mid' props stand on the ground but behind the terrain's fringe:
      // painted into the back canvas when the room has no back wall to hide
      const ctx = layer === 'fg' ? f : layer === 'back' ? b : b;
      ctx.save();
      if (p.alpha !== undefined) ctx.globalAlpha = p.alpha;
      if (p.flip) {
        ctx.translate(r.x + r.w, r.y);
        ctx.scale(-1, 1);
        ctx.drawImage(art.c, 0, 0, r.w, r.h);
      } else ctx.drawImage(art.c, r.x, r.y, r.w, r.h);
      ctx.restore();
      // a soft contact shadow under floor props
      if ((art.def.anchor || [0.5, 1])[1] === 1 && layer !== 'fg') {
        const sh = b.createRadialGradient(r.cx, r.cy, 2, r.cx, r.cy, r.w * 0.5);
        sh.addColorStop(0, rgba(P.deep, 0.35));
        sh.addColorStop(1, rgba(P.deep, 0));
        b.fillStyle = sh;
        b.fillRect(r.x - 10, r.cy - 8, r.w + 20, 12);
      }
    }
    if (room.enclosure) paintFgFrame(f, room, { ...P, ...(room.enclosure.palette || {}) });
    void stamp;
    return { W, H, back, mid, fg, live, lights, decorCount: placed.length };
  },

  // collision: merged runs of solid tiles → static bodies (invisible zones)
  colliders(scene, r) {
    const grid = r.data.grid;
    const solids = scene.physics.add.staticGroup();
    const oneWays = scene.physics.add.staticGroup();
    const hazards = scene.physics.add.staticGroup();
    const X = r.x0;
    const Y = r.y0;
    for (let y = 0; y < grid.length; y++) {
      let x = 0;
      const row = grid[y];
      while (x < row.length) {
        const ch = row[x];
        const role = roleOf(ch);
        if (isSolidChar(ch) && role !== 'gate') {
          let e = x;
          while (e + 1 < row.length && isSolidChar(row[e + 1]) && roleOf(row[e + 1]) !== 'gate') e++;
          const z = scene.add.zone(X + x * T, Y + y * T, (e - x + 1) * T, T).setOrigin(0, 0);
          scene.physics.add.existing(z, true);
          solids.add(z);
          x = e + 1;
          continue;
        }
        if (role === 'oneway') {
          let e = x;
          while (e + 1 < row.length && roleOf(row[e + 1]) === 'oneway') e++;
          const z = scene.add.zone(X + x * T, Y + y * T, (e - x + 1) * T, 12).setOrigin(0, 0);
          scene.physics.add.existing(z, true);
          z.body.checkCollision.down = false;
          z.body.checkCollision.left = false;
          z.body.checkCollision.right = false;
          oneWays.add(z);
          x = e + 1;
          continue;
        }
        if (role === 'hazard') {
          const z = scene.add.zone(X + x * T + 4, Y + y * T + 16, 24, 16).setOrigin(0, 0);
          scene.physics.add.existing(z, true);
          hazards.add(z);
        }
        x++;
      }
    }
    return {
      solids,
      oneWays,
      hazards,
      destroy() {
        // the scene's shutdown may have destroyed the groups already
        for (const g of [solids, oneWays, hazards]) if (g.children) g.destroy(true);
      },
    };
  },

  // world-tile grids the Player reads (ladders, ribbed walls, slopes, solids)
  fillGrids(target, r) {
    const grid = r.data.grid;
    for (let y = 0; y < grid.length; y++)
      for (let x = 0; x < grid[y].length; x++) {
        const role = roleOf(grid[y][x]);
        const wy = r.ty + y;
        const wx = r.tx + x;
        if (role === 'ladder') (target.ladderGrid[wy] ||= {})[wx] = true;
        if (role === 'climbable') (target.climbGrid[wy] ||= {})[wx] = true;
        if (role.startsWith('slope')) (target.slopeGrid[wy] ||= {})[wx] = role;
        if (isSolidChar(grid[y][x]) && role !== 'gate') (target.solidGrid[wy] ||= {})[wx] = true;
        if (role === 'liquid') (target.surfaceGrid[wy] ||= {})[wx] = 'liquid';
      }
  },

  surfaceAt(r, lib) {
    const matAt = materialMap(r.data);
    return (tx, ty) => {
      const x = tx - r.tx;
      const y = ty - r.ty;
      if (y < 0 || y >= r.h || x < 0 || x >= r.w) return null;
      if (!isSolidChar(r.data.grid[y][x] || '.') && roleOf(r.data.grid[y][x] || '.') !== 'oneway') return null;
      return lib.def(matAt(x, y)).surface || 'stone';
    };
  },
};

export default Terrain;
