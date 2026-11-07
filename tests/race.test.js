// The car and the race rules, with bots. Every number pinned here lives in TUNE
// or a track; the feel behind them has not been felt by anybody yet.
import { describe, it, expect } from 'vitest';
import { Race, TUNE, STEP, CAR_LEN, gripFactor, gripBand, brakeDistance, revs, bendSafe, outward, chalkAt, turnSide, draftBeat, raceLost, gatePassed } from '../src/engines/race.js';
import { STYLES, steerTo, dodge } from '../src/engines/rivals.js';
import { compile } from '../src/engines/road.js';
import { raceFor } from '../src/dreams/racer/race/script.js';
import { tidy, coppaBot, runRace } from './raceBots.js';
import { carTune } from '../src/dreams/racer/race/car.js';
import { TRACKS } from '../src/dreams/racer/race/tracks.js';

const FLAT = { pieces: [{ straight: 5000 }], countdown: 0, lamps: [600, 1200] };
const LONG = { pieces: [{ straight: 90000 }], countdown: 0 };
const types = (log) => log.map((e) => e.type);
const run = (race, policy, secs) => {
  const log = [];
  for (let i = 0; i < secs * 120; i++) {
    race.step({ ...policy(race) });
    log.push(...race.drain());
    if (race.result && policy.stop) break;
  }
  return log;
};
const gas = () => ({ throttle: true });
const secsTo = (v) => {
  const r = new Race(FLAT);
  let n = 0;
  while (r.jo.v < v && n < 40 * 120) {
    r.step({ throttle: true });
    n += 1;
  }
  return n / 120;
};
// a road with one bend at 400 m
const oneBend = (outside, bend = 'L', safe = 22) => ({ pieces: [{ straight: 400 }, { bend, len: 100, safe, outside }, { straight: 1500 }], countdown: 0, lamps: [100] });

// A driver on the engine's own numbers: a plan per bend ('in', 'mid', 'out', or the
// x it holds), dodges what stands in the road. Waits for the green, then taps it.
const LINE = { in: -0.33, mid: 0, out: 0.7, hug: -0.7 };
function driver(plans, { brakes = true, margin = 1, k = 0.995 } = {}) {
  return (race) => {
    const c = race.jo;
    if (race.t < 0) return {};
    const b = race.nextBend(c.d);
    const plan = b ? (typeof plans === 'string' ? plans : plans[race.track.bends.indexOf(b)]) : 'mid';
    const want = b ? LINE[plan] * b.side : 0;
    const near = b && b.from - c.d < 110;
    const carAhead = race.rivals.find((o) => o.d > c.d && o.d - c.d < CAR_LEN * 3 && Math.abs(o.x - c.x) < TUNE.carWide + 0.05);
    const target = dodge(race, c) ?? (carAhead ? carAhead.x + (carAhead.x > 0 ? -0.55 : 0.55) : near ? want : Math.abs(c.x) > 0.9 ? 0 : c.x);
    let brake = false;
    let throttle = true;
    if (b && brakes) {
      const lim = bendSafe(b, c.x, gripFactor(c.grip)) * k;
      if (c.d >= b.from) {
        brake = c.v > lim;
        throttle = c.v < lim * 0.985;
      } else {
        brake = race.wantsBrake(c, { k, margin, x: want });
        throttle = !brake;
      }
    }
    return { throttle, brake, steer: steerTo(c, target) };
  };
}
const lapOn = (track, bot, rivals = []) => {
  const r = new Race(track, { rivals });
  const log = [];
  for (let i = 0; i < 150 * 120 && !r.result; i++) {
    r.step(bot(r));
    log.push(...r.drain());
  }
  return { r, log };
};
const testRace = () => new Race(TRACKS.test, { rivals: [TRACKS.test.rival] });

describe('the car on a flat road', () => {
  it('pulls hard off the line and takes its time to the top', () => {
    expect(secsTo(20)).toBeGreaterThan(2.5);
    expect(secsTo(20)).toBeLessThan(3.6);
    expect(secsTo(34)).toBeGreaterThan(7);
    expect(secsTo(34)).toBeLessThan(12);
  });
  it('tops out at the design speed and no higher', () => {
    const r = new Race(FLAT);
    run(r, gas, 30);
    expect(r.jo.v).toBeGreaterThan(TUNE.vMax - 0.5);
    expect(r.jo.v).toBeLessThanOrEqual(TUNE.vMax);
  });
  it('rolls on when you lift, and stops on the brake in about 4 s from the top', () => {
    const r = new Race(FLAT);
    run(r, gas, 25);
    const v0 = r.jo.v;
    run(r, () => ({}), 1);
    expect(v0 - r.jo.v).toBeGreaterThan(2);
    expect(v0 - r.jo.v).toBeLessThan(5);
    const r2 = new Race(FLAT);
    run(r2, gas, 25);
    let n = 0;
    while (r2.jo.v > 0 && n < 1200) {
      r2.step({ brake: true });
      n += 1;
    }
    expect(n / 120).toBeGreaterThan(3);
    expect(n / 120).toBeLessThan(5.5);
  });
  it('fades the drums when the brake is held, and only then', () => {
    const lost = (held) => {
      const r = new Race(LONG);
      r.jo.v = 20;
      r.jo.brakeHeld = held;
      r.step({ brake: true });
      return 20 - r.jo.v;
    };
    expect(lost(0)).toBeCloseTo(lost(2), 5);
    expect(lost(6)).toBeLessThan(lost(0));
  });
  it('runs the same race at any frame rate', () => {
    const go = (ms) => {
      const r = new Race(FLAT);
      for (let t = 0; t < 8000; t += ms) r.advance({ throttle: true, steer: 0.2 }, ms);
      return [r.jo.d, r.jo.x];
    };
    expect(Math.abs(go(16.67)[0] - go(33.33)[0])).toBeLessThan(1);
    expect(Math.abs(go(16.67)[0] - go(8.33)[0])).toBeLessThan(1);
    expect(Math.abs(go(16.67)[1] - go(33.33)[1])).toBeLessThan(0.01);
  });
  it('a hitch costs no more than 50 ms of race', () => {
    const r = new Race(FLAT);
    expect(r.advance({ throttle: true }, 400)).toBeLessThanOrEqual(6);
  });
  it('sets the note by speed: idle low, red line at the top', () => {
    expect(revs(0)).toBeCloseTo(0.18, 2);
    expect(revs(TUNE.vMax)).toBeCloseTo(1, 2);
    expect(revs(18)).toBeGreaterThan(revs(9));
  });
});

describe('the wheel', () => {
  const steered = (v, steer, secs = 0.1) => {
    const r = new Race(FLAT);
    r.jo.v = v;
    for (let i = 0; i < secs * 120; i++) {
      r.jo.v = v;
      r.step({ steer, throttle: true });
    }
    return r.jo.x;
  };
  it('steers at its full rate at the top speed, and less at a crawl', () => {
    expect(steered(TUNE.vMax, 1)).toBeCloseTo(TUNE.steerRate * 0.1, 2);
    expect(steered(TUNE.vMax, -1)).toBeCloseTo(-TUNE.steerRate * 0.1, 2);
    expect(steered(1, 1)).toBeLessThan(steered(TUNE.vMax, 1) * (TUNE.steerLow + 0.05));
    expect(steered(1, 1)).toBeGreaterThan(steered(TUNE.vMax, 1) * TUNE.steerLow);
  });
  it('takes the analog in between, and no more than full lock', () => {
    expect(steered(TUNE.vMax, 0.5)).toBeCloseTo(TUNE.steerRate * 0.05, 2);
    expect(steered(TUNE.vMax, 7)).toBeCloseTo(steered(TUNE.vMax, 1), 5);
  });
  it('a parked car with no gas does not slide sideways', () => {
    const r = new Race(FLAT);
    run(r, () => ({ steer: 1 }), 1);
    expect(r.jo.x).toBe(0);
  });
  it('stops at the edge of the world on a straight, on the verge, and drives out', () => {
    const r = new Race(FLAT);
    r.jo.v = 30;
    const log = run(r, () => ({ steer: 1, throttle: true }), 2);
    expect(r.jo.x).toBe(TUNE.off);
    expect(r.jo.onVerge).toBe(true);
    expect(types(log).filter((t) => t === 'verge')).toHaveLength(1);
    expect(r.jo.state).toBe('run');
    run(r, () => ({ steer: -1, throttle: true }), 1);
    expect(r.jo.onVerge).toBe(false);
  });
  it('the verge drags and wears', () => {
    const r = new Race(LONG);
    const s = new Race(LONG);
    r.jo.x = TUNE.edge + 0.1;
    r.jo.v = s.jo.v = 30;
    run(r, () => ({}), 1);
    run(s, () => ({}), 1);
    expect(s.jo.v - r.jo.v).toBeCloseTo(TUNE.vergeDrag, 0);
    expect(1 - r.jo.grip).toBeCloseTo(TUNE.wearVerge, 2);
    expect(s.jo.grip).toBe(1);
  });
});

describe('the start', () => {
  const start = (press, release = Infinity) => {
    const r = new Race({ pieces: [{ straight: 2000 }], countdown: 1 });
    const log = [];
    for (let i = 0; i < 4 * 120; i++) {
      const at = i / 120;
      r.step({ throttle: at >= press && at < release });
      log.push(...r.drain());
    }
    return { d: r.jo.d, ev: types(log), r };
  };
  const later = TUNE.launchWindow + 0.2; // pressed too late for a launch
  it('a tap of the gas on the green is a good start', () => {
    const good = start(1 + TUNE.launchWindow / 2);
    const none = start(1 + later);
    expect(good.ev).toContain('launch');
    expect(good.r.launched).toBe(true);
    expect(none.ev).not.toContain('launch');
    expect(good.d).toBeGreaterThan(none.d + 2);
  });
  it('a tap just before the green still counts', () => {
    expect(start(1 - TUNE.launchEarly / 2).ev).toContain('launch');
  });
  it('gas held before the green bogs for a moment', () => {
    const held = start(0.5);
    const on = start(1 + TUNE.launchWindow / 2);
    expect(held.ev).toContain('jump_start');
    expect(held.ev).not.toContain('launch');
    expect(held.r.launched).toBe(false);
    expect(on.d - held.d).toBeGreaterThan(2);
    const r = new Race({ pieces: [{ straight: 2000 }], countdown: 1 });
    run(r, gas, 1 + TUNE.bogTime / 2);
    expect(r.jo.d).toBe(0); // no pull yet
    run(r, gas, TUNE.bogTime);
    expect(r.jo.d).toBeGreaterThan(0);
  });
  it('gas lifted before the green costs nothing, and a fresh tap still launches', () => {
    const r = new Race({ pieces: [{ straight: 2000 }], countdown: 1 });
    const log = run(r, () => ({ throttle: r.t < -0.5 || r.t > 0.05 }), 2);
    expect(types(log)).toContain('launch');
    expect(types(log)).not.toContain('jump_start');
  });
  it('does not move before GO', () => {
    const r = new Race({ pieces: [{ straight: 2000 }], countdown: 3 });
    for (let i = 0; i < 2.9 * 120; i++) r.step({ throttle: true });
    expect(r.jo.d).toBe(0);
    expect(r.jo.throttle).toBe(true);
  });
});

describe('grip', () => {
  it('bald tyres cost at most a fair 25 percent', () => {
    expect(gripFactor(1)).toBe(1);
    expect(gripFactor(0)).toBe(TUNE.gripMin);
    expect(gripFactor(-5)).toBe(TUNE.gripMin);
    expect(gripBand(0.8)).toBe('green');
    expect(gripBand(0.4)).toBe('worn');
    expect(gripBand(0.1)).toBe('bald');
  });
  it('wears under hard braking and in a slide, never on a clean pull', () => {
    const r = new Race(FLAT);
    run(r, gas, 12);
    expect(r.jo.grip).toBe(1);
    run(r, () => ({ brake: true }), 1);
    expect(1 - r.jo.grip).toBeCloseTo(TUNE.wearBrake, 2);
    const s = new Race(oneBend('straw'));
    Object.assign(s.jo, { d: 400, v: 26 });
    const before = s.jo.grip;
    s.step({ throttle: true });
    s.step({ throttle: true });
    expect(s.jo.grip).toBeLessThan(before);
  });
  it('a gentle brake does not wear', () => {
    const r = new Race(FLAT);
    r.jo.v = TUNE.wearBrakeOver - 1;
    run(r, () => ({ brake: true }), 0.5);
    expect(r.jo.grip).toBe(1);
  });
  it('worn tyres brake longer, by no more than the fair limit', () => {
    const stop = (grip) => {
      const r = new Race(FLAT);
      r.jo.v = 30;
      r.jo.grip = grip;
      while (r.jo.v > 0) r.step({ brake: true });
      return r.jo.d;
    };
    expect(stop(0)).toBeGreaterThan(stop(1) * 1.1);
    expect(stop(0)).toBeLessThan(stop(1) * 1.35);
  });
  it('worn tyres slide sooner', () => {
    const b = compile(oneBend('straw')).bends[0];
    expect(bendSafe(b, 0, gripFactor(0))).toBeLessThan(bendSafe(b, 0, gripFactor(1)));
    const slips = (grip) => {
      const r = new Race(oneBend('straw'));
      Object.assign(r.jo, { d: 410, v: b.safe - 1, grip });
      r.step({});
      return r.jo.slip;
    };
    expect(slips(1)).toBe(0);
    expect(slips(0)).toBeGreaterThan(0);
  });
  it('an untuned engine runs hot late and tops out lower; only then', () => {
    const top = (tune, d) => {
      const r = new Race({ pieces: [{ straight: 100000 }], countdown: 0 }, { tune });
      Object.assign(r.jo, { d: d * 100000, v: TUNE.vMax });
      for (let i = 0; i < 25 * 120; i++) r.step({ throttle: true });
      return r.jo.v;
    };
    const hot = carTune({}, {});
    expect(hot.untuned).toBe(true);
    expect(carTune({}, { tuned: true }).untuned).toBe(false);
    expect(top(hot, TUNE.hotAfter + 0.01)).toBeCloseTo(TUNE.vMax * TUNE.hotTop, 0);
    expect(top(hot, TUNE.hotAfter - 0.1)).toBeGreaterThan(TUNE.vMax * TUNE.hotTop + 0.5);
    expect(top(carTune({}, { tuned: true }), TUNE.hotAfter + 0.01)).toBeGreaterThan(TUNE.vMax - 0.5);
  });
});

describe('bends', () => {
  it('the outside holds more and is further; the inside the reverse', () => {
    const [l] = compile(oneBend('straw', 'L', 20)).bends;
    const [rb] = compile(oneBend('straw', 'R', 20)).bends;
    expect(l.side).toBe(1);
    expect(outward(l, 1)).toBe(1);
    expect(outward(l, -1)).toBe(-1);
    expect(outward(rb, -1)).toBe(1);
    expect(outward(l, 9)).toBe(1); // (past the edge is no better)
    expect(bendSafe(l, 0)).toBe(20);
    expect(bendSafe(l, 1)).toBe(20 + TUNE.lineSpeed);
    expect(bendSafe(rb, 1)).toBe(20 - TUNE.lineSpeed);
    expect(turnSide(l)).toBe('LEFT');
    expect(turnSide(rb)).toBe('RIGHT');
    const go = (x) => {
      const r = new Race({ pieces: [{ bend: 'L', len: 2000, safe: 40 }], countdown: 0 });
      Object.assign(r.jo, { d: 100, v: 20, x });
      for (let i = 0; i < 60; i++) r.step({ steer: 0 });
      return r.jo.d;
    };
    expect(go(-0.8)).toBeGreaterThan(go(0));
    expect(go(0)).toBeGreaterThan(go(0.8));
  });
  it('under the limit the curve pulls outward: the wheel must be held, and holding it is enough', () => {
    const r = new Race(oneBend('straw'));
    const b = r.track.bends[0];
    Object.assign(r.jo, { d: 400, v: 21, lampD: 100 });
    r.step({});
    const pull = (r.jo.x - 0) / STEP;
    expect(pull).toBeCloseTo(TUNE.curvePull * Math.abs(b.curve) * (21 / TUNE.vMax) ** 2, 3);
    run(r, () => ({}), 4);
    expect(r.jo.x).toBeGreaterThan(0.3); // left alone it drifts out …
    expect(r.jo.offroads).toBe(0); // … and at this length stays on the road
    const held = new Race(oneBend('straw'));
    Object.assign(held.jo, { d: 400, v: 21, lampD: 100 });
    run(held, (x) => ({ steer: steerTo(x.jo, 0) }), 4);
    expect(Math.abs(held.jo.x)).toBeLessThan(0.1);
  });
  it('the pull is the same at every bend when it is taken on the limit', () => {
    const at = (safe) => {
      const b = compile(oneBend('straw', 'L', safe)).bends[0];
      return Math.abs(b.curve) * (safe / TUNE.vMax) ** 2;
    };
    expect(at(19)).toBeCloseTo(at(30), 5);
  });
  it('over the limit it slides and scrubs, and a hit of straw costs speed, tyre and that is all', () => {
    const r = new Race(oneBend('straw'));
    Object.assign(r.jo, { d: 395, v: TUNE.vMax, lampD: 100 });
    let vAtStraw = null;
    const log = [];
    for (let i = 0; i < 5 * 120; i++) {
      const v0 = r.jo.v;
      r.step({ throttle: true });
      const ev = r.drain();
      log.push(...ev);
      if (types(ev).includes('straw')) vAtStraw = [v0, r.jo.v, r.jo.x];
    }
    expect(vAtStraw).not.toBeNull();
    expect(vAtStraw[1]).toBeLessThan(vAtStraw[0] * (1 - TUNE.strawLoss) + 0.2);
    expect(vAtStraw[2]).toBe(TUNE.strawBack);
    expect(r.jo.state).toBe('run');
    expect(r.jo.spins).toBe(0);
    expect(r.jo.grip).toBeLessThanOrEqual(1 - TUNE.wearStraw);
  });
  it('the straw takes one hit per bend, and leaning on it after is no way round', () => {
    const r = new Race({ pieces: [{ bend: 'L', len: 4000, safe: 20, outside: 'straw' }], countdown: 0 });
    Object.assign(r.jo, { d: 10, v: TUNE.vMax });
    const log = run(r, gas, 6);
    expect(types(log).filter((t) => t === 'straw')).toHaveLength(1);
    expect(r.jo.x).toBe(TUNE.off);
    expect(r.jo.v).toBeLessThan(bendSafe(r.track.bends[0], TUNE.off) + 2);
  });
  it('the inside of a bend has no straw and no wall', () => {
    const r = new Race(oneBend('wall'));
    Object.assign(r.jo, { d: 400, v: 15, lampD: 100 });
    const log = run(r, () => ({ steer: -1 }), 3);
    expect(types(log)).not.toContain('spin');
    expect(types(log)).not.toContain('straw');
    expect(r.jo.x).toBe(-TUNE.off);
  });
  it('a wall on the outside spins you back to the lamp, driving, in 3 s', () => {
    const r = new Race(oneBend('wall', 'R'));
    Object.assign(r.jo, { d: 395, v: TUNE.vMax, lampD: 100 });
    let spunAt = null;
    let backAt = null;
    for (let i = 0; i < 8 * 120 && backAt === null; i++) {
      r.step({ throttle: true });
      for (const e of r.drain()) {
        if (e.type === 'spin') spunAt = i;
        if (e.type === 'back') backAt = i;
      }
    }
    expect(spunAt).not.toBeNull();
    expect((backAt - spunAt) / 120).toBeCloseTo(TUNE.backAt, 1);
    expect(r.jo.d).toBeGreaterThanOrEqual(100);
    expect(r.jo.d).toBeLessThan(102);
    expect(r.jo.x).toBe(0);
    expect(r.jo.v).toBe(TUNE.rollOut);
  });
  it('a crawl into the wall is no spin', () => {
    const r = new Race(oneBend('wall', 'R'));
    Object.assign(r.jo, { d: 420, v: TUNE.hardHit - 2, lampD: 100 });
    Object.assign(r.jo, { x: -TUNE.off + 0.01 });
    const log = run(r, () => ({ steer: -1 }), 0.5);
    expect(types(log)).not.toContain('spin');
  });
  it('a late brake and the wheel can save it, on all but the line by the wall', () => {
    const saved = (x, over) => {
      const r = new Race(oneBend('wall', 'R', 19));
      const b = r.track.bends[0];
      Object.assign(r.jo, { d: b.from - 0.5, v: bendSafe(b, x) * over, x, lampD: 100 });
      for (let i = 0; i < 6 * 120 && r.jo.d < b.to && !r.jo.spins; i++) {
        const late = (r.jo.d - b.from) / Math.max(r.jo.v, 1) > 0.3; // about 0.3 s in
        r.step({ brake: late && r.jo.v > bendSafe(b, r.jo.x), steer: late ? steerTo(r.jo, 0) : 0 });
        r.drain();
      }
      return r.jo.spins === 0;
    };
    expect(saved(0.5, 1.25)).toBe(true); // (a right-hander: +x is the inside)
    expect(saved(0, 1.2)).toBe(true);
    expect(saved(-1.1, 1.3)).toBe(false);
  });
  it('the slide leaves you slower than the limit, not at it', () => {
    const r = new Race({ pieces: [{ straight: 100 }, { bend: 'L', len: 300, safe: 20, outside: 'straw' }, { straight: 1000 }], countdown: 0 });
    Object.assign(r.jo, { d: 100, v: 28, x: -0.8 });
    let low = 99;
    for (let i = 0; i < 360; i++) {
      r.step({ steer: steerTo(r.jo, -0.8) });
      low = Math.min(low, r.jo.v);
    }
    expect(low).toBeLessThan(bendSafe(r.track.bends[0], -0.8) - 0.5);
  });
  it('the chalk is where the brake really has to go on', () => {
    for (const bend of TRACKS.test.bends) {
      const r = new Race({ pieces: [{ straight: 500 }, { bend: bend.side > 0 ? 'L' : 'R', len: 200, safe: bend.safe }, { straight: 500 }], countdown: 0 });
      const b = r.track.bends[0];
      Object.assign(r.jo, { v: TUNE.vMax, d: chalkAt(b) });
      for (let i = 0; i < TUNE.chalkReact * 120; i++) r.step({ throttle: true });
      while (r.jo.d < b.from) r.step({ brake: true });
      expect(r.jo.v).toBeLessThanOrEqual(b.safe + 0.2);
      expect(r.jo.v).toBeGreaterThan(b.safe - 1.5);
    }
  });
});

describe('what is on the road', () => {
  it('a bale is soft and gone; a cart spins you; slowly it only stops you', () => {
    const r = new Race({ pieces: [{ straight: 3000 }], countdown: 0, lamps: [50], things: [{ d: 300, x: 0, kind: 'bale' }, { d: 600, x: 0, kind: 'cart' }] });
    Object.assign(r.jo, { d: 290, v: 20 });
    run(r, gas, 1);
    expect(r.obstacles[0].gone).toBe(true);
    expect(r.jo.v).toBeLessThan(20);
    expect(r.jo.state).toBe('run');
    Object.assign(r.jo, { d: 590, v: 30 });
    expect(types(run(r, gas, 1))).toContain('spin');
    const s = new Race({ pieces: [{ straight: 3000 }], countdown: 0, things: [{ d: 100, x: 0, kind: 'cart' }] });
    Object.assign(s.jo, { d: 95, v: 5 });
    expect(types(run(s, () => ({}), 2))).toContain('bump');
    expect(s.jo.state).toBe('run');
  });
  it('passes it if steered clear, and only just', () => {
    const at = (x) => {
      const r = new Race({ pieces: [{ straight: 3000 }], countdown: 0, things: [{ d: 100, x: 0, kind: 'cart' }] });
      Object.assign(r.jo, { d: 90, v: 30, x });
      return types(run(r, gas, 1)).includes('spin');
    };
    const wide = (TUNE.carWide + new Race({ pieces: [{ straight: 10 }], things: [{ d: 1, kind: 'cart' }] }).obstacles[0].wide) / 2;
    expect(at(wide + 0.02)).toBe(false);
    expect(at(-wide - 0.02)).toBe(false);
    expect(at(wide - 0.02)).toBe(true);
  });
  it('a car stopped against a cart can steer out on the gas', () => {
    const r = new Race({ pieces: [{ straight: 3000 }], countdown: 0, things: [{ d: 100, x: 0, kind: 'cart' }] });
    Object.assign(r.jo, { d: 97.9, v: 3 });
    run(r, (x) => ({ throttle: true, steer: x.jo.d < 105 ? 1 : 0 }), 6);
    expect(r.jo.d).toBeGreaterThan(110);
    expect(r.jo.spins).toBe(0);
  });
  it('a car pressing on a cart knocks twice a second, not every step', () => {
    const r = new Race({ pieces: [{ straight: 3000 }], countdown: 0, things: [{ d: 100, x: 0, kind: 'cart' }] });
    Object.assign(r.jo, { d: 97.9, v: 5 });
    const bumps = types(run(r, gas, 2)).filter((t) => t === 'bump').length;
    expect(bumps).toBeGreaterThan(1);
    expect(bumps).toBeLessThanOrEqual(2 / TUNE.bumpGap + 1);
  });
  it('gives a lamp when passed and a restart back to it', () => {
    const r = new Race(FLAT);
    Object.assign(r.jo, { d: 599, v: 30 });
    expect(run(r, gas, 1)).toContainEqual({ type: 'lamp', d: 600 });
    r.toLamp(r.jo, true);
    expect(r.jo.d).toBe(600);
    expect(r.jo.state).toBe('run');
    expect(r.jo.v).toBe(TUNE.rollOut);
  });
  it('a cue fires once, where it is, and a lamp does not fire it again', () => {
    const r = new Race({ ...FLAT, lamps: [100], cues: [{ d: 150, id: 'crest' }, { d: 900, id: 'later' }] });
    Object.assign(r.jo, { d: 90, v: 30 });
    const log = run(r, gas, 3);
    expect(log.filter((e) => e.type === 'cue')).toEqual([{ type: 'cue', id: 'crest', d: 150 }]);
    r.toLamp(r.jo, true);
    expect(run(r, gas, 3).filter((e) => e.type === 'cue')).toEqual([]);
    expect(TRACKS.pinewood.cues.map((q) => q.id)).toContain('crest');
  });
});

describe('the draft and the sling', () => {
  const behind = (g, x = 0) => {
    const r = new Race({ pieces: [{ straight: 5000 }], countdown: 0 }, { rivals: [{ id: 'x', x, d: 100 + CAR_LEN + g * CAR_LEN }] });
    r.jo.d = 100;
    return r;
  };
  const hold = (r, s) => {
    for (let i = 0; i < s * 120; i++) r.drafts(STEP);
  };
  const slot = (TUNE.draftNear + TUNE.draftFar) / 2;
  it('fills in its time, between the lengths and within a quarter road', () => {
    const r = behind(slot);
    hold(r, TUNE.draftFill - 0.1);
    expect(r.jo.draft).toBeLessThan(1);
    hold(r, 0.15);
    expect(r.jo.draft).toBe(1);
    expect(r.jo.armed).toBe(true);
    const e = 0.1;
    for (const [g, want] of [[TUNE.draftNear - e, false], [TUNE.draftNear + e, true], [TUNE.draftFar - e, true], [TUNE.draftFar + e, false]]) {
      const q = behind(g);
      hold(q, 0.1);
      expect(q.jo.inDraft).toBe(want);
    }
    const near = behind(slot, TUNE.draftWide - 0.01);
    hold(near, 0.1);
    expect(near.jo.inDraft).toBe(true);
    const o = behind(slot, TUNE.draftWide + 0.01);
    hold(o, TUNE.draftFill + 0.1);
    expect(o.jo.draft).toBe(0);
  });
  it('gives its share of speed while in it', () => {
    const r = new Race(LONG);
    r.jo.inDraft = true;
    r.jo.v = TUNE.vMax;
    r.drive(r.jo, { throttle: true }, STEP);
    expect(r.jo.v).toBeGreaterThan(TUNE.vMax);
    for (let i = 0; i < 30 * 120; i++) r.drive(r.jo, { throttle: true }, STEP);
    expect(r.jo.v).toBeCloseTo(TUNE.vMax * (1 + TUNE.draftSpeed), 0);
  });
  it('fires itself when you break out with the bar full', () => {
    const r = behind(slot);
    r.jo.v = 30;
    hold(r, TUNE.draftFill + 0.1);
    r.drain();
    r.jo.x = TUNE.draftWide + 0.01;
    r.drafts(STEP);
    expect(types(r.drain())).toEqual(['sling']);
    expect(r.jo.slingT).toBe(TUNE.slingTime);
    expect(r.jo.armed).toBe(false);
    expect(r.jo.slings).toBe(1);
  });
  it('holds fire if you drop back or sit too close; a pull out from there still fires', () => {
    const r = behind(slot);
    r.jo.v = 30;
    hold(r, TUNE.draftFill + 0.1);
    r.drain();
    r.rivals[0].d = r.jo.d + CAR_LEN + (TUNE.draftFar + 2) * CAR_LEN; // he has gone
    hold(r, 0.2);
    expect(types(r.drain())).toEqual([]);
    r.rivals[0].d = r.jo.d + CAR_LEN + (TUNE.draftNear - 0.5) * CAR_LEN; // on his bumper
    hold(r, 0.2);
    expect(types(r.drain())).toEqual([]);
    expect(r.jo.armed).toBe(true);
    r.jo.x = TUNE.draftWide + 0.01;
    r.drafts(STEP);
    expect(types(r.drain())).toEqual(['sling']);
  });
  it('the bar lets go if you wait too long behind him', () => {
    const r = behind(TUNE.draftFar + 3);
    Object.assign(r.jo, { armed: true, draft: 1 });
    hold(r, (1 - TUNE.draftKeep) / TUNE.draftLeak + 0.1);
    expect(r.jo.armed).toBe(false);
  });
  it('will not fire without a full bar, or from a crawl', () => {
    const r = behind(slot);
    r.jo.v = 30;
    hold(r, TUNE.draftFill / 2);
    r.jo.x = TUNE.draftWide + 0.01;
    hold(r, 0.1);
    expect(r.jo.slings).toBe(0);
    const slow = behind(slot);
    slow.jo.v = TUNE.slingMinV - 1;
    hold(slow, TUNE.draftFill + 0.1);
    slow.jo.x = TUNE.draftWide + 0.01;
    hold(slow, 0.1);
    expect(slow.jo.slings).toBe(0);
  });
  it('slings for its share over its time, then cools', () => {
    const r = new Race(LONG);
    r.jo.v = 34;
    r.jo.armed = true;
    r.trySling(r.jo);
    const v0 = r.jo.v;
    for (let i = 0; i < TUNE.slingTime * 120 - 1; i++) r.step({ throttle: true });
    expect(r.jo.v).toBeGreaterThan(v0 + 4);
    expect(r.jo.v).toBeLessThanOrEqual(TUNE.vMax * (1 + TUNE.slingSpeed));
    r.jo.armed = true;
    expect(r.trySling(r.jo)).toBe(false); // cooling
    for (let i = 0; i < TUNE.slingCool * 120 + 2; i++) r.step({ throttle: true });
    r.jo.armed = true;
    expect(r.trySling(r.jo)).toBe(true);
  });
  it('out of a real draft at speed, the sling carries Jo past', () => {
    const r = new Race({ pieces: [{ straight: 3000 }], countdown: 0 }, { rivals: [{ id: 'x', d: 200 + CAR_LEN + slot * CAR_LEN, top: 0.8 }] });
    r.jo.d = 200;
    r.jo.v = r.rivals[0].v = TUNE.vMax * 0.8;
    const log = run(r, (x) => {
      const gap = x.rivals[0].d - x.jo.d - CAR_LEN;
      if (x.jo.armed) return { throttle: true, steer: 1 };
      return { throttle: x.jo.slings > 0 || gap > slot * CAR_LEN, steer: x.jo.slings ? steerTo(x.jo, 0.6) : 0 };
    }, 8);
    expect(types(log)).toContain('sling');
    expect(r.jo.d).toBeGreaterThan(r.rivals[0].d);
    expect(r.jo.rubs).toBe(0);
  });
});

describe('contact', () => {
  const pair = (dx, joV, rV, gap) => {
    const r = new Race({ pieces: [{ straight: 5000 }], countdown: 0 }, { rivals: [{ id: 'x', d: 100 + gap }] });
    Object.assign(r.jo, { d: 100, v: joV, x: dx });
    r.rivals[0].v = rV;
    return r;
  };
  it('a tap beside a rival is a rub: both lose their share, and they are shoved apart', () => {
    const r = pair(0.3, 30, 30, 1);
    r.contacts();
    expect(r.jo.v).toBeCloseTo(30 * (1 - TUNE.rubLoss));
    expect(r.rivals[0].v).toBeCloseTo(30 * (1 - TUNE.rubLoss));
    expect(r.jo.x).toBeCloseTo(0.3 + TUNE.rubPush);
    expect(r.rivals[0].x).toBeCloseTo(-TUNE.rubPush);
    expect(types(r.drain())).toEqual(['rub']);
  });
  it('rubs only once in a touch', () => {
    const r = pair(0, 30, 30, 2);
    r.contacts();
    r.jo.d = r.rivals[0].d - 2;
    r.t += STEP;
    r.contacts();
    expect(r.jo.rubs).toBe(1);
  });
  it('a real hit slows both by more', () => {
    const r = pair(0, 36, 20, 2);
    r.contacts();
    expect(r.jo.v).toBeCloseTo(36 * (1 - TUNE.hitLoss));
    expect(r.rivals[0].v).toBeCloseTo(20 * (1 - TUNE.hitLoss));
    expect(types(r.drain())).toEqual(['hit']);
  });
  it('nothing touches a car width apart', () => {
    const r = pair(TUNE.carWide, 30, 30, 0);
    r.contacts();
    expect(r.jo.rubs).toBe(0);
    expect(r.jo.v).toBe(30);
  });
  it('a car back from the lamp is clear of the traffic for a moment', () => {
    const r = pair(0, 30, 30, 1);
    r.jo.ghost = 1;
    r.contacts();
    expect(r.jo.rubs).toBe(0);
  });
});

describe('the rivals', () => {
  it('a clean driver holds his line, brakes for the bends, steps round the cart', () => {
    const r = testRace();
    const c = r.rivals[0];
    const log = run(r, () => ({ brake: true }), 70);
    expect(types(log)).toContain('rival_home');
    expect(c.spins).toBe(0);
    expect(c.offroads).toBe(0);
    expect(Math.abs(c.x - TRACKS.test.rival.x)).toBeLessThan(0.1);
    expect(c.finished).toBeLessThan(55);
  });
  it('a style is one function', () => {
    STYLES.parked = () => ({ throttle: false, brake: true, steer: 0 });
    const r = new Race(FLAT, { rivals: [{ id: 'x', style: 'parked', d: 50 }] });
    run(r, gas, 1);
    delete STYLES.parked;
    expect(r.rivals[0].d).toBe(50);
  });
  it('a slow car near a bend does not stop short of it', () => {
    const r = new Race(oneBend('straw'));
    const c = r.jo;
    Object.assign(c, { d: 399, v: 5 });
    expect(r.wantsBrake(c, { margin: 20 })).toBe(false);
  });
});

describe('a mistake costs seconds, not the road', () => {
  for (const id of ['test', 'pinewood', 'harbour', 'salt', 'coppa']) {
    const T = TRACKS[id];
    it(`${id}: a lamp within reach of every hard thing, and of every bend's way in`, () => {
      const stops = [0, ...T.lamps, T.length];
      stops.slice(1).forEach((l, i) => expect(l - stops[i]).toBeLessThanOrEqual(350));
      const hard = [...T.obstacles.filter((o) => o.kind === 'cart').map((o) => o.d), ...T.bends.filter((b) => b.outside === 'wall').map((b) => b.from)];
      for (const d of hard) expect(d - Math.max(0, ...T.lamps.filter((l) => l < d))).toBeLessThanOrEqual(250);
      for (const b of T.bends) expect(b.from - Math.max(0, ...T.lamps.filter((l) => l <= b.from))).toBeLessThanOrEqual(20);
    });
  }
  it('the rival goes back with Jo, keeping his share of what he made since the lamp; the clock does not', () => {
    const r = new Race({ pieces: [{ straight: 3000 }], countdown: 0, lamps: [100] }, { rivals: [{ id: 'x', x: 0.5, d: 130 }] });
    Object.assign(r.jo, { d: 99, v: 30 });
    r.rivals[0].v = 30;
    run(r, gas, 0.1);
    const at = r.rivals[0].d;
    run(r, gas, 4);
    const away = r.rivals[0].d;
    expect(away).toBeGreaterThan(at + 100);
    const t0 = r.t;
    r.toLamp(r.jo, true);
    expect(r.jo.d).toBe(100);
    expect(r.rivals[0].d).toBeLessThan(away); // (he made this much more while Jo was at it, and keeps a share)
    expect(Math.abs(r.rivals[0].d - (at + TUNE.spinKeep * (away - at)))).toBeLessThan(4);
    expect(r.t).toBe(t0);
  });
  it('nothing of the sling or the draft comes back from before the lamp, and the reset says whose it was', () => {
    const r = new Race(FLAT);
    Object.assign(r.jo, { lampD: 600, d: 700, x: 0.8, slingT: 1, slingCool: 3, armed: true, draft: 1, inDraft: true });
    r.toLamp(r.jo, true);
    expect(r.jo).toMatchObject({ x: 0, slingT: 0, slingCool: 0, armed: false, draft: 0, inDraft: false, resets: 1 });
    expect(r.drain()).toContainEqual({ type: 'reset', id: 'jo', d: 600, now: true });
  });
  it('a spin before the first lamp leaves the rival be', () => {
    const r = new Race({ pieces: [{ straight: 3000 }], countdown: 0 }, { rivals: [{ id: 'x', x: 0.5, d: 200 }] });
    r.toLamp(r.jo, true);
    expect(r.rivals[0].d).toBe(200);
  });
  it('a spin costs seconds, never the race: wall on the test road, once', () => {
    const tidy = lapOn(TRACKS.test, driver('mid')).r.result.time;
    const wall = TRACKS.test.bends.find((b) => b.outside === 'wall');
    let spun = false;
    const base = driver('mid');
    const once = (race) => {
      if (!spun && race.jo.spins) spun = true;
      return !spun && race.jo.d > wall.from - 60 ? { throttle: true, steer: 0 } : base(race);
    };
    const { r } = lapOn(TRACKS.test, once);
    expect(r.jo.spins).toBe(1);
    expect(r.result.time - tidy).toBeGreaterThan(1);
    expect(r.result.time - tidy).toBeLessThan(TUNE.backAt + 3);
  });
  it('knows a lost race from one a sling can still win', () => {
    const at = (joD, rD, joV = 30) => {
      const r = new Race({ pieces: [{ straight: 1200 }], countdown: 0, gate: { place: 1 } }, { rivals: [{ id: 'x', d: rD, top: 0.96 }] });
      r.jo.d = joD;
      r.jo.v = joV;
      return raceLost(r);
    };
    expect(at(600, 610)).toBe(false);
    expect(at(1000, 1100)).toBe(true);
    expect(at(1000, 900)).toBe(false);
    expect(at(600, 700, 12)).toBe(true);
    const home = new Race({ pieces: [{ straight: 1200 }], countdown: 0, gate: { place: 1 } }, { rivals: [{ id: 'x', d: 1200 }] });
    home.rivals[0].finished = 40;
    expect(raceLost(home)).toBe(true);
  });
});

describe('the gate', () => {
  it('a time, a place, or nothing to fail', () => {
    expect(gatePassed({ time: 34 }, { place: 3, time: 34 })).toBe(true);
    expect(gatePassed({ time: 34 }, { place: 1, time: 34.01 })).toBe(false);
    expect(gatePassed({ place: 3 }, { place: 3, time: 99 })).toBe(true);
    expect(gatePassed({ place: 3 }, { place: 4, time: 1 })).toBe(false);
    expect(gatePassed({ scripted: true }, { place: 9, time: 99 })).toBe(true);
    expect(gatePassed(undefined, { place: 9, time: 99 })).toBe(true);
  });
  it('the result carries it', () => {
    const finish = (gate) => {
      const r = new Race({ pieces: [{ straight: 100 }], countdown: 0, gate });
      Object.assign(r.jo, { d: 99, v: 30 });
      run(r, gas, 1);
      return r.result.passed;
    };
    expect(finish({ time: 5 })).toBe(true);
    expect(finish({ time: 0.001 })).toBe(false);
    expect(finish({ place: 1 })).toBe(true);
  });
  it('a time gate is lost when flat out cannot make it; a scripted race never is', () => {
    const at = (t, gate = { time: 34 }) => {
      const r = new Race({ pieces: [{ straight: 800 }], countdown: 0, gate });
      Object.assign(r.jo, { d: 400, v: TUNE.vMax });
      r.t = t;
      return raceLost(r);
    };
    const eta = 400 / TUNE.vMax;
    expect(at(34 - eta - 0.5)).toBe(false);
    expect(at(34 - eta + 0.5)).toBe(true);
    expect(at(99, { scripted: true })).toBe(false);
    expect(at(99, null)).toBe(false);
  });
});

describe('what Ottavia hears as a lift', () => {
  const coast = (d, input, secs) => {
    const r = new Race({ pieces: [{ straight: 1000 }, { bend: 'L', len: 100, safe: 20, outside: 'straw' }, { straight: 3900 }], countdown: 0 });
    Object.assign(r.jo, { d, v: 34 });
    for (let i = 0; i < secs * 120; i++) r.step(input);
    return r.jo.lifts;
  };
  it('off both pedals for 0.3 s at speed is one lift, however long', () => {
    expect(coast(100, {}, TUNE.liftHold - 0.05)).toBe(0);
    expect(coast(100, {}, TUNE.liftHold + 0.05)).toBe(1);
    expect(coast(100, {}, 1)).toBe(1);
  });
  it('a feather is no lift, and the brake is no lift', () => {
    const r = new Race({ pieces: [{ straight: 5000 }], countdown: 0 });
    Object.assign(r.jo, { d: 100, v: 34 });
    for (let i = 0; i < 240; i++) r.step({ throttle: i % 24 > 12 });
    expect(r.jo.lifts).toBe(0);
    expect(coast(100, { brake: true }, 1)).toBe(0);
  });
  it('near a bend, and slowly, is no lift', () => {
    expect(coast(900, {}, 0.5)).toBe(0);
    const r = new Race({ pieces: [{ straight: 5000 }], countdown: 0 });
    Object.assign(r.jo, { d: 100, v: 20 });
    for (let i = 0; i < 120; i++) r.step({});
    expect(r.jo.lifts).toBe(0);
  });
});

// Every bend is a loan: these are the promises of RACER_REBUILD_PLAN §7
describe('every track, by bot', () => {
  for (const id of ['test', 'pinewood']) {
    const T = TRACKS[id];
    const rivals = T.rival ? [T.rival] : [];
    const tidy = () => lapOn(T, driver('in', { margin: 8 }), rivals);
    const uniform = (a) => T.bends.map(() => a);
    const time = (plans) => {
      const { r } = lapOn(T, driver(plans));
      expect(r.jo.spins).toBe(0);
      return r.result.time;
    };

    it(`${id}: a tidy bot finishes with no rub, spin or offroad, and passes the gate`, () => {
      const { r } = tidy();
      expect(r.result).not.toBeNull();
      expect(r.result.flags).toMatchObject({ rubs: 0, spins: 0, offroads: 0, clean: true });
      expect(r.result.passed).toBe(true);
      expect(gripBand(r.jo.grip)).toBe('green');
    });
    it(`${id}: never touching a thing is also the fast way`, () => {
      const { r } = lapOn(T, driver(uniform('out')), rivals);
      expect(r.result.flags.rubs).toBe(0);
      expect(r.result.flags.spins).toBe(0);
    });
    it(`${id}: a bot that never brakes pays on every bend`, () => {
      const best = Math.min(time(uniform('in')), time(uniform('out')));
      const { r, log } = lapOn(T, driver('mid', { brakes: false }));
      const strawOrWall = types(log).filter((t) => t === 'straw' || t === 'spin').length;
      expect(strawOrWall).toBeGreaterThanOrEqual(T.bends.length);
      if (r.result) {
        if (T.gate.time !== undefined) expect(r.result.passed).toBe(false); // the straw does not earn the seat
        expect(r.result.time - best).toBeGreaterThan(2);
      }
      expect(gripBand(r.jo.grip)).not.toBe('green');
    });
    it(`${id}: hug-the-inside and run-wide each win a bend; no line wins everywhere`, () => {
      const wins = T.bends.map((_, i) => {
        const mixed = (a) => T.bends.map((__, j) => (j === i ? a : 'mid'));
        return time(mixed('hug')) - time(mixed('out'));
      });
      expect(wins.some((d) => d < -0.02)).toBe(true); // the inside won this one
      expect(wins.some((d) => d > 0.02)).toBe(true); // and the outside this one
    });
    it(`${id}: the right line on each bend beats any one line, and is what the best time takes`, () => {
      const plans = T.bends.map((_, i) => {
        const mixed = (a) => T.bends.map((__, j) => (j === i ? a : 'mid'));
        return time(mixed('hug')) < time(mixed('out')) ? 'hug' : 'out';
      });
      expect(time(plans)).toBeLessThan((T.gate.time ?? T.target) + 0.1);
      expect(time(plans)).toBeLessThan(time(uniform('mid')));
    });
    it(`${id}: carrying a little too much is a loan: a little time now, a lot of tyre`, () => {
      const limit = lapOn(T, driver('mid')).r;
      const over = lapOn(T, driver('mid', { k: 1.05 })).r;
      expect(over.result.time).toBeLessThan(limit.result.time + 0.1);
      expect(limit.jo.grip - over.jo.grip).toBeGreaterThan(0.15);
    });
  }
  it('pinewood is the length and the shape the plan asks for', () => {
    const T = TRACKS.pinewood;
    expect(T.length).toBe(800);
    expect(T.obstacles.filter((o) => o.kind === 'cart').map((o) => o.d)).toEqual([300, 700]);
    expect(T.hills[0].to).toBe(520);
    expect(T.hills[0].to - T.hills[0].from).toBe(80);
    expect(T.hills[0].y1).toBe(9); // (the plan said 6; raised so the hidden bend is really hidden, the boards still on the climb)
    // the seat is within reach of a tidy run, with a second to spare
    const { r } = lapOn(T, driver('in', { margin: 8 }));
    expect(r.result.time).toBeGreaterThan(28);
    expect(r.result.time).toBeLessThan(T.gate.time - 1);
  });
});

describe('hear the draft', () => {
  const at = (lengths, dx = 0) => {
    const jo = { d: 100, x: 0, state: 'run' };
    return draftBeat(jo, { id: 'x', d: 100 + CAR_LEN + lengths * CAR_LEN, x: dx, state: 'run' });
  };
  const slot = (TUNE.draftNear + TUNE.draftFar) / 2;
  it('stops in the perfect slot', () => {
    expect(at(slot).hz).toBe(0);
    expect(at(slot + 0.2).hz).toBe(0);
    expect(at(slot).hear).toBe(1);
  });
  it('quickens the further out of it, either way, and at the window edge it is a clear beat', () => {
    expect(at(TUNE.draftFar).hz).toBeCloseTo(TUNE.beatEdge, 5);
    expect(at(TUNE.draftNear).hz).toBeCloseTo(TUNE.beatEdge, 5);
    let last = -1;
    for (let g = slot; g < 7; g += 0.25) {
      const b = at(g);
      if (!b) break;
      expect(b.hz).toBeGreaterThanOrEqual(last);
      last = b.hz;
    }
    expect(last).toBeLessThanOrEqual(TUNE.beatMax);
  });
  it('off his line is out of tune too', () => {
    expect(at(slot, TUNE.draftWide).hz).toBeCloseTo(TUNE.beatEdge, 5);
    expect(at(slot, TUNE.draftWide * 2.5).hz).toBeGreaterThan(TUNE.beatEdge);
  });
  it('lets go of the note far away, behind, and in a spin', () => {
    expect(at(30)).toBeNull();
    expect(draftBeat({ d: 100, x: 0, state: 'run' }, { d: 90, x: 0, state: 'run' })).toBeNull();
    expect(draftBeat({ d: 100, x: 0, state: 'spin' }, { d: 110, x: 0, state: 'run' })).toBeNull();
    const far = at(slot + 1.25 * TUNE.beatFar - 0.5);
    expect(far && far.hear).toBeLessThan(1);
  });
  it('the race listens to the nearest it can hear', () => {
    const r = new Race(FLAT, { rivals: [{ id: 'near', d: CAR_LEN + slot * CAR_LEN }, { id: 'far', d: 18 }] });
    expect(r.beat().id).toBe('near');
    expect(r.beat().hz).toBe(0);
  });
});

describe('the test road, bot against the placeholder rival', () => {
  const stops = (bot) => Object.assign((x) => bot(x), { stop: true });
  it('a tidy driver wins, inside the design length', () => {
    const { r } = lapOn(TRACKS.test, driver('in', { margin: 8 }), [TRACKS.test.rival]);
    expect(r.result.place).toBe(1);
    expect(r.result.time).toBeGreaterThan(35);
    expect(r.result.time).toBeLessThan(55);
  });
  it('flat out and no brakes meets the wall and goes back to the lamp', () => {
    const r = testRace();
    const log = run(r, stops(driver('mid', { brakes: false })), 90);
    expect(types(log)).toContain('straw');
    expect(types(log)).toContain('spin');
  });
  it('coming second is a result too', () => {
    const r = testRace();
    run(r, stops((x) => ({ throttle: x.jo.v < 15, steer: steerTo(x.jo, -0.6) })), 150);
    expect(r.result.place).toBe(2);
    expect(r.result.gap).toBeLessThan(0);
  });
  it('the first row is off Jo\'s line on the grid', () => {
    expect(Math.abs(TRACKS.test.rival.x)).toBeGreaterThan(TUNE.carWide);
  });
  it('a perfect launch held straight passes him and never touches', () => {
    const r = testRace();
    let passedAt = null;
    while (r.t < TUNE.launchTime + 6) {
      r.step({ throttle: r.t >= -TUNE.launchEarly / 2 });
      r.drain();
      if (passedAt === null && r.jo.d > r.rivals[0].d) passedAt = r.t;
    }
    expect(r.launched).toBe(true);
    expect(r.jo.rubs).toBe(0);
    expect(passedAt).not.toBeNull();
  });
  it('pull in behind him off a launch: the draft fills, with time to pull out before his bumper', () => {
    const r = testRace();
    let armedAt = null;
    let touchedAt = null;
    while (r.t < 8 && touchedAt === null) {
      r.step({ throttle: r.t >= -TUNE.launchEarly / 2, steer: r.t > 0 ? steerTo(r.jo, r.rivals[0].x) : 0 });
      r.drain();
      if (armedAt === null && r.jo.armed) armedAt = r.t;
      if (r.jo.rubs) touchedAt = r.t;
    }
    expect(armedAt).toBeLessThan(TUNE.launchTime);
    expect(touchedAt - armedAt).toBeGreaterThan(1);
  });
  it('the result says what the run did', () => {
    const { r } = lapOn(TRACKS.test, driver('in', { margin: 8 }), [TRACKS.test.rival]);
    expect(r.result.flags.lifts).toBe(0); // (a brake for a bend is no lift)
    expect(r.result.flags.launched).toBe(true);
    expect(r.result.flags.slowest.under).toBeGreaterThan(0);
    expect(TRACKS.test.bends.map((b) => b.name)).toContain(r.result.flags.slowest.name);
    expect(r.result.gap).toBeGreaterThan(0);
    expect(typeof r.result.flags.clean).toBe('boolean');
  });
  it('after the line the car rolls down by itself', () => {
    const r = new Race({ pieces: [{ straight: 100 }], countdown: 0 });
    Object.assign(r.jo, { d: 99, v: 30 });
    run(r, gas, 4);
    expect(r.result.place).toBe(1);
    expect(r.jo.v).toBeLessThan(15);
  });
  it('brakeDistance is the road the brake really takes', () => {
    const r = new Race(LONG);
    Object.assign(r.jo, { v: 30, d: 0 });
    while (r.jo.v > 20) r.step({ brake: true });
    expect(r.jo.d).toBeCloseTo(brakeDistance(30, 20), 0);
  });
});

describe('the three other tracks, by bot', () => {
  const F = { tuned: true };
  const of = { harbour: tidy({ air: 'aldo' }), salt: tidy(), coppa: coppaBot() };
  it('are the length and the shape the plan asks for', () => {
    expect(TRACKS.harbour.length).toBe(1200);
    expect(TRACKS.harbour.gate).toEqual({ scripted: true });
    expect(TRACKS.harbour.bends.find((b) => b.name === 'Gull Bend')).toMatchObject({ outside: 'wall' });
    expect(TRACKS.salt.length).toBe(1500);
    expect(TRACKS.salt.gate).toEqual({ place: 3 });
    expect(TRACKS.salt.prize).toEqual({ 1: 18, 2: 12, 3: 8 });
    expect(TRACKS.coppa.length).toBe(2000);
    expect(TRACKS.coppa.lapLen).toBe(1000);
    expect(TRACKS.coppa.gate).toEqual({ place: 1 });
    expect(TRACKS.coppa.bends.filter((b) => b.name === 'Gull Bend')).toHaveLength(2);
    expect(TRACKS.coppa.hills.at(-1).y1).toBe(0); // (back up the terraces each lap)
  });
  it('harbour: a tidy bot in his air, no rub, spin or straw, and held_aldo', () => {
    const { r } = runRace(TRACKS.harbour, F, of.harbour);
    expect(r.jo).toMatchObject({ rubs: 0, spins: 0, offroads: 0 });
    expect(r.script.flags.held_aldo).toBe(true);
  });
  it('salt: a tidy bot is clean and on the sheet, on any tyres, held or not', () => {
    for (const flags of [F, { ...F, tyres_short: true }, { ...F, sable_orders: true }, { ...F, tyre_soft: true }]) {
      const { r } = runRace(TRACKS.salt, flags, tidy());
      expect(r.result.flags).toMatchObject({ spins: 0, offroads: 0 });
      expect(r.result.flags.rubs).toBeLessThanOrEqual(1); // (Teo dives where he likes, and on worn tyres he gets there)
      expect(r.result.place).toBeLessThanOrEqual(3);
      expect(r.result.passed).toBe(true);
    }
  });
  it('coppa: a tidy bot is clean and first', () => {
    const { r } = runRace(TRACKS.coppa, F, of.coppa);
    expect(r.result.flags).toMatchObject({ rubs: 0, spins: 0, offroads: 0, clean: true });
    expect(r.result).toMatchObject({ place: 1, passed: true });
  });
  for (const id of ['salt', 'coppa']) {
    it(`${id}: flat out with no brakes pays on the bends, and finishes 3 s behind the tidy bot or worse`, () => {
      const T = TRACKS[id];
      const flat = tidy({ brakes: false });
      const { r, log } = runRace(T, F, id === 'coppa' ? coppaBot({ box: 'through', drive: flat }) : flat);
      const paid = log.filter((e) => e.id === 'jo' && (e.type === 'straw' || e.type === 'spin')).length;
      expect(paid).toBeGreaterThanOrEqual(T.bends.filter((b) => b.outside === 'wall').length);
      expect(paid).toBeGreaterThanOrEqual(T.bends.length / 2);
      // (a wall bend never lets a car with no brakes by, and that is the plan's point too)
      if (r.result) expect(r.result.time - runRace(T, F, of[id]).r.result.time).toBeGreaterThan(3);
      else expect(r.jo.spins).toBeGreaterThan(1);
    });
  }
  it('the Salt Road is not settled by one corner: Teo comes back to a car that holds behind Dante, late', () => {
    const r = raceFor(TRACKS.salt, { ...F, sable_orders: true });
    const bot = tidy({ behind: 'dante' });
    const teo = r.rivals.find((c) => c.id === 'teo');
    let wasAhead = false;
    let backAt = null;
    while (!r.result && r.t < 100) {
      r.step(bot(r));
      r.drain();
      if (teo.d > r.jo.d) wasAhead = true;
      if (wasAhead && teo.d < r.jo.d && backAt === null) backAt = r.jo.d;
    }
    expect(wasAhead).toBe(true);
    expect(backAt).toBeGreaterThan(TRACKS.salt.length / 2);
  });
});

describe('oil', () => {
  const road = () => new Race({ pieces: [{ straight: 3000 }], countdown: 0 });
  const hit = () => {
    const r = road();
    Object.assign(r.jo, { d: 100, v: 30 });
    r.oil.push({ d: 110, x: 0, len: TUNE.oilLen, wide: TUNE.oilWide, by: 'teo', gone: false });
    return r;
  };
  it('is a wobble, 0.6 s long, once a patch, and a held wheel gets it back', () => {
    const r = hit();
    const log = run(r, (x) => ({ throttle: true, steer: steerTo(x.jo, 0) }), 3);
    expect(log.filter((e) => e.type === 'oil')).toEqual([{ type: 'oil', id: 'jo', d: 110 }]);
    expect(r.jo.spins).toBe(0);
    expect(Math.abs(r.jo.x)).toBeLessThan(0.05);
    expect(r.jo.wobbleT).toBe(0);
    const held = hit();
    let longest = 0;
    let t = 0;
    while (held.t < 3) {
      held.step({ throttle: true });
      if (held.jo.wobbleT > 0) t += STEP;
      longest = Math.max(longest, t);
    }
    expect(longest).toBeCloseTo(TUNE.oilWobble, 1);
  });
  it('costs a few tenths, not the race', () => {
    const clean = road();
    Object.assign(clean.jo, { d: 100, v: 30 });
    const r = hit();
    run(clean, gas, 2);
    run(r, gas, 2);
    expect(clean.jo.d - r.jo.d).toBeGreaterThan(0.2);
    expect(clean.jo.d - r.jo.d).toBeLessThan(5);
  });
  it('misses a car that steered round it, and the car that dropped it', () => {
    const r = hit();
    r.jo.x = 0.5;
    expect(types(run(r, gas, 1))).not.toContain('oil');
    const own = hit();
    own.oil[0].by = 'jo';
    expect(types(run(own, gas, 1))).not.toContain('oil');
  });
  it('a dropped patch says where it lies', () => {
    const r = road();
    Object.assign(r.jo, { d: 77, x: 0.3 });
    r.dropOil(r.jo);
    expect(r.drain()).toEqual([{ type: 'oil_drop', id: 'jo', d: 77, x: 0.3, len: TUNE.oilLen, wide: TUNE.oilWide }]);
    expect(r.oil).toHaveLength(1);
  });
});

describe('a cue on a lap', () => {
  it('fires on that lap, at d + lapLen, and says both', () => {
    const r = new Race({ pieces: [{ straight: 3000 }], countdown: 0, lapLen: 1000, cues: [{ d: 50, lap: 2, id: 'late' }, { d: 60, id: 'early' }] });
    Object.assign(r.jo, { d: 40, v: 30 });
    const early = run(r, gas, 2).filter((e) => e.type === 'cue');
    expect(early).toEqual([{ type: 'cue', id: 'early', d: 60 }]);
    r.jo.d = 1040;
    const late = run(r, gas, 2).filter((e) => e.type === 'cue');
    expect(late).toEqual([{ type: 'cue', id: 'late', d: 1050, lap: 2 }]);
  });
});
