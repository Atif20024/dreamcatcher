// How far a person's grab reaches, as numbers (Foe.update plays them; the test
// walks every kind through them). He starts the wind-up inside RANGE and his
// hand reaches REACH, so without a step in Jo was safe anywhere between the two.
export const WINDUP_RANGE = 70;
export const GRAB_REACH = 42;
export const WINDUP_MS = 400;
export const GRAB_MS = 250;
export const MIN_LUNGE = Math.ceil((WINDUP_RANGE - GRAB_REACH) / (GRAB_MS / 1000 - 1 / 60)); // the slowest step that closes the gap
// a conversation or a card gives Jo this long before he's looked at again; a
// second one soon after gives nothing, or a sign beside a foe keeps him off for good
export const GRACE_MS = 900;
export const GRACE_EVERY_MS = 4000;

// One grab, frame by frame: Jo `gap` px away when the wind-up starts, reacting
// after reactMs by running at joSpeed (away from the foe, picking up speed as
// Player.update does), or ducking. A duck only counts as a reaction: `heldDown`
// is Jo already crouched when the wind-up began. True if it connects.
export function grabConnects({ gap, lunge, joSpeed = 0, reactMs = 0, ducks = false, heldDown = false, dt = 1 / 60 }) {
  if (ducks && !heldDown) return false;
  let jo = gap;
  let vx = 0;
  let t = 0;
  const end = (WINDUP_MS + GRAB_MS) / 1000;
  while (t < end) {
    const inGrab = t >= WINDUP_MS / 1000;
    if (inGrab && Math.abs(jo) < GRAB_REACH) return true;
    if (t >= reactMs / 1000) vx += (joSpeed - vx) * 0.5;
    jo += vx * dt;
    if (inGrab) jo -= lunge * dt;
    t += dt;
  }
  return false;
}
