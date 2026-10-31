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
    const g = reachGrid(buildHubMap());
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
});
