// Terrain rules (plan 2.3): the pure half of the terrain. Given a room's
// collision grid it answers, per tile, which painted pieces to lay
// (lit lip, body, underside, side edges, inner corners), which hashed
// variant, and where the decor rules place their fringe. No Phaser, no
// canvas: the content lint and the unit tests use it, and the StaticBaker
// paints from its output.
import { roleOf, isSolidChar, isSlopeChar } from '../builders/legend.js';

// deterministic integer hash → [0, 1)
export function hash01(x, y, seed = 0) {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263 + (seed | 0) * 1274126177;
  h = (h ^ (h >>> 13)) * 1274126177;
  h ^= h >>> 16;
  return ((h >>> 0) % 100000) / 100000;
}

// a string seed → int
export function seedOf(s) {
  let h = 0x811c9dc5;
  for (const ch of String(s)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h & 0x7fffffff;
}

// A grid accessor over a room: char, role, solid (out of range = `edge`,
// which defaults to solid so a room's walls read as continuing past it).
export function gridView(grid, { edgeSolid = false } = {}) {
  const h = grid.length;
  const w = Math.max(...grid.map((r) => r.length));
  const ch = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? null : grid[y][x] || '.');
  const solid = (x, y) => {
    const c = ch(x, y);
    if (c === null) return edgeSolid && y >= 0;
    return isSolidChar(c) && roleOf(c) !== 'gate';
  };
  const filled = (x, y) => {
    // what reads as ground for the lip test: solids and slopes
    const c = ch(x, y);
    if (c === null) return edgeSolid && y >= 0;
    return solid(x, y) || isSlopeChar(c);
  };
  return { w, h, ch, solid, filled, role: (x, y) => roleOf(ch(x, y) || '.') };
}

// Which pieces a solid tile wears. Composited (body, then overlays), so
// every one of the 47 blob cases falls out of 4-neighbour + corner flags.
//  top/bottom/left/right: that side is exposed
//  capL/capR: a lit lip that ends here (rounded lip corner)
//  innerTL/innerTR: an inner corner under an overhang edge (shadow)
//  depth: tiles of solid above (0 = the surface) for the weight gradient
export function classifyTile(v, x, y) {
  if (!v.solid(x, y)) return null;
  const top = !v.filled(x, y - 1);
  const bottom = !v.solid(x, y + 1) && y + 1 < v.h;
  const left = !v.filled(x - 1, y) && x > 0;
  const right = !v.filled(x + 1, y) && x + 1 < v.w;
  let depth = 0;
  while (depth < 8 && v.solid(x, y - 1 - depth)) depth++;
  return {
    top,
    bottom,
    left,
    right,
    capL: top && !v.filled(x - 1, y) && x > 0,
    capR: top && !v.filled(x + 1, y) && x + 1 < v.w,
    // a step up beside the lip: shade where the higher block meets this lip
    stepL: top && v.filled(x - 1, y - 1),
    stepR: top && v.filled(x + 1, y - 1),
    innerTL: !top && !left && !v.filled(x - 1, y - 1) && v.solid(x - 1, y),
    innerTR: !top && !right && !v.filled(x + 1, y - 1) && v.solid(x + 1, y),
    depth,
  };
}

// A hashed variant 0..n-1 that never repeats three times in a row along a
// row (the old lint rule: three identical tiles read as a stamp).
export function variantAt(x, y, n, seed = 0) {
  if (n <= 1) return 0;
  const raw = (vx) => Math.floor(hash01(vx, y, seed) * n);
  // walk the row from its start so a bumped tile feeds the next check
  let a = -1;
  let b = -1;
  let v = 0;
  for (let i = 0; i <= x; i++) {
    v = raw(i);
    if (a === v && b === v) v = (v + 1) % n;
    a = b;
    b = v;
  }
  return v;
}

// every solid tile's pieces, as a flat list (the baker's input)
export function classifyRoom(grid, { seed = 0, variants = 4, edgeSolid = false } = {}) {
  const v = gridView(grid, { edgeSolid });
  const out = [];
  for (let y = 0; y < v.h; y++) {
    for (let x = 0; x < v.w; x++) {
      const c = classifyTile(v, x, y);
      if (!c) continue;
      out.push({ x, y, role: v.role(x, y), variant: variantAt(x, y, variants, seed), ...c });
    }
  }
  return out;
}

// ---- decor rules (4.4) ------------------------------------------------------
// A rule: { id, when, place, chance, layer, materials?, every?, seed? }
//   when: 'topExposed'      a lit lip (the tile's top is open air)
//         'ledgeEdge'       a lip that ends at a drop (left or right side)
//         'ceilingExposed'  a tile whose underside is open (roots, drips, webs)
//         'wallBase'        an open tile on the floor, against a wall
//         'hollow'          a lip in a dip (higher ground both sides, ≤ 4 wide)
//         'cornerTop'       an open tile in the top corner against a wall + ceiling
//         'openFloor'       an open tile on the floor with 3 tiles of air above
//   place: a decor key, or 'key_*' to pick a variant ('key_0'…'key_{n-1}', n = rule.variants)
//   chance: 0..1 per candidate (seeded hash, deterministic)
//   every: keep at most one hit per `every` columns in a row (spacing)
//   materials: only on tiles whose material is in the list
export const DECOR_WHEN = ['topExposed', 'ledgeEdge', 'ceilingExposed', 'wallBase', 'hollow', 'cornerTop', 'openFloor'];

function matches(rule, v, x, y) {
  const solid = v.solid;
  const filled = v.filled;
  switch (rule.when) {
    case 'topExposed':
      return solid(x, y) && !filled(x, y - 1);
    case 'ledgeEdge':
      return solid(x, y) && !filled(x, y - 1) && ((!filled(x - 1, y) && x > 0) || (!filled(x + 1, y) && x + 1 < v.w));
    case 'ceilingExposed':
      return solid(x, y) && !filled(x, y + 1) && y + 1 < v.h;
    case 'wallBase':
      return !filled(x, y) && solid(x, y + 1) && (solid(x - 1, y) || solid(x + 1, y));
    case 'hollow': {
      if (!solid(x, y) || filled(x, y - 1)) return false;
      let l = false;
      let r = false;
      for (let d = 1; d <= 4; d++) {
        if (filled(x - d, y - 1)) l = true;
        if (filled(x + d, y - 1)) r = true;
      }
      return l && r;
    }
    case 'cornerTop':
      return !filled(x, y) && solid(x, y - 1) && (solid(x - 1, y) || solid(x + 1, y));
    case 'openFloor':
      return !filled(x, y) && solid(x, y + 1) && !filled(x, y - 1) && !filled(x, y - 2);
    default:
      return false;
  }
}

// placements: [{ rule, x, y, key, layer, side }] in room tiles, deterministic
export function evaluateDecor(rules, grid, { seed = 0, materialAt = () => null, edgeSolid = false } = {}) {
  const v = gridView(grid, { edgeSolid });
  const out = [];
  for (const rule of rules || []) {
    if (!DECOR_WHEN.includes(rule.when)) throw new Error(`decor rule ${rule.id}: unknown 'when' "${rule.when}"`);
    const rs = seed ^ seedOf(rule.id || rule.place);
    const lastAt = new Map();
    for (let y = 0; y < v.h; y++) {
      for (let x = 0; x < v.w; x++) {
        if (!matches(rule, v, x, y)) continue;
        if (rule.materials) {
          // fringe sits on the ground tile: for open-tile rules, the one below
          const ground = ['wallBase', 'openFloor'].includes(rule.when) ? materialAt(x, y + 1) : rule.when === 'cornerTop' ? materialAt(x, y - 1) : materialAt(x, y);
          if (!rule.materials.includes(ground)) continue;
        }
        if (hash01(x, y, rs) >= (rule.chance ?? 1)) continue;
        if (rule.every && x - (lastAt.get(y) ?? -Infinity) < rule.every) continue;
        lastAt.set(y, x);
        let key = rule.place;
        if (key.endsWith('_*')) key = `${key.slice(0, -2)}_${Math.floor(hash01(y, x, rs + 7) * (rule.variants || 3))}`;
        const side = rule.when === 'ledgeEdge' ? (!v.filled(x - 1, y) && x > 0 ? 'left' : 'right') : rule.when === 'wallBase' || rule.when === 'cornerTop' ? (v.solid(x - 1, y) ? 'left' : 'right') : null;
        out.push({ rule: rule.id || rule.place, x, y, key, layer: rule.layer || 'mid', side });
      }
    }
  }
  return out;
}

// a material per tile from the room's default + rect regions ([x0,y0,x1,y1] inclusive)
export function materialMap(room) {
  const regions = room.regions || [];
  return (x, y) => {
    for (let i = regions.length - 1; i >= 0; i--) {
      const [x0, y0, x1, y1] = regions[i].rect;
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return regions[i].material;
    }
    return room.material;
  };
}

// Headroom for the 80 px Jo (owner decision): every standable floor tile in
// a framework room needs `tiles` clear tiles above it. Returns spans.
export function headroomSpans(grid, tiles = 3) {
  const v = gridView(grid);
  const low = [];
  for (let x = 0; x < v.w; x++) {
    for (let y = 1; y < v.h - 1; y++) {
      if (v.filled(x, y) || !(v.solid(x, y + 1) || v.role(x, y + 1) === 'oneway')) continue;
      let clear = 0;
      while (y - clear >= 0 && !v.solid(x, y - clear)) clear += 1;
      if (y - clear < 0) continue; // open sky
      if (clear >= 2 && clear < tiles) low.push([x, y, clear]);
    }
  }
  return low;
}
