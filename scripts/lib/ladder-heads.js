// Ladder-head headroom (ladder review r1, SHOULD 1): every ladder head Jo
// steps out at (the cap on an open top rung, the plank over it, or the lid
// over it) needs clear rows above the surface he steps onto. Under 2 rows
// not even the legacy 44 px body fits (the Writer's top shelf had 1: Jo was
// shoved back into the shaft and re-grabbed it); under REACH.body (3) the
// 82 px body does not, which is reported as a warning for the dreams still
// on the legacy body.
import { roleOf, isSolidChar, isSlopeChar } from '../../src/builders/legend.js';

export const HEAD_MIN_ROWS = 2;

export function ladderHeads(dream, rooms) {
  const out = [];
  for (const room of rooms) {
    const g = room.grid;
    const at = (x, y) => (y < 0 ? '.' : (g[y] && g[y][x]) || '.');
    const blocked = (x, y) => y >= 0 && (isSolidChar(at(x, y)) || isSlopeChar(at(x, y)));
    const W = Math.max(...g.map((r) => r.length));
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < g.length; y++) {
        if (roleOf(at(x, y)) !== 'ladder' || roleOf(at(x, y - 1)) === 'ladder') continue;
        const kind = roleOf(at(x, y - 1)) === 'oneway' ? 'plank' : blocked(x, y - 1) ? 'lid' : 'cap';
        const stand = kind === 'cap' ? y : y - 1; // the row whose top he stands on
        let clear = 0;
        for (let r = stand - 1; r >= stand - 4 && !blocked(x, r); r--) clear++;
        out.push({ dream, room: room.id, col: x, row: y, kind, clear });
      }
    }
  }
  return out;
}
