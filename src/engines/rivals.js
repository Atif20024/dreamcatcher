// How the other cars drive: pure, no Phaser. A style is one function of the race
// to the car's pedals and wheel, on the same numbers Jo drives by, so nobody
// cheats in a bend. Add a style by adding a function here, and name it in the
// rival's `style`.
//
//   STYLES.name = (race, c) => ({ throttle, brake, steer })

const LOOK = 1.6; // s of road ahead a driver reads for something standing in it
const SPEED_K = 0.97; // of the limit: a rival leaves itself this much
const MARGIN = 6; // m of braking road spare
const STEER_SOFT = 0.05; // road widths: the wheel eases off this close to where it is going
const CAR_TAIL = 2; // m: it is not past a thing until its tail is

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// the wheel that takes a car towards x
export const steerTo = (c, x) => clamp((x - c.x) / STEER_SOFT, -1, 1);

// where to be to clear what is standing ahead; null when the way is clear
export function dodge(race, c) {
  const t = race.tune;
  const o = race.obstacles.find((q) => !q.gone && q.d + q.len + CAR_TAIL > c.d && q.d - c.d < Math.max(c.v, 10) * LOOK && Math.abs(c.x - q.x) < (t.carWide + q.wide) / 2 + STEER_SOFT);
  if (!o) return null;
  const clear = (t.carWide + o.wide) / 2 + STEER_SOFT * 2;
  const side = o.x + clear <= t.edge && (c.x >= o.x || o.x - clear < -t.edge) ? 1 : -1;
  return o.x + side * clear;
}

// Dante: holds his line (where he started), brakes for the bends, steps round what is on the road
function clean(race, c) {
  c.line ??= c.x;
  const brake = race.wantsBrake(c, { k: SPEED_K, margin: MARGIN });
  return { throttle: !brake, brake, steer: steerTo(c, dodge(race, c) ?? c.line) };
}

export const STYLES = { clean };

export const rivalInput = (race, c) => STYLES[c.style](race, c);
