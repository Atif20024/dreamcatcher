// Drivers on the engine's own numbers, shared by the race tests. Not a test file.
import { TUNE, CAR_LEN, bendSafe, gripFactor } from '../src/engines/race.js';
import { dodge, steerTo } from '../src/engines/rivals.js';
import { raceFor } from '../src/dreams/racer/race/script.js';

const BELL_MARGIN = 0.1; // s the bot wants in hand before it goes for a gate

// should the car lift for a crossing, by the numbers on the road? If it will not make the gate on full
// throttle, it brakes down to the speed that arrives as the gate lifts, and rolls through
export function gateCall(race, c) {
  for (const o of race.crossings) {
    const to = o.d - CAR_LEN / 2 - c.d;
    if (to < 0 || o.state === 'open') continue;
    const left = o.state === 'bell' ? TUNE.crossingBell - o.t : 0;
    if (o.state === 'bell' && to / Math.max((c.v + TUNE.vMax) / 2, 1) < left - BELL_MARGIN) continue;
    const opens = left + (o.state === 'bell' ? TUNE.crossingShut : TUNE.crossingShut - o.t);
    if (c.v > to / Math.max(opens, 0.1)) return true;
  }
  return false;
}

// A person leaves room: the nearest place on the road clear of everything standing ahead by `room`. Null when nothing is near.
function giveRoom(race, c, room) {
  const ahead = race.obstacles.filter((o) => !o.gone && o.d + o.len + CAR_LEN > c.d && o.d - c.d < Math.max(c.v, 12) * 2.5);
  if (!ahead.length) return null;
  const half = (o) => (TUNE.carWide + o.wide) / 2;
  for (let r = room; r >= 0; r -= 0.05) {
    let best = null;
    for (let x = -0.9; x <= 0.9; x += 0.05) {
      if (ahead.every((o) => Math.abs(x - o.x) >= half(o) + r) && (best === null || Math.abs(x - c.x) < Math.abs(best - c.x))) best = x;
    }
    if (best !== null) return Math.abs(best - c.x) < 0.1 ? c.x : best;
  }
  return null;
}

// A tidy driver: line per bend (share of a road width to the inside), brakes with a margin,
// keeps clear of everything. `behind` is a car id it will not pass.
export function tidy({ margin = 8, k = 0.995, inside = 0.33, behind = null, brakes = true, air = null, room = 0, line = null } = {}) {
  return (race) => {
    const c = race.jo;
    if (race.t < 0) return {};
    const b = race.nextBend(c.d);
    const want = b ? (line ? line[race.track.bends.indexOf(b)] : -inside) * b.side : 0;
    const near = b && b.from - c.d < 110;
    const beside = race.rivals.find((o) => o.state === 'run' && !o.rail && Math.abs(o.d - c.d) < CAR_LEN * 1.4 && Math.abs(o.x - c.x) < TUNE.carWide + 0.12);
    const ahead = race.rivals.find((o) => o.state === 'run' && o.finished === null && o.d > c.d && o.d - c.d < Math.max(CAR_LEN * 4, (c.v - o.v) * 1.5) && o.v < c.v + 1 && Math.abs(o.x - c.x) < TUNE.carWide + 0.1);
    const held = behind && race.rivals.find((o) => o.id === behind && o.d > c.d && o.d - c.d < CAR_LEN * 3.2);
    let target = near ? want : Math.abs(c.x) > 0.9 ? 0 : c.x;
    if (ahead && !held) {
      const side = Math.abs(ahead.x) > 0.3 ? -Math.sign(ahead.x) : Math.sign(c.x - ahead.x || 1);
      target = ahead.x + side * (TUNE.carWide + 0.15);
    }
    if (beside) target = beside.x + Math.sign(c.x - beside.x || 1) * (TUNE.carWide + 0.2);
    // sits in this car's air, on his line
    const inAirOf = air && race.rivals.find((o) => o.id === air && o.d > c.d);
    if (inAirOf) target = inAirOf.x;
    target = Math.max(-0.9, Math.min(0.9, (room ? giveRoom(race, c, room) : null) ?? dodge(race, c) ?? target));
    let brake = false;
    let throttle = true;
    if (b && brakes) {
      const lim = bendSafe(b, c.x, gripFactor(c.grip)) * k;
      if (c.d >= b.from) {
        brake = c.v > lim;
        throttle = c.v < lim * 0.985;
      } else {
        brake = race.wantsBrake(c, { k, margin, x: want });
        throttle = !brake;
      }
    }
    if (gateCall(race, c)) [brake, throttle] = [true, false];
    if (held) {
      throttle = false;
      if (held.d - c.d < CAR_LEN * 2.6) brake = c.v > held.v - 0.5;
    }
    // no room to go round: wait
    if (ahead && ahead.d - c.d < CAR_LEN * 2.2 && Math.abs(ahead.x - c.x) < TUNE.carWide + 0.02) {
      throttle = false;
      brake = brake || c.v > ahead.v;
    }
    return { throttle, brake, steer: steerTo(c, target) };
  };
}

// Draft-passes Cassian with the gap he gives you: gets into his air and stays, follows his moves
// after the tell, and when he brakes early pulls to the inside (the sling fires) and goes by.
export function gapBot({ margin = 3, k = 1, who = 'cassian', line = null } = {}) {
  const base = tidy({ margin, k, line });
  return (race) => {
    const c = race.jo;
    const o = base(race);
    if (race.t < 0) return o;
    const r = race.rivals.find((q) => q.id === who);
    if (!r || r.out || c.d > r.d + CAR_LEN) return o; // past him (or he is gone): just drive
    const gap = r.d - c.d - CAR_LEN;
    if (gap > CAR_LEN * 8 || race.rivals.some((q) => q !== r && q.d > c.d - CAR_LEN * 1.4 && q.d < r.d)) return o; // (nobody in between or alongside)
    const nextB = race.nextBend(c.d);
    if (r.earlyAt && r.earlyAt === nextB) return { ...o, steer: steerTo(c, Math.max(-0.9, Math.min(0.9, -0.5 * nextB.side))) }; // the gap: the inside
    if (r.early !== 'next' && r.early !== undefined) return o;
    // his air: on his line, off his bumper
    const brake = o.brake;
    return { throttle: !brake && gap > CAR_LEN * 2, brake, steer: steerTo(c, dodge(race, c) ?? r.x) };
  };
}

// On the straight, as soon as the bar is full: out to the side, the sling, past. What the tell is there to stop.
export function slingBot({ margin = 3, k = 1, who = 'cassian' } = {}) {
  const base = tidy({ margin, k });
  return (race) => {
    const c = race.jo;
    const o = base(race);
    if (race.t < 0) return o;
    const r = race.rivals.find((q) => q.id === who);
    if (!r || r.out || c.d > r.d + CAR_LEN) return o;
    const gap = r.d - c.d - CAR_LEN;
    if (gap > CAR_LEN * 8) return o;
    if (c.slings > (race.slingSeen ?? 0)) race.slingSeen = c.slings, (race.slingOut = race.t);
    if (race.slingOut !== undefined && race.t - race.slingOut < 3) return o;
    if (c.armed) return { ...o, steer: steerTo(c, r.x > 0 ? r.x - 0.6 : r.x + 0.6) };
    return { throttle: !o.brake && gap > CAR_LEN * 2, brake: o.brake, steer: steerTo(c, dodge(race, c) ?? r.x) };
  };
}

// Sits in his air until the door has shut, then goes round on the straight while he can't shut it again.
export function afterBlockBot({ margin = 3, k = 1, who = 'cassian' } = {}) {
  const base = tidy({ margin, k });
  return (race) => {
    const c = race.jo;
    const o = base(race);
    if (race.t < 0) return o;
    const r = race.rivals.find((q) => q.id === who);
    if (!r || r.out || c.d > r.d + CAR_LEN) return o;
    const gap = r.d - c.d - CAR_LEN;
    if (gap > CAR_LEN * 8) return o;
    const since = race.t - (r.tellAt ?? -Infinity);
    const nextB = race.nextBend(c.d);
    const room = !nextB || nextB.from - c.d > 100;
    if (since > race.tune.blockTell + race.tune.blockMove && since < race.tune.blockGap && c.draft > 0.5 && room) {
      return { ...o, steer: steerTo(c, r.x > 0 ? r.x - 0.6 : r.x + 0.6) };
    }
    if (c.slingT > 0) return o;
    return { throttle: !o.brake && gap > CAR_LEN * 1.7, brake: o.brake, steer: steerTo(c, dodge(race, c) ?? r.x) };
  };
}

// a bot wrapped so it answers the pit (box or through) and the wheel (stop or pass)
export function coppaBot({ box = 'box', cassian = 'pass', drive = tidy() } = {}) {
  return (race) => {
    const c = race.jo;
    const s = race.script;
    const o = drive(race);
    if (s.pit === 'ahead' && box === 'box') {
      const { d, len } = race.track.script.box;
      const stopAt = d + len / 2 - CAR_LEN / 2;
      if (c.d > stopAt - 200 && (c.v * c.v) / (2 * (TUNE.brake * gripFactor(c.grip) + TUNE.coast)) + 3 >= stopAt - c.d) return { ...o, throttle: false, brake: true };
    }
    if (s.pit === 'ahead' && typeof box === 'number') {
      // stop this many metres short of (or past) the box
      const { d, len } = race.track.script.box;
      const stopAt = d + (box < 0 ? box : len + box) - CAR_LEN / 2;
      if (c.d > stopAt - 200 && (c.v * c.v) / (2 * (TUNE.brake * gripFactor(c.grip) + TUNE.coast)) + 2 >= stopAt - c.d) return { ...o, throttle: false, brake: true };
    }
    if (cassian === 'stop' && s.wheel === 'off') {
      const wreck = race.rivals.find((q) => q.id === 'cassian');
      const to = wreck.d - 8 - c.d;
      if ((c.v * c.v) / (2 * (TUNE.brake * gripFactor(c.grip) + TUNE.coast)) + 3 >= to) return { ...o, throttle: false, brake: true };
    }
    return o;
  };
}

// A person, not a computer: what `drive` asks for reaches the car `lag` seconds late, through three
// keys (full left, nothing, full right), after a slow foot on the green.
export function hands(drive, { lag = 0.25, green = 0.5 } = {}) {
  const queue = [];
  const n = Math.round(lag * 120);
  return (race) => {
    if (race.t < 0) return {};
    const o = drive(race);
    queue.push({ ...o, steer: Math.abs(o.steer ?? 0) >= 1 ? Math.sign(o.steer) : 0 });
    const late = queue.length > n ? queue.shift() : {};
    return race.t < green ? {} : late;
  };
}

// One bad mistake: misses the brake for bend number `at` altogether, and stands on it only once it is in the bend.
export function blunder(drive, at) {
  return (race) => {
    const o = drive(race);
    const b = race.track.bends[at];
    return race.nextBend(race.jo.d) === b && race.jo.d < b.from ? { ...o, throttle: true, brake: false } : o;
  };
}

const midOf = (list) => list[Math.floor(list.length / 2)];
const strawBends = (track) => track.bends.flatMap((b, i) => (b.outside === 'straw' ? [i] : []));

// Bends about 15 percent under the limit, a quarter second behind, three keys, one bad mistake a race.
export const rusty = ({ track, at = midOf(track.bends.map((_, i) => i)), ...o }) => hands(blunder(tidy({ k: 0.85, margin: 4, room: 0.25, ...o }), at), { lag: 0.25, green: 0.5 });
// Bends about 25 percent under, a slower foot, and one trip into the straw a race.
export const newcomer = ({ track, at = midOf(strawBends(track)), ...o }) => hands(blunder(tidy({ k: 0.75, margin: 10, room: 0.3, ...o }), at), { lag: 0.35, green: 0.7 });

// The fastest honest way round: the right line for each bend (outward share), on the limit, and Cassian's gap
const BEST_LINE = { pinewood: [0.7, -0.7, -0.7], salt: [-0.7, -0.7, 0.7, -0.7], coppa: [0.7, -0.7, -0.7, 0.7, 0.7, -0.7, -0.7, 0.7] };
export const best = (track) => (track.rivals?.some((c) => c.id === 'cassian') ? gapBot({ margin: 1, k: 1, line: BEST_LINE[track.id] }) : tidy({ margin: 1, k: 1, line: BEST_LINE[track.id] }));

// run a whole race; returns the race, its log and when each thing happened
export function runRace(track, F, bot, { seed = 1, secs = 240, tune } = {}) {
  const r = raceFor(track, F, { seed, ...(tune ? { tune } : null) });
  const log = [];
  for (let i = 0; i < secs * 120 && !r.result && r.script?.state !== 'over'; i++) {
    r.step(bot(r));
    for (const e of r.drain()) log.push({ ...e, at: r.t });
  }
  return { r, log };
}
