// Driving, as the InputMap hears it (no Phaser: tests/raceResult.test.js). Up is the
// gas, Down the brake, Left and Right the wheel; touch presses the same keys
// (layoutRace). No Ctrl for the brake: Ctrl with W held closes the browser's tab.
export const RACE_KEYS = { up: ['ArrowUp', 'KeyW', 'ShiftLeft', 'ShiftRight'] };
export const RACE_PAD = { up: ['b7', 'b0'], down: ['b6', 'b1'], left: ['b14'], right: ['b15'] };

const DEAD = 0.18;
const IN = 1 / 90; // per ms: a key takes the wheel over in 90 ms …
const OUT = 1 / 60; // … and gives it back in 60

// the stick, past its dead zone, from 0 at the edge of it
export function stick(a = 0) {
  const m = Math.abs(a);
  return m <= DEAD ? 0 : (Math.sign(a) * (Math.min(1, m) - DEAD)) / (1 - DEAD);
}

// a key is all or nothing: the wheel still turns, so the car does not twitch
export function wheel(was, want, ms) {
  if (want === was) return was;
  const rate = want === 0 || Math.sign(want) !== Math.sign(was) ? OUT : IN;
  const step = rate * ms;
  return want > was ? Math.min(want, was + step) : Math.max(want, was - step);
}

// the frame's pedals and wheel. pad: the raw gamepad, for the stick's own value; thumb: the touch
// slab's own value (-1..1, null with no thumb on it: touchLayout.slabSteer), taken as it stands
export function driveInput(inputs, pad, was, ms, thumb = null) {
  const keys = (inputs.isDown('right') ? 1 : 0) - (inputs.isDown('left') ? 1 : 0);
  const axis = stick(pad && pad.axes ? pad.axes[0] : 0);
  const steer = thumb !== null && thumb !== undefined ? thumb : axis || wheel(was, keys, ms);
  return { throttle: inputs.isDown('up'), brake: inputs.isDown('down'), steer };
}
