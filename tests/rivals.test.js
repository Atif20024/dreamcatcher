// How the others drive, by bot: RACER_REBUILD_PLAN §7's promises about them.
import { describe, it, expect } from 'vitest';
import { Race, TUNE, CAR_LEN, gripFactor, bendSafe, rubberBand } from '../src/engines/race.js';
import { STYLES, steerTo, stopAt } from '../src/engines/rivals.js';
import { TRACKS } from '../src/dreams/racer/race/tracks.js';
import { raceFor } from '../src/dreams/racer/race/script.js';
import { tidy, gapBot, slingBot, afterBlockBot, runRace, coppaBot } from './raceBots.js';

const F = { tuned: true };

// sits in `who`'s air however he moves, with a seeded wander in how close
const shadow = (who, wander = 0) => {
  const base = tidy({ margin: 3, k: 1 });
  return (r) => {
    const c = r.jo;
    const o = base(r);
    if (r.t < 0) return o;
    const q = r.rivals.find((x) => x.id === who);
    if (!q || q.out || q.d < c.d || r.rivals.some((x) => x !== q && x.d > c.d - CAR_LEN * 1.4 && x.d < q.d)) return o;
    const gap = q.d - c.d - CAR_LEN;
    return { throttle: !o.brake && gap > CAR_LEN * (2 + wander), brake: o.brake, steer: steerTo(c, q.x) };
  };
};

// every tell over a race, and what followed it
function tells(track, flags, bot, seed) {
  const { r, log } = runRace(track, flags, bot, { seed });
  return { r, log, at: log.filter((e) => e.type === 'block_tell') };
}

describe('Cassian shuts the door', () => {
  it('the tell comes at least 0.4 s before he moves towards you, over 50 seeded races', () => {
    let seen = 0;
    for (let seed = 1; seed <= 50; seed++) {
      const race = runRaceWatching(TRACKS.salt, F, shadow('cassian', (seed % 5) * 0.1), seed);
      for (const lead of race.leads) {
        seen += 1;
        expect(lead).toBeGreaterThanOrEqual(0.4);
      }
    }
    expect(seen).toBeGreaterThan(50);
  });
  it('never in a bend or close to one, and never twice in 4 s, over 50 seeded races', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const race = runRaceWatching(TRACKS.coppa, F, coppaBot({ drive: shadow('cassian', (seed % 5) * 0.1) }), seed);
      race.tellsAt.forEach((e, i) => {
        expect(e.inBend).toBe(false);
        expect(e.toBend).toBeGreaterThan(TUNE.blockClear);
        if (i) expect(e.t - race.tellsAt[i - 1].t).toBeGreaterThanOrEqual(TUNE.blockGap - 1e-6);
      });
      for (const moved of race.movedInBend) expect(moved).toBe(false);
    }
  });
  it('seeds change when he looks up', () => {
    const when = (seed) => tells(TRACKS.salt, F, shadow('cassian'), seed).at.map((e) => e.at.toFixed(2)).join();
    expect(new Set([1, 2, 3, 4, 5].map(when)).size).toBeGreaterThan(1);
  });
  it('only Cassian: the others never tell, and never move towards a car in their air', () => {
    for (const [track, who] of [[TRACKS.harbour, 'aldo'], [TRACKS.salt, 'dante'], [TRACKS.salt, 'teo'], [TRACKS.coppa, 'dante'], [TRACKS.coppa, 'teo']]) {
      const bot = track === TRACKS.coppa ? coppaBot({ drive: shadow(who) }) : shadow(who);
      const r = runRaceWatching(track, F, bot, 1, who);
      expect(r.log.filter((e) => e.type === 'block_tell' && e.id !== 'cassian')).toEqual([]);
      expect(r.towardsInAir).toBeLessThan(0.2); // (a car stepping round traffic; a block is a 0.3 move at the least)
    }
  });
  it('sit in his air for 3 s and he brakes early at the next bend, once', () => {
    const { log, r } = runRace(TRACKS.salt, F, gapBot());
    const mistakes = log.filter((e) => e.type === 'mistake');
    expect(mistakes).toHaveLength(1);
    expect(r.rivals.find((c) => c.id === 'cassian').early).toBe('made');
    // and nobody who keeps out of his air gets one
    expect(runRace(TRACKS.salt, F, tidy({ margin: 8 })).log.filter((e) => e.type === 'mistake')).toEqual([]);
  });
});

describe('the honest way past him', () => {
  const past = (bot) => {
    const { r } = runRace(TRACKS.salt, F, bot);
    return r.result;
  };
  it('a clean run that uses the gap wins the Salt Road', () => {
    const res = past(gapBot());
    expect(res.place).toBe(1);
    expect(res.flags.rubs).toBe(0);
    expect(res.flags.clean).toBe(true);
  });
  it('pace alone does not get past: tidy and fast both follow him home', () => {
    expect(past(tidy()).place).toBeGreaterThan(1);
    expect(past(tidy({ margin: 1, k: 1 })).place).toBeGreaterThan(1);
  });
  it('going out on the straight does not get past: the door shuts, and it costs', () => {
    for (const bot of [slingBot(), afterBlockBot()]) {
      const res = past(bot);
      expect(res.place).toBeGreaterThan(1);
      expect(res.flags.rubs).toBeGreaterThan(0);
      expect(res.time).toBeGreaterThan(past(gapBot()).time);
    }
  });
});

describe('Teo', () => {
  it('is bald two thirds in and fades to his lower top', () => {
    const r = new Race(TRACKS.salt, { rivals: TRACKS.salt.rivals });
    const teo = r.rivals.find((c) => c.id === 'teo');
    const bot = tidy();
    let at = null;
    while (!r.result && r.t < 120) {
      r.step(bot(r));
      if (at === null && teo.d >= TRACKS.salt.length * (2 / 3)) at = teo.grip;
    }
    expect(at).toBeLessThan(0.3);
    expect(teo.top).toBe(TUNE.fadeTop);
    expect(r.result.place).toBeLessThan(4);
  });
  it('wears at his own rate and nobody else does', () => {
    const r = new Race({ pieces: [{ straight: 3000 }], countdown: 0 }, { rivals: [{ id: 'a', d: 100, wear: 1, style: 'parked' }, { id: 'b', d: 200, wear: 2.5, style: 'parked' }] });
    STYLES.parked = () => ({ brake: true });
    for (const c of r.rivals) c.v = 30;
    for (let i = 0; i < 60; i++) r.step({});
    delete STYLES.parked;
    expect((1 - r.rivals[1].grip) / (1 - r.rivals[0].grip)).toBeCloseTo(2.5, 3);
  });
  it('drops oil where he brakes hard on a road that has it, not on others', () => {
    expect(runRace(TRACKS.salt, F, tidy()).log.filter((e) => e.type === 'oil_drop').length).toBeGreaterThan(1);
    expect(runRace(TRACKS.harbour, F, tidy()).log.filter((e) => e.type === 'oil_drop')).toEqual([]);
  });
  it('never spins and takes no wall', () => {
    for (const [T, bot] of [[TRACKS.harbour, tidy()], [TRACKS.salt, tidy()], [TRACKS.coppa, coppaBot()]]) {
      expect(runRace(T, F, bot).r.rivals.find((c) => c.id === 'teo').spins).toBe(0);
    }
  });
});

describe('Dante', () => {
  it('holds his line while HOLD is up: his x never crosses Jo\'s', () => {
    const r = runRaceWatching(TRACKS.salt, { ...F, sable_orders: true }, tidy({ behind: 'dante' }), 1);
    expect(r.danteCrossed).toBe(false);
    expect(r.r.script.flags.broke_orders).toBeUndefined();
  });
});

describe('Aldo', () => {
  it('stays 2 to 3 lengths ahead of Jo whatever Jo does', () => {
    const streams = [
      () => ({ throttle: true }),
      () => ({ brake: true }),
      () => ({}),
      (r) => ({ throttle: r.rand() > 0.3, brake: r.rand() > 0.8, steer: r.rand() * 2 - 1 }),
      (r) => ({ throttle: true, steer: Math.sin(r.t * 2) }),
    ];
    for (const stream of streams) {
      const r = raceFor(TRACKS.harbour, {}, { seed: 7 });
      const aldo = r.rivals.find((c) => c.id === 'aldo');
      for (let i = 0; i < 60 * 120 && r.script.state === 'race' && aldo.style === 'station'; i++) {
        r.step(stream(r));
        if (r.script.state !== 'race') break;
        if (r.t < 0) continue;
        const gap = (aldo.d - r.jo.d - CAR_LEN) / CAR_LEN;
        expect(gap).toBeGreaterThanOrEqual(2 - 1e-6);
        expect(gap).toBeLessThanOrEqual(3 + 1e-6);
      }
      expect(aldo.spins).toBe(0);
    }
  });
});

describe('the rubber band', () => {
  it('is at most 6 percent, none up close, on the far end only', () => {
    const at = (gap) => {
      const r = new Race({ pieces: [{ straight: 3000 }], countdown: 0 }, { rivals: [{ id: 'x', d: 1000 + gap }] });
      r.jo.d = 1000;
      return rubberBand(r, r.rivals[0]);
    };
    expect(at(TUNE.bandNear - 1)).toBe(1);
    expect(at(-TUNE.bandNear + 1)).toBe(1);
    expect(at(1500)).toBeCloseTo(1 - TUNE.bandMax, 5);
    expect(at(-900)).toBeCloseTo(1 + TUNE.bandMax * TUNE.bandBehind, 5);
    expect(TUNE.bandMax).toBeLessThanOrEqual(0.06);
  });
  it('never closes a car in a bend: nobody is over the bend\'s limit because of it, on any track', () => {
    for (const T of [TRACKS.salt, TRACKS.coppa]) {
      const r = new Race(T, { rivals: T.rivals });
      // Jo stands still: everybody far ahead or lapping the road on the band
      for (let i = 0; i < 100 * 120 && r.rivals.some((c) => c.finished === null); i++) {
        if (r.rivals.some((c) => c.state !== 'run')) break;
        r.step({});
        for (const c of r.rivals) {
          const b = r.bendAt(c.d);
          if (b && c.d > b.from + 30 && c.style !== 'dive') expect(c.v).toBeLessThan(bendSafe(b, c.x, gripFactor(c.grip)) + 1.5);
        }
      }
    }
  });
  it('a band-free race has the same speeds in the bends', () => {
    const inBends = (tune) => {
      const r = new Race(TRACKS.salt, { rivals: [{ id: 'd', d: 300, x: 0.4, k: 0.97, top: 0.97, style: 'clean' }], tune });
      let top = 0;
      for (let i = 0; i < 80 * 120 && r.rivals[0].finished === null; i++) {
        r.step({});
        const c = r.rivals[0];
        if (r.bendAt(c.d)?.name === 'the drop' && c.d > r.bendAt(c.d).from + 10) top = Math.max(top, c.v);
      }
      return top;
    };
    expect(Math.abs(inBends(TUNE) - inBends({ ...TUNE, bandMax: 0 }))).toBeLessThan(0.3);
  });
});

describe('orders a script can give', () => {
  it('stop at a place for a time, then back to the style', () => {
    const r = new Race({ pieces: [{ straight: 2000 }], countdown: 0 }, { rivals: [{ id: 'x', d: 10, style: 'clean' }] });
    const c = r.rivals[0];
    c.order = stopAt(300, 2);
    let t = 0;
    while (c.order && t < 60 * 120) {
      r.step({});
      t += 1;
      if (c.d > 295 && c.d < 305 && c.v < 0.5) break;
    }
    expect(Math.abs(c.d - 300)).toBeLessThan(5);
    const stoppedAt = r.t;
    while (c.order) r.step({});
    expect(r.t - stoppedAt).toBeCloseTo(2, 0);
    r.step({});
    for (let i = 0; i < 60; i++) r.step({});
    expect(c.v).toBeGreaterThan(1);
  });
});

// A race watched between steps: how long from each tell until Cassian first moves towards Jo,
// where he told and moved, how far `who` moved towards a car in his air, and whether Dante crossed Jo
function runRaceWatching(track, flags, bot, seed, who = null) {
  const r = raceFor(track, flags, { seed });
  const log = [];
  const leads = [];
  const tellsAt = [];
  const movedInBend = [];
  let open = null;
  let towardsInAir = 0;
  let danteCrossed = false;
  const cassian = r.rivals.find((c) => c.id === 'cassian');
  const target = r.rivals.find((c) => c.id === who);
  const dante = r.rivals.find((c) => c.id === 'dante');
  for (let i = 0; i < 240 * 120 && !r.result && r.script?.state !== 'over'; i++) {
    const wasX = target?.x;
    const [danteWas, joWas] = [dante?.x, r.jo.x];
    r.step(bot(r));
    for (const e of r.drain()) {
      log.push({ ...e, at: r.t });
      if (e.type === 'block_tell') {
        const next = r.nextBend(cassian.d);
        tellsAt.push({ t: r.t, inBend: !!r.bendAt(cassian.d), toBend: next ? next.from - cassian.d : Infinity });
        open = { t: r.t, x: cassian.x };
      }
    }
    if (open) {
      const moved = cassian.x - open.x;
      if (Math.abs(moved) > 1e-3) {
        leads.push(r.t - open.t);
        open = null;
      }
    }
    if (cassian?.blocking === 'move') movedInBend.push(!!r.bendAt(cassian.d));
    // (stepping round something on the road is not a block)
    const clearRoad = target && !r.obstacles.some((o) => Math.abs(o.d - target.d) < 70) && !r.oil.some((o) => o.by !== target.id && Math.abs(o.d - target.d) < 70);
    if (target && clearRoad && r.jo.inDraft && r.jo.draftOf === target && !r.bendAt(target.d)) {
      const dx = target.x - wasX;
      if (dx && Math.sign(dx) === Math.sign(r.jo.x - target.x)) towardsInAir += Math.abs(dx);
    }
    // (his doing, not Jo's: Jo may drive where he likes)
    const free = dante && !r.rivals.some((c) => c !== dante && Math.abs(c.d - dante.d) < CAR_LEN * 5) && !r.oil.some((o) => Math.abs(o.d - dante.d) < 70) && !r.obstacles.some((o) => Math.abs(o.d - dante.d) < 70);
    if (free && dante.d > r.jo.d && r.t > 0 && Math.sign(dante.x - r.jo.x) !== Math.sign(danteWas - joWas) && Math.abs(dante.x - danteWas) > Math.abs(r.jo.x - joWas)) danteCrossed = true;
  }
  return { r, log, leads, tellsAt, movedInBend, towardsInAir, danteCrossed };
}
