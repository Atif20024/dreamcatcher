import { describe, it, expect } from 'vitest';
import { TUNING, tier, tuneEncounter, foePace, ventBeat } from '../src/data/tuning.js';
import { VENTS } from '../src/dreams/gambler/rooms/deck.js';
import { craft } from '../src/engines/craft.js';
import { GIORNATA_STEPS } from '../src/dreams/painter/contract.js';
import * as clockwork from '../src/dreams/clockmaker/encounters/clockwork.js';

describe('the tuning tables', () => {
  it('every table has three tiers, and level 0 changes nothing', () => {
    for (const table of Object.values(TUNING)) for (const row of Object.values(table)) expect(row).toHaveLength(3);
    const set = { bpm: 86, window: 170, retries: 1, nervePerMiss: 14 };
    expect(tuneEncounter('musician', set, 0)).toMatchObject(set);
    const job = { speed: 0.8, zone: 0.16, clock: 9000, rival: { ms: 52000 }, steps: [{ label: 'a', zone: 0.2 }] };
    expect(tuneEncounter('painter', job, 0)).toEqual(job);
    expect(tuneEncounter('clockmaker', { speed: 140, window: 38 }, 0)).toEqual({ speed: 140, window: 38 });
  });

  it('tiers cap at two; a dream with only a walking pace in its table passes through', () => {
    expect([0, 1, 2, 5].map(tier)).toEqual([0, 1, 2, 2]);
    const p = { a: 1 };
    expect(tuneEncounter('chef', p, 3)).toBe(p);
  });

  it('the musician narrows, and never below one retry or a playable window', () => {
    const top = tuneEncounter('musician', { window: 150, retries: 1, nervePerMiss: 14 }, 5);
    expect(top.retries).toBe(1);
    expect(top.window).toBeGreaterThanOrEqual(125);
    expect(top.nervePerMiss).toBe(18);
    // Ray's drill has no nerve: it stays at none
    expect(tuneEncounter('musician', { nervePerMiss: 0 }, 5).nervePerMiss).toBe(0);
  });

  it("the painter's hardest job can still be done inside the plaster's clock", () => {
    const hard = tuneEncounter('painter', { speed: 0.8, zone: 0.16, clock: 9000, rival: { ms: 52000 }, steps: GIORNATA_STEPS }, 5);
    expect(hard.speed).toBeGreaterThan(0.8);
    expect(hard.clock).toBeLessThan(9000);
    const e = craft(hard);
    for (let i = 0; i < 20000 && !e.done; i++) {
      const due = e.due();
      if (due && due.inZone) e.press();
      e.update(16);
    }
    expect(e.done).toBe(true);
    expect(e.result.dried).toBe(0);
  });

  it("the casino moves Lou and the pipes, never the odds", () => {
    expect(tuneEncounter('gambler', { lou: { wrongEvery: 4, describe: true }, stack: 100 }, 5).lou.wrongEvery).toBe(3);
    expect(tuneEncounter('gambler', { bank: 40, target: 80 }, 5)).toEqual({ bank: 40, target: 80 });
    expect(TUNING.gambler.ventWarnMs[2]).toBeGreaterThanOrEqual(300); // still time to see it
  });

  it('the clockmaker stays gentle at every level', () => {
    for (const d of [0, 1, 2, 5]) {
      const dial = tuneEncounter('clockmaker', clockwork.default.params, d);
      expect(dial.window).toBe(clockwork.default.params.window);
      expect(dial.speed).toBeLessThanOrEqual(clockwork.default.params.speed * 1.1);
      expect(tuneEncounter('clockmaker', clockwork.escapement.params, d)).toEqual(clockwork.escapement.params);
      expect(tuneEncounter('clockmaker', clockwork.strike.params, d)).toEqual(clockwork.strike.params);
    }
  });

  it('people walk a little faster, on one curve in every dream', () => {
    expect(foePace('painter', 0)).toBe(1);
    expect(foePace('painter', 5)).toBe(1.16);
    expect(foePace('astronaut', 2)).toBeCloseTo(1.16);
    for (const id of ['chef', 'astronaut', 'writer', 'nowhere']) {
      expect(foePace(id, 0)).toBe(1);
      expect(foePace(id, 1)).toBeCloseTo(1.08);
      expect(foePace(id, 5)).toBeCloseTo(1.16); // was 1.4 at five catches
    }
    for (const id of Object.keys(TUNING)) expect(foePace(id, 5)).toBeLessThanOrEqual(1.16);
  });

  it("the boat's pipes always leave a gap to cross and a warning, tilted or not", () => {
    for (const v of VENTS) {
      for (const d of [0, 1, 2]) {
        for (const tilted of [false, true]) {
          const { on, warn } = ventBeat(v, tilted, d);
          expect(v.period - on).toBeGreaterThanOrEqual(700);
          expect(warn).toBeGreaterThanOrEqual(200);
          expect(warn).toBeLessThan(v.period - on);
        }
      }
    }
    // the case that was 418 ms: the third pipe, tier 2, tilted
    expect(ventBeat(VENTS[2], true, 2).on).toBe(1500);
    // and nobody else's beat moved
    expect(ventBeat(VENTS[0], false, 2).on).toBeCloseTo(1320);
    expect(ventBeat(VENTS[0], false, 2).warn).toBe(320);
  });
});
