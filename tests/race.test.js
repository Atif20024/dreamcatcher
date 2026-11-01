// The car and the race rules, with bots. The numbers these pin are the design's
// (docs/dream_racer.md §3); the feel behind them has not been felt by anybody yet.
import { describe, it, expect } from 'vitest';
import { Race, TUNE, STEP, CAR_LEN, gripFactor, gripBand, brakeDistance, revs, bendSafe, bendLen, lineOf, chalkAt, turnSide, draftBeat, raceLost } from '../src/engines/race.js';
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
    if (b) brake = c.d >= b.from ? c.v > bendSafe(b, c.y, gf) * 0.98 : brakeDistance(c.v, bendSafe(b, c.lane, gf) * 0.98, gf) + margin >= b.from - c.d;
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
    expect(r.ahead()).toEqual(expect.arrayContaining([{ kind: 'cart', lane: 2, dist: 100, v: 0 }, { kind: 'car', lane: 0, dist: 50, v: 0 }]));
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

// a driver with a plan for each bend: in, out, or the line change (inside to the apex, then out)
function lineBot(plans, { k = 1, brakes = true } = {}) {
  return (race) => {
    const c = race.jo;
    const bends = race.track.bends;
    const i = bends.findIndex((x) => x.to > c.d);
    const b = bends[i];
    const inner = b && (b.side > 0 ? 0 : 2);
    const lineLane = () => (plans[i] === 'in' ? inner : plans[i] === 'out' ? 2 - inner : c.d >= (b.from + b.to) / 2 ? 2 - inner : inner);
    let target = b && b.from - c.d < 110 ? lineLane() : c.lane;
    const blocked = (l) => race.obstacles.some((o) => !o.gone && o.lane === l && o.d > c.d - 2 && o.d - c.d < Math.max(30, c.v * 1.3));
    if (blocked(target)) target = [1, 0, 2].filter((l) => l !== target && !blocked(l)).sort((x, y) => Math.abs(x - c.lane) - Math.abs(y - c.lane))[0] ?? target;
    const press = target !== c.lane && c.steerT <= 0;
    const gf = gripFactor(c.grip);
    let brake = false;
    if (b && brakes) {
      if (c.d >= b.from) brake = c.v > bendSafe(b, c.y, gf) * k + 0.05;
      else brake = brakeDistance(c.v, bendSafe(b, lineLane(), gf) * k, gf) + 1 >= b.from - c.d;
    }
    return { throttle: !brake, brake, laneUp: press && target < c.lane, laneDown: press && target > c.lane };
  };
}
const lap = (plans, opts = {}, rivals = []) => {
  const r = new Race(TRACKS.test, { rivals });
  const bot = lineBot(plans, opts);
  for (let i = 0; i < 100 * 120 && !r.result; i++) {
    r.step({ ...bot(r) });
    r.drain();
  }
  return r;
};
const time = (plans) => {
  const r = lap(plans);
  expect(r.jo.spins).toBe(0);
  return r.result.time;
};

describe('a lane is a racing line', () => {
  const b = { from: 100, to: 200, safe: 20, side: 1 };
  const w = { ...b, side: -1 };
  it('the inside is the side it turns to: shorter and slower; the outside longer and faster', () => {
    expect(lineOf(b, 0)).toBe(0);
    expect(lineOf(b, 2)).toBe(1);
    expect(lineOf(w, 0)).toBe(1);
    expect(bendSafe(b, 1)).toBe(20);
    expect(bendSafe(b, 0)).toBeLessThan(20);
    expect(bendSafe(b, 2)).toBeGreaterThan(20);
    expect(bendLen(b, 0)).toBeLessThan(1);
    expect(bendLen(b, 1)).toBe(1);
    expect(bendLen(b, 2)).toBeGreaterThan(1);
    expect(bendSafe(w, 2)).toBeLessThan(20);
    expect(turnSide(b)).toBe('LEFT');
    expect(turnSide(w)).toBe('RIGHT');
  });
  it('the inside really is less road for the same speed', () => {
    const go = (lane) => {
      const r = new Race({ length: 2000, countdown: 0, bends: [{ ...b, safe: 40 }] });
      Object.assign(r.jo, { d: 100, v: 20, y: lane, lane });
      for (let i = 0; i < 60; i++) r.step({ throttle: false });
      return r.jo.d;
    };
    expect(go(0)).toBeGreaterThan(go(1));
    expect(go(1)).toBeGreaterThan(go(2));
  });
  it('a lane change at speed scrubs a little speed; a crawl does not', () => {
    const scrub = (v) => {
      const r = new Race(FLAT);
      r.jo.v = v;
      r.changeLane(r.jo, 1);
      return r.jo.v / v;
    };
    expect(scrub(30)).toBeCloseTo(1 - TUNE.laneScrub, 5);
    expect(scrub(10)).toBe(1);
  });
  it('no line is best everywhere: the uniform plans finish close, and mixing them beats them all', () => {
    const bends = TRACKS.test.bends.length;
    const uniform = ['in', 'out', 'change'].map((p) => time(Array(bends).fill(p)));
    expect(Math.max(...uniform) - Math.min(...uniform)).toBeLessThan(0.8);
    // every plan on the road; then, from the best, the winner of each bend with the others held
    const plans = [[]];
    for (let i = 0; i < bends; i++) plans.splice(0, plans.length, ...plans.flatMap((p) => ['in', 'out', 'change'].map((a) => [...p, a])));
    const best = plans.map((p) => [p, time(p)]).sort((x, y) => x[1] - y[1])[0];
    expect(Math.min(...uniform) - best[1]).toBeGreaterThan(0.1); // mixing them is the skill
    const winners = best[0].map((_, i) => ['in', 'out', 'change'].map((a) => {
      const p = [...best[0]];
      p[i] = a;
      return [a, time(p)];
    }).sort((x, y) => x[1] - y[1]));
    expect(new Set(winners.map((w0) => w0[0][0])).size).toBeGreaterThan(1);
    // and each bend is a choice: its losing lines are close enough to take for safety
    for (const w0 of winners) expect(w0[2][1] - w0[0][1]).toBeLessThan(0.8);
  });
});

describe('braking matters', () => {
  const plans = (p) => Array(TRACKS.test.bends.length).fill(p);
  it('a driver who never brakes does not finish well, on any line', () => {
    const tidy = lap(plans('in')).result.time;
    for (const p of ['in', 'out', 'change']) {
      const r = lap(plans(p), { brakes: false });
      expect(r.jo.spins).toBeGreaterThan(0);
      if (r.result) expect(r.result.time).toBeGreaterThan(tidy + 10);
    }
  });
  it('holds braking to the limit over carrying more into the bend', () => {
    for (const p of ['in', 'out', 'change']) {
      const limit = lap(plans(p)).result.time;
      const over = lap(plans(p), { k: 1.15 });
      if (over.result && !over.jo.spins) expect(over.result.time).toBeGreaterThan(limit - 0.15);
    }
  });
  it('the slide leaves you slower than the limit, not at it', () => {
    const r = new Race({ length: 2000, countdown: 0, bends: [{ from: 100, to: 400, safe: 20, side: 1, outside: 'straw' }] });
    Object.assign(r.jo, { d: 100, v: 28, y: 0, lane: 0 });
    let low = 99;
    for (let i = 0; i < 360; i++) {
      r.step({ brake: false, throttle: false });
      low = Math.min(low, r.jo.v);
    }
    expect(low).toBeLessThan(bendSafe(r.track.bends[0], 0) - 0.5);
  });
  it('a late brake saves it on the inside and the middle; the line by the wall has no room', () => {
    const wall = TRACKS.test.bends.find((x) => x.outside === 'wall');
    const saved = (lane, over) => {
      const r = new Race({ length: 2000, countdown: 0, bends: [wall] });
      Object.assign(r.jo, { d: wall.from - 0.5, v: bendSafe(wall, lane) * over, y: lane, lane });
      for (let i = 0; i < 6 * 120 && r.jo.d < wall.to && !r.jo.spins; i++) {
        const late = (r.jo.d - wall.from) / Math.max(r.jo.v, 1) > 0.3; // about 0.3 s in
        r.step({ brake: late && r.jo.v > bendSafe(wall, r.jo.y) });
        r.drain();
      }
      return r.jo.spins === 0;
    };
    const inside = wall.side > 0 ? 0 : 2;
    expect(saved(inside, 1.25)).toBe(true);
    expect(saved(1, 1.15)).toBe(true);
    expect(saved(2 - inside, 1.25)).toBe(false);
  });
  it('the chalk is where the brake really has to go on', () => {
    for (const bend of TRACKS.test.bends) {
      for (const lane of [0, 1, 2]) {
        const r = new Race({ length: 2000, countdown: 0, bends: [{ ...bend, from: 500, to: 700 }] });
        Object.assign(r.jo, { v: TUNE.vMax, y: lane, lane });
        const mark = chalkAt(r.track.bends[0], lane);
        r.jo.d = mark;
        // the foot takes its moment, then the brake, and then it is on the line's speed at the bend
        for (let i = 0; i < TUNE.chalkReact * 120; i++) r.step({ throttle: true });
        while (r.jo.d < 500) r.step({ brake: true });
        const safe = bendSafe(r.track.bends[0], lane);
        expect(r.jo.v).toBeLessThanOrEqual(safe + 0.2);
        expect(r.jo.v).toBeGreaterThan(safe - 1.5);
      }
    }
  });
});

describe('a mistake costs seconds, not the road', () => {
  const T = TRACKS.test;
  it('never leaves a lamp more than 250 m back, or a hard thing past one', () => {
    const stops = [0, ...T.lamps, T.length];
    stops.slice(1).forEach((l, i) => expect(l - stops[i]).toBeLessThanOrEqual(250));
    const hard = [...T.obstacles.filter((o) => o.kind === 'cart').map((o) => o.d), ...T.bends.filter((b) => b.outside === 'wall').map((b) => b.from)];
    for (const d of hard) {
      const back = d - Math.max(...T.lamps.filter((l) => l < d));
      expect(back).toBeLessThanOrEqual(250);
    }
  });
  it('the rival goes back with Jo, to where he was when Jo passed the lamp; the clock does not', () => {
    const r = new Race({ length: 3000, countdown: 0, lamps: [100] }, { rivals: [{ id: 'x', lane: 1, d: 130 }] });
    r.jo.d = 99;
    r.jo.v = 30;
    r.rivals[0].v = 30;
    run(r, gas, 0.1);
    const at = r.rivals[0].d;
    run(r, gas, 4);
    expect(r.rivals[0].d).toBeGreaterThan(at + 100);
    const t0 = r.t;
    r.toLamp(r.jo, true);
    expect(r.jo.d).toBe(100);
    expect(r.rivals[0].d).toBeLessThan(at + 3.5);
    expect(r.t).toBe(t0);
  });
  it('nothing of the sling or the draft comes back from before the lamp, and the reset says whose it was', () => {
    const r = new Race(FLAT);
    Object.assign(r.jo, { lampD: 600, d: 700, slingT: 1, slingCool: 3, armed: true, draft: 1, inDraft: true, steerT: 0.2 });
    r.toLamp(r.jo, true);
    expect(r.jo).toMatchObject({ slingT: 0, slingCool: 0, armed: false, draft: 0, inDraft: false, steerT: 0, resets: 1 });
    expect(r.drain()).toContainEqual({ type: 'reset', id: 'jo', d: 600, now: true });
  });
  it('a spin before the first lamp leaves the rival be', () => {
    const r = new Race({ length: 3000, countdown: 0 }, { rivals: [{ id: 'x', lane: 1, d: 200 }] });
    r.toLamp(r.jo, true);
    expect(r.rivals[0].d).toBe(200);
  });
  it('knows a lost race from one a sling can still win', () => {
    const at = (joD, rD, joV = 30) => {
      const r = new Race({ length: 1200, countdown: 0, passPlace: 1 }, { rivals: [{ id: 'x', lane: 1, d: rD, top: 0.96 }] });
      r.jo.d = joD;
      r.jo.v = joV;
      return raceLost(r);
    };
    expect(at(600, 610)).toBe(false);
    expect(at(1000, 1100)).toBe(true);
    expect(at(1000, 900)).toBe(false);
    expect(at(600, 700, 12)).toBe(true);
    const home = new Race({ length: 1200, countdown: 0, passPlace: 1 }, { rivals: [{ id: 'x', lane: 1, d: 1200 }] });
    home.rivals[0].finished = 40;
    expect(raceLost(home)).toBe(true);
  });
  it('a car pressing on a cart knocks twice a second, not every step', () => {
    const r = new Race({ length: 3000, countdown: 0, obstacles: [{ d: 100, lane: 1, kind: 'cart' }] });
    r.jo.d = 97.9;
    r.jo.v = 5;
    const bumps = types(run(r, gas, 2)).filter((t) => t === 'bump').length;
    expect(bumps).toBeGreaterThan(1);
    expect(bumps).toBeLessThanOrEqual(5);
  });
  it('a double tap thrown back goes back to where the glide began', () => {
    const r = new Race(FLAT);
    r.step({ laneUp: true });
    r.step({ laneDown: true });
    r.step({ laneDown: true });
    expect(r.jo.lane).toBe(2);
    expect(r.jo.fromLane).toBe(1);
  });
  it('a press in a hit-stop waits for the race to go on', () => {
    const r = new Race(FLAT);
    expect(r.advance({ laneUp: true }, 0)).toBe(0);
    expect(r.jo.lane).toBe(1);
    r.advance({}, 20);
    expect(r.jo.lane).toBe(0);
  });
});

describe('what Ottavia hears as a lift', () => {
  const coast = (d, input, secs) => {
    const r = new Race({ length: 5000, countdown: 0, bends: [{ from: 1000, to: 1100, safe: 20, side: 1, outside: 'straw' }] });
    Object.assign(r.jo, { d, v: 34 });
    for (let i = 0; i < secs * 120; i++) r.step(input);
    return r.jo.lifts;
  };
  it('off both pedals for 0.3 s at speed is one lift, however long', () => {
    expect(coast(100, {}, 0.25)).toBe(0);
    expect(coast(100, {}, 0.35)).toBe(1);
    expect(coast(100, {}, 1)).toBe(1);
  });
  it('a feather is no lift, and the brake is no lift', () => {
    const r = new Race({ length: 5000, countdown: 0 });
    Object.assign(r.jo, { d: 100, v: 34 });
    for (let i = 0; i < 240; i++) r.step({ throttle: i % 24 > 12 });
    expect(r.jo.lifts).toBe(0);
    expect(coast(100, { brake: true }, 1)).toBe(0);
  });
  it('near a bend, and slowly, is no lift', () => {
    expect(coast(900, {}, 0.5)).toBe(0);
    const r = new Race({ length: 5000, countdown: 0 });
    Object.assign(r.jo, { d: 100, v: 20 });
    for (let i = 0; i < 120; i++) r.step({});
    expect(r.jo.lifts).toBe(0);
  });
});

describe('every track, by bot', () => {
  const noBrakeAt = (plans, skip) => {
    const bot = lineBot(plans);
    return (race) => {
      const out = bot(race);
      return skip(race.nextBend(race.jo.d)) ? { ...out, brake: false, throttle: true } : out;
    };
  };
  const lapOn = (track, bot, rivals = []) => {
    const r = new Race(track, { rivals });
    for (let i = 0; i < 150 * 120 && !r.result; i++) {
      r.step(bot(r));
      r.drain();
    }
    return r;
  };
  for (const track of Object.values(TRACKS)) {
    const uniform = (a) => Array(track.bends.length).fill(a);
    const rivalHome = () => {
      const r = new Race(track, { rivals: [track.rival] });
      for (let i = 0; i < 150 * 120 && r.rivals[0].finished === null; i++) {
        r.step({});
        r.drain();
      }
      return r.rivals[0].finished;
    };
    // the fastest clean lap with the wall bends on `wall`: lines tried bend by bend
    const best = (wall) => {
      let plans = uniform('in');
      const time = (p) => {
        const r = lapOn(track, lineBot(p));
        return r.jo.spins ? Infinity : r.result.time;
      };
      track.bends.forEach((b, i) => {
        const tries = b.outside === 'wall' ? [wall] : ['in', 'out', 'change'];
        plans = tries.map((a) => plans.map((x, j) => (j === i ? a : x))).sort((p, q) => time(p) - time(q))[0];
      });
      return { plans, time: time(plans) };
    };
    it(`${track.id}: the outside of a wall bend pays at least 0.3 s`, () => {
      expect(best('in').time - best('out').time).toBeGreaterThanOrEqual(0.3);
    });
    it(`${track.id}: skipping the brake at the straw bends costs at least the race's slack`, () => {
      const { plans, time } = best('out');
      const slack = rivalHome() - time;
      expect(slack).toBeGreaterThan(0);
      const skipped = lapOn(track, noBrakeAt(plans, (b) => b?.outside === 'straw'));
      expect(skipped.result.time - time).toBeGreaterThanOrEqual(slack);
    });
  }
});

describe('hear the draft', () => {
  const at = (lengths, dy = 0) => {
    const jo = { d: 100, y: 1, state: 'run' };
    return draftBeat(jo, { id: 'x', d: 100 + CAR_LEN + lengths * CAR_LEN, y: 1 + dy, state: 'run' });
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
  it('a lane over is out of tune too', () => {
    expect(at(slot, 0.4).hz).toBeCloseTo(TUNE.beatEdge, 5);
    expect(at(slot, 1).hz).toBeGreaterThan(TUNE.beatEdge);
  });
  it('lets go of the note far away, behind, and in a spin', () => {
    expect(at(30)).toBeNull();
    expect(draftBeat({ d: 100, y: 1, state: 'run' }, { d: 90, y: 1, state: 'run' })).toBeNull();
    expect(draftBeat({ d: 100, y: 1, state: 'spin' }, { d: 110, y: 1, state: 'run' })).toBeNull();
    const far = at(slot + 1.25 * TUNE.beatFar - 0.5);
    expect(far && far.hear).toBeLessThan(1);
  });
  it('the race listens to the nearest it can hear', () => {
    const r = new Race(FLAT, { rivals: [{ id: 'near', lane: 1, d: CAR_LEN + slot * CAR_LEN }, { id: 'far', lane: 1, d: 18 }] });
    expect(r.beat().id).toBe('near');
    expect(r.beat().hz).toBe(0);
  });
});

describe('the test road, bot against the placeholder rival', () => {
  const stopAtEnd = (bot) => Object.assign((r) => bot(r), { stop: (r) => r.result });
  it('a tidy driver wins, inside the design length', () => {
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
  it('the first row is on the screen on the grid, a lane over', () => {
    const { rival, gridLane } = TRACKS.test;
    expect(rival.d - CAR_LEN / 2).toBeLessThan(13.6); // (the view ahead at rest: (960 - 360) / 44)
    expect(rival.lane).not.toBe(gridLane);
  });
  it('a perfect launch held straight passes him and never touches', () => {
    const r = testRace();
    let passedAt = null;
    while (r.t < TUNE.launchTime + 6) {
      r.step({ throttle: true, sling: r.t >= -0.05 && r.t < 0 });
      r.drain();
      if (passedAt === null && r.jo.d > r.rivals[0].d) passedAt = r.t;
    }
    expect(r.launched).toBe(true);
    expect(r.jo.rubs).toBe(0);
    expect(passedAt).not.toBeNull();
  });
  it('pull in behind him off a launch: the draft pays, with time to pull out before his bumper', () => {
    const r = testRace();
    let armedAt = null;
    let touchedAt = null;
    while (r.t < 8 && touchedAt === null) {
      r.step({ throttle: true, sling: r.t >= -0.05 && r.t < 0, laneDown: r.t > 0 && r.jo.lane === 1 });
      r.drain();
      if (armedAt === null && r.jo.armed) armedAt = r.t;
      if (r.jo.rubs) touchedAt = r.t;
    }
    expect(armedAt).toBeLessThan(2);
    expect(touchedAt - armedAt).toBeGreaterThan(1.5);
  });
  it('the result says what the run did', () => {
    const r = testRace();
    run(r, stopAtEnd(cleanBot({ sling: true })), 120);
    expect(r.result.flags.lifts).toBe(0); // (a brake for a bend is no lift)
    expect(r.result.flags.launched).toBe(false);
    expect(r.result.flags.slowest.under).toBeGreaterThan(0);
    expect(TRACKS.test.bends.map((b) => b.name)).toContain(r.result.flags.slowest.name);
    expect(r.result.gap).toBeGreaterThan(0);
    expect(typeof r.result.flags.clean).toBe('boolean');
    const s = testRace();
    run(s, stopAtEnd((x) => ({ throttle: x.jo.v < 15 })), 150);
    expect(s.result.gap).toBeLessThan(0);
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
