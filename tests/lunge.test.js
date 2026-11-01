import { describe, it, expect } from 'vitest';
import { FOES } from '../src/data/kinds.js';
import { grabConnects, WINDUP_RANGE, MIN_LUNGE } from '../src/entities/grab.js';
import { SPEED } from '../src/entities/motion.js';

const WALK = 80;
// everyone who actually comes for Jo (a talker pushes, a heckler throws, the pit boss watches)
const grabbers = Object.entries(FOES).flatMap(([dream, kinds]) =>
  Object.entries(kinds)
    .filter(([, k]) => k.human && !k.pushes && !k.ranged && !k.passive)
    .map(([id, k]) => [`${dream}/${id}`, k])
);

describe('a grab has no dead zone and a fair dodge', () => {
  it.each(grabbers)('%s', (_, k) => {
    expect(k.lunge).toBeGreaterThanOrEqual(MIN_LUNGE);
    // standing still is not immunity, anywhere he can start a wind-up
    for (let gap = 1; gap < WINDUP_RANGE; gap += 3) expect(grabConnects({ gap, lunge: k.lunge })).toBe(true);
    // a duck always beats it
    expect(grabConnects({ gap: 40, lunge: k.lunge, ducks: true })).toBe(false);
    // a player who reads the tell (0.25 s to react) can run from any distance
    for (let gap = 1; gap < WINDUP_RANGE; gap += 3) {
      expect(grabConnects({ gap, lunge: k.lunge, joSpeed: SPEED, reactMs: 250 })).toBe(false);
    }
    // and at the range he usually starts from, even a walk away is enough
    expect(grabConnects({ gap: WINDUP_RANGE - 1, lunge: k.lunge, joSpeed: WALK, reactMs: 150 })).toBe(false);
  });
});
