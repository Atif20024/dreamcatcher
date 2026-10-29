import { describe, it, expect } from 'vitest';
import { craft } from '../src/engines/craft.js';

// press when the mark is over the zone: step the engine until it is
function playStep(e, dt = 10, limit = 2000) {
  for (let i = 0; i < limit; i++) {
    const d = e.due();
    if (d && d.inZone) return e.press();
    e.update(dt);
  }
  return null;
}

describe('craft engine (THE MASTER\'S LADDER)', () => {
  it('a hit in the gold mark does the step; a miss slows the sweep and never fails', () => {
    const e = craft({ steps: [{ label: 'a', at: 0.5 }, { label: 'b', at: 0.7 }], speed: 1 });
    e.update(100); // p = 0.1, far from 0.5
    expect(e.press()).toBe('miss');
    expect(e.state().misses).toBe(1);
    expect(playStep(e)).toBe('hit');
    expect(e.state().idx).toBe(1);
    expect(playStep(e)).toBe('hit');
    expect(e.done).toBe(true);
    expect(e.result.ok).toBe(true);
  });

  it('the mark sweeps there and back inside the bar', () => {
    const e = craft({ steps: [{ at: 0.9, zone: 0.02 }], speed: 1.5 });
    for (let i = 0; i < 300; i++) {
      e.update(16);
      const p = e.state().p;
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it('plaster dries: the section starts again, slower, with the clock refilled', () => {
    const e = craft({ steps: [{ section: 0, at: 0.5 }, { section: 0, at: 0.5 }, { section: 1, at: 0.5 }], speed: 1, clock: 2000 });
    expect(playStep(e)).toBe('hit');
    expect(e.state().idx).toBe(1);
    for (let i = 0; i < 160; i++) e.update(10); // past the 2 s clock: dried
    const st = e.state();
    expect(st.dried).toBe(1);
    expect(st.idx).toBe(0);
    expect(st.phase).toBe('dried');
    expect(e.press()).toBe('wait');
    // it is always finished
    for (let k = 0; k < 3; k++) playStep(e);
    expect(e.done).toBe(true);
    expect(e.result.dried).toBe(1);
    expect(e.result.clean).toBe(false);
  });

  it('an auto step is painted by someone else; the rival paints at his own pace', () => {
    const e = craft({ steps: [{ at: 0.5 }, { label: 'the face', auto: 500 }], speed: 1, rival: { ms: 400 } });
    playStep(e);
    expect(e.state().auto).toBe(true);
    expect(e.press()).toBe('wait');
    for (let i = 0; i < 60; i++) e.update(10);
    expect(e.done).toBe(true);
    expect(e.result.rivalFirst).toBe(true);
    expect(e.state().rival).toBe(1);
  });
});
