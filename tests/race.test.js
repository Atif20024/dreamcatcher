// The car and the race rules, with bots. The numbers these pin are the design's
// (docs/dream_racer.md §3); the feel behind them has not been felt by anybody yet.
import { describe, it, expect } from 'vitest';
import { Race, TUNE, STEP, CAR_LEN, gripFactor, gripBand, brakeDistance, revs } from '../src/engines/race.js';
import { TRACKS } from '../src/dreams/racer/race/tracks.js';

const FLAT = { length: 5000, countdown: 0, lamps: [600, 1200] };
const types = (log) => log.map((e) => e.type);
const run = (race, policy, secs) => {
  const log = [];
  for (let i = 0; i < secs * 120; i++) {
    race.step({ throttle: false, brake: false, laneUp: false, laneDown: false, sling: false, ...policy(race) });
    log.push(...race.drain());
    if (policy.stop && policy.stop(race)) break;
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

// a tidy driver: brakes on the engine's own numbers, dodges what is ahead
function cleanBot({ sling = false, margin = 8, pass = true } = {}) {
  return (race) => {
    const c = race.jo;
    const b = race.nextBend(c.d);
    const gf = gripFactor(c.grip);
    let brake = false;
    if (b) brake = c.d >= b.from ? c.v > b.safe * gf * 0.98 : brakeDistance(c.v, b.safe * 0.98 * gf, gf) + margin >= b.from - c.d;
    let laneUp = false;
    let laneDown = false;
    const hit = race.obstacles.find((o) => !o.gone && o.lane === c.lane && o.d > c.d && o.d - c.d < 45) || race.rivals.find((o) => o.lane === c.lane && o.d > c.d && o.d - c.d < CAR_LEN * 2.3 && c.v >= o.v && pass);
    if (hit && c.y === c.lane) {
      if (c.lane < 2) laneDown = true;
      else laneUp = true;
    }
    return { throttle: !brake, brake, laneUp, laneDown, sling: sling && c.armed };
  };
}
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
    expect(r.jo.v).toBeGreaterThan(35.5);
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
      const r = new Race({ length: 90000, countdown: 0 });
      r.jo.v = 20;
      r.jo.brakeHeld = held;
      r.step({ brake: true });
      return 20 - r.jo.v;
    };
    expect(lost(0)).toBeCloseTo(lost(2), 5);
    expect(lost(6)).toBeLessThan(lost(0));
  });
  it('glides a lane in 0.45 s', () => {
    const r = new Race(FLAT);
    run(r, gas, 2);
    r.step({ throttle: true, laneUp: true });
    expect(r.jo.lane).toBe(0);
    let n = 1;
    while (r.jo.y !== 0 && n < 240) {
      r.step({ throttle: true });
      n += 1;
    }
    expect(n * STEP).toBeCloseTo(0.45, 1);
  });
  it('keeps to the road', () => {
    const r = new Race(FLAT);
    r.step({ laneUp: true });
    r.step({ laneUp: true });
    expect(r.jo.lane).toBe(0);
  });
  it('runs the same race at any frame rate', () => {
    const go = (ms) => {
      const r = new Race(FLAT);
      for (let t = 0; t < 8000; t += ms) r.advance({ throttle: true }, ms);
      return r.jo.d;
    };
    expect(Math.abs(go(16.67) - go(33.33))).toBeLessThan(1);
    expect(Math.abs(go(16.67) - go(8.33))).toBeLessThan(1);
  });
  it('a hitch costs no more than 50 ms of race', () => {
    const r = new Race(FLAT);
    expect(r.advance({ throttle: true }, 400)).toBeLessThanOrEqual(6);
  });
  it('never loses a lane press in a short frame', () => {
    const r = new Race(FLAT);
    r.advance({ laneUp: true }, 0.5); // too short for a step
    r.advance({}, 20);
    expect(r.jo.lane).toBe(0);
  });
  it('sets the note by speed: idle low, red line at the top', () => {
    expect(revs(0)).toBeCloseTo(0.18, 2);
    expect(revs(36)).toBeCloseTo(1, 2);
    expect(revs(18)).toBeGreaterThan(revs(9));
  });
});

describe('the start', () => {
  it('gives a good start for a tap on the green, nothing for one early', () => {
    const go = (at) => {
      const r = new Race({ length: 2000, countdown: 1 });
      const log = [];
      for (let i = 0; i < 4 * 120; i++) {
        r.step({ throttle: true, sling: Math.abs(i / 120 - at) < STEP / 2 });
        log.push(...r.drain());
      }
      return { d: r.jo.d, ev: types(log) };
    };
    const good = go(1.1);
    const early = go(0.5);
    const none = go(99);
    expect(good.ev).toContain('launch');
    expect(early.ev).toContain('jump_start');
    expect(good.d).toBeGreaterThan(none.d + 2);
    expect(early.d).toBeCloseTo(none.d, 1);
  });
  it('does not move before GO', () => {
    const r = new Race({ length: 2000, countdown: 3 });
    for (let i = 0; i < 2.9 * 120; i++) r.step({ throttle: true });
    expect(r.jo.d).toBe(0);
    expect(r.jo.throttle).toBe(true);
  });
});

describe('grip', () => {
  it('bald tyres cost at most a fair 25 percent', () => {
    expect(gripFactor(1)).toBe(1);
    expect(gripFactor(0)).toBe(0.75);
    expect(gripFactor(-5)).toBe(0.75);
    expect(gripBand(0.8)).toBe('green');
    expect(gripBand(0.4)).toBe('worn');
    expect(gripBand(0.1)).toBe('bald');
  });
  it('wears with hard braking, lane changes at speed and slides', () => {
    const r = new Race(FLAT);
    run(r, gas, 12);
    expect(r.jo.grip).toBe(1);
    r.step({ throttle: true, laneUp: true });
    expect(r.jo.grip).toBeCloseTo(1 - TUNE.wearLane, 5);
    run(r, () => ({ brake: true }), 1);
    expect(r.jo.grip).toBeLessThan(1 - TUNE.wearLane - 0.01);
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
});

describe('bends', () => {
  const bend = (outside, side = 1) => ({ length: 2000, countdown: 0, lamps: [100], bends: [{ from: 400, to: 500, safe: 22, side, outside }] });
  it('holds a car at its safe speed', () => {
    const r = new Race(bend('straw'));
    r.jo.d = 390;
    r.jo.v = 21;
    r.jo.lampD = 100;
    run(r, () => ({}), 3);
    expect(r.jo.spins).toBe(0);
    expect(r.jo.y).toBe(1);
  });
  it('slides a fast car to the outside, and straw only costs speed', () => {
    const r = new Race(bend('straw'));
    r.jo.d = 395;
    r.jo.v = 36;
    r.jo.lampD = 100;
    const log = run(r, gas, 5);
    expect(types(log)).toContain('straw');
    expect(r.jo.state).toBe('run');
    expect(r.jo.lane).toBe(2);
  });
  it('a wall on the outside spins you back to the lamp in 3 s', () => {
    const r = new Race(bend('wall', -1));
    r.jo.d = 395;
    r.jo.v = 36;
    r.jo.lampD = 100;
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
    expect(r.jo.v).toBe(TUNE.rollOut);
  });
  it('a brake and a lane press against the slide can save it', () => {
    const r = new Race(bend('wall', -1));
    r.jo.d = 399;
    r.jo.v = 25; // 3 over
    r.jo.lampD = 100;
    const log = run(r, (x) => ({ brake: x.jo.v > 21, laneDown: x.jo.y < 0.9 && x.jo.lane < 2 }), 5);
    expect(types(log)).not.toContain('spin');
  });
});

describe('what is on the road', () => {
  it('a bale is soft and gone; a cart spins you; slowly it only stops you', () => {
    const r = new Race({ length: 3000, countdown: 0, lamps: [50], obstacles: [{ d: 300, lane: 1, kind: 'bale' }, { d: 600, lane: 1, kind: 'cart' }] });
    r.jo.d = 290;
    r.jo.v = 20;
    run(r, gas, 1);
    expect(r.obstacles[0].gone).toBe(true);
    expect(r.jo.v).toBeLessThan(20);
    expect(r.jo.state).toBe('run');
    r.jo.d = 590;
    r.jo.v = 30;
    expect(types(run(r, gas, 1))).toContain('spin');
    const s = new Race({ length: 3000, countdown: 0, obstacles: [{ d: 100, lane: 1, kind: 'cart' }] });
    s.jo.d = 95;
    s.jo.v = 5;
    expect(types(run(s, () => ({}), 2))).toContain('bump');
    expect(s.jo.state).toBe('run');
  });
  it('misses a thing in another lane', () => {
    const r = new Race({ length: 3000, countdown: 0, obstacles: [{ d: 100, lane: 2, kind: 'cart' }] });
    r.jo.d = 90;
    r.jo.v = 30;
    expect(types(run(r, gas, 1))).not.toContain('spin');
  });
  it('sees it coming, in the right lane', () => {
    const r = new Race({ length: 3000, countdown: 0, obstacles: [{ d: 100, lane: 2, kind: 'cart' }] }, { rivals: [{ id: 'x', d: 50, lane: 0 }] });
    expect(r.ahead()).toEqual(expect.arrayContaining([{ kind: 'cart', lane: 2, dist: 100 }, { kind: 'car', lane: 0, dist: 50 }]));
  });
  it('gives a lamp when passed and a restart back to it', () => {
    const r = new Race(FLAT);
    r.jo.d = 599;
    r.jo.v = 30;
    expect(run(r, gas, 1)).toContainEqual({ type: 'lamp', d: 600 });
    r.toLamp(r.jo, true);
    expect(r.jo.d).toBe(600);
    expect(r.jo.state).toBe('run');
    expect(r.jo.v).toBe(TUNE.rollOut);
  });
});

describe('the draft and the slingshot', () => {
  const behind = (g) => {
    const r = new Race({ length: 5000, countdown: 0 }, { rivals: [{ id: 'x', lane: 1, d: 100 + CAR_LEN + g * CAR_LEN }] });
    r.jo.d = 100;
    return r;
  };
  const hold = (r, s) => {
    for (let i = 0; i < s * 120; i++) r.drafts(STEP);
  };
  it('fills in 1.2 s between 1.5 and 4 lengths behind, same lane', () => {
    const r = behind(2.5);
    hold(r, 1.1);
    expect(r.jo.draft).toBeLessThan(1);
    hold(r, 0.15);
    expect(r.jo.draft).toBe(1);
    expect(r.jo.armed).toBe(true);
    for (const [g, want] of [[1.4, false], [1.6, true], [3.9, true], [4.1, false]]) {
      const q = behind(g);
      hold(q, 0.1);
      expect(q.jo.inDraft).toBe(want);
    }
    const o = behind(2.5);
    o.jo.y = 0;
    hold(o, 1.3);
    expect(o.jo.draft).toBe(0);
  });
  it('gives 6 percent while in it', () => {
    const r = new Race({ length: 90000, countdown: 0 });
    r.jo.inDraft = true;
    r.jo.v = 36;
    r.drive(r.jo, { throttle: true }, STEP);
    expect(r.jo.v).toBeGreaterThan(36);
    for (let i = 0; i < 30 * 120; i++) r.drive(r.jo, { throttle: true }, STEP);
    expect(r.jo.v).toBeCloseTo(36 * 1.06, 0);
  });
  it('stays armed long enough to pull out, then lets go', () => {
    const r = behind(2.5);
    hold(r, 1.3);
    r.jo.y = 0; // out of the lane
    hold(r, 1.5);
    expect(r.jo.armed).toBe(true);
    hold(r, 1);
    expect(r.jo.armed).toBe(false);
  });
  it('slings for 18 percent over 2 s, then cools for 4', () => {
    const r = new Race({ length: 90000, countdown: 0 });
    r.launchTried = true;
    r.jo.v = 34;
    r.jo.armed = true;
    r.jo.draft = 1;
    r.step({ throttle: true, sling: true });
    expect(types(r.drain())).toContain('sling');
    expect(r.jo.armed).toBe(false);
    const v0 = r.jo.v;
    for (let i = 0; i < 2 * 120 - 1; i++) r.step({ throttle: true });
    expect(r.jo.v).toBeGreaterThan(v0 + 4);
    expect(r.jo.v).toBeLessThanOrEqual(36 * 1.18);
    r.jo.armed = true;
    r.step({ throttle: true, sling: true });
    expect(types(r.drain())).not.toContain('sling'); // cooling
    for (let i = 0; i < 4 * 120; i++) r.step({ throttle: true });
    r.jo.armed = true;
    r.step({ throttle: true, sling: true });
    expect(types(r.drain())).toContain('sling');
  });
  it('will not sling without a full bar', () => {
    const r = new Race({ length: 90000, countdown: 0 });
    r.launchTried = true;
    r.jo.v = 34;
    r.jo.draft = 0.9;
    r.step({ throttle: true, sling: true });
    expect(types(r.drain())).not.toContain('sling');
  });
});

describe('contact', () => {
  const pair = (dy, joV, rV, gap) => {
    const r = new Race({ length: 5000, countdown: 0 }, { rivals: [{ id: 'x', lane: 1, d: 100 + gap }] });
    r.jo.d = 100;
    r.jo.v = joV;
    r.rivals[0].v = rV;
    r.jo.y = 1 + dy;
    return r;
  };
  it('a tap beside a rival is a rub: both lose 10 percent, and the door is shut', () => {
    const r = pair(0.5, 30, 30, 1);
    r.jo.lane = 1;
    r.jo.fromLane = 2;
    r.contacts();
    expect(r.jo.v).toBeCloseTo(27);
    expect(r.rivals[0].v).toBeCloseTo(27);
    expect(r.jo.lane).toBe(2);
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
    expect(r.jo.v).toBeCloseTo(27);
    expect(r.rivals[0].v).toBeCloseTo(15);
    expect(types(r.drain())).toEqual(['hit']);
  });
  it('nothing touches across a lane', () => {
    const r = pair(1, 30, 30, 0);
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

describe('the test road, bot against the placeholder rival', () => {
  const stopAtEnd = (bot) => Object.assign((r) => bot(r), { stop: (r) => r.result });
  it('a tidy driver who drafts and slings wins, inside the design length', () => {
    const r = testRace();
    run(r, stopAtEnd(cleanBot({ sling: true })), 120);
    expect(r.result.place).toBe(1);
    expect(r.result.time).toBeGreaterThan(35);
    expect(r.result.time).toBeLessThan(55);
    expect(gripBand(r.jo.grip)).toBe('green');
    expect(r.result.flags.spins).toBe(0);
  });
  it('flat out and no brakes meets the wall and goes back to the lamp', () => {
    const r = testRace();
    const log = run(r, stopAtEnd(gas), 90);
    expect(types(log)).toContain('straw');
    expect(types(log)).toContain('spin');
  });
  it('the rival makes a fair lap on its own', () => {
    const r = testRace();
    run(r, () => ({ brake: true }), 70);
    expect(r.rivals[0].finished).not.toBeNull();
    expect(r.rivals[0].spins).toBe(0);
    expect(r.rivals[0].finished).toBeLessThan(55);
  });
  it('coming second is a result too', () => {
    const r = testRace();
    run(r, stopAtEnd((x) => ({ throttle: x.jo.v < 15 })), 150);
    expect(r.result.place).toBe(2);
  });
  it('after the line the car rolls down by itself', () => {
    const r = new Race({ length: 100, countdown: 0 });
    r.jo.d = 99;
    r.jo.v = 30;
    run(r, gas, 4);
    expect(r.result.place).toBe(1);
    expect(r.jo.v).toBeLessThan(15);
  });
});
