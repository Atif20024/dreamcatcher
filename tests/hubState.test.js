import { describe, it, expect } from 'vitest';
import { hubState, stretch, headline, pembertonLine, teaLine, runningCount, caughtRunning, progress } from '../src/systems/hubState.js';

const running = runningCount();

describe('the station counts every running dream', () => {
  it('the state moves with every catch and ends only at the last one', () => {
    for (let n = 1; n <= running; n++) {
      expect(hubState(n).sat, `n=${n}`).toBeGreaterThan(hubState(n - 1).sat);
      expect(hubState(n).tally).toBeGreaterThan(hubState(n - 1).tally);
    }
    expect(hubState(running - 1).clockStutter).toBe(false);
    expect(hubState(running)).toMatchObject({ clockStutter: true, fountain: 'dry', travelers: 0, flowers: 0 });
    expect(hubState(running + 3)).toMatchObject({ fountain: 'dry' }); // an old save past the table
    expect(hubState(0)).toMatchObject({ sat: 0, fountain: 'flowing', travelers: 40 });
  });

  it('every catch has its own line, and only the last says the board is done', () => {
    const lines = Array.from({ length: running }, (_, i) => pembertonLine(i + 1));
    expect(new Set(lines).size).toBe(running);
    expect(lines[running - 1]).toMatch(/That's the board/);
    expect(lines.slice(0, -1).join()).not.toMatch(/That's the board/);
    expect(new Set(Array.from({ length: running + 1 }, (_, i) => headline(i))).size).toBe(running + 1);
    expect(headline(0)).toBe(`TEN PLATFORMS, ONE TIMETABLE — ALL ON TIME`);
    expect(headline(running)).toBe('NO PASSENGERS');
    expect(teaLine(running)).toBe(null);
    expect(teaLine(running - 1)).toBeTruthy();
  });

  it('a longer timetable stretches the lists without an edit', () => {
    const list = ['none', 'a', 'b', 'c', 'all'];
    for (const r of [3, 7, 9, 12]) {
      expect(stretch(list, 0, r)).toBe('none');
      expect(stretch(list, r, r)).toBe('all');
      for (let n = 1; n < r; n++) expect(stretch(list, n, r), `${n}/${r}`).toMatch(/^[abc]$/);
    }
  });

  it('an old save: caught ids that no longer run count for nothing', () => {
    expect(caughtRunning({ dreams: { proof: true, chef: true, athlete: true } })).toBe(1);
    expect(progress(99)).toBe(1);
  });
});
