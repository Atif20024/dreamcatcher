// The Musician's rhythm engine (src/engines/rhythm.js): pure, deterministic,
// stepped by update(dt). An auto-player presses on the beat.
import { describe, it, expect } from 'vitest';
import { rhythm } from '../src/engines/rhythm.js';

// run the engine at 60 Hz; `press(e, st)` decides whether to press this frame
function play(e, press = () => false, release = () => false, max = 20000) {
  let f = 0;
  while (!e.done && f < max) {
    e.update(1000 / 60);
    const st = e.state();
    if (press(e, st)) e.press();
    if (release(e, st)) e.release();
    f += 1;
  }
  return f;
}

// press once on each note beat of the play bar (within half a frame)
function onBeat() {
  const done = new Set();
  return (e, st) => {
    const d = e.due();
    if (!d || d.hold) return false;
    const i = Math.round(d.t / d.beatMs);
    const key = `${st.idx}:${st.tries}:${i}`;
    if (i < 0 || i >= d.beats.length || done.has(key) || d.beats[i] !== 1) return false;
    if (Math.abs(d.t - i * d.beatMs) > 12) return false;
    done.add(key);
    return true;
  };
}

describe('rhythm engine', () => {
  it('a perfect player passes every phrase first time', () => {
    const e = rhythm({ bpm: 120, phrases: [[1, 1, 1, 1], [1, 0, 1, 1], [1, 1, 0, 1]] });
    play(e, onBeat());
    expect(e.done).toBe(true);
    expect(e.result).toMatchObject({ ok: true, passes: 3, misses: 0, perfect: true });
  });

  it('silence: each phrase is retried (slower), then the band carries on', () => {
    const e = rhythm({ bpm: 120, phrases: [[1, 1]], retries: 2, nervePerMiss: 5 });
    const tries = [];
    play(e, (eng, st) => {
      tries.push(st.tries);
      return false;
    });
    expect(e.done).toBe(true);
    expect(Math.max(...tries)).toBe(2);
    expect(e.result.passes).toBe(0);
    expect(e.result.misses).toBe(6);
    expect(e.result.ok).toBe(true);
  });

  it('a press over a rest fails the phrase', () => {
    const e = rhythm({ bpm: 120, phrases: [[1, 0]], retries: 0 });
    let pressedRest = false;
    play(e, (eng, st) => {
      const d = eng.due();
      if (!d || pressedRest) return false;
      if (Math.abs(d.t - d.beatMs) < 10) {
        pressedRest = true;
        return true;
      }
      return Math.abs(d.t) < 10 && st.hits[0] === null;
    });
    expect(e.result.passes).toBe(0);
  });

  it('rests: false fills every rest (Tally\'s set list); an all-rest bar stays silent', () => {
    const e = rhythm({ phrases: [[1, 0, 1, 0], [0, 0, 0, 0]], rests: false });
    expect(e.phrases[0].beats).toEqual([1, 1, 1, 1]);
    expect(e.phrases[1].silent).toBe(true);
  });

  it('an all-rest bar passes by doing nothing (Ray\'s lesson)', () => {
    const e = rhythm({ bpm: 120, phrases: [[0, 0, 0, 0]], retries: 0 });
    play(e);
    expect(e.result).toMatchObject({ passes: 1, misses: 0 });
  });

  it('a held note must be held for its length', () => {
    const good = rhythm({ bpm: 120, phrases: [{ hold: 4 }], retries: 0, lead: 0 });
    let down = false;
    play(good, (eng) => {
      const d = eng.due();
      if (d && !down && d.t >= 0) {
        down = true;
        return true;
      }
      return false;
    });
    expect(good.result.passes).toBe(1);
    const short = rhythm({ bpm: 120, phrases: [{ hold: 4 }], retries: 0, lead: 0 });
    let pressed = false;
    play(
      short,
      (eng) => {
        const d = eng.due();
        if (d && !pressed && d.t >= 0) {
          pressed = true;
          return true;
        }
        return false;
      },
      (eng) => pressed && eng.state().phase === 'play' && eng.state().beat > 1
    );
    expect(short.result.passes).toBe(0);
  });

  it('nerve at 100 freezes Jo and restarts the phrase', () => {
    const e = rhythm({ bpm: 120, phrases: [[1, 1, 1, 1]], retries: 3, nervePerMiss: 30 });
    const phases = new Set();
    play(e, (eng, st) => {
      phases.add(st.phase);
      return false;
    });
    expect(phases.has('frozen')).toBe(true);
    expect(e.result.freezes).toBeGreaterThan(0);
  });

  it('events report the listen bar and the judgement', () => {
    const e = rhythm({ bpm: 120, phrases: [[1, 0, 1]] });
    const seen = [];
    play(e, onBeat(), () => false);
    // events were not drained during the run: they are all still queued
    for (const ev of e.takeEvents()) seen.push(ev.type);
    expect(seen).toContain('preview');
    expect(seen).toContain('play');
    expect(seen).toContain('judge');
    expect(seen[seen.length - 1]).toBe('done');
  });
});
