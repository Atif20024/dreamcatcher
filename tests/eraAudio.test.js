// THE MASTER'S LADDER's sound, checked offline (dev is silent: nothing is
// ever played). The era loops are pure: render each recipe, measure it.
import { describe, it, expect } from 'vitest';
import { RECIPES, ERA_LOOPS, SOUNDS } from '../src/audio/eraLoops.js';
import { LOOPS } from '../src/audio/synthLoops.js';
import { ACOUSTICS, COMB_DELAYS, combFeedback } from '../src/audio/AudioBus.js';
import { MODES, degree, VOICES } from '../src/audio/MusicDirector.js';
import { MUSIC_KEYS } from '../src/dreams/painter/music.js';

const SR = 8000;
const rms = (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);

describe('era ambience loops (offline render)', () => {
  const rendered = Object.fromEntries(Object.keys(RECIPES).map((k) => [k, ERA_LOOPS[k](SR)]));

  it('every recipe uses known sounds and is merged into LOOPS', () => {
    for (const [k, rec] of Object.entries(RECIPES)) {
      for (const [name] of rec.layers) expect(SOUNDS[name], `${k}: ${name}`).toBeTypeOf('function');
      expect(LOOPS[k]).toBeTypeOf('function');
    }
  });

  it('never clips (peak ≤ -6 dBFS), is never silent, has no NaN', () => {
    for (const [k, buf] of Object.entries(rendered)) {
      let peak = 0;
      for (const v of buf) {
        expect(Number.isFinite(v), k).toBe(true);
        peak = Math.max(peak, Math.abs(v));
      }
      expect(peak, `${k} peak`).toBeLessThanOrEqual(0.5001);
      expect(rms(buf), `${k} rms`).toBeGreaterThan(0.004);
      expect(buf.length / SR, `${k} length`).toBeGreaterThan(5);
    }
  });

  it('loops without a click: the seam is no louder than the loop itself', () => {
    for (const [k, buf] of Object.entries(rendered)) {
      const jump = Math.abs(buf[0] - buf[buf.length - 1]);
      expect(jump, k).toBeLessThan(0.25);
    }
  });

  it('inside is quieter in the air band than outside (the street through a wall)', () => {
    // high-band energy: first difference RMS (a crude high-pass)
    const hi = (a) => Math.sqrt(a.slice(1).reduce((s, v, i) => s + (v - a[i]) ** 2, 0) / a.length);
    expect(hi(rendered.rn_bottega) / rms(rendered.rn_bottega)).toBeLessThan(hi(rendered.rn_street) / rms(rendered.rn_street));
  });
});

describe('acoustics and the era band', () => {
  it('every preset is stable (comb feedback < 1) and open is dry', () => {
    for (const p of Object.values(ACOUSTICS)) for (const d of COMB_DELAYS) expect(combFeedback(d, p.t60)).toBeLessThan(1);
    expect(ACOUSTICS.open.wet).toBe(0);
    expect(ACOUSTICS.chapel.t60).toBeGreaterThanOrEqual(3);
  });

  it('modes walk the right steps; every key names real voices', () => {
    expect(degree('dorian', 2)).toBe(3);
    expect(degree('mixolydian', 6)).toBe(10);
    expect(degree('dorian', 7)).toBe(12);
    for (const [name, k] of Object.entries(MUSIC_KEYS)) {
      expect(MODES[k.mode], name).toBeTruthy();
      for (const v of Object.values(k.voices)) if (v) expect(VOICES[v], `${name}: ${v}`).toBeTypeOf('function');
    }
  });
});
