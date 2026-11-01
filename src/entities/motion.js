// Jo's movement numbers and the pure maths behind them (no Phaser, so
// tests/feel.test.js can run them at any refresh rate). Arcade integrates on a
// fixed 60 Hz step; Player.update runs once per render frame, so anything it
// applies per call is scaled here. At 60 Hz every value is what it always was:
// the level reach model (src/world/reach.js) is built on these arcs.
export const GRAVITY = 1200;
export const SPEED = 280;
export const JUMP = 600;
const FRAME_MS = 1000 / 60;

// a per-frame lerp factor written for 60 Hz, for a frame of dtMs
export const perFrame = (f, dtMs) => 1 - Math.pow(1 - f, dtMs / FRAME_MS);

// The jump cut. Below this rising speed a released key no longer shortens the jump.
export const JUMP_CUT_BELOW = 160;
const OLD_DECAY = 0.82; // what the cut used to multiply by, every 60 Hz frame

// One shot: the rising speed that, from here, reaches the apex the old 60 Hz
// frame-by-frame decay reached. So a release gives the same hop as it always
// did at 60 Hz, and the same hop at any other rate.
export function cutSpeed(speed, gravity = GRAVITY) {
  const dv = gravity / 60;
  let v = speed;
  let rise = 0;
  while (v > JUMP_CUT_BELOW) {
    v = v * OLD_DECAY - dv;
    rise += v / 60;
  }
  // Arcade's step loses dv/2 of rise per step: h = v²/2g - v/120
  rise += (v * v) / (2 * gravity) - v / 120;
  const half = gravity / 120;
  return half + Math.sqrt(half * half + 2 * gravity * rise);
}

// Terminal velocity. Arcade adds up to 3 steps of gravity (fps.min 20) before
// Player.update clamps again: 660 + 3 x 20 = 720 px/s, 12 px a step at most,
// the depth of a plank or a ladder cap. A 5-tile drop (the hard landing) hits
// 620 px/s, under the cap, so the fall tiers do not move.
export const TERMINAL_FALL = 660;

// A landing's weight from the height fallen, 0..1, shaped like the impact speed:
// 12 px is 0, a full jump 0.76, the 5-tile hard landing 0.82, 204 px and up 1.
export function landImpact(drop, gravity = GRAVITY) {
  const f = (Math.sqrt(2 * Math.max(0, gravity) * Math.max(0, drop)) - 250) / 450;
  return Math.max(0, Math.min(1, f));
}

// Was that a landing at all? A seam between bodies or a step down is a frame
// or two of air; touching down at the top of a hop is a long time in the air.
export const isLanding = (drop, airMs) => drop >= 12 || airMs >= 150;
