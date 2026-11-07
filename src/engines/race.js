// The race: pure maths, no Phaser (tests/race.test.js drives it with bots).
// One track, Jo's car and whoever else is on the road, stepped at a fixed
// 120 Hz (`advance` holds the accumulator, so a slow frame is more steps and
// never a different race). Distances are metres and speeds m/s. Across the road
// `x` is in road widths: 0 the middle, ±1 the edges, ±1.25 the straw or the wall,
// plus is right. In a bend the outside holds more speed and is a longer way round.
//
// THE CONTRACT (stages B and C build on this):
//   const r = new Race(track, { rivals: [{ id, d, x, style, pull, top }], tune });   track: compiled or raw (road.js)
//   r.advance({ throttle, brake, steer }, ms)   steer -1..1. Returns the steps taken
//   r.alpha()                  between the last two steps, for the picture
//   r.jo, r.rivals, r.cars     { d, prevD, x, prevX, v, grip, steer, throttle, braking, slip, onVerge, draft, inDraft, armed, slingT, launchT, bogT, state, ghost, lampD, finished, rubs, spins, slings, offroads, lifts, resets }
//   r.t (below 0 on the grid), r.result, r.track, r.obstacles, r.lamps, r.nextBend(d), r.bendAt(d), r.beat(), r.wantsBrake(car, opts)
//   r.drain(): launch, jump_start, sling, armed, sing { id, bend }, verge, straw, bale, bump, spin, back, reset, lamp, rub, hit, cue, rival_home, finish,
//     oil_drop { id, d, x, len, wide }, oil { id, d }, crossing_bell | crossing_shut | crossing_open { d }; bump carries why: 'gate' at a shut crossing
//     rivals.js adds block_tell, block_move, mistake, fade; race/script.js adds the story's (its head lists them)
//   new Race(track, { rivals, tune, script, seed }): seed makes a race's dice repeatable; r.script is the state machine for the view to read
//   r.oil [{ d, x, len, wide, by }], r.crossings [{ d, bell, state: 'open'|'bell'|'shut', rung }], r.rand()
//   a cue's `lap` (track.lapLen): { d, lap: 2, id } fires at d + lapLen, and the event carries both: { id, d (on the road), lap }
//   r.toLamp(r.jo, true)       Restart from the lamp
//   track.gate: { time } | { place } | { scripted: true }. r.result: { place, time, gap, passed, flags }; gatePassed(gate, result) says the same for a saved one
//   tune.untuned: the engine runs hot after hotAfter of the race (car.js sets it)
//   A rival style is one function in rivals.js: (race, car) => { throttle, brake, steer }.
import { compile } from './road.js';
import { rivalInput } from './rivals.js';

export const CAR_LEN = 3.8; // m
export const STEP = 1 / 120;
const MAX_FRAME = 0.05; // a hitch costs at most this much race time

// Why each number is what it is: docs/redesign/RACER_REBUILD_PLAN.md §5 and docs/redesign/round2/RACER_STAGE1_REPORT.md
export const TUNE = Object.freeze({
  vMax: 36, // m/s: 130 km/h, the design's honest 1958 top speed
  accel: 8.5, // m/s² off the line
  accelPow: 1.7, // how the pull fades towards the top speed
  coast: 0.6, // m/s² rolling
  coastAero: 0.0025, // × v²
  brake: 8, // m/s²: drum brakes (coast adds to it)
  fadeFrom: 2.5, // s of held brake before the drums fade …
  fadeTo: 5, // … to this …
  fadeMin: 0.7, // … at this strength
  steerRate: 1.3, // widths/s at the top speed …
  steerLow: 0.35, // … and this share of it at a crawl, so parking is calm
  curvePull: 1.4, // widths/s outward per unit of curve, × (v/vMax)²: about 0.35 at any bend's limit, so a bend left alone ends on the verge and the wheel must be held
  lineSpeed: 2, // m/s: a bend's outside edge holds this much more than its middle, the inside this much less
  lineLen: 0.08, // and the outside is this much longer a way round, the inside this much shorter
  slipPush: 0.16, // widths/s per m/s over a bend's speed
  slipBig: 5, // m/s of slide past which the push grows with it: a little over is a loan, a lot over is the hay
  slipScrub: 0.6, // m/s² per m/s over it (a slide costs speed)
  slipOver: 0.5, // a tyre that has let go grips again only this far under the limit, per m/s it went over …
  slipOverMax: 0.5, // … and never further than this share of it
  slipSteer: 0.7, // in a slide the wheel fights at this share of its rate
  edge: 1, // |x| past this is the verge
  off: 1.25, // and past this the straw, or the wall
  strawBack: 1.2, // where the straw hands the car back
  vergeDrag: 4, // m/s²
  gripMin: 0.75, // bald tyres: never worse than a fair 25 percent
  wearBrake: 0.02, // grip/s under hard braking …
  wearBrakeOver: 12, // … above this speed
  wearSlip: 0.015, // grip/s per m/s of slide
  wearVerge: 0.04, // grip/s
  wearBale: 0.03,
  wearStraw: 0.1, // a bend's straw scrubs the tyres hard: taking the bale wall instead of the brake must cost about the race's slack
  draftNear: 1.5, // car lengths, bumper to bumper
  draftFar: 4,
  draftWide: 0.25, // road widths either side of his line
  draftFill: 1.2, // s to a full bar
  draftLeak: 0.25, // bar/s lost out of the draft
  draftKeep: 0.5, // a full bar stays armed down to this
  draftSpeed: 0.06, // +6 percent while in it
  slingSpeed: 0.18, // +18 percent …
  slingTime: 2, // … for 2 s …
  slingCool: 4, // … then a 4 s cool-down
  slingPull: 1.8, // and this much more pull, so the 2 s are felt
  slingMinV: 10, // m/s: no sling from a crawl
  launchWindow: 0.35, // s after GO: a tap of the gas here is a good start
  launchEarly: 0.1, // s before GO that still counts as on the green
  launchPull: 1.25,
  launchTime: 2.5,
  bogTime: 0.3, // s of no pull for gas held before the green
  liftHold: 0.3, // s off both pedals that Ottavia can hear as a lift …
  liftSpeed: 25, // m/s: … above this …
  liftZone: 120, // m: … and this far clear of the next bend (a brake for a bend is no lift)
  carWide: 0.4, // road widths: who can touch whom
  sameLine: 0.15, // this close across the road, a touch is nose to tail
  rubPush: 0.12, // widths: a rub shoves the two apart
  rubLoss: 0.1, // both lose 10 percent
  hitLoss: 0.25, // a real hit
  hitClosing: 6, // m/s closing speed that makes a tap a hit
  contactGap: 0.8, // s before the same two cars can touch again
  hardHit: 8, // m/s: slower than this a hard thing is a bump, not a spin
  baleLoss: 0.4,
  strawLoss: 0.65, // one hit per bend: at least this share of the speed goes …
  strawCrash: 0.4, // … and it leaves at no more than this share of the bend's speed, so the straw is never a better brake than the brake …
  strawHold: 2.5, // … s of no pull while it drags clear of the hay …
  strawScrape: 14, // … and m/s² while it stays pressed against the bales
  spinTime: 1.2, // s of visible spin (the picture) …
  resetAt: 2, // … at the lamp by here (the screen is dark) …
  backAt: 3, // … and driving again at this: the design's 3 s
  rollOut: 12, // m/s: the car is moving when it is handed back
  ghost: 1, // s after a reset that nothing can touch it
  spinKeep: 0.7, // of the road a rival made while Jo was away from his lamp, he keeps: a wall costs a place race something, and never the race
  chalkReact: 0.2, // s: Ottavia's chalk leaves this much road for the foot to move
  singUnder: 3, // m/s under the line's limit at the way in, and no slide over singSlip: the loan paid back (RaceScene's SHE SINGS) …
  singSlip: 1,
  singPull: 1.25, // … pays this much pull …
  singTime: 2, // … for this long out of the bend
  bumpGap: 0.5, // s between the knocks of a car pressing on a cart
  hotAfter: 0.6, // of the race: an untuned engine runs hot from here …
  hotTop: 0.96, // … and tops out at this
  rollCost: 3, // s a car standing still has yet to lose to one at the top speed (raceLost)
  catchSlack: 0.5, // s a sling and a draft can still win back (raceLost)
  beatSlotWidth: 0.2, // of the window's half: the slot where the beat has stopped
  beatEdge: 4, // Hz at the edge of the draft window
  beatMax: 9, // Hz at its roughest, far from it
  beatHear: 3, // misses (window half-widths) at which the two engines are fully pulled together …
  beatFar: 5, // … and at which the rival's note is its own again
  bandMax: 0.06, // rubber band: at most this share of a rival's top speed; never the bend, which is grip and not top
  bandBehind: 0.5, // of it for a car behind Jo: a lead earned should mostly stay earned
  bandNear: 40, // m apart: none this close, so a duel is a duel …
  bandFar: 240, // m: … and all of it this far
  oilWobble: 0.6, // s
  oilShake: 0.9, // widths/s at its worst: a twitch that a held wheel gets back
  oilDrag: 2, // m/s² while it lasts
  oilLen: 7, // m
  oilWide: 0.35, // road widths
  oilHard: 26, // m/s: a car braking from this leaves its sump on the road
  crossingBell: 5.7, // s of bell and red lamps: a car on full throttle out of the chicane makes it by a few tenths; a lift or a poor exit does not …
  crossingShut: 2, // … and the gate is down this long
  wearGate: 0.05, // a shut gate met at speed: never a spin, but it is not nothing, so braking for it pays
  blockSpeed: 28, // m/s: nobody is in anybody's mirror off the line or out of a bend
  blockMirror: 0.5, // s in his air before he looks up
  blockTell: 0.45, // s from the look to the move: what the tell gives you
  blockMove: 0.8, // s across
  blockGap: 4, // s: never twice in this
  blockClear: 60, // m: the door is not in the bend, nor this close to one
  blockMin: 0.3, // widths: he always moves at least this, so it can be seen
  blockLimit: 0.8, // and never further out than this
  mistakeAir: 3, // s in his air and he is thinking about you …
  mistakeEarly: 10, // m: … and brakes this early at the next bend, once a race …
  mistakeSlow: 0.8, // … and takes it at this share of his pace: 8 m alone is a gap no car fits in
  fadeGrip: 0.2, // a diver's tyres under this are gone …
  fadeTop: 0.9, // … and so is his top speed
  weave: 0.25, // widths either side, behind you
  weaveRate: 1.6, // rad/s
  pitBox: 2.5, // s: nose in the box
  pitClean: 1.5, // s: and the crew has done the drill
  pitMiss: 5, // s: stopped short or long
  pitThrough: 0, // the grip you have left if you don't stop: there is no second lap in them …
  pitThroughMin: 0.66, // … and bald is this bad, soft set or not
  stopHelp: 2.4, // s stood still: with the stop and the pull away, that is about 5 s on the clock
  yellowV: 12, // m/s: past the marshals when Jo has stopped for him, the rivals who have yet to come by go at this …
  yellowLook: 80, // … from this far before the wreck …
  yellowPast: 60, // … to this far after it
  stopNear: 40, // m from his car: that is stopping for him
  wheelNear: 60, // m ahead of Jo: the wheel waits for this
  heldV: 18, // m/s: at less than this there is no air to be in
  airHold: 1.5, // s with the bar full in his air is holding it …
  airWindow: 8, // … and it counts this long, so one pull-out at the cue does not lose the line
  airWarn: 3, // s out of his air before the script says so (air { held: false })
  aldoDrift: 1.5, // s his tail lamps drift before they go out
  darkStop: 3.5, // s from there to the end of race 2: the car stops, and 2 s on the dark
  teoPassTop: 1.35, // going by, at the hairpin's exit: the one place a script gives a rival speed, and it is on a straight
  teoPassPull: 2.2,
  wornStart: 0.7, // the jar's tyres: not so worn that top 3 is a coin toss with Teo
  pitLook: 150, // m: a rival starts for his stall from here
  pitLine: 0.85, // where a rival's stall is, off the road's line
  wheelExit: 10, // m before the bend's exit: the wheel has waited long enough
  easePace: 0.06, // per failed try: rivals' top speed and bend pace, on a place gate (a track's `ease` overrides it; raceFor) …
  easeTime: 1.6, // … s more on the sheet, on a time gate …
  easeMax: 6, // … no more tries than this count …
  easeFloor: 0.5, // … and no rival goes slower than this share of himself
});

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// how much grip does a tyre at `grip` (0..1) still give? 1 new, TUNE.gripMin bald
export const gripFactor = (grip, t = TUNE) => t.gripMin + (1 - t.gripMin) * clamp(grip, 0, 1);
export const gripBand = (grip) => (grip >= 0.6 ? 'green' : grip >= 0.3 ? 'worn' : 'bald');

// the road needed to get from v to `safe` under the brake, the rolling drag included
// (∫ v dv / (B + A v²); the drums do not fade in a stop this short)
export function brakeDistance(v, safe, gf = 1, t = TUNE) {
  if (v <= safe) return 0;
  const B = t.brake * gf + t.coast;
  return Math.log((B + t.coastAero * v * v) / (B + t.coastAero * safe * safe)) / (2 * t.coastAero);
}

// How far out the car is running in a bend: 1 the outside edge (the side it throws you), -1 the inside
export const outward = (b, x) => clamp(x * b.side, -1, 1);
// what this line holds: the outside is faster …
export const bendSafe = (b, x = 0, gf = 1, t = TUNE) => (b.safe + outward(b, x) * (b.lineSpeed ?? t.lineSpeed)) * gf;
// … and longer (metres driven per metre of road)
const bendLen = (b, x, t) => 1 + outward(b, x) * (b.lineLen ?? t.lineLen);

// what the engine note follows (no gears: one long pull). 0.18 idle … 1 at the
// top speed; the throttle lifts it a little, as it does on a real car
export function revs(v, throttle = false, vMax = TUNE.vMax) {
  const r = 0.18 + 0.82 * Math.pow(clamp(v / vMax, 0, 1.2), 0.8);
  return Math.min(1.15, r + (throttle ? 0.05 : 0));
}

// Where to get on the brake for a line, from speed v. A chalk mark (one, for the
// road's middle from the top speed) leaves the foot its moment.
export const brakePoint = (b, x = 0, v = TUNE.vMax, gf = 1, t = TUNE) => b.from - brakeDistance(v, bendSafe(b, x, gf, t), gf, t);
export const chalkAt = (b, t = TUNE) => brakePoint(b, 0, t.vMax, 1, t) - t.vMax * t.chalkReact;

// Which side the road turns: away from the side it throws you.
export const turnSide = (b) => (b.side > 0 ? 'LEFT' : 'RIGHT');

// HEAR THE DRAFT. The two engines beat against each other, and the beat slows to
// nothing in the perfect slot behind a rival: the middle of the draft window, on
// his line. `hz` is the beat, 0 in the slot; `hear` (0..1) is how far the rival's
// note has been pulled to Jo's. Null when there is nobody to tune to.
export function draftBeat(jo, r, t = TUNE) {
  if (r.d <= jo.d || r.state !== 'run' || jo.state !== 'run') return null;
  const half = (t.draftFar - t.draftNear) / 2;
  const off = ((r.d - jo.d - CAR_LEN) / CAR_LEN - (t.draftNear + half)) / half; // 0 the slot, ±1 the window's ends
  const miss = Math.hypot(off, (jo.x - r.x) / t.draftWide);
  if (miss >= t.beatFar) return null;
  const w = t.beatSlotWidth;
  let hz = 0;
  if (miss > w) hz = miss <= 1 ? (t.beatEdge * (miss - w)) / (1 - w) : t.beatEdge + (t.beatMax - t.beatEdge) * Math.min(1, (miss - 1) / 2);
  return { id: r.id, hz, hear: clamp((t.beatFar - miss) / (t.beatFar - t.beatHear), 0, 1) };
}

// A rival far ahead eases and one far behind presses: on top speed only, and only at a distance.
export function rubberBand(race, c, t = race.tune) {
  const ahead = c.d - race.jo.d;
  return 1 - Math.sign(ahead) * (ahead < 0 ? t.bandBehind : 1) * t.bandMax * clamp((Math.abs(ahead) - t.bandNear) / (t.bandFar - t.bandNear), 0, 1);
}

// Did this finish pass the track's gate? A scripted race, or a road with no gate, has nothing to fail.
export function gatePassed(gate, { place, time }) {
  if (gate?.time !== undefined) return time <= gate.time;
  if (gate?.place !== undefined) return place <= gate.place;
  return true;
}

// Can Jo still make the gate? Flat-out arithmetic on what is left, the bends the
// same for everybody: a time is out of reach when he cannot get home inside it, and
// a rival when it gets home a sling's worth sooner than Jo can, from the speed he has.
export function raceLost(race, t = race.tune) {
  const L = race.track.length;
  const jo = race.jo;
  const gate = race.track.gate;
  if (race.result || !gate || gate.scripted) return false;
  const v = jo.state === 'run' ? jo.v : t.rollOut; // (in the dark he is about to be handed back at this)
  const joEta = (L - jo.d) / t.vMax + t.rollCost * (1 - Math.min(1, v / t.vMax));
  if (gate.time !== undefined) return race.t + joEta > gate.time;
  const out = race.rivals.filter((r) => !r.doomed && (r.finished !== null || (L - r.d) / (t.vMax * r.top) + t.catchSlack < joEta)); // (the story knows who does not finish)
  return out.length >= gate.place;
}

export function newCar({ id = 'jo', d = 0, x = 0, pull = 1, top = 1, style = 'clean', wear = 1, ...rest } = {}) {
  return {
    id,
    style,
    d,
    prevD: d,
    v: 0,
    x,
    prevX: x,
    steer: 0,
    onVerge: false,
    grip: 1,
    brakeHeld: 0,
    draft: 0,
    inDraft: false,
    draftOf: null, // whose air the bar was filled in
    armed: false,
    slingT: 0,
    slingCool: 0,
    launchT: 0,
    bogT: 0,
    slip: 0,
    slipPeak: 0,
    strawOf: null, // the straw takes one hit per bend
    braking: false,
    throttle: false,
    state: 'run', // run | spin | reset
    stateT: 0,
    ghost: 0,
    lampD: 0,
    pull,
    top,
    finished: null,
    rubs: 0,
    spins: 0,
    slings: 0,
    offroads: 0,
    lifts: 0,
    liftT: 0,
    resets: 0, // times back at the lamp
    under: new Map(), // bend → m/s under its line's limit at the way in (the best try at it)
    bumpAt: -Infinity,
    touchAgain: new Map(), // other car id → when they may next touch
    wear, // tyres go at this many times the rate
    singT: 0, // the pull a sung bend pays
    slid: false, // this bend
    wobbleT: 0, // on oil
    order: null, // the script's word: a style-shaped function, in place of the style
    ...rest,
  };
}

export class Race {
  constructor(track, { rivals = [], tune = TUNE, script = null, seed = 1 } = {}) {
    this.track = track.segments ? track : compile(track);
    this.tune = tune;
    this.jo = newCar({ id: 'jo' });
    this.rivals = rivals.map((r) => newCar(r));
    this.cars = [this.jo, ...this.rivals];
    this.obstacles = this.track.obstacles.map((o) => ({ ...o, gone: false }));
    this.lamps = this.track.lamps;
    const lapLen = this.track.lapLen ?? this.track.length;
    this.cues = this.track.cues.map((q) => ({ ...q, at: q.d + ((q.lap ?? 1) - 1) * lapLen }));
    this.oil = [];
    this.crossings = (this.track.things || []).filter((o) => o.kind === 'crossing').map((o) => ({ ...o, state: 'open', t: 0, rung: false }));
    this.seed = seed >>> 0;
    this.script = script;
    this.lampRivals = null; // where everybody was when Jo passed his last lamp
    this.t = -(this.track.countdown ?? 3); // the lights: racing starts at 0
    this.acc = 0;
    this.events = [];
    this.result = null;
    this.launchTried = this.t >= 0; // (no lights, no launch)
    this.launched = false; // the green was hit
    this.gasWas = false;
    this.gridGas = false; // gas down since before the green
    this.script?.start?.(this);
  }

  // this race's dice (mulberry32): the same seed is the same race
  rand() {
    this.seed = (this.seed + 0x6d2b79f5) >>> 0;
    let z = this.seed;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  }

  emit(type, data = {}) {
    this.events.push({ type, ...data });
  }

  drain() {
    const e = this.events;
    this.events = [];
    return e;
  }

  // the frame's time → fixed steps
  advance(input = {}, ms = 16.67) {
    this.acc += Math.min(ms / 1000, MAX_FRAME);
    let n = 0;
    while (this.acc >= STEP) {
      this.acc -= STEP;
      this.step(input);
      n += 1;
    }
    return n;
  }

  // between the last two steps, for the picture (0..1)
  alpha() {
    return this.acc / STEP;
  }

  bendAt(d) {
    return this.track.bends.find((b) => d >= b.from && d < b.to) || null;
  }

  nextBend(d) {
    return this.track.bends.find((b) => b.to > d) || null;
  }

  // the nearest rival ahead Jo can hear: the beat of the two engines (see draftBeat)
  beat() {
    let best = null;
    for (const r of this.rivals) {
      const b = draftBeat(this.jo, r, this.tune);
      if (b && (!best || b.hear > best.hear)) best = b;
    }
    return best;
  }

  // on the numbers Jo brakes by: is it time to brake for the next bend? k shaves
  // the speed aimed for, margin is road left spare, x is the line it will take
  wantsBrake(c, { k = 1, margin = 0, x = c.x } = {}) {
    const t = this.tune;
    const b = this.nextBend(c.d);
    if (!b) return false;
    const gf = gripFactor(c.grip, t);
    if (c.d >= b.from) return c.v > bendSafe(b, c.x, gf, t) * k;
    const aim = bendSafe(b, x, gf, t) * k;
    return c.v > aim && brakeDistance(c.v, aim, gf, t) + margin >= b.from - c.d;
  }

  step(input) {
    const h = STEP;
    const t = this.tune;
    this.t += h;
    const gas = !!input.throttle;
    const tapped = gas && !this.gasWas;
    this.gasWas = gas;
    if (this.t < 0) {
      // the grid: a tap this close before GO still counts as on the green
      if (tapped && !this.launchTried && this.t > -t.launchEarly) this.tryLaunch();
      this.gridGas = gas && !this.launched;
      for (const c of this.cars) c.throttle = c === this.jo && gas;
      return;
    }
    if (!this.launchTried) {
      if (this.gridGas && gas) {
        this.launchTried = true;
        this.jo.bogT = t.bogTime;
        this.emit('jump_start');
      } else if (tapped && this.t <= t.launchWindow) this.tryLaunch();
      else if (this.t > t.launchWindow) this.launchTried = true;
    }
    if (this.script) input = this.script.step(this, input) ?? input;
    this.crossingsStep(h);
    this.drive(this.jo, input, h);
    for (const c of this.rivals) this.drive(c, rivalInput(this, c), h);
    this.contacts();
    this.drafts(h);
    this.passCues();
    this.checkFinish();
  }

  tryLaunch() {
    this.launchTried = true;
    this.launched = true;
    this.jo.launchT = this.tune.launchTime;
    this.emit('launch');
  }

  trySling(c) {
    const t = this.tune;
    if (!c.armed || c.slingCool > 0 || c.state !== 'run' || c.v < t.slingMinV) return false;
    c.slingT = t.slingTime;
    c.slingCool = t.slingTime + t.slingCool;
    c.armed = false;
    c.draft = 0;
    c.slings += 1;
    this.emit('sling', { id: c.id });
    return true;
  }

  drive(c, input, h) {
    const t = this.tune;
    c.prevD = c.d;
    c.prevX = c.x;
    if (c.finished !== null) input = { throttle: false, brake: c.v > 14 }; // past the line, it rolls down by itself
    if (c.ghost > 0) c.ghost -= h;
    c.slingCool = Math.max(0, c.slingCool - h);
    c.slingT = Math.max(0, c.slingT - h);
    c.launchT = Math.max(0, c.launchT - h);
    c.bogT = Math.max(0, c.bogT - h);
    c.singT = Math.max(0, c.singT - h);
    if (c.state !== 'run') return this.recover(c, h);
    // (held to another car's position by its style: it does not drive the road, so the road does nothing to it)
    if (input.rail) {
      Object.assign(c, input.rail, { throttle: !!input.throttle, braking: !!input.brake, slip: 0, slipPeak: 0 });
      this.passLamps(c);
      return undefined;
    }
    const grip0 = c.grip;

    // the pedals (the brake wins)
    const gf = gripFactor(c.grip, t);
    const hot = t.untuned && c === this.jo && c.d > this.track.length * t.hotAfter ? t.hotTop : 1; // she left the bench still beating
    const band = c === this.jo || c.finished !== null ? 1 : rubberBand(this, c, t);
    const vTop = t.vMax * c.top * hot * band * (1 + (c.inDraft ? t.draftSpeed : 0) + (c.slingT > 0 ? t.slingSpeed : 0));
    const coast = t.coast + t.coastAero * c.v * c.v;
    // what Ottavia hears from the pit wall: off both pedals, at speed, with no bend to blame
    const coasting = !input.throttle && !input.brake && c.v > t.liftSpeed && c.finished === null && !this.track.bends.some((x) => c.d >= x.from - t.liftZone && c.d < x.to);
    if (coasting && c.liftT < t.liftHold && c.liftT + h >= t.liftHold) c.lifts += 1;
    c.liftT = coasting ? c.liftT + h : 0;
    c.throttle = !!input.throttle && !input.brake;
    c.braking = !!input.brake;
    let a;
    if (input.brake) {
      c.brakeHeld += h;
      const k = c.brakeHeld <= t.fadeFrom ? 1 : Math.max(t.fadeMin, 1 - ((c.brakeHeld - t.fadeFrom) / (t.fadeTo - t.fadeFrom)) * (1 - t.fadeMin));
      a = -(t.brake * gf * k + coast);
      if (c.v > t.wearBrakeOver) c.grip -= t.wearBrake * h;
    } else {
      c.brakeHeld = Math.max(0, c.brakeHeld - h);
      if (input.throttle && c.v < vTop && c.bogT <= 0) {
        const pull = t.accel * c.pull * (c.slingT > 0 ? t.slingPull : 1) * (c.launchT > 0 ? t.launchPull : 1) * (c.singT > 0 ? t.singPull : 1);
        a = pull * (1 - Math.pow(c.v / vTop, t.accelPow));
      } else a = -coast;
    }

    // a bend: over its line's speed the car slides towards the outside, and scrubs
    const b = this.bendAt(c.d);
    const limit = b ? bendSafe(b, c.x, gf, t) : 0;
    c.slipPeak = b ? Math.max(c.slipPeak, c.v - limit) : 0;
    c.slip = b ? Math.max(0, c.v - (limit - Math.min(t.slipOver * c.slipPeak, t.slipOverMax * limit))) : 0;
    if (c.slip <= 0) c.slipPeak = 0;
    if (c.slip > 0) {
      a -= t.slipScrub * c.slip;
      c.grip -= t.wearSlip * c.slip * h;
    }
    this.lateral(c, input, b, h);
    if (c.wobbleT > 0) a -= t.oilDrag;

    // the verge: a mistake you can drive out of
    const verge = Math.abs(c.x) > t.edge;
    if (verge) {
      a -= t.vergeDrag;
      c.grip -= t.wearVerge * h;
      if (!c.onVerge) this.emit('verge', { id: c.id });
    }
    c.onVerge = verge;

    c.grip = clamp(grip0 - (grip0 - c.grip) * c.wear, 0, 1);
    c.v = Math.max(0, c.v + a * h);
    c.d += (c.v * h) / (b ? bendLen(b, c.x, t) : 1);
    const into = this.bendAt(c.d);
    if (into && c.prevD < into.from) {
      c.under.set(into, Math.min(c.under.get(into) ?? Infinity, bendSafe(into, c.x, gf, t) - c.v));
      c.slid = false;
    }
    if (b && (c.slip > t.singSlip || verge)) c.slid = true;
    // the loan paid back: close to the limit, no slide, and she pulls out of it
    if (b && into !== b && !c.slid && (c.under.get(b) ?? Infinity) <= t.singUnder && c === this.jo) {
      c.singT = t.singTime;
      this.emit('sing', { id: c.id, bend: b.name });
    }
    if (c.state === 'run' && c.ghost <= 0) this.hitObstacles(c);
    this.hitCrossings(c);
    this.hitOil(c, h);
    this.passLamps(c);
    return undefined;
  }

  // the wheel, against what the bend does to the car
  lateral(c, input, b, h) {
    const t = this.tune;
    const speed = Math.min(1, c.v / t.vMax);
    c.steer = clamp(input.steer ?? 0, -1, 1);
    // (a parked car does not slide sideways; on the gas it can creep off a cart's tail)
    if (c.v > 0.5 || input.throttle) c.x += c.steer * t.steerRate * (t.steerLow + (1 - t.steerLow) * speed) * (c.slip > 0 || c.wobbleT > 0 ? t.slipSteer : 1) * h;
    if (c.wobbleT > 0) c.x += Math.sin((c.wobbleT / t.oilWobble) * Math.PI * 4) * t.oilShake * speed * h;
    if (b) c.x += b.side * (t.curvePull * Math.abs(b.curve) * speed * speed + t.slipPush * c.slip * Math.max(1, c.slip / t.slipBig)) * h;
    this.offRoad(c, b);
  }

  offRoad(c, b) {
    const t = this.tune;
    if (Math.abs(c.x) <= t.off) return;
    const side = Math.sign(c.x);
    const outside = b && b.side === side ? b.outside : null;
    if (outside === 'wall' && c.v > t.hardHit) {
      this.spin(c, 'wall');
    } else if (outside === 'straw' && c.strawOf !== b) {
      // the straw: soft, costly, and it puts the car back on the road
      c.strawOf = b;
      c.x = side * t.strawBack;
      c.v = Math.min(c.v * (1 - t.strawLoss), b.safe * t.strawCrash);
      c.bogT = t.strawHold;
      c.slip = c.slipPeak = 0;
      c.grip -= t.wearStraw;
      c.offroads += 1;
      this.emit('straw', { id: c.id });
    } else {
      c.x = side * t.off;
      if (outside === 'straw') c.v = Math.max(Math.min(c.v, b.safe * t.strawCrash), c.v - t.strawScrape * STEP); // leaning on the bales is no way round a bend, and no place to stop for ever
    }
  }

  hitObstacles(c) {
    const t = this.tune;
    for (const o of this.obstacles) {
      if (o.gone || Math.abs(c.x - o.x) > (t.carWide + o.wide) / 2) continue;
      if (c.d + CAR_LEN / 2 < o.d || c.d - CAR_LEN / 2 > o.d + o.len) continue;
      if (o.kind === 'bale') {
        o.gone = true;
        c.v *= 1 - t.baleLoss;
        c.grip -= t.wearBale;
        c.offroads += 1;
        this.emit('bale', { id: c.id, d: o.d, x: o.x });
      } else if (c.v > t.hardHit) {
        this.spin(c, o.kind);
      } else {
        c.d = o.d - CAR_LEN / 2 - 0.05;
        c.v = 0;
        if (this.t >= c.bumpAt) this.emit('bump', { id: c.id });
        if (this.t >= c.bumpAt) c.bumpAt = this.t + t.bumpGap;
      }
      return;
    }
  }

  // a thing that leaves its sump on the road; it stays there
  dropOil(c) {
    const t = this.tune;
    const o = { d: c.d, x: c.x, len: t.oilLen, wide: t.oilWide, by: c.id, gone: false };
    this.oil.push(o);
    this.emit('oil_drop', { id: c.id, d: o.d, x: o.x, len: o.len, wide: o.wide });
  }

  hitOil(c, h) {
    const t = this.tune;
    if (c.wobbleT > 0) {
      c.wobbleT = Math.max(0, c.wobbleT - h);
      return;
    }
    if (c.ghost > 0 || c.v < 5) return;
    const o = this.oil.find((q) => q.by !== c.id && c.d >= q.d && c.d <= q.d + q.len && Math.abs(c.x - q.x) < (t.carWide + q.wide) / 2);
    if (!o || c.oiledOn === o) return;
    c.oiledOn = o; // (one wobble a patch)
    c.wobbleT = t.oilWobble;
    this.emit('oil', { id: c.id, d: o.d });
  }

  // Jo's approach rings it, once: the same question for whoever is driving
  crossingsStep(h) {
    const t = this.tune;
    for (const o of this.crossings) {
      o.t += h;
      if (o.state === 'open' && !o.rung && this.jo.d >= o.d - o.bell && this.jo.d < o.d) {
        Object.assign(o, { state: 'bell', t: 0, rung: true });
        this.emit('crossing_bell', { d: o.d });
      } else if (o.state === 'bell' && o.t >= t.crossingBell) {
        Object.assign(o, { state: 'shut', t: 0 });
        this.emit('crossing_shut', { d: o.d });
      } else if (o.state === 'shut' && o.t >= t.crossingShut) {
        o.state = 'open';
        this.emit('crossing_open', { d: o.d });
      }
    }
  }

  // a shut gate is a bump and a stop, whatever the speed: it never spins you
  hitCrossings(c) {
    const t = this.tune;
    for (const o of this.crossings) {
      const stop = o.d - CAR_LEN / 2 - 0.05;
      if (o.state !== 'shut' || c.d <= stop || c.prevD > stop + 0.1) continue;
      if (c.v > t.hardHit) c.grip = clamp(c.grip - t.wearGate, 0, 1);
      c.d = stop;
      c.v = 0;
      if (this.t >= c.bumpAt) this.emit('bump', { id: c.id, why: 'gate' });
      if (this.t >= c.bumpAt) c.bumpAt = this.t + t.bumpGap;
    }
  }

  passLamps(c) {
    for (const l of this.lamps) {
      if (l > c.lampD && c.d >= l) {
        c.lampD = l;
        if (c === this.jo) {
          this.lampRivals = this.rivals.map((r) => ({ r, d: r.d, v: r.v, x: r.x, finished: r.finished, state: r.state }));
          this.emit('lamp', { d: l });
        }
      }
    }
  }

  // a scripted moment fires once, the first time Jo reaches it (going back to a lamp does not fire it again)
  passCues() {
    this.cues = this.cues.filter((q) => {
      if (this.jo.d < q.at) return true;
      this.emit('cue', { id: q.id, d: q.at, lap: q.lap });
      return false;
    });
  }

  // a hard thing: the car spins, and the lamp has it back in TUNE.backAt seconds
  spin(c, why) {
    if (c.state !== 'run') return;
    c.state = 'spin';
    c.stateT = 0;
    c.spins += 1;
    c.slip = c.slipPeak = 0;
    c.draft = 0;
    c.armed = false;
    this.emit('spin', { id: c.id, why });
  }

  recover(c, h) {
    const t = this.tune;
    c.stateT += h;
    if (c.state === 'spin') {
      c.v = Math.max(0, c.v - 30 * h);
      c.d += c.v * h;
      if (c.stateT >= t.resetAt) this.toLamp(c);
    } else if (c.stateT >= t.backAt) {
      c.state = 'run';
      c.v = t.rollOut;
      c.ghost = t.ghost;
      this.emit('back', { id: c.id });
    }
  }

  // to the last lamp (a spin's dark, or Restart from the lamp): `now` hands the car back at once
  toLamp(c, now = false) {
    const t = this.tune;
    c.d = c.prevD = c.lampD;
    c.x = c.prevX = 0;
    c.v = 0;
    c.slip = c.slipPeak = 0;
    c.brakeHeld = 0;
    Object.assign(c, { slingT: 0, slingCool: 0, armed: false, draft: 0, inDraft: false, draftOf: null, strawOf: null, onVerge: false, bogT: 0 }); // (nothing carries over from before the lamp)
    c.resets += 1;
    c.state = now ? 'run' : 'reset';
    c.stateT = t.resetAt;
    if (now) {
      c.v = t.rollOut;
      c.ghost = t.ghost;
    }
    // the road goes back with Jo, most of the way: everybody back towards where they were when he
    // passed that lamp, less what they keep (spinKeep). The clock does not go back (no lamp: no change)
    if (c === this.jo && this.lampRivals) {
      for (const { r, d, v, x, finished, state } of this.lampRivals) {
        if (r.out) continue; // (what the story has broken stays broken)
        const kept = d + t.spinKeep * (r.d - d);
        // (no faster than the next bend lets him be, from where he has been put)
        const b = this.nextBend(kept);
        const gf = gripFactor(r.grip, t);
        const room = b ? Math.max(0, b.from - kept) : 0;
        const fair = b ? Math.sqrt(bendSafe(b, x, gf, t) ** 2 + 2 * t.brake * gf * room) : v;
        Object.assign(r, { d: kept, prevD: kept, v: Math.min(v, fair), x, prevX: x, finished: kept >= this.track.length ? r.finished : finished, state, slip: 0, slipPeak: 0, ghost: t.ghost });
      }
    }
    this.emit('reset', { id: c.id, d: c.lampD, now });
  }

  // cars touch only within a car's width and a car's length
  contacts() {
    const t = this.tune;
    const c = this.jo;
    for (const r of this.rivals) {
      if (c.state !== 'run' || r.state !== 'run' || c.ghost > 0 || r.ghost > 0) continue;
      if (Math.abs(c.d - r.d) >= CAR_LEN || Math.abs(c.x - r.x) >= t.carWide) continue;
      if ((c.touchAgain.get(r.id) ?? -Infinity) > this.t) continue;
      c.touchAgain.set(r.id, this.t + t.contactGap);
      const [back, front] = c.d < r.d ? [c, r] : [r, c];
      const sameLine = Math.abs(c.x - r.x) < t.sameLine;
      const closing = back.v - front.v;
      c.rubs += 1;
      if (sameLine && closing > t.hitClosing) {
        // a real hit slows both
        back.v *= 1 - t.hitLoss;
        front.v *= 1 - t.hitLoss;
        back.d = front.d - CAR_LEN - 0.05;
        this.emit('hit', { id: r.id, closing });
      } else {
        // a rub: a small push, a sound, both lose 10 percent
        c.v *= 1 - t.rubLoss;
        r.v *= 1 - t.rubLoss;
        if (sameLine) back.d = front.d - CAR_LEN - 0.05;
        else {
          const away = Math.sign(c.x - r.x);
          c.x += away * t.rubPush;
          r.x -= away * t.rubPush;
        }
        this.emit('rub', { id: r.id });
      }
    }
  }

  drafts(h) {
    const t = this.tune;
    const c = this.jo;
    let inD = false;
    if (c.state === 'run') {
      for (const r of this.rivals) {
        const gap = r.d - c.d - CAR_LEN;
        if (Math.abs(c.x - r.x) < t.draftWide && gap >= t.draftNear * CAR_LEN && gap <= t.draftFar * CAR_LEN) {
          inD = true;
          c.draftOf = r;
        }
      }
    }
    c.inDraft = inD;
    if (inD) c.draft = Math.min(1, c.draft + h / t.draftFill);
    else c.draft = Math.max(0, c.draft - t.draftLeak * h);
    if (c.draft >= 1 && !c.armed) {
      c.armed = true;
      this.emit('armed');
    } else if (c.armed && c.draft < t.draftKeep) c.armed = false;
    // the sling fires itself: out of his line with the bar full, while he is still there to pass
    const r = c.draftOf;
    if (c.armed && !inD && r) {
      const gap = r.d - c.d - CAR_LEN;
      if (Math.abs(c.x - r.x) >= t.draftWide && gap >= -CAR_LEN && gap <= t.draftFar * CAR_LEN) this.trySling(c);
    }
  }

  checkFinish() {
    const L = this.track.length;
    for (const c of this.cars) {
      if (c.finished !== null || c.d < L) continue;
      c.finished = this.t;
      if (c !== this.jo) {
        this.emit('rival_home', { id: c.id });
        continue;
      }
      const place = 1 + this.rivals.filter((r) => r.finished !== null).length;
      // the gap to the nearest rival, in seconds: + he was behind, - he was already home
      const gaps = this.rivals.map((r) => (r.finished !== null ? r.finished - this.t : (L - r.d) / Math.max(r.v, 1)));
      const gap = gaps.length ? gaps.reduce((a, b) => (Math.abs(b) < Math.abs(a) ? b : a)) : null;
      const [slowBend, slowBy] = [...c.under].reduce((w, e) => (e[1] > w[1] ? e : w), [null, 0]);
      this.result = { place, time: this.t, gap, passed: gatePassed(this.track.gate, { place, time: this.t }), flags: { rubs: c.rubs, spins: c.spins, slings: c.slings, lifts: c.lifts, offroads: c.offroads, resets: c.resets, launched: this.launched, slowest: slowBend && { name: slowBend.name, under: slowBy }, clean: !c.rubs && !c.spins && !c.offroads } };
      this.emit('finish', this.result);
    }
  }
}
