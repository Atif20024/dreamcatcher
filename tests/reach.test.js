import { describe, it, expect } from 'vitest';
import { buildHubMap, HUB_ROWS } from '../src/data/hub/map.js';
import { reachGrid, pockets } from '../src/world/reach.js';

// the station's home: the hall's concourse (feet in row 25, cols 31-78)
const HOME = Array.from({ length: 48 }, (_, i) => [31 + i, HUB_ROWS.FLOOR - 1]);
const START = [[3, 29]]; // the street

describe('reach: every drop has a way back', () => {
  it('the station has no pocket: everywhere Jo can get to, he can get back to the hall from', () => {
    expect(pockets(buildHubMap(), START, HOME)).toEqual([]);
  });

  it('the roof is reached, end to end, and every cell of it gets home', () => {
    const g = reachGrid(buildHubMap(), { lids: true });
    const there = g.from(START);
    const back = g.to(HOME);
    const row = HUB_ROWS.ROOF - 1;
    const roof = [];
    for (let c = 0; c < g.W; c++) if (g.node(c, row) && g.has(there, c, row)) roof.push(c);
    expect(roof.length).toBeGreaterThan(100);
    expect(Math.max(...roof)).toBe(g.W - 1); // the leads run to the east end wall
    for (const c of roof) expect(g.has(back, c, row)).toBe(true);
  });

  it('finds a shaft behind a wall too tall to jump (the old gate end)', () => {
    const rows = [
      '..........',
      'H#####....',
      'H.....##..',
      'H.....##..',
      'H.....##..',
      'H.....##..',
      'H.....##..',
      'H.....##..',
      '##########',
    ];
    const p = pockets(rows, [[2, 7]], [[2, 7]]);
    expect(p).toContainEqual([8, 7]);
    expect(p).toContainEqual([9, 7]);
    expect(p).toHaveLength(2); // the roof, the wall top and the floor all get home
  });

  it('a ladder out of the same shaft makes it sound', () => {
    const rows = [
      '..........',
      'H#####....',
      'H.....##.H',
      'H.....##.H',
      'H.....##.H',
      'H.....##.H',
      'H.....##.H',
      'H.....##.H',
      '##########',
    ];
    expect(pockets(rows, [[2, 7]], [[2, 7]])).toEqual([]);
  });

  // the owner's bug: "before i enter the platform, there is a ladder. but as
  // i reach there, i move back to upper level". The undercroft ladder hangs
  // under a solid floor tile (the grate), which the reach map read as a wall:
  // the whole undercroft had no way home, so the safety net put Jo back on
  // the concourse the moment he stood at the ladder's foot.
  it('the ladder under the grate leads down to the undercroft and back up (the lid hatch)', () => {
    const g = reachGrid(buildHubMap(), { lids: true });
    const there = g.from(START);
    const back = g.to(HOME);
    const foot = [77, HUB_ROWS.UNDER - 1]; // the ladder's foot, on the bedrock
    expect(g.has(there, ...foot)).toBe(true);
    expect(g.has(back, ...foot)).toBe(true);
    // and the whole undercroft floor, end to end, is somewhere he can get home from
    for (let c = 30; c < 172; c++) if (g.node(c, HUB_ROWS.UNDER - 1)) expect(g.has(back, c, HUB_ROWS.UNDER - 1)).toBe(true);
  });

  it('a lid hatch in a small grid: down through the tile, and up out of it', () => {
    const rows = [
      '..........',
      '..........',
      '..........',
      '##########', // the floor, with a ladder under the tile at col 4
      '....H.....',
      '....H.....',
      '....H.....',
      '....H.....',
      '##########',
    ];
    const g = reachGrid(rows, { lids: true });
    expect(g.has(g.from([[1, 2]]), 4, 7)).toBe(true); // down
    expect(g.has(g.to([[1, 2]]), 4, 7)).toBe(true); // and back up
    expect(g.has(g.to([[1, 2]]), 8, 7)).toBe(true); // anywhere down there
    // a two-tile slab is not a lid: Jo cannot climb through it
    const thick = rows.slice();
    thick[4] = '##########';
    thick[5] = '....H.....';
    expect(g.has(reachGrid(thick, { lids: true }).from([[1, 2]]), 4, 7)).toBe(false);
    // where the scene does not let a climber through (no ladderLids), the
    // Player treats the tile as a ceiling, and so does the model
    const shut = reachGrid(rows);
    expect(shut.has(shut.from([[1, 2]]), 4, 7)).toBe(false);
    expect(shut.has(shut.to([[1, 2]]), 4, 7)).toBe(false);
  });
});

