// How the other cars drive: pure, no Phaser. A style is one function of the race
// to the car's pedals and wheel, on the same numbers Jo drives by, so nobody
// cheats in a bend. Add a style by adding a function here, and name it in the
// rival's `style`. A script can give a car an `order`, the same shape, in place of
// its style.
//
//   STYLES.name = (race, c) => ({ throttle, brake, steer })   or { rail: { d, v, x } } for a car held to another's position
//
// A rival's data may carry k (share of a bend's limit it takes) and margin (m of
// braking road it leaves): that is its pace. `doomed` tells raceLost it will not finish.
//
// Emits: block_tell { id }, block_move { id, x }, mistake { id, bend }, fade { id }
import { brakeDistance, CAR_LEN, gripFactor, STEP } from './race.js';

const LOOK = 1.6; // s of road ahead a driver reads for something standing in it
const SPEED_K = 0.97; // of the limit: a rival leaves itself this much
const MARGIN = 6; // m of braking road spare
const STEER_SOFT = 0.05; // road widths: the wheel eases off this close to where it is going
const CAR_TAIL = 2; // m: it is not past a thing until its tail is
const TRAFFIC = 3; // car lengths ahead that a driver reads for a slower car on his line
const NEAR_BEND = 110; // m: a driver is setting up for it from here

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// the wheel that takes a car towards x
export const steerTo = (c, x) => clamp((x - c.x) / STEER_SOFT, -1, 1);

// where to be to clear what is standing ahead, the oil included; null when the way is clear
export function dodge(race, c) {
  const t = race.tune;
  const near = (q) => !q.gone && q.by !== c.id && q.d + q.len + CAR_TAIL > c.d && q.d - c.d < Math.max(c.v, 10) * LOOK && Math.abs(c.x - q.x) < (t.carWide + q.wide) / 2 + STEER_SOFT;
  const o = race.obstacles.find(near) ?? race.oil.find(near);
  if (!o) return null;
  const clear = (t.carWide + o.wide) / 2 + STEER_SOFT * 2;
  const side = o.x + clear <= t.edge && (c.x >= o.x || o.x - clear < -t.edge) ? 1 : -1;
  return o.x + side * clear;
}

// where to be to get round a slower car on this line; null when nobody is there
export function traffic(race, c) {
  const t = race.tune;
  const clear = t.carWide + STEER_SOFT * 2;
  // (alongside: keep off his door, whichever side you are on)
  const by = race.cars.find((q) => q !== c && q.state === 'run' && Math.abs(q.d - c.d) < CAR_LEN * 1.3 && Math.abs(q.x - c.x) < clear);
  if (by) return clamp(by.x + Math.sign(c.x - by.x || 1) * clear, -t.edge + STEER_SOFT, t.edge - STEER_SOFT);
  const o = race.cars.find((q) => q !== c && q.state === 'run' && q.finished === null && q.d > c.d && q.d - c.d < CAR_LEN * (TRAFFIC + 1) && q.v < c.v + 1 && Math.abs(q.x - c.x) < t.carWide + STEER_SOFT);
  if (!o) return null;
  const side = o.x + clear <= t.edge && (c.x >= o.x || o.x - clear < -t.edge) ? 1 : -1;
  return o.x + side * clear;
}

// a gate going down ahead that this car will not beat: stop for it
function gateAhead(race, c) {
  const t = race.tune;
  return race.crossings.some((o) => {
    const to = o.d - CAR_LEN / 2 - 1 - c.d;
    if (to < 0 || o.state === 'open') return false;
    if (o.state === 'bell' && to / Math.max(c.v, 1) < t.crossingBell - o.t) return false;
    return brakeDistance(c.v, 0, gripFactor(c.grip, t), t) + 4 >= to;
  });
}

// the pedals: brake on the same numbers as Jo, and for a gate
function pace(race, c, more = 0, k = c.k ?? SPEED_K) {
  const brake = race.wantsBrake(c, { k, margin: (c.margin ?? MARGIN) + more }) || gateAhead(race, c);
  return { throttle: !brake, brake };
}

// Held somewhere relative to Jo, in car lengths bumper to bumper (negative: behind him). Not
// driving the road: this is how a script keeps a car where the story needs it, whatever Jo does
export function holdOn(race, c, lo, hi, x) {
  const jo = race.jo;
  const h = STEP;
  const to = (n) => jo.d + Math.sign(n || 1) * (Math.abs(n) * CAR_LEN + CAR_LEN);
  const d = clamp(c.d + (jo.v + (to((lo + hi) / 2) - c.d) * 0.8) * h, to(lo), to(hi));
  const dx = clamp(x - c.x, -0.6 * h, 0.6 * h);
  const v = Math.abs(d - c.d) / h > jo.v + 20 ? jo.v : Math.max(0, (d - c.d) / h); // (no speed from Jo going back to a lamp)
  return { rail: { d, prevD: c.d, v, x: c.x + dx, prevX: c.x }, throttle: v >= c.v, brake: v < c.v - 0.05 };
}

// Dante: holds his line (where he started), brakes for the bends, steps round what is on the road
function clean(race, c) {
  c.line ??= c.x;
  const { throttle, brake } = pace(race, c);
  return { throttle, brake, steer: steerTo(c, dodge(race, c) ?? traffic(race, c) ?? c.line) };
}

// Aldo: 2 to 3 lengths ahead of Jo whatever Jo does, on the line he is showing him: the inside of what's next
function station(race, c) {
  const b = race.nextBend(c.d);
  const x = b && b.from - c.d < NEAR_BEND ? -0.33 * b.side : 0;
  return holdOn(race, c, 2, 3, x);
}

// Teo: into any gap, late on the brakes, weaving when he is behind you, and his tyres pay for it
function dive(race, c) {
  const t = race.tune;
  const jo = race.jo;
  c.line ??= c.x;
  if (c.grip < t.fadeGrip && c.top > t.fadeTop) {
    c.top = t.fadeTop;
    race.emit('fade', { id: c.id });
  }
  const b = race.nextBend(c.d);
  // (a fool, not a madman: nobody dives at a wall)
  const { throttle, brake } = pace(race, c, 0, b?.outside === 'wall' ? Math.min(c.k ?? SPEED_K, SPEED_K) : c.k);
  // his sump goes where he braked hard, once a bend
  if (race.track.oil && brake && b && c.v > t.oilHard && c.oilFor !== b) {
    c.oilFor = b;
    race.dropOil(c);
  }
  let line = b && b.from - c.d < NEAR_BEND ? -0.5 * b.side : c.line;
  const inHisAir = jo.inDraft && jo.draftOf === c;
  if (inHisAir) line = c.airX ??= c.x; // (only one man on this road shuts a door)
  else {
    c.airX = null;
    if (c.d < jo.d && jo.d - c.d < CAR_LEN * 6) line = jo.x + Math.sin(race.t * t.weaveRate) * t.weave + (jo.x > 0 ? -0.5 : 0.5); // in your mirror, one side and the other
  }
  return { throttle, brake, steer: steerTo(c, dodge(race, c) ?? traffic(race, c) ?? line) };
}

// Cassian: smooth and fast, and he shuts the door. In his air on a straight he looks up
// (block_tell: lamps twice, the helmet), holds still for blockTell, then moves across
// to your side over blockMove. Never in a bend, never twice in blockGap. And sit in his
// air long enough and he is thinking about you: he brakes early for the next bend, once.
function block(race, c) {
  const t = race.tune;
  const jo = race.jo;
  const h = STEP;
  c.line ??= c.x;
  c.home ??= c.x;
  c.tellAt ??= -Infinity;
  const air = jo.inDraft && jo.draftOf === c && c.v >= t.blockSpeed;
  c.mirror = air ? (c.mirror ?? 0) + h : 0;
  c.airT = Math.max(0, (c.airT ?? 0) + (air ? h : -h / 2));
  if (c.airT >= t.mistakeAir && c.early === undefined) c.early = 'next'; // (one mistake a race)

  const bend = race.bendAt(c.d);
  const next = race.nextBend(c.d);
  const way = dodge(race, c) ?? traffic(race, c);
  const clear = !bend && (!next || next.from - c.d > t.blockClear);
  const since = race.t - c.tellAt;

  c.lookAfter ??= t.blockMirror * (1 + race.rand()); // (not a metronome)
  if (!c.blocking && air && clear && way === null && c.mirror >= c.lookAfter && since >= t.blockGap) {
    c.tellAt = race.t;
    c.lookAfter = null;
    c.blocking = 'tell';
    race.emit('block_tell', { id: c.id });
  }
  let steer;
  if (c.blocking === 'tell') {
    steer = 0;
    if (race.t - c.tellAt >= t.blockTell) {
      const dx = jo.x - c.x;
      const side = Math.sign(dx) || -Math.sign(c.x) || 1;
      c.moveTo = clamp(Math.abs(dx) >= t.blockMin ? jo.x : c.x + side * t.blockMin, -t.blockLimit, t.blockLimit);
      // (the door shuts on the road in front of you, not on your door handle)
      if (Math.abs(jo.d - c.d) < CAR_LEN * 1.5) c.moveTo = jo.x - side * (t.carWide + STEER_SOFT);
      c.blocking = 'move';
      race.emit('block_move', { id: c.id, x: c.moveTo });
    }
  }
  if (c.blocking === 'move') {
    const left = t.blockTell + t.blockMove - (race.t - c.tellAt);
    // (a car alongside by now has beaten the door: he does not lean on it)
    const beaten = Math.abs(jo.d - c.d) < CAR_LEN * 1.3 && Math.abs(jo.x - c.x) < t.carWide + STEER_SOFT * 2 && Math.sign(c.moveTo - c.x) === Math.sign(jo.x - c.x);
    if (left <= 0 || beaten) {
      c.blocking = null;
      c.line = c.x;
      c.moveTo = null;
    } else {
      const rate = t.steerRate * (t.steerLow + (1 - t.steerLow) * Math.min(1, c.v / t.vMax));
      steer = clamp((c.moveTo - c.x) / (left * rate), -1, 1);
    }
  }
  // the bend: he goes in on the outside of it, and that is what leaves the inside
  if (next && next.from - c.d < t.blockClear) c.line = next.side * 0.35;
  else if (!c.blocking && !air && since > t.blockGap) c.line = c.home;

  // (the margin holds all the way to the bend, or it was no mistake)
  const early = c.early === 'next' && next && !bend;
  const flustered = c.earlyAt && c.d < c.earlyAt.to;
  const { throttle, brake } = pace(race, c, early ? t.mistakeEarly : 0, (c.k ?? SPEED_K) * (flustered ? t.mistakeSlow : 1));
  if (early && brake && !c.earlyAt) {
    c.earlyAt = next;
    race.emit('mistake', { id: c.id, bend: next.name });
  }
  if (c.earlyAt && c.d >= c.earlyAt.from) c.early = 'made';
  return { throttle, brake, steer: steer ?? steerTo(c, way ?? c.line) };
}

export const STYLES = { clean, station, dive, block };

export const rivalInput = (race, c) => (c.order ?? STYLES[c.style])(race, c);

// Orders a script gives. Brake to a stop at d on line x, wait `secs` (Infinity: stays), then back to the style
export const stopAt = (d, secs = Infinity, x = null) => (race, c) => {
  const to = d - c.d;
  const t = race.tune;
  const brake = to < 0.5 || brakeDistance(c.v, 0, gripFactor(c.grip, t), t) + 1 >= to || race.wantsBrake(c, { k: SPEED_K, margin: MARGIN });
  if (brake && c.v < 0.5) {
    c.stopT = (c.stopT ?? 0) + STEP;
    if (c.stopT >= secs) {
      c.stopT = 0;
      c.stopX = null;
      c.order = null;
    }
  }
  c.stopX = x ?? c.stopX ?? c.x;
  return { throttle: !brake, brake, steer: steerTo(c, traffic(race, c) ?? c.stopX) };
};

// Slews to x and stops: a car the story has finished with
export const slew = (x) => (race, c) => ({ throttle: false, brake: Math.abs(c.x - x) < 0.3 || c.v > 8, steer: clamp((x - c.x) / 0.3, -1, 1) });
