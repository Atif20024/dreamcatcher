// How Jo feels, at every refresh rate (docs/redesign/round2/FEEL_REPORT.md).
// Arcade integrates on a fixed 60 Hz step; Player.update runs once per render
// frame. This drives the Player's own constants and helpers through that same
// loop at 30/60/144 Hz, and against the old per-frame controller at 60 Hz:
// 60 Hz must stay what the levels were built on.
import { describe, it, expect, afterEach } from 'vitest';
import { GRAVITY, SPEED, JUMP, JUMP_CUT_BELOW, TERMINAL_FALL, perFrame, cutSpeed, landImpact, isLanding } from '../src/entities/motion.js';
import { REACH } from '../src/world/reach.js';
import { easeFollow, shakeScale } from '../src/world/CameraDirector.js';
import { InputMap, attachInput } from '../src/input/InputMap.js';
import { installAudioContext, audioTap, sfx } from '../src/systems/audio.js';
import { buses } from '../src/audio/AudioBus.js';
import { updateSettings } from '../src/utils/save.js';
import { FakeAudioContext } from './helpers/fakeAudio.js';

const T = 32;
const STEP_MS = 1000 / 60;
const STEP_DV = GRAVITY / 60;
const RATES = [30, 60, 144];

// the frame loop: Arcade's fixed steps, then the controller once per frame.
// `control(state, tMs, dtMs)` is Player.update's movement part.
function run(hz, control, { ms = 3000 } = {}) {
  const frame = 1000 / hz;
  const s = { y: 0, x: 0, vy: 0, vx: 0, top: 0, maxStep: 0, air: false, landedX: null };
  let acc = 0;
  for (let t = 0; t < ms; t += frame) {
    acc += frame;
    s.steps = 0;
    while (acc >= STEP_MS - 1e-9) {
      acc -= STEP_MS;
      s.steps += 1;
      if (s.air) s.vy += STEP_DV; // semi-implicit, as Arcade's Body
      s.y += s.vy / 60;
      s.x += s.vx / 60;
      s.maxStep = Math.max(s.maxStep, Math.abs(s.vy / 60));
      s.top = Math.min(s.top, s.y);
      if (s.air && s.y >= 0 && s.vy > 0) {
        s.y = 0;
        s.vy = 0;
        s.air = false;
        if (s.landedX === null) s.landedX = s.x;
      }
    }
    control(s, t, frame);
  }
  return s;
}

// a jump pressed at t = 0 and released at releaseMs, with the new controller
const newJump = (releaseMs) => {
  let jumped = false;
  let rising = false;
  return (s, t) => {
    if (!jumped) {
      s.vy = -JUMP;
      s.air = true;
      jumped = true;
      rising = true;
    }
    if (rising) {
      if (s.vy >= -JUMP_CUT_BELOW) rising = false;
      else if (t >= releaseMs && s.steps > 0) {
        s.vy = -cutSpeed(-s.vy);
        rising = false;
      }
    }
  };
};

// the same jump, as Player.js used to do it
const oldJump = (releaseMs) => {
  let jumped = false;
  return (s, t) => {
    if (!jumped) {
      s.vy = -JUMP;
      s.air = true;
      jumped = true;
    }
    if (t >= releaseMs && s.vy < -JUMP_CUT_BELOW) s.vy *= 0.82;
  };
};

const hop = (ctl, hz) => -run(hz, ctl).top;

describe('the jump', () => {
  it('a held jump is the same at every rate, and the reach model still holds', () => {
    for (const hz of RATES) {
      const h = hop(newJump(Infinity), hz);
      expect(h, `${hz} Hz`).toBeGreaterThanOrEqual(145);
      expect(h, `${hz} Hz`).toBeLessThanOrEqual(150);
      expect(h).toBeGreaterThan(REACH.rise * T); // reach.js: a jump rises 4 tiles
    }
  });

  it('at 60 Hz a release reaches what it always reached, at every moment', () => {
    for (let ms = 17; ms <= 400; ms += 17) {
      const was = hop(oldJump(ms), 60);
      const now = hop(newJump(ms), 60);
      expect(Math.abs(now - was), `release at ${ms} ms: ${now} vs ${was}`).toBeLessThanOrEqual(1);
    }
  });

  it('a release gives the same hop at 30, 60 and 144 Hz (it used to be 62/41/20)', () => {
    // the shortest tap there is: released the frame after the press (30 Hz
    // cannot see it before two physics steps have risen; the others after one)
    const tap = (ctl, hz) => hop(ctl(1), hz);
    const was = tap(oldJump, 60);
    expect(was).toBeCloseTo(41, 0);
    expect(Math.abs(tap(newJump, 60) - was)).toBeLessThanOrEqual(1);
    expect(Math.abs(tap(newJump, 144) - was)).toBeLessThanOrEqual(1);
    expect(Math.abs(tap(newJump, 30) - was)).toBeLessThanOrEqual(10);
    for (const ms of [50, 100, 200, 300]) {
      const at60 = hop(newJump(ms), 60);
      // (the frame the release is seen in moves by at most 33 ms of rise)
      for (const hz of RATES) expect(Math.abs(hop(newJump(ms), hz) - at60), `${ms} ms at ${hz}`).toBeLessThanOrEqual(10);
    }
  });

  it('the old continuous cut really did differ by rate (what this fixes)', () => {
    const tap = RATES.map((hz) => hop(oldJump(0), hz));
    expect(tap[0] - tap[2]).toBeGreaterThan(20);
  });

  it('the cut never reads as a boost, and is continuous at its threshold', () => {
    for (let v = JUMP_CUT_BELOW + 1; v <= JUMP; v += 5) expect(cutSpeed(v)).toBeLessThan(v);
    expect(cutSpeed(JUMP_CUT_BELOW + 1)).toBeGreaterThan(JUMP_CUT_BELOW * 0.7);
  });
});

describe('run and ice', () => {
  // ms to 90 % of top speed from a standstill, with this per-frame factor
  const settle = (f, hz, scaled) => {
    const dt = 1000 / hz;
    let v = 0;
    for (let t = dt; t < 5000; t += dt) {
      v += (SPEED - v) * (scaled ? perFrame(f, dt) : f);
      if (v >= SPEED * 0.9) return t;
    }
    return Infinity;
  };
  it('60 Hz is exactly the old factors', () => {
    for (const f of [0.5, 0.35, 0.06]) expect(perFrame(f, STEP_MS)).toBeCloseTo(f, 10);
  });
  it('run, air and ice settle in the same time at every rate', () => {
    for (const f of [0.5, 0.35, 0.06]) {
      const at60 = settle(f, 60, true);
      expect(at60).toBeCloseTo(settle(f, 60, false), 6);
      for (const hz of RATES) expect(Math.abs(settle(f, hz, true) - at60), `${f} at ${hz}`).toBeLessThanOrEqual(1000 / 30 + 1);
    }
  });

  it('a running full jump carries the same distance at every rate', () => {
    const jump = (hz, f) => {
      const ctl = newJump(Infinity);
      return run(hz, (s, t, dt) => {
        ctl(s, t);
        s.vx += (SPEED - s.vx) * f(dt);
      }).landedX;
    };
    const was = jump(60, () => 0.35);
    for (const hz of RATES) expect(Math.abs(jump(hz, (dt) => perFrame(0.35, dt)) - was), `${hz} Hz`).toBeLessThanOrEqual(6);
    expect(was).toBeGreaterThan(REACH.across * T); // reach.js: carries 4 tiles
  });
});

describe('terminal velocity', () => {
  it('no physics step is deeper than a plank (12 px), at the 3 steps a frame fps.min allows', () => {
    expect((TERMINAL_FALL + 3 * STEP_DV) / 60).toBeLessThanOrEqual(12);
    for (const hz of [20, ...RATES]) {
      const s = run(
        hz,
        (st) => {
          st.air = true;
          if (st.y < 0) st.y = 0;
          if (st.vy > TERMINAL_FALL) st.vy = TERMINAL_FALL;
        },
        { ms: 3000 }
      );
      expect(s.maxStep, `${hz} Hz`).toBeLessThanOrEqual(12);
    }
  });
  it('does not touch the fall tiers: a 5-tile drop lands under the cap', () => {
    expect(Math.sqrt(2 * GRAVITY * 5 * T)).toBeLessThan(TERMINAL_FALL);
    // and old "fallSpeed > 900" only ever meant a drop past those 5 tiles
    expect((900 * 900 - 420 * 420) / (2 * GRAVITY)).toBeGreaterThan(5 * T);
  });
});

describe('landing', () => {
  it('weighs by the height fallen; a full jump is the old squash', () => {
    expect(landImpact(4)).toBe(0);
    expect(landImpact(64)).toBeLessThan(landImpact(145));
    expect(landImpact(145)).toBeCloseTo(0.76, 1);
    expect(0.08 + 0.17 * landImpact(145)).toBeCloseTo(0.2, 1);
    expect(landImpact(5 * T)).toBeGreaterThanOrEqual(0.8);
    expect(landImpact(144)).toBeLessThan(0.8); // the kick starts past a jump
    expect(landImpact(10 * T)).toBe(1);
    expect(landImpact(360, 500)).toBeLessThan(0.8); // a moon jump: no camera kick
    expect(landImpact(360, 0)).toBe(0); // zero-g
  });
  it('a frame of air over a seam is no landing; a low hop is', () => {
    expect(isLanding(0.3, 17)).toBe(false);
    expect(isLanding(4, 80)).toBe(false);
    expect(isLanding(41, 400)).toBe(true);
    expect(isLanding(2, 300)).toBe(true); // onto a ledge at the top of his jump
  });
});

describe('the follow camera', () => {
  const cam = () => ({ followOffset: { x: 0 }, lerp: 0, deadzone: { height: 60 }, setLerp(l) { this.lerp = l; } });
  const jo = (o = {}) => ({ flipX: false, body: { velocity: { x: 0 }, onFloor: () => true }, ...o });
  it('settles in the same time at every rate; 60 Hz is the old 0.1', () => {
    const c = cam();
    easeFollow(c, jo(), STEP_MS);
    expect(c.lerp).toBeCloseTo(0.1, 8);
    const settle = (hz) => {
      const k = cam();
      let gap = 1;
      let t = 0;
      while (gap > 0.1) {
        easeFollow(k, jo(), 1000 / hz);
        gap *= 1 - k.lerp;
        t += 1000 / hz;
      }
      return t;
    };
    for (const hz of RATES) expect(Math.abs(settle(hz) - settle(60)), `${hz} Hz`).toBeLessThanOrEqual(34);
  });
  it('the look-ahead eases, and opens the deadzone only in the air', () => {
    const c = cam();
    easeFollow(c, jo({ flipX: true }), STEP_MS);
    expect(c.followOffset.x).toBeGreaterThan(0);
    expect(c.followOffset.x).toBeLessThan(48);
    expect(c.deadzone.height).toBe(60);
    easeFollow(c, jo({ body: { velocity: { x: 0 }, onFloor: () => false } }), STEP_MS);
    expect(c.deadzone.height).toBeGreaterThan(145 * 1.5);
    easeFollow(c, jo({ climbing: true, body: { velocity: { x: 0 }, onFloor: () => false } }), STEP_MS);
    expect(c.deadzone.height).toBe(60);
  });
});

describe('settings', () => {
  afterEach(() => {
    updateSettings((s) => {
      s.reducedShake = false;
      s.volumes = { music: 1, ambience: 1 };
    });
  });
  it('reduced shake is read, not just declared', () => {
    expect(shakeScale()).toBe(1);
    updateSettings((s) => {
      s.reducedShake = true;
    });
    expect(shakeScale()).toBe(0.4);
  });
  it('sfx go through the sfx bus: its slider silences them', () => {
    const peak = (vol) => {
      updateSettings((s) => {
        s.volumes = { music: 1, ambience: 1, sfx: vol };
      });
      const ctx = new FakeAudioContext({ sampleRate: 22050 });
      installAudioContext(ctx);
      buses.reset();
      buses.ensure();
      const cap = ctx.createGain();
      audioTap().connect(cap);
      // (the bus eases to its level: let it get there first)
      let fired = false;
      const o = ctx.render(cap, 0.8, {
        onBlock: () => {
          if (!fired && ctx.currentTime >= 0.4) {
            fired = true;
            sfx('hurt');
          }
        },
      });
      installAudioContext(null);
      buses.reset();
      return o.L.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    };
    expect(peak(1)).toBeGreaterThan(0.001);
    expect(peak(0)).toBeLessThan(peak(1) / 100);
  });
});

describe('InputMap', () => {
  it('keeps a tap that starts and ends between two frames', () => {
    const target = new EventTarget();
    const map = attachInput(new InputMap(), target);
    const key = (type, code) => target.dispatchEvent(Object.assign(new Event(type), { code }));
    map.poll();
    key('keydown', 'Space');
    key('keyup', 'Space');
    map.poll();
    expect(map.justDown('jump')).toBe(true);
    map.poll();
    expect(map.isDown('jump')).toBe(false);
    // a held key is unchanged
    key('keydown', 'KeyA');
    map.poll();
    map.poll();
    expect(map.isDown('left')).toBe(true);
    key('keyup', 'KeyA');
    map.poll();
    expect(map.isDown('left')).toBe(false);
  });
});
