import { describe, it, expect } from 'vitest';
import { craft } from '../src/engines/craft.js';
import { MUSIC_KEYS } from '../src/dreams/painter/music.js';
import speziale from '../src/dreams/painter/rooms/speziale.js';
import { KITS, testStock, TEST_STEPS, trialLost, trialVerdict, loseLapis, streetFlags, studiesLine, rankKey } from '../src/dreams/painter/logic.js';

const run = (e, ms) => {
  for (let t = 0; t < ms; t += 10) e.update(10);
};
const toZone = (e) => {
  for (let i = 0; i < 2000 && !e.due().inZone; i++) e.update(10);
};

describe('craft modes: each job its own way to play', () => {
  it('mash: fills on the gold, a press off it loses one back', () => {
    const e = craft({ steps: [{ mode: 'mash', need: 3, at: 0.5, zone: 0.4 }], speed: 0.1 });
    expect(e.press()).toBe('miss'); // p = 0, off the gold
    expect(e.state().mash).toBe(0);
    toZone(e);
    expect(e.press()).toBe('hit');
    expect(e.press()).toBe('hit');
    expect(e.state().mash).toBe(2);
    expect(e.done).toBe(false);
    expect(e.press()).toBe('hit');
    expect(e.done).toBe(true);
  });

  it('hold: the brush moves only while held; a release off the gold starts again', () => {
    const e = craft({ steps: [{ mode: 'hold', at: 0.5, zone: 0.2 }], speed: 1 });
    run(e, 300);
    expect(e.state().p).toBe(0); // not held: nothing moves
    expect(e.press()).toBe('hold');
    run(e, 100);
    expect(e.state().p).toBeCloseTo(0.1, 5);
    expect(e.release()).toBe('miss');
    expect(e.state().p).toBe(0);
    expect(e.state().misses).toBe(1);
    expect(e.release()).toBe(null); // no key was down
    e.press();
    run(e, 560); // the slower hand: 0.85 per second
    expect(e.due().inZone).toBe(true);
    expect(e.release()).toBe('hit');
    expect(e.done).toBe(true);
  });

  it('hold: run off the end of the bar and it is a miss, never stuck', () => {
    const e = craft({ steps: [{ mode: 'hold', at: 0.5, zone: 0.2 }], speed: 1 });
    e.press();
    run(e, 1100);
    const st = e.state();
    expect(st.misses).toBe(1);
    expect(st.holding).toBe(false);
    expect(st.p).toBe(0);
  });

  it('double: two marks in order on one pass; a pass ending between them goes slack', () => {
    const e = craft({ steps: [{ mode: 'double', at: 0.3, at2: 0.7, zone: 0.1, zone2: 0.1 }], speed: 1 });
    toZone(e);
    expect(e.press()).toBe('hit');
    expect(e.state().marks[0].done).toBe(true);
    expect(e.done).toBe(false);
    run(e, 800); // past the second mark, off the end of the bar
    const st = e.state();
    expect(st.marks[0].done).toBe(false);
    expect(st.misses).toBe(1);
    toZone(e);
    e.press();
    toZone(e);
    expect(e.press()).toBe('hit');
    expect(e.done).toBe(true);
  });

  it('stock: a hit spends it, a miss wastes it, no stock is finished in the cheap stuff', () => {
    const e = craft({ steps: [{ uses: 'gold', at: 0.1, zone: 0.04, instead: 'in ochre', label: 'in gold' }, { uses: 'blue', at: 0.5 }, { uses: 'bone', at: 0.5 }], speed: 1, stock: { gold: 1, blue: 1, bone: 0 } });
    expect(e.state().label).toBe('in gold');
    run(e, 500);
    expect(e.press()).toBe('miss'); // the gold is wasted
    expect(e.state().label).toBe('in ochre');
    for (let k = 0; k < 3; k++) {
      toZone(e);
      e.press();
    }
    expect(e.done).toBe(true);
    expect(e.result.wasted).toEqual(['gold']);
    expect(e.result.used).toEqual(['blue']);
    expect(e.result.subbed).toEqual(['gold', 'bone']);
  });

  it('a job with no stock keeps its old result shape, and always finishes', () => {
    const e = craft({ steps: [{ at: 0.5 }] });
    toZone(e);
    e.press();
    expect(e.result.ok).toBe(true);
    expect(e.result.wasted).toBeUndefined();
  });
});

describe('the test piece', () => {
  it('every kit carries two of the three, and every carried thing has a step', () => {
    for (const k of Object.keys(KITS)) {
      const st = testStock(k);
      expect(Object.values(st).reduce((a, b) => a + b, 0)).toBe(2);
    }
    expect(TEST_STEPS.filter((s) => s.uses).map((s) => s.uses).sort()).toEqual(['bone', 'gold', 'ultramarine']);
  });
  it('the verdict differs by what the panel lacks', () => {
    const lines = Object.keys(KITS).map((k) => trialVerdict(k));
    expect(new Set(lines).size).toBe(3);
    expect(trialLost('ug')).toEqual(['bone']);
    expect(trialLost('ub', ['bone'])).toEqual(['gold', 'bone']);
    expect(trialVerdict('ub', ['bone'])).toMatch(/floor/);
    expect(trialVerdict('ug', ['ultramarine'])).toMatch(/floor/);
  });
});

describe('the street', () => {
  it('the return trip has its own rivals, and the seal clears them', () => {
    const F = { lapis: true };
    streetFlags(F);
    expect(F.lapis_carry).toBe(true);
    expect(F.rivals_out).toBe(false);
    F.drapery_done = true;
    streetFlags(F);
    expect(F.lapis_carry).toBe(false);
    expect(F.rivals_out).toBe(true);
    expect(F.rivals_on_pentice).toBe(true);
    F.seal = true;
    streetFlags(F);
    expect(F.rivals_out).toBe(false);
    expect(F.rivals_on_pentice).toBe(false);
  });
  it('a grab takes the stone back to the shelf: the key item can be taken again', () => {
    const F = { lapis: true, 'item:lapis': true };
    loseLapis(F);
    loseLapis(F);
    expect(F.lapis).toBe(false);
    expect(F['item:lapis']).toBe(false);
    expect(F.lapis_stolen).toBe(2);
  });
});

describe('one lapis on the shelf', () => {
  // the entity's own rule (dreamAdapters.watch and spawnKeyItem): which spawn for these flags
  const live = (F) => speziale.entities.filter((e) => e.type === 'keyitem' && e.id === 'lapis').filter((e) => (!e.when || F[e.when]) && (!e.unless || !F[e.unless]) && !F['item:lapis']);
  it('exactly one until taken, before and after every theft', () => {
    expect(live({}).length).toBe(1);
    expect(live({ lapis: true, 'item:lapis': true }).length).toBe(0);
    const F = { lapis: true, 'item:lapis': true };
    loseLapis(F);
    expect(live(F).length).toBe(1);
    Object.assign(F, { lapis: true, 'item:lapis': true });
    expect(live(F).length).toBe(0);
    loseLapis(F);
    expect(live(F).length).toBe(1);
  });
});

describe('craft assist and rest', () => {
  it("a step's own speed steadies after a miss", () => {
    const e = craft({ steps: [{ at: 0.9, zone: 0.02, speed: 0.4 }], speed: 1, assist: 0.5 });
    e.update(100);
    const p0 = e.state().p;
    e.press();
    e.update(100);
    expect(e.state().p - p0).toBeCloseTo(0.02, 5); // half of 0.4 per second
  });
  it('the tap after the last blow of a mash does not spill into a hold', () => {
    const e = craft({ steps: [{ mode: 'mash', need: 1, at: 0.5, zone: 1 }, { mode: 'hold', at: 0.5, zone: 0.2 }], speed: 1 });
    expect(e.press()).toBe('hit');
    expect(e.state().idx).toBe(1);
    expect(e.press()).toBe('wait');
    expect(e.state().holding).toBe(false);
    expect(e.release()).toBe(null);
    expect(e.state().misses).toBe(0);
    e.update(260);
    expect(e.press()).toBe('hold');
  });
});

describe('the book of studies', () => {
  it('pays for one, two or three, and says nothing for none', () => {
    expect(studiesLine({})).toBe(null);
    expect(studiesLine({ study_hands: true })).toMatch(/^A pair of hands, kept/);
    expect(studiesLine({ study_torso: true, study_hands: true })).toBe('A torso and a pair of hands, kept in a book for sixty years.');
    expect(studiesLine({ study_torso: true, study_hands: true, study_dome: true })).toMatch(/^Three studies/);
  });
});

describe('the city notices the rank in its music', () => {
  it('each place changes key at its own flag, and the chase has a voice', () => {
    expect(rankKey('via', {})).toBe(null);
    expect(rankKey('via', { assistant: true })).toBe('street_known');
    expect(rankKey('piazza', { assistant: true })).toBe(null);
    expect(rankKey('piazza', { seal: true })).toBe('piazza_sealed');
    expect(rankKey('palazzo', { commission: true })).toBe('palazzo_signed');
    expect(rankKey('chapel', { seal: true })).toBe(null);
    for (const k of ['street_known', 'piazza_sealed', 'palazzo_signed']) expect(MUSIC_KEYS[k].pad).toBeTruthy();
    for (const k of ['street', 'piazza', 'palazzo']) expect(MUSIC_KEYS[k].voices.danger).toBe('drone');
  });
});
