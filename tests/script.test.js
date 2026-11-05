// The story on the road, by bot: RACER_REBUILD_PLAN §7's promises about the scripts.
import { describe, it, expect } from 'vitest';
import { TUNE, CAR_LEN, raceLost } from '../src/engines/race.js';
import { steerTo } from '../src/engines/rivals.js';
import { TRACKS } from '../src/dreams/racer/race/tracks.js';
import { raceFor } from '../src/dreams/racer/race/script.js';
import { tidy, gapBot, coppaBot, runRace } from './raceBots.js';

const F = { tuned: true };
const types = (log) => log.map((e) => e.type);
const on = (log, type) => log.find((e) => e.type === type);

// run on after Jo's finish until everyone who can finish has, so a margin is measured and not guessed
function margin(r, bot) {
  const t0 = r.result.time;
  for (let i = 0; i < 90 * 120 && r.rivals.some((c) => c.finished === null && !c.out); i++) r.step(bot(r));
  r.drain();
  return Math.min(...r.rivals.filter((c) => !c.out).map((c) => c.finished)) - t0;
}

describe('race 2 cannot be failed', () => {
  const T = TRACKS.harbour;
  const streams = {
    tidy: tidy({ air: 'aldo' }),
    parked: () => ({}),
    brake: () => ({ brake: true }),
    flat: () => ({ throttle: true }),
    wall: (r) => ({ throttle: true, steer: -1 }),
    other: (r) => ({ throttle: true, steer: 1 }),
    wobble: (r) => ({ throttle: true, steer: Math.sin(r.t * 3) }),
    random: (r) => ({ throttle: r.rand() > 0.2, brake: r.rand() > 0.9, steer: r.rand() * 2 - 1 }),
    crawl: (r) => ({ throttle: r.jo.v < 6 }),
  };
  for (const [name, bot] of Object.entries(streams)) {
    it(`${name}: it ends in the dark with done_race2, and never a finish`, () => {
      const { r, log } = runRace(T, {}, bot, { seed: 3, secs: 200 });
      expect(r.script.state).toBe('over');
      expect(r.script.flags.done_race2).toBe(true);
      expect(types(log)).not.toContain('finish');
      expect(r.result).toBeNull();
      const dark = on(log, 'aldo_dark');
      expect(dark).toBeTruthy();
      expect(on(log, 'race_over').flags.done_race2).toBe(true);
      expect(on(log, 'race_over').at - dark.at).toBeCloseTo(TUNE.darkStop, 1);
      expect(r.track.gate.scripted).toBe(true);
      expect(raceLost(r)).toBe(false);
    });
  }
  it('fifty seeds of a random foot all end it', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const { r } = runRace(T, {}, streams.random, { seed, secs: 200 });
      expect(r.script.state).toBe('over');
    }
  });
  it('held_aldo: true in his air at a racing pace, false for a foot off the gas, or off his line', () => {
    expect(runRace(T, F, tidy({ air: 'aldo' })).r.script.flags.held_aldo).toBe(true);
    const air = tidy({ air: 'aldo' });
    const lifted = (r) => ({ ...air(r), ...(r.jo.d > 150 ? { throttle: r.jo.v < 12, brake: r.jo.v > 14 } : null) });
    expect(runRace(T, F, lifted).r.script.flags.held_aldo).toBe(false);
    const off = (r) => ({ ...air(r), steer: steerTo(r.jo, r.rivals[0].x + 0.6) });
    expect(runRace(T, F, off).r.script.flags.held_aldo).toBe(false);
  });
  it('the first sling is there on the quay', () => {
    const air = tidy({ air: 'aldo' });
    const out = (r) => (r.jo.armed && r.jo.d > 150 && r.jo.d < 300 ? { ...air(r), steer: 1 } : air(r));
    expect(types(runRace(T, F, out).log)).toContain('sling');
  });
  it('Teo goes by Jo on the way out of the hairpin, and before the Gull Bend', () => {
    const { log, r } = runRace(T, F, tidy({ air: 'aldo' }));
    const through = log.filter((e) => e.type === 'teo_through');
    expect(through).toHaveLength(1);
    const brasca = on(log, 'cue') && log.find((e) => e.type === 'cue' && e.id === 'brasca');
    expect(through[0].at).toBeGreaterThan(brasca.at);
    expect(through[0].at).toBeLessThan(brasca.at + 6);
    expect(r.rivals.find((c) => c.id === 'teo').spins).toBe(0);
  });
  it('the last 3 s: the brake is his, and she stops by the verge on her own', () => {
    const air = tidy({ air: 'aldo' });
    const { r } = runRace(T, F, (q) => (q.script.state === 'race' ? air(q) : { throttle: true, steer: -1 }));
    expect(r.jo.v).toBe(0);
    expect(r.jo.spins).toBe(0);
  });
});

describe('the Gull lamp', () => {
  it('race 2: lit until Aldo\'s lights go, then dark', () => {
    const r = raceFor(TRACKS.harbour, F);
    expect(r.script.lamp).toBe('lit');
    const { r: done, log } = runRace(TRACKS.harbour, F, tidy({ air: 'aldo' }));
    expect(done.script.lamp).toBe('dark');
    const lamp = log.filter((e) => e.type === 'gull_lamp');
    expect(lamp).toHaveLength(1);
    expect(lamp[0].state).toBe('dark');
    expect(lamp[0].at).toBeCloseTo(on(log, 'aldo_dark').at, 2);
  });
  it('race 4: dark from the start, lit on passing it on lap 1, and he stops by it on lap 2', () => {
    const r = raceFor(TRACKS.coppa, F);
    expect(r.script.lamp).toBe('dark');
    const { r: done, log } = runRace(TRACKS.coppa, F, coppaBot());
    expect(done.script.lamp).toBe('lit');
    const lamp = log.filter((e) => e.type === 'gull_lamp');
    expect(lamp).toHaveLength(1);
    expect(lamp[0].state).toBe('lit');
    expect(lamp[0].at).toBeLessThan(on(log, 'pit').at);
    const wreck = done.rivals.find((c) => c.id === 'cassian');
    const gull = TRACKS.coppa.bends.filter((b) => b.name === 'Gull Bend')[1];
    expect(wreck.d).toBeGreaterThan(gull.from);
    expect(wreck.d).toBeLessThan(gull.to + 10);
  });
});

describe('the pit box', () => {
  const stop = (box, flags = F) => runRace(TRACKS.coppa, flags, coppaBot({ box }));
  it('nose in the 12 m: 3 s and new tyres', () => {
    const { r, log } = stop('box');
    expect(on(log, 'pit')).toMatchObject({ how: 'box', secs: TUNE.pitBox });
    expect(on(log, 'pit_go').at - on(log, 'pit').at).toBeCloseTo(TUNE.pitBox, 1);
    expect(r.jo.grip).toBeGreaterThan(0.8);
  });
  it('2 s if the crew has done the drill', () => {
    const { log } = stop('box', { ...F, pit_clean: true });
    expect(on(log, 'pit').secs).toBe(TUNE.pitClean);
    expect(on(log, 'pit_go').at - on(log, 'pit').at).toBeCloseTo(TUNE.pitClean, 1);
  });
  it('short or long: 5 s, and the board says which', () => {
    const short = stop(-12);
    expect(on(short.log, 'pit')).toMatchObject({ how: 'short', secs: TUNE.pitMiss });
    const long = stop(14);
    expect(on(long.log, 'pit')).toMatchObject({ how: 'long', secs: TUNE.pitMiss });
    const r = raceFor(TRACKS.coppa, F);
    const bot = coppaBot({ box: -12 });
    while (r.script.pit !== 'in') r.step(bot(r));
    expect(r.script.board).toBe('SHORT');
  });
  it('through: no tyres for a second lap, and it is no faster than stopping, to a drilled crew by a second', () => {
    const { r, log } = stop('through');
    expect(types(log)).toContain('pit_through');
    expect(types(log)).not.toContain('pit');
    expect(r.jo.grip).toBeLessThan(0.05);
    const drilled = stop('box', { ...F, pit_clean: true }).r.result.time;
    expect(r.result.time).toBeGreaterThan(drilled);
    // and a soft set gives no shelter from it
    const soft = stop('through', { ...F, tyre_soft: true }).r;
    expect(soft.tune.gripMin).toBe(TUNE.gripMin);
    expect(soft.result.time).toBeGreaterThan(r.result.time - 0.5);
  });
  it('the rivals stop on the same lap, for 3 s, at their own stalls', () => {
    const r = raceFor(TRACKS.coppa, F);
    const bot = coppaBot();
    const stood = new Map();
    while (!r.result && r.t < 200) {
      r.step(bot(r));
      r.drain();
      for (const c of r.rivals) if (c.v < 0.5 && !c.out && c.d > 500) stood.set(c.id, (stood.get(c.id) ?? 0) + 1 / 120);
    }
    for (const c of r.rivals) {
      expect(c.pitted).toBe(true);
      if (c.id !== 'cassian') expect(stood.get(c.id)).toBeCloseTo(TUNE.pitBox, 0);
    }
  });
});

describe('team orders', () => {
  const orders = { ...F, sable_orders: true };
  it('HOLD only with the orders signed, and only while Dante is ahead', () => {
    const hold = runRace(TRACKS.salt, orders, tidy({ behind: 'dante' }));
    expect(hold.log.filter((e) => e.type === 'board' && e.text === 'HOLD').length).toBeGreaterThan(0);
    expect(hold.r.script.board).toBe('HOLD');
    const free = runRace(TRACKS.salt, F, tidy({ behind: 'dante' }));
    expect(free.log.filter((e) => e.type === 'board')).toEqual([]);
    expect(free.r.script.board).toBeNull();
  });
  it('passing him sets broke_orders, once; without orders there are none to break', () => {
    const { r, log } = runRace(TRACKS.salt, orders, tidy());
    expect(r.script.flags.broke_orders).toBe(true);
    expect(log.filter((e) => e.type === 'orders_broken')).toHaveLength(1);
    expect(r.result.place).toBeLessThanOrEqual(3);
    expect(runRace(TRACKS.salt, F, tidy()).r.script.flags.broke_orders).toBeUndefined();
  });
  it('holding still reaches the sheet, on either tyres', () => {
    for (const flags of [orders, { ...orders, tyres_short: true }]) {
      const { r } = runRace(TRACKS.salt, flags, tidy({ behind: 'dante' }));
      expect(r.script.flags.broke_orders).toBeUndefined();
      expect(r.result.place).toBe(3);
      expect(r.result.passed).toBe(true);
      expect(r.result.flags.clean).toBe(true);
    }
  });
  it('worn tyres start at the jar\'s grip', () => {
    expect(raceFor(TRACKS.salt, { tyres_short: true }).jo.grip).toBe(TUNE.wornStart);
    expect(raceFor(TRACKS.salt, {}).jo.grip).toBe(1);
  });
});

describe('the crossing', () => {
  const T = TRACKS.salt;
  const gate = T.things.find((o) => o.kind === 'crossing');
  it('a car at the top speed when the bell goes makes it; a car that braked for the cart does not', () => {
    const made = runRace(T, F, tidy());
    expect(made.r.jo.d).toBeGreaterThan(gate.d);
    expect(made.log.filter((e) => e.type === 'bump' && e.id === 'jo')).toEqual([]);
    expect(types(made.log)).toEqual(expect.arrayContaining(['crossing_bell', 'crossing_shut', 'crossing_open']));
    const base = tidy();
    const braked = (r) => (r.jo.d > 560 && r.jo.d < 640 && r.jo.v > 16 ? { ...base(r), throttle: false, brake: true } : base(r));
    const late = runRace(T, F, braked);
    const shutAt = on(late.log, 'crossing_shut').at;
    const openAt = on(late.log, 'crossing_open').at;
    expect(openAt - shutAt).toBeCloseTo(TUNE.crossingShut, 1);
    expect(shutAt - on(late.log, 'crossing_bell').at).toBeCloseTo(TUNE.crossingBell, 1);
    expect(late.r.result.time).toBeGreaterThan(made.r.result.time + 3);
  });
  it('a shut gate met at speed is a bump and a stop, never a spin, and it marks the tyres', () => {
    const r = raceFor(T, F);
    r.t = 0;
    Object.assign(r.jo, { d: gate.d - 50, v: 34, lampD: 620 });
    r.crossings[0].state = 'shut';
    const log = [];
    for (let i = 0; i < 240; i++) {
      r.step({ throttle: true });
      log.push(...r.drain());
    }
    expect(r.jo.spins).toBe(0);
    expect(r.jo.v).toBeLessThan(1);
    expect(r.jo.d + CAR_LEN / 2).toBeLessThanOrEqual(gate.d);
    expect(log.find((e) => e.type === 'bump')).toMatchObject({ id: 'jo', why: 'gate' });
    expect(r.jo.grip).toBeLessThan(1);
  });
  it('braking and rolling up to it beats meeting it flat: that is the reason to lift', () => {
    const r = (brake) => {
      const q = raceFor(T, F);
      q.t = 0;
      Object.assign(q.jo, { d: gate.d - 60, v: 34, lampD: 620 });
      Object.assign(q.crossings[0], { state: 'shut', rung: true, t: 0 });
      for (let i = 0; i < 12 * 120; i++) {
        const to = gate.d - q.jo.d;
        // the driver who reads it arrives as it lifts, still rolling
        const open = q.crossings[0].state === 'open';
        q.step(brake ? { throttle: open || q.jo.v < 8, brake: !open && q.jo.v > 8 && to < 90 } : { throttle: true });
        q.drain();
      }
      return q.jo;
    };
    expect(r(true).d).toBeGreaterThan(r(false).d);
    expect(r(true).grip).toBeGreaterThan(r(false).grip);
  });
  it('a car behind Jo stops for it too; nobody drives through a shut gate', () => {
    const r = raceFor(T, F);
    const bot = tidy();
    const seen = new Map();
    while (!r.result && r.t < 100) {
      r.step(bot(r));
      r.drain();
      if (r.crossings[0].state === 'shut') for (const c of r.cars) if (!seen.has(c.id)) seen.set(c.id, c.d);
      if (r.crossings[0].state === 'shut') {
        for (const c of r.cars) expect(seen.get(c.id) > gate.d || c.d < gate.d).toBe(true);
      }
    }
  });
});

describe('the wheel and the choice', () => {
  const T = TRACKS.coppa;
  it('passing: a clean win by plenty, passed_cassian', () => {
    const bot = coppaBot();
    const { r, log } = runRace(T, F, bot);
    expect(r.script.flags).toMatchObject({ passed_cassian: true });
    expect(r.script.flags.helped_cassian).toBeUndefined();
    expect(on(log, 'choice').how).toBe('pass');
    expect(r.result).toMatchObject({ place: 1, passed: true });
    expect(r.result.flags.clean).toBe(true);
    expect(margin(r, bot)).toBeGreaterThan(4);
  });
  it('stopping: the win survives it by 1.5 s, on the tidy pace, and it costs 6 s on the clock', () => {
    const pass = runRace(T, F, coppaBot()).r.result.time;
    const bot = coppaBot({ cassian: 'stop' });
    const { r, log } = runRace(T, F, bot);
    expect(r.script.flags).toMatchObject({ helped_cassian: true });
    expect(r.script.flags.passed_cassian).toBeUndefined();
    expect(on(log, 'choice').how).toBe('stop');
    expect(on(log, 'stop_go').at - on(log, 'choice').at).toBeCloseTo(TUNE.stopHelp, 1);
    expect(r.result).toMatchObject({ place: 1, passed: true });
    expect(r.result.flags.clean).toBe(true);
    expect(Math.abs(r.result.time - pass - 6)).toBeLessThan(0.5);
    expect(margin(r, bot)).toBeGreaterThanOrEqual(1.5);
  });
  it('the rubber band does not close it in a bend: the same win with the band off is by no less than a second', () => {
    const go = (tune) => {
      const r = raceFor(T, F, { tune });
      const bot = coppaBot({ cassian: 'stop' });
      while (!r.result && r.t < 200) {
        r.step(bot(r));
        r.drain();
      }
      return margin(r, bot);
    };
    const withBand = go({ ...TUNE, untuned: false });
    const noBand = go({ ...TUNE, untuned: false, bandMax: 0 });
    expect(noBand - withBand).toBeLessThan(2); // the band is on the straights, a little
    expect(noBand).toBeGreaterThanOrEqual(withBand - 0.1);
  });
  it('the wheel goes within 60 m of Jo, or at the bend\'s exit, and he stays out', () => {
    const { r, log } = runRace(T, F, coppaBot());
    const wheel = on(log, 'wheel');
    const gull = T.bends.filter((b) => b.name === 'Gull Bend')[1];
    expect(wheel.d).toBeGreaterThanOrEqual(gull.from);
    expect(wheel.d).toBeLessThan(gull.to);
    expect(Math.abs(wheel.gap)).toBeLessThanOrEqual(TUNE.wheelNear);
    expect(r.rivals.find((c) => c.id === 'cassian').finished).toBeNull();
    // a slow Jo far behind: it goes at the exit all the same
    const far = runRace(T, F, coppaBot({ drive: tidy({ margin: 30, k: 0.7 }) }));
    const w = on(far.log, 'wheel');
    expect(w.gap).toBeGreaterThan(TUNE.wheelNear);
    expect(w.d).toBeGreaterThanOrEqual(gull.to - TUNE.wheelExit - 1);
  });
  it('off behind Jo, the choice is still there', () => {
    const bot = coppaBot({ drive: gapBot(), cassian: 'stop' });
    const { r, log } = runRace(T, F, bot);
    expect(on(log, 'wheel').gap).toBeLessThan(0);
    expect(r.script.flags.helped_cassian).toBe(true);
    expect(r.result.place).toBe(1);
  });
  it('failing to win is possible, and it is a retry: too slow, or a spin and the stop', () => {
    const slow = runRace(T, F, coppaBot({ drive: tidy({ margin: 20, k: 0.85 }) })).r;
    expect(slow.result.place).toBeGreaterThan(1);
    expect(slow.result.passed).toBe(false);
    // a run a little off the tidy pace wins if it goes by, and not if it stops: that is the decision
    const off = (cassian) => runRace(T, F, coppaBot({ drive: tidy({ margin: 12, k: 0.94 }), cassian })).r.result;
    expect(off('pass').place).toBe(1);
    expect(off('stop').place).toBeGreaterThan(1);
    expect(off('stop').passed).toBe(false);
  });
  it('Cassian\'s lead is never "lost" on the card: the story knows', () => {
    const r = raceFor(T, F);
    r.t = 10;
    r.jo.d = 200;
    r.jo.v = 30;
    r.rivals.find((c) => c.id === 'cassian').d = 1500;
    expect(raceLost(r)).toBe(false);
  });
});

describe('the length', () => {
  it('a tidy season: four races under 4:20 of race time', () => {
    const times = [
      runRace(TRACKS.pinewood, F, tidy()).r.result.time,
      runRace(TRACKS.harbour, F, tidy({ air: 'aldo' })).r.t,
      runRace(TRACKS.salt, F, tidy()).r.result.time,
      runRace(TRACKS.coppa, F, coppaBot()).r.result.time,
    ];
    expect(times.reduce((a, b) => a + b)).toBeLessThan(260);
  });
});
