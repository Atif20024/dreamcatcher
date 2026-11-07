import { describe, it, expect } from 'vitest';
import { FOES } from '../src/data/kinds.js';
import { grabConnects, WINDUP_RANGE, MIN_LUNGE } from '../src/entities/grab.js';
import { SPEED } from '../src/entities/motion.js';
import { foePace } from '../src/data/tuning.js';

const WALK = 80;
// below this a wind-up has started on top of Jo: at 0.25 s he can't clear the
// hand by running (9 frames of picking up speed), and the duck is the answer
const CLOSE = 5;
// everyone who actually comes for Jo (a talker pushes, a heckler throws, the pit boss watches)
const grabbers = Object.entries(FOES).flatMap(([dream, kinds]) =>
  Object.entries(kinds)
    .filter(([, k]) => k.human && !k.pushes && !k.ranged && !k.passive)
    .map(([id, k]) => [`${dream}/${id}`, k, dream])
);

describe('a grab has no dead zone and a fair dodge', () => {
  it.each(grabbers)('%s', (_, k, dream) => {
    expect(k.lunge).toBeGreaterThanOrEqual(MIN_LUNGE);
    // standing still is not immunity, anywhere he can start a wind-up
    for (let gap = 1; gap < WINDUP_RANGE; gap += 3) expect(grabConnects({ gap, lunge: k.lunge })).toBe(true);
    // a duck in time always beats it; Down held since before the tell doesn't
    for (let gap = 1; gap < WINDUP_RANGE; gap += 3) {
      expect(grabConnects({ gap, lunge: k.lunge, ducks: true })).toBe(false);
      expect(grabConnects({ gap, lunge: k.lunge, ducks: true, heldDown: true })).toBe(true);
    }
    // a player who reads the tell (0.25 s to react) can run, with Jo's real pick-up, from any real gap
    for (let gap = CLOSE; gap < WINDUP_RANGE; gap++) {
      expect(grabConnects({ gap, lunge: k.lunge, joSpeed: SPEED, reactMs: 250 })).toBe(false);
    }
    // and at the range he usually starts from, even a walk away is enough
    expect(grabConnects({ gap: WINDUP_RANGE - 1, lunge: k.lunge, joSpeed: WALK, reactMs: 150 })).toBe(false);

    // the top tier: he walks in faster, so he starts his wind-up a step closer, and that's all it changes
    const walk = (k.speed || 70) * foePace(dream, 5) * 0.9;
    const gap = WINDUP_RANGE - walk / 60;
    expect(grabConnects({ gap, lunge: k.lunge, joSpeed: SPEED, reactMs: 250 })).toBe(false);
    expect(grabConnects({ gap, lunge: k.lunge, joSpeed: WALK, reactMs: 150 })).toBe(false);
    expect(grabConnects({ gap, lunge: k.lunge, ducks: true })).toBe(false);
    // and once Jo runs, nobody who walks catches him, on any tier
    expect(walk).toBeLessThan(SPEED);
  });
});
