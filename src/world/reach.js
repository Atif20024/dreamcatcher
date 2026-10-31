// Where can Jo get back from? A tile-level reach map of a level grid (the
// rows of chars RoomBuilder reads), used two ways:
//   - a lint: every place Jo can get to from the start has a way back to
//     the level's home (no drop into a pocket with no ladder, steps or floor
//     out of it; tests/reach.test.js runs it on the station)
//   - a safety net: standing on a cell outside the home set, or below the
//     floor, means Jo is stuck, and the scene puts him back on safe ground
//
// Pure code, no Phaser. The model is deliberately generous (a jump rises up
// to 4 tiles and carries up to 4 across; a full jump is about 4.7 tiles), so
// a cell it calls stuck really is stuck and the net never fires on a real
// route. A node is a cell Jo's feet can be in: three clear rows of body
// (76 px is 2.4 tiles) over a floor, or any rung of a ladder.
import { roleOf, isSolidChar, isSlopeChar } from '../builders/legend.js';

export const REACH = { rise: 4, across: 4, body: 3 };

export function reachGrid(rows, opts = {}) {
  const { rise, across, body } = { ...REACH, ...opts };
  const H = rows.length;
  const W = Math.max(...rows.map((r) => r.length));
  const ch = (c, r) => (r < 0 ? '.' : r >= H || c < 0 || c >= W ? '#' : rows[r][c] || '.');
  const ladder = (c, r) => roleOf(ch(c, r)) === 'ladder';
  // a slope or a stair is something to stand on, not to stand in (Jo walks it
  // as a surface a tile or less high, which a rise of 4 more than covers)
  const blocked = (c, r) => isSolidChar(ch(c, r)) || isSlopeChar(ch(c, r));
  const floor = (c, r) => blocked(c, r) || roleOf(ch(c, r)) === 'oneway' || ladder(c, r);
  const clear = (c, r0, r1) => {
    for (let r = r0; r <= r1; r++) if (blocked(c, r)) return false;
    return true;
  };
  const node = (c, r) => c >= 0 && c < W && r >= 0 && r < H && clear(c, r - body + 1, r) && (ladder(c, r) || floor(c, r + 1));
  const key = (c, r) => r * W + c;

  // every move out of a node: along a ladder, or a jump / step / drop. A jump
  // goes up in its own column to an apex row, across at the apex, then falls
  // in the landing column to the first floor under it.
  const out = (c, r) => {
    const to = [];
    if (ladder(c, r)) {
      if (node(c, r - 1)) to.push([c, r - 1]);
      if (node(c, r + 1)) to.push([c, r + 1]);
    }
    if (ladder(c, r + 1) && node(c, r + 1)) to.push([c, r + 1]); // down through a floor hatch
    for (let a = r; a >= r - rise; a--) {
      if (!clear(c, a - body + 1, r)) break;
      for (const dir of [-1, 1]) {
        for (let dx = 1; dx <= across; dx++) {
          const cx = c + dir * dx;
          if (!clear(cx, a - body + 1, a)) break; // a wall at the apex
          // fall in this column to the first node (a ladder catches him too)
          for (let y = a; y < H; y++) {
            if (blocked(cx, y)) break;
            if (node(cx, y)) {
              to.push([cx, y]);
              if (!ladder(cx, y)) break;
            }
          }
        }
      }
    }
    return to;
  };

  const nodes = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (node(c, r)) nodes.push([c, r]);
  const edges = new Map();
  const back = new Map();
  for (const [c, r] of nodes) {
    const k = key(c, r);
    const list = out(c, r).map(([x, y]) => key(x, y));
    edges.set(k, list);
    for (const t of list) {
      if (!back.has(t)) back.set(t, []);
      back.get(t).push(k);
    }
  }
  const walk = (starts, graph) => {
    const seen = new Set(starts.filter(([c, r]) => node(c, r)).map(([c, r]) => key(c, r)));
    const q = [...seen];
    while (q.length) {
      const k = q.pop();
      for (const t of graph.get(k) || []) {
        if (!seen.has(t)) {
          seen.add(t);
          q.push(t);
        }
      }
    }
    return seen;
  };
  const cell = (k) => [k % W, Math.floor(k / W)];
  return {
    W,
    H,
    node,
    // every node Jo can get to from these cells
    from: (starts) => walk(starts, edges),
    // every node Jo can get back to these cells from
    to: (goals) => walk(goals, back),
    has: (set, c, r) => set.has(key(c, r)),
    cell,
  };
}

// The pockets: nodes reachable from `start` that cannot get back to `home`
// (both lists of [col, row] feet cells). Empty for a sound level.
export function pockets(rows, start, home, opts) {
  const g = reachGrid(rows, opts);
  const there = g.from(start);
  const back = g.to(home);
  return [...there].filter((k) => !back.has(k)).map(g.cell);
}
