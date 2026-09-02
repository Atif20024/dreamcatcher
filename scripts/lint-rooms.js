// D2 — room validation. `npm run lint:rooms`
import chefRooms from '../src/data/chef/rooms.js';
import musicianRooms from '../src/data/musician/rooms.js';
import hubRooms from '../src/data/hub/rooms.js';
import { roleOf, isSolidChar, isSlopeChar } from '../src/builders/legend.js';
import { maskAt, wearAt } from '../src/builders/autotile.js';

const DREAMS = { chef: chefRooms, musician: musicianRooms, hub: hubRooms };
let failures = 0;
let warnings = 0;

const fail = (dream, room, msg) => {
  console.log(`  ✗ [${dream}/${room}] ${msg}`);
  failures += 1;
};
const warn = (dream, room, msg) => {
  console.log(`  ! [${dream}/${room}] ${msg}`);
  warnings += 1;
};

for (const [dream, rooms] of Object.entries(DREAMS)) {
  console.log(`\n${dream}: ${rooms.length} rooms`);

  const sectionsWithFoes = new Set();
  const roomHasSlope = rooms.map((r) =>
    r.grid.some((line) => [...line].some((ch) => isSlopeChar(ch) || roleOf(ch) === 'stair'))
  );

  rooms.forEach((room, ri) => {
    const grid = room.grid;
    const h = grid.length;
    const w = Math.max(...grid.map((g) => g.length));
    const at = (x, y) => (grid[y] && grid[y][x]) || '.';
    const solid = (x, y) => isSolidChar(at(x, y));

    // (2) landmark
    if (!room.bg || !room.bg.landmark) fail(dream, room.id, 'no bg.landmark');

    // (1) three identical resolved tiles in a row
    let run = 1;
    let worst = 0;
    for (let y = 0; y < h; y++) {
      run = 1;
      for (let x = 1; x < w; x++) {
        const a = solid(x - 1, y) ? `${maskAt(solid, x - 1, y)}:${wearAt(x - 1, y)}` : null;
        const b = solid(x, y) ? `${maskAt(solid, x, y)}:${wearAt(x, y)}` : null;
        if (a && b && a === b) {
          run += 1;
          worst = Math.max(worst, run);
        } else run = 1;
      }
    }
    if (worst >= 3) fail(dream, room.id, `${worst} identical tiles in a row (autotile wear should break this)`);

    // (4) foes per section
    const foes = (room.objects || []).filter((o) => o.type === 'foe');
    if (foes.length) sectionsWithFoes.add(room.section);

    // (5) gates need requires or a plate
    for (const g of (room.objects || []).filter((o) => o.type === 'gate')) {
      const plate = (room.objects || []).some((o) => o.type === 'plate' && o.opens === g.id);
      if (!(g.requires && g.requires.length) && !plate) fail(dream, room.id, `gate ${g.id} has no requires and no plate`);
    }

    // (6) anti-skip: a full-height solid column at a room seam needs | or G
    const seamCols = [0, w - 1];
    for (const x of seamCols) {
      let solidRun = 0;
      let hasEscape = false;
      for (let y = 0; y < h; y++) {
        if (solid(x, y)) solidRun += 1;
        const role = roleOf(at(x, y));
        if (role === 'climbable' || role === 'gate' || role === 'ladder') hasEscape = true;
      }
      if (solidRun === h && !hasEscape) fail(dream, room.id, `seam column x=${x} is a full solid wall with no | or G`);
    }

    // (7) drops > 10 tiles with no ledge inside
    for (let x = 0; x < w; x++) {
      let gap = 0;
      let gapTop = 0;
      for (let y = 0; y < h; y++) {
        const empty = !solid(x, y) && roleOf(at(x, y)) !== 'oneway';
        if (empty) {
          if (gap === 0) gapTop = y;
          gap += 1;
        } else {
          // only a drop the player can actually fall into: the tile above the
          // gap must be open. A void sealed under a floor is not a hazard.
          const openFromAbove = gapTop === 0 || !solid(x, gapTop - 1);
          if (gap > 10 && gapTop > 0 && openFromAbove) {
            // is there a ledge within 2 columns?
            let ledge = false;
            for (let dx = -2; dx <= 2 && !ledge; dx++) {
              for (let y2 = gapTop; y2 < gapTop + gap; y2++) {
                const r = roleOf(at(x + dx, y2));
                if (r === 'oneway' || r === 'ladder' || r === 'climbable' || isSolidChar(at(x + dx, y2))) {
                  ledge = true;
                  break;
                }
              }
            }
            if (!ledge) warn(dream, room.id, `drop of ${gap} tiles at x=${x} with no ledge`);
          }
          gap = 0;
        }
      }
    }
  });

  // (3) slope/stair coverage
  rooms.forEach((room, ri) => {
    if (roomHasSlope[ri]) return;
    const prev = ri > 0 && roomHasSlope[ri - 1];
    const next = ri < rooms.length - 1 && roomHasSlope[ri + 1];
    if (!prev && !next) fail(dream, room.id, 'no slope/stair and no neighbour with one');
  });

  // (4) sections
  const exempt = new Set(rooms.filter((r) => r.allowNoFoes).map((r) => r.section));
  const allSections = new Set(rooms.map((r) => r.section));
  for (const s of allSections) {
    if (!sectionsWithFoes.has(s) && !exempt.has(s)) warn(dream, s, 'section has no foe');
  }
}

console.log(`\n${failures} failures, ${warnings} warnings`);
process.exit(failures > 0 ? 1 : 0);
