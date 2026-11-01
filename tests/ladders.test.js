// Ladder review r1, SHOULD 2-3 and NICE 5: the pure parts of the climb
// (src/world/ladders.js) under vitest, and reach.js kept in step with the
// Player on lids. The browser parts are the ladder scenarios
// (src/dev/scenarios/ladders.js: hub-ladder-undercroft, hub-ladder-roof,
// dream-ladders-both-ways, writer-ladders-both-ways), part of the pre-merge set.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { openLadderTop, overLadder, headroomClear, freshDown, HATCH_PRESS_GRACE_MS } from '../src/world/ladders.js';
import { DREAMS } from '../scripts/lib/rooms-check.js';
import { ladderHeads } from '../scripts/lib/ladder-heads.js';
import { REACH } from '../src/world/reach.js';

const T = 32;
const grid = (rows) => (x, y) => (rows[y] && rows[y][x]) || '.';

describe('openLadderTop', () => {
  const rows = ['......', '..H...', '..H...', '######'];
  it('a ladder cell with open air over it needs a cap', () => {
    expect(openLadderTop(grid(rows), 2, 1)).toBe(true);
    expect(openLadderTop(grid(rows), 2, 2)).toBe(false); // a rung over it
    expect(openLadderTop(grid(rows), 3, 1)).toBe(false); // not a ladder
    expect(openLadderTop(grid(rows), 2, 0)).toBe(false); // the grid's top row
  });
  it('a plank or a solid over the head is not open', () => {
    expect(openLadderTop(grid(['..=...', '..H...']), 2, 1)).toBe(false);
    expect(openLadderTop(grid(['..#...', '..H...']), 2, 1)).toBe(false);
  });
});

describe('overLadder', () => {
  // a ladder in col 2, rows 3..5
  const lg = { 3: { 2: true }, 4: { 2: true }, 5: { 2: true } };
  const p = { x: 2 * T + 16 };
  const tile = (row, h = 12, top = row * T) => ({ left: 2 * T, right: 3 * T, top, bottom: top + h, height: h });
  it('the cap on the top rung (its own row has a rung)', () => {
    expect(overLadder(lg, p, tile(3))).toBe(true);
  });
  it('a plank or lid right over the head (a rung under its row)', () => {
    expect(overLadder(lg, p, tile(2, 12))).toBe(true);
    expect(overLadder(lg, p, tile(2, 32))).toBe(true);
  });
  it('a plank under the foot is something to land on', () => {
    expect(overLadder(lg, p, tile(6))).toBe(false);
  });
  it('another column, a thick body, or no ladder grid: no', () => {
    expect(overLadder(lg, { x: 5 * T }, tile(3))).toBe(false);
    expect(overLadder(lg, p, tile(2, 64))).toBe(false);
    expect(overLadder(null, p, tile(3))).toBe(false);
  });
});

describe('headroomClear (SHOULD 1: no step-out under a low ceiling)', () => {
  // a ceiling in row 1; a plank's top at row 3 (y 96)
  const solidAt = (tx, ty) => ty === 1;
  it('a 44 px body under a ceiling one tile up does not fit; two tiles does', () => {
    expect(headroomClear(solidAt, 0, 3 * T, 44)).toBe(false);
    expect(headroomClear((tx, ty) => ty === 0, 0, 3 * T, 44)).toBe(true);
  });
  it('the 82 px body needs three tiles', () => {
    expect(headroomClear((tx, ty) => ty === 0, 0, 3 * T, 82)).toBe(false);
    expect(headroomClear((tx, ty) => ty === -1, 0, 3 * T, 82)).toBe(true);
  });
  it('no solid map: nothing to check', () => {
    expect(headroomClear(null, 0, 0, 82)).toBe(true);
  });
});

describe('freshDown (NICE 5: DOWN held across a hatch walks on)', () => {
  it('pressed on the hatch, or just before arriving: grabs', () => {
    expect(freshDown(1000, 900)).toBe(true);
    expect(freshDown(900 - HATCH_PRESS_GRACE_MS + 1, 900)).toBe(true);
  });
  it('held from long before: no', () => {
    expect(freshDown(100, 900)).toBe(false);
  });
  it('not on a hatch, or never pressed: no', () => {
    expect(freshDown(1000, null)).toBe(false);
    expect(freshDown(null, 900)).toBe(false);
  });
});

describe('reach.js and the Player agree on lids (SHOULD 2)', () => {
  const src = path.resolve(__dirname, '../src');
  const files = [];
  const walk = (d) => {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) walk(p);
      else if (p.endsWith('.js')) files.push(p);
    }
  };
  walk(src);
  it('every scene that builds a reach map tells it whether lids open (its ladderLids)', () => {
    let calls = 0;
    for (const f of files) {
      if (f.endsWith(path.join('world', 'reach.js'))) continue;
      const text = fs.readFileSync(f, 'utf8');
      for (const m of text.matchAll(/reachGrid\(([^;]*)\)/g)) {
        calls += 1;
        expect(m[1], `${path.relative(src, f)}: reachGrid without { lids: this.ladderLids }`).toMatch(/lids:\s*this\.ladderLids/);
      }
    }
    expect(calls).toBeGreaterThan(0);
  });
  it("the station sets ladderLids before it builds the net's reach map", () => {
    // (Phaser reuses a scene object: set after, the flag was undefined on the
    // first visit only, and the net "rescued" Jo out of the undercroft)
    const hub = fs.readFileSync(path.join(src, 'scenes', 'HubScene.js'), 'utf8');
    const set = hub.indexOf('this.ladderLids = true');
    expect(set).toBeGreaterThan(-1);
    expect(set).toBeLessThan(hub.indexOf('this.buildSafetyNet();'));
  });

  it('the Player passes a solid lid only where the scene sets ladderLids', () => {
    const player = fs.readFileSync(path.join(src, 'entities', 'Player.js'), 'utf8');
    expect(player).toMatch(/\(!lidAt\(fr\) \|\| this\.scene\.ladderLids\)/);
    expect(player).toMatch(/const lidOver = ss && ss\(htx, hr - 1\) && this\.scene\.ladderLids/);
  });
});

describe('ladder heads have room to stand (lint:rooms ladder-head headroom)', () => {
  it(`no head has fewer than 2 clear rows over its surface; the Writer's top shelf has ${REACH.body}`, () => {
    const heads = Object.entries(DREAMS).flatMap(([dream, rooms]) => ladderHeads(dream, rooms));
    expect(heads.length).toBeGreaterThan(10);
    for (const h of heads) expect(h.clear, `${h.dream}/${h.room} col ${h.col}`).toBeGreaterThanOrEqual(2);
    const shelf = heads.find((h) => h.dream === 'writer' && h.room === 'library' && h.col === 30);
    expect(shelf && shelf.clear).toBeGreaterThanOrEqual(REACH.body);
  });
});
