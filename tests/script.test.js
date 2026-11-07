// The story on the road, by bot: RACER_REBUILD_PLAN §7's promises about the scripts.
import { describe, it, expect } from 'vitest';
import { TUNE, CAR_LEN, raceLost } from '../src/engines/race.js';
import { steerTo, dodge, tellFlash } from '../src/engines/rivals.js';
import { TRACKS } from '../src/dreams/racer/race/tracks.js';
import { raceFor, triedIt } from '../src/dreams/racer/race/script.js';
import { tidy, gapBot, coppaBot, runRace, rusty, newcomer, best } from './raceBots.js';

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
  it('held_aldo: one pull-out before the cue does not lose it, and steering round him is said out loud', () => {
    const air = tidy({ air: 'aldo' });
    const lastPull = (r) => (r.jo.d > 1000 ? { ...air(r), steer: steerTo(r.jo, r.rivals[0].x + 0.6) } : air(r));
    expect(runRace(T, F, lastPull).r.script.flags.held_aldo).toBe(true);
    const round = runRace(T, F, tidy());
    expect(round.log.find((e) => e.type === 'air')).toMatchObject({ held: false });
    const inHis = runRace(T, F, air);
    expect(inHis.log.find((e) => e.type === 'air')).toMatchObject({ held: true });
    expect(inHis.r.script.air).toBe(true);
    expect(raceFor(T, F).script.air).toBeNull();
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
    expect(soft.tune.gripMin).toBe(TUNE.pitThroughMin);
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
      for (let i = 0; i < 5 * 120; i++) {
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
  it('stopping: the win survives it by 3 s, on the tidy pace, and it costs about 5 s on the clock', () => {
    const pass = runRace(T, F, coppaBot()).r.result.time;
    const bot = coppaBot({ cassian: 'stop' });
    const { r, log } = runRace(T, F, bot);
    expect(r.script.flags).toMatchObject({ helped_cassian: true });
    expect(r.script.flags.passed_cassian).toBeUndefined();
    expect(on(log, 'choice').how).toBe('stop');
    expect(on(log, 'stop_go').at - on(log, 'choice').at).toBeCloseTo(TUNE.stopHelp, 1);
    expect(r.result).toMatchObject({ place: 1, passed: true });
    expect(r.result.flags.clean).toBe(true);
    expect(Math.abs(r.result.time - pass - 5)).toBeLessThan(0.5);
    expect(margin(r, bot)).toBeGreaterThanOrEqual(3);
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
  it('failing to win is possible on the first try, and it is a retry; the kind choice is not what fails it', () => {
    const slow = runRace(T, F, coppaBot({ drive: tidy({ margin: 20, k: 0.8 }) })).r;
    expect(slow.result.place).toBeGreaterThan(1);
    expect(slow.result.passed).toBe(false);
    // a run a little off the tidy pace wins whichever he chooses
    const off = (cassian) => runRace(T, F, coppaBot({ drive: tidy({ margin: 15, k: 0.95 }), cassian })).r.result;
    expect(off('pass').place).toBe(1);
    expect(off('stop').place).toBe(1);
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

// The balance review (docs/redesign/advice/racer_rebuild_review.md): harder to master, not harder to finish.
describe('harder to master, not harder to finish', () => {
  const FIRST = {}; // the first time through: an untuned car, no soft tyres, no drill
  const branches = (T) => (T.id === 'coppa' ? ['pass', 'stop'] : [null]);
  const driven = (T, drive, cassian) => (T.id === 'coppa' ? coppaBot({ drive, cassian }) : drive);
  // which try does this driver first pass the gate on? (the help goes by failed tries)
  const firstPass = (T, flags, make, cassian) => {
    for (let tries = 0; tries < 8; tries++) {
      const r = raceFor(T, flags, { tries });
      const bot = driven(T, make(), cassian);
      for (let i = 0; i < 240 * 120 && !r.result; i++) {
        r.step(bot(r));
        r.drain();
      }
      if (r.result?.passed) return { tryNo: tries + 1, r };
    }
    return { tryNo: Infinity };
  };
  const gates = [
    [TRACKS.pinewood, FIRST],
    [TRACKS.salt, FIRST],
    [TRACKS.salt, { tyres_short: true }],
    [TRACKS.salt, { tyres_short: true, sable_orders: true }],
    [TRACKS.coppa, FIRST],
  ];

  for (const [T, flags] of gates) {
    for (const cassian of branches(T)) {
      const name = `${T.id} ${JSON.stringify(flags)} ${cassian ?? ''}`;
      it(`${name}: a rusty driver is through on the first or second try; on the Salt Road a mistake at the worst place can take a third`, () => {
        expect(firstPass(T, flags, () => rusty({ track: T }), cassian).tryNo).toBeLessThanOrEqual(2);
        T.bends.forEach((_, at) => expect(firstPass(T, flags, () => rusty({ track: T, at }), cassian).tryNo).toBeLessThanOrEqual(T.id === 'salt' ? 3 : 2));
      });
      it(`${name}: a new driver is through by the fourth, wherever his trip into the straw falls`, () => {
        T.bends.forEach((b, at) => {
          if (b.outside === 'straw') expect(firstPass(T, flags, () => newcomer({ track: T, at }), cassian).tryNo).toBeLessThanOrEqual(4);
        });
      });
    }
  }
  it('the first try is a real test: neither gets it first time with his mistake in the middle', () => {
    for (const T of [TRACKS.salt, TRACKS.coppa, TRACKS.pinewood]) {
      expect(firstPass(T, FIRST, () => newcomer({ track: T })).tryNo).toBeGreaterThan(1);
      expect(firstPass(T, FIRST, () => rusty({ track: T })).tryNo).toBeGreaterThan(1);
    }
  });
  it('the Coppa is won, not given: first over the line, the choice made, whatever the tries', () => {
    const T = TRACKS.coppa;
    for (const cassian of ['pass', 'stop']) {
      const { r } = firstPass(T, FIRST, () => newcomer({ track: T }), cassian);
      expect(r.result.place).toBe(1);
      expect(r.script.flags[cassian === 'stop' ? 'helped_cassian' : 'passed_cassian']).toBe(true);
    }
  });
  it('the help: rivals a little off on a place gate, more time on a time gate, capped, and Cassian untouched', () => {
    const c = TRACKS.coppa;
    expect(raceFor(c, F, { tries: 0 }).track).toBe(c);
    const eased = raceFor(c, F, { tries: 2 });
    const dante = c.rivals.find((q) => q.id === 'dante');
    expect(eased.rivals.find((q) => q.id === 'dante').top).toBeCloseTo(dante.top * (1 - 2 * c.ease), 5);
    expect(eased.rivals.find((q) => q.id === 'dante').k).toBeCloseTo(dante.k * (1 - 2 * c.ease), 5);
    expect(eased.rivals.find((q) => q.id === 'cassian').top).toBe(c.rivals.find((q) => q.id === 'cassian').top);
    const p = TRACKS.pinewood;
    const sheet = p.gate.time;
    expect(raceFor(p, F, { tries: 2 }).track.gate.time).toBe(sheet + 2 * TUNE.easeTime);
    expect(raceFor(p, F, { tries: 99 }).track.gate.time).toBe(sheet + TUNE.easeMax * TUNE.easeTime);
    expect(p.gate.time).toBe(sheet); // (the track itself is never changed)
    expect(raceFor(c, F, { tries: 99 }).rivals.find((q) => q.id === 'dante').top).toBeCloseTo(dante.top * TUNE.easeFloor, 5);
    expect(raceFor(TRACKS.harbour, F, { tries: 3 }).rivals.find((q) => q.id === 'teo').top).toBe(TRACKS.harbour.rivals.find((q) => q.id === 'teo').top);
  });
  it('only a real attempt is a try: a restart in the first half buys nothing, one past half does, a finish never double-counts', () => {
    for (const T of [TRACKS.pinewood, TRACKS.salt, TRACKS.coppa]) {
      const r = raceFor(T, F);
      r.jo.d = T.length * 0.49;
      expect(triedIt(r)).toBe(false); // (four restarts on the first bend are not four tries: no walkover)
      r.jo.d = T.length * 0.5;
      expect(triedIt(r)).toBe(true);
      r.result = { place: 4, time: 99 };
      expect(triedIt(r)).toBe(false); // (a finish is counted by applyResult, once)
    }
  });
  it("Cassian's tell is lit 0.4 s or more, in two flashes, and holds to the move", () => {
    let lit = 0;
    let flashes = 0;
    let was = false;
    for (let s = 0; s < 1; s += 0.001) {
      const on = tellFlash(s, TUNE.blockTell);
      if (on) lit += 0.001;
      if (on && !was) flashes += 1;
      was = on;
    }
    expect(lit).toBeGreaterThanOrEqual(0.4);
    expect(flashes).toBe(2);
    expect(tellFlash(TUNE.blockTell - 0.01, TUNE.blockTell)).toBe(true);
    expect(TUNE.blockTell).toBeGreaterThanOrEqual(0.4);
  });
  it('the expert has more to find: the best lines beat tidy by a visible margin, everywhere', () => {
    for (const T of [TRACKS.pinewood, TRACKS.salt, TRACKS.coppa]) {
      const fast = runRace(T, FIRST, driven(T, best(T))).r.result;
      const neat = runRace(T, FIRST, driven(T, tidy())).r.result;
      expect(neat.time - fast.time).toBeGreaterThan(0.8);
      expect(fast.flags).toMatchObject({ spins: 0, offroads: 0, rubs: 0 });
      expect(fast.time).toBeLessThanOrEqual(T.target); // Ottavia's time is there for him …
      expect(neat.time).toBeGreaterThan(T.target); // … and not for tidy
      expect(fast.place).toBeLessThanOrEqual(neat.place);
    }
  });
  it('nobody has to touch anybody: the tidy and the best win clean', () => {
    const T = TRACKS.coppa;
    for (const cassian of ['pass', 'stop']) expect(runRace(T, FIRST, coppaBot({ cassian })).r.result).toMatchObject({ place: 1, flags: { rubs: 0, spins: 0 } });
    expect(runRace(TRACKS.salt, FIRST, best(TRACKS.salt)).r.result).toMatchObject({ place: 1, flags: { rubs: 0, spins: 0 } });
  });

  describe('the wheel and the straw', () => {
    const T = TRACKS.pinewood;
    const noWheel = (r) => {
      const o = tidy({ margin: 1, k: 1 })(r);
      const round = dodge(r, r.jo);
      return { ...o, steer: round === null ? 0 : steerTo(r.jo, round) };
    };
    it('a car left alone in a bend ends in the hay: never steering misses the gate, and still gets home', () => {
      const { r } = runRace(T, FIRST, noWheel);
      expect(r.result.passed).toBe(false);
      expect(r.result.time).toBeGreaterThan(T.gate.time + 2);
      expect(r.jo.offroads).toBeGreaterThan(0);
    });
    it('the last bend is not free: skipping the brake costs more than 1.5 s, on Pinewood and the Salt Road', () => {
      for (const [track, name] of [[T, 'blind right'], [TRACKS.salt, 'the drop'], [TRACKS.salt, 'salt pans']]) {
        const b = track.bends.find((q) => q.name === name);
        const base = tidy();
        const skip = (r) => (r.nextBend(r.jo.d) === b && r.jo.d < b.from ? { ...base(r), throttle: true, brake: false } : base(r));
        const R = (bot) => runRace({ ...track, rivals: [] }, FIRST, bot);
        const { r, log } = R(skip);
        expect(log.some((e) => e.type === 'straw' && e.id === 'jo')).toBe(true);
        expect(r.result.time - R(tidy()).r.result.time).toBeGreaterThan(1.5);
      }
    });
    it('the brake is a loan on both sides: a little late costs tenths and tyres, a lot late costs the straw', () => {
      const at = (margin) => runRace(T, FIRST, tidy({ margin, k: 1, inside: 0 })).r;
      const [limit, early, late, later, tooLate] = [0, 15, -6, -12, -30].map(at);
      expect(early.result.time - limit.result.time).toBeGreaterThan(0.4); // early is paid for
      expect(limit.result.time).toBeLessThan(late.result.time); // the limit is the fastest place to be …
      expect(late.result.time - limit.result.time).toBeLessThan(0.7); // … a little past it is not a cliff …
      expect(later.result.time - limit.result.time).toBeLessThan(1.2);
      expect(late.jo.offroads + later.jo.offroads).toBe(0);
      expect(limit.jo.grip - later.jo.grip).toBeGreaterThan(0.2); // … it is paid in tyres
      expect(tooLate.jo.offroads).toBeGreaterThan(0);
      expect(tooLate.result.time - limit.result.time).toBeGreaterThan(3);
    });
    it('a bend taken on its limit without a slide pulls harder out of it', () => {
      expect(runRace(T, FIRST, tidy({ margin: 1, k: 1 })).log.filter((e) => e.type === 'sing')).toHaveLength(T.bends.length);
      expect(runRace(T, FIRST, tidy({ k: 0.8 })).log.filter((e) => e.type === 'sing').length).toBeLessThan(T.bends.length);
      const r = raceFor({ pieces: [{ straight: 50 }], gate: null, id: 'x', countdown: 0, lamps: [], things: [], cues: [] }, F);
      r.jo.v = 20;
      const a = () => {
        const v = r.jo.v;
        r.step({ throttle: true });
        return r.jo.v - v;
      };
      const plain = a();
      r.jo.v = 20;
      r.jo.singT = 1;
      expect(a()).toBeCloseTo(plain * TUNE.singPull, 4);
    });
  });

  describe('the line is a question per bend', () => {
    for (const id of ['pinewood', 'salt', 'coppa']) {
      const T = { ...TRACKS[id], rivals: [] };
      const n = T.bends.length;
      const time = (line) => runRace(T, F, driven(T, tidy({ margin: 1, k: 1, line }))).r.result.time;
      const lap = id === 'coppa' ? n / 2 : n;
      const one = (i, share) => {
        const line = Array(n).fill(0);
        line[i] = share;
        if (id === 'coppa') line[i + lap] = share;
        return time(line);
      };
      it(`${id}: the outside wins some and the inside wins some, and the right mix beats any one line`, () => {
        const pick = Array.from({ length: lap }, (_, i) => one(i, 0.7) - one(i, -0.7)); // minus: the outside is faster
        expect(pick.some((d) => d < -0.25)).toBe(true);
        expect(pick.some((d) => d > 0.25)).toBe(true);
        const right = pick.map((d) => (d < 0 ? 0.7 : -0.7));
        const mix = time(id === 'coppa' ? [...right, ...right] : right);
        expect(mix).toBeLessThan(Math.min(time(Array(n).fill(0.7)), time(Array(n).fill(-0.7))) - 0.25);
      });
    }
  });

  describe('the finale', () => {
    const T = TRACKS.coppa;
    const clear = (bot) => {
      const { r } = runRace(T, FIRST, bot);
      expect(r.result.place).toBe(1);
      return margin(r, bot);
    };
    it('both branches are the same race: tidy and cautious win either way, by about the same', () => {
      for (const drive of [tidy(), tidy({ margin: 15, k: 0.95 })]) {
        const [pass, stop] = ['pass', 'stop'].map((cassian) => clear(coppaBot({ drive, cassian })));
        expect(stop).toBeGreaterThan(1);
        expect(Math.abs(pass - stop)).toBeLessThan(1.5);
      }
    });
    it('passing is no walkover for a tidy car', () => {
      expect(clear(coppaBot())).toBeLessThan(6);
    });
    it('a wall takes something out of the margin each time, and not the race', () => {
      const gull = T.bends.filter((b) => b.name === 'Gull Bend')[0];
      const margins = [0, 1, 2].map((n) => {
        const base = coppaBot();
        const bot = (r) => (r.jo.spins < n && r.jo.d > gull.from - 40 && r.jo.d < gull.to ? { throttle: true, brake: false, steer: gull.side } : base(r));
        const { r } = runRace(T, FIRST, bot);
        expect(r.jo.spins).toBe(n);
        expect(r.rivals.filter((c) => !c.out && c.spins)).toEqual([]); // (nobody is put back into a bend at a speed that spins him)
        return margin(r, base);
      });
      expect(margins[0] - margins[1]).toBeGreaterThan(1.5);
      expect(margins[1] - margins[2]).toBeGreaterThan(0.3);
      expect(margins[2]).toBeGreaterThan(0); // (a tidy car can hit it twice and still win)
    });
    it('the box is worth stopping for: new tyres beat none, the drill pays, and missing it costs what skipping it does', () => {
      const t = (box, flags = FIRST) => runRace({ ...T, rivals: [] }, flags, coppaBot({ box })).r.result.time; // (on an empty road: what comes out of the box next to you is another matter)
      const [stop, drilled, through, short] = [t('box'), t('box', { pit_clean: true }), t('through'), t(-12)];
      expect(through - stop).toBeGreaterThan(1.5);
      expect(stop - drilled).toBeGreaterThan(0.6);
      expect(short - stop).toBeGreaterThan(1.5);
      expect(Math.abs(through - short)).toBeLessThan(1.5);
    });
  });

  describe('the Salt Road', () => {
    const T = TRACKS.salt;
    const gate = T.things.find((o) => o.kind === 'crossing');
    it('top 3 on worn tyres has room in it: 1.5 s for tidy, and a cautious car is on the sheet', () => {
      const worn = { tyres_short: true };
      const bot = tidy();
      const { r } = runRace(T, worn, bot);
      expect(r.result.place).toBeLessThanOrEqual(3);
      const t0 = r.result.time;
      for (let i = 0; i < 60 * 120 && r.rivals.some((c) => c.finished === null); i++) r.step(bot(r));
      expect(Math.max(...r.rivals.map((c) => c.finished)) - t0).toBeGreaterThan(1.5);
      expect(runRace(T, worn, tidy({ margin: 15, k: 0.95 })).r.result.place).toBeLessThanOrEqual(3);
    });
    it('the bell goes as you come out of the chicane: gas down makes it, a lift does not, and the lift costs seconds', () => {
      const base = tidy();
      const R = (bot) => runRace({ ...T, rivals: [] }, FIRST, bot);
      const made = R(base);
      expect(made.log.filter((e) => e.type === 'bump' && e.why === 'gate')).toEqual([]);
      const lifted = (r) => (r.jo.d > gate.d - gate.bell - 10 && r.jo.d < gate.d - gate.bell + 40 ? { ...base(r), throttle: false } : base(r));
      const cost = R(lifted).r.result.time - made.r.result.time;
      expect(cost).toBeGreaterThan(2);
      expect(cost).toBeLessThan(6);
    });
  });
});
