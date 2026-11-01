// The race: pure maths, no Phaser (tests/race.test.js drives it with bots).
// One track, Jo's car and whoever else is on the road, stepped at a fixed
// 120 Hz (`advance` holds the accumulator, so a slow frame is more steps and
// never a different race). Distances are metres and speeds m/s (1 m = 44 px
// lives in the scene). The depth axis is the road's width: `y` is in lanes,
// 0 far, 1 middle, 2 near, and a bend that is taken too fast pushes the car
// along it, towards the outside of the bend.
//
//   const r = new Race(track, { rivals: [{ id: 'roche', lane: 1, d: 9 }] });
//   const steps = r.advance({ throttle, brake, laneUp, laneDown, sling }, ms);
//   r.jo, r.cars, r.t, r.result, r.drain()   (events since the last drain)

export const CAR_LEN = 3.8; // m (167 px)
export const STEP = 1 / 120;
const MAX_FRAME = 0.05; // a hitch costs at most this much race time

// Why each number is what it is: docs/redesign/round2/RACER_STAGE1_REPORT.md, then _R2_REPORT.md
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
  laneTime: 0.45, // s per lane
  laneScrub: 0.015, // a lane change at speed costs this much of it (weaving is not free)
  lineSpeed: 2, // m/s: a bend's outside lane holds this much more than its middle, the inside this much less
  lineLen: 0.08, // and the outside is this much longer a way round, the inside this much shorter
  slipPush: 0.28, // lanes/s per m/s over a bend's speed
  slipScrub: 0.6, // m/s² per m/s over it (a slide costs speed)
  slipOver: 1, // a tyre that has let go grips again only this far under the limit, per m/s it went over …
  slipOverMax: 0.5, // … and never further than this share of it
  slipSteer: 0.5, // a lane press in a slide steers at this share of the glide
  gripMin: 0.75, // bald tyres: never worse than a fair 25 percent
  wearBrake: 0.02, // grip/s under hard braking
  wearLane: 0.006, // grip per lane change at speed
  wearSlip: 0.015, // grip/s per m/s of slide
  wearBale: 0.03,
  wearStraw: 0.1, // a bend's straw scrubs the tyres hard: taking the bale wall instead of the brake must cost about the race's slack
  draftNear: 1.5, // car lengths, bumper to bumper
  draftFar: 4,
  draftFill: 1.2, // s to a full bar
  draftLeak: 0.25, // bar/s lost out of the draft
  draftKeep: 0.5, // a full bar stays armed down to this
  draftSpeed: 0.06, // +6 percent while in it
  slingSpeed: 0.18, // +18 percent …
  slingTime: 2, // … for 2 s …
  slingCool: 4, // … then a 4 s cool-down
  slingPull: 1.8, // and this much more pull, so the 2 s are felt
  launchWindow: 0.35, // s after GO: a tap here is a good start
  launchPull: 1.25,
  launchTime: 2.5,
  liftHold: 0.3, // s off both pedals that Ottavia can hear as a lift …
  liftSpeed: 25, // m/s: … above this …
  liftZone: 120, // m: … and this far clear of the next bend (a brake for a bend is no lift)
  rubLoss: 0.1, // both lose 10 percent
  hitLoss: 0.25, // a real hit
  hitClosing: 6, // m/s closing speed that makes a tap a hit
  contactGap: 0.8, // s before the same two cars can touch again
  hardHit: 8, // m/s: slower than this a hard thing is a bump, not a spin
  baleLoss: 0.4,
  spinTime: 1.2, // s of visible spin (the picture) …
  resetAt: 2, // … at the lamp by here (the screen is dark) …
  backAt: 3, // … and driving again at this: the design's 3 s
  rollOut: 12, // m/s: the car is moving when it is handed back
  ghost: 1, // s after a reset that nothing can touch it
  chalkReact: 0.2, // s: Ottavia's chalk leaves this much road for the foot to move
  bumpGap: 0.5, // s between the knocks of a car pressing on a cart
  rollCost: 3, // s a car standing still has yet to lose to one at the top speed (raceLost)
  catchSlack: 0.5, // s a sling and a draft can still win back (raceLost)
  beatSlotWidth: 0.2, // of the window's half: the slot where the beat has stopped
  beatEdge: 4, // Hz at the edge of the draft window
  beatMax: 9, // Hz at its roughest, far from it
  beatHear: 3, // misses (window half-widths) at which the two engines are fully pulled together …
  beatFar: 5, // … and at which the rival's note is its own again
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

// A lane is a racing line. In a bend, y becomes how far out the car is running:
// 0 the inside lane (the side it turns towards), 1 the outside (the side it throws you)
export const lineOf = (b, y) => clamp(b.side > 0 ? y / 2 : (2 - y) / 2, 0, 1);
// what this line holds: the outside is faster …
export const bendSafe = (b, y, gf = 1, t = TUNE) => (b.safe + (lineOf(b, y) * 2 - 1) * (b.lineSpeed ?? t.lineSpeed)) * gf;
// … and longer (metres driven per metre of road)
export const bendLen = (b, y, t = TUNE) => 1 + (lineOf(b, y) * 2 - 1) * (b.lineLen ?? t.lineLen);

// what the engine note follows (no gears: one long pull). 0.18 idle … 1 at the
// top speed; the throttle lifts it a little, as it does on a real car
export function revs(v, throttle = false, vMax = TUNE.vMax) {
  const r = 0.18 + 0.82 * Math.pow(clamp(v / vMax, 0, 1.2), 0.8);
  return Math.min(1.15, r + (throttle ? 0.05 : 0));
}

// Where to get on the brake for a line, from speed v. A chalk mark leaves the foot its moment.
export const brakePoint = (b, y, v = TUNE.vMax, gf = 1, t = TUNE) => b.from - brakeDistance(v, bendSafe(b, y, gf, t), gf, t);
export const chalkAt = (b, lane, t = TUNE) => brakePoint(b, lane, t.vMax, 1, t) - t.vMax * t.chalkReact;

// Which side the road turns: a bend that throws you to the near verge turns away
// from it. Driving right across the screen, the near verge is on Jo's right hand.
export const turnSide = (b) => (b.side > 0 ? 'LEFT' : 'RIGHT');

// HEAR THE DRAFT. The two engines beat against each other, and the beat slows to
// nothing in the perfect slot behind a rival: the middle of the draft window, in
// its lane. `hz` is the beat, 0 in the slot; `hear` (0..1) is how far the rival's
// note has been pulled to Jo's. Null when there is nobody to tune to.
export function draftBeat(jo, r, t = TUNE) {
  if (r.d <= jo.d || r.state !== 'run' || jo.state !== 'run') return null;
  const half = (t.draftFar - t.draftNear) / 2;
  const off = ((r.d - jo.d - CAR_LEN) / CAR_LEN - (t.draftNear + half)) / half; // 0 the slot, ±1 the window's ends
  const miss = Math.hypot(off, (jo.y - r.y) / 0.4); // (0.4: the draft's own lane test)
  if (miss >= t.beatFar) return null;
  const w = t.beatSlotWidth;
  let hz = 0;
  if (miss > w) hz = miss <= 1 ? (t.beatEdge * (miss - w)) / (1 - w) : t.beatEdge + (t.beatMax - t.beatEdge) * Math.min(1, (miss - 1) / 2);
  return { id: r.id, hz, hear: clamp((t.beatFar - miss) / (t.beatFar - t.beatHear), 0, 1) };
}

// Can Jo still make the gate? Flat-out arithmetic on what is left, the bends the
// same for everybody: a rival is out of reach when it gets home a sling's worth
// sooner than Jo can, from the speed he has.
export function raceLost(race, t = race.tune) {
  const L = race.track.length;
  const jo = race.jo;
  if (race.result || race.track.passPlace === undefined) return false;
  const v = jo.state === 'run' ? jo.v : t.rollOut; // (in the dark he is about to be handed back at this)
  const joEta = (L - jo.d) / t.vMax + t.rollCost * (1 - Math.min(1, v / t.vMax));
  const out = race.rivals.filter((r) => r.finished !== null || (L - r.d) / (t.vMax * r.top) + t.catchSlack < joEta);
  return out.length >= race.track.passPlace;
}

export function newCar({ id = 'jo', d = 0, lane = 1, pull = 1, top = 1 } = {}) {
  return {
    id,
    d,
    prevD: d,
    v: 0,
    y: lane,
    prevY: lane,
    lane,
    fromLane: lane,
    grip: 1,
    brakeHeld: 0,
    draft: 0,
    inDraft: false,
    armed: false,
    slingT: 0,
    slingCool: 0,
    launchT: 0,
    slip: 0,
    slipPeak: 0,
    steerT: 0,
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
  };
}

export class Race {
  // track: { length, countdown, gridLane, bends: [{ from, to, safe, side, outside }],
  //          lamps: [m], obstacles: [{ d, lane, kind: 'cart' | 'bale' }] }
  constructor(track, { rivals = [], tune = TUNE } = {}) {
    this.track = track;
    this.tune = tune;
    this.jo = newCar({ id: 'jo', lane: track.gridLane ?? 1 });
    this.rivals = rivals.map((r) => newCar(r));
    this.cars = [this.jo, ...this.rivals];
    this.obstacles = (track.obstacles || []).map((o) => ({ ...o, gone: false }));
    this.lamps = [...(track.lamps || [])].sort((a, b) => a - b);
    this.lampRivals = null; // where everybody was when Jo passed his last lamp
    this.t = -(track.countdown ?? 3); // the lights: racing starts at 0
    this.acc = 0;
    this.events = [];
    this.result = null;
    this.edges = { laneUp: false, laneDown: false, sling: false };
    this.launchTried = false;
    this.launched = false; // the green was hit
  }

  emit(type, data = {}) {
    this.events.push({ type, ...data });
  }

  drain() {
    const e = this.events;
    this.events = [];
    return e;
  }

  // the frame's time → fixed steps. Edges (a lane key, the sling key) wait for
  // the first step they can land on, so a press in a short frame is never lost
  advance(input = {}, ms = 16.67) {
    const e = this.edges;
    e.laneUp ||= !!input.laneUp;
    e.laneDown ||= !!input.laneDown;
    e.sling ||= !!input.sling;
    this.acc += Math.min(ms / 1000, MAX_FRAME);
    let n = 0;
    while (this.acc >= STEP) {
      this.acc -= STEP;
      this.step({ throttle: !!input.throttle, brake: !!input.brake, laneUp: e.laneUp, laneDown: e.laneDown, sling: e.sling });
      e.laneUp = e.laneDown = e.sling = false;
      n += 1;
    }
    return n;
  }

  // between the last two steps, for the picture (0..1)
  alpha() {
    return this.acc / STEP;
  }

  bendAt(d) {
    return (this.track.bends || []).find((b) => d >= b.from && d < b.to) || null;
  }

  nextBend(d) {
    return (this.track.bends || []).find((b) => b.to > d) || null;
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

  // what is coming, per lane, for the sight strip (the view is 14-17 m ahead)
  ahead(range = 150) {
    const c = this.jo;
    const out = [];
    for (const o of this.obstacles) {
      const dist = o.d - c.d;
      if (!o.gone && dist > 0 && dist < range) out.push({ kind: o.kind, lane: o.lane, dist, v: 0 });
    }
    for (const r of this.rivals) {
      const dist = r.d - c.d;
      if (dist > 0 && dist < range) out.push({ kind: 'car', lane: r.lane, dist, v: r.v });
    }
    return out;
  }

  step(input) {
    const h = STEP;
    this.t += h;
    if (this.t < 0) {
      // the grid: a tap this close before GO still counts as on the green
      if (input.sling && !this.launchTried) {
        if (this.t > -0.1) this.tryLaunch();
        else {
          this.launchTried = true;
          this.emit('jump_start'); // too early: no good start, nothing worse
        }
      }
      for (const c of this.cars) c.throttle = c === this.jo && !!input.throttle;
      return;
    }
    if (input.sling && !this.launchTried && this.t <= this.tune.launchWindow) this.tryLaunch();
    else if (input.sling) this.trySling(this.jo);
    this.drive(this.jo, input, h);
    for (const c of this.rivals) this.drive(c, this.rivalInput(c), h);
    this.contacts();
    this.drafts(h);
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
    if (!c.armed || c.slingCool > 0 || c.state !== 'run' || c.v < 10) return false;
    c.slingT = t.slingTime;
    c.slingCool = t.slingTime + t.slingCool;
    c.armed = false;
    c.draft = 0;
    c.slings += 1;
    this.emit('sling', { id: c.id });
    return true;
  }

  // the placeholder rival: holds its lane, brakes for the bends on the same
  // numbers as Jo, steps round what is on the road. No rubber band.
  rivalInput(c) {
    const t = this.tune;
    const b = this.nextBend(c.d);
    const gf = gripFactor(c.grip, t);
    let brake = false;
    if (b) {
      const safe = bendSafe(b, c.y, gf, t) * 0.97;
      brake = c.d >= b.from ? c.v > safe : brakeDistance(c.v, safe, gf, t) + 6 >= b.from - c.d;
    }
    let laneUp = false;
    let laneDown = false;
    const block = this.obstacles.find((o) => !o.gone && o.lane === c.lane && o.d > c.d && o.d - c.d < c.v * 1.6);
    if (block && c.y === c.lane) {
      if (c.lane < 2) laneDown = true;
      else laneUp = true;
    }
    return { throttle: !brake, brake, laneUp, laneDown };
  }

  drive(c, input, h) {
    const t = this.tune;
    c.prevD = c.d;
    c.prevY = c.y;
    if (c.finished !== null) input = { throttle: false, brake: c.v > 14 }; // past the line, it rolls down by itself
    if (c.ghost > 0) c.ghost -= h;
    c.slingCool = Math.max(0, c.slingCool - h);
    c.slingT = Math.max(0, c.slingT - h);
    c.launchT = Math.max(0, c.launchT - h);
    if (c.state !== 'run') return this.recover(c, h);

    // lanes: a press moves the target, the car glides there
    if (input.laneUp && c.lane > 0) this.changeLane(c, -1);
    if (input.laneDown && c.lane < 2) this.changeLane(c, 1);
    // (a slide wins over the glide unless a lane press is fighting it)
    c.steerT = Math.max(0, c.steerT - h);
    if (c.slip <= 0 || c.steerT > 0) {
      const dy = c.lane - c.y;
      const glide = (h / t.laneTime) * (c.slip > 0 ? t.slipSteer : 1);
      c.y = Math.abs(dy) <= glide ? c.lane : c.y + Math.sign(dy) * glide;
    }

    // the pedals (the brake wins)
    const gf = gripFactor(c.grip, t);
    const vTop = t.vMax * c.top * (1 + (c.inDraft ? t.draftSpeed : 0) + (c.slingT > 0 ? t.slingSpeed : 0));
    const coast = t.coast + t.coastAero * c.v * c.v;
    // what Ottavia hears from the pit wall: off both pedals, at speed, with no bend to blame
    const coasting = !input.throttle && !input.brake && c.v > t.liftSpeed && c.finished === null && !(this.track.bends || []).some((x) => c.d >= x.from - t.liftZone && c.d < x.to);
    if (coasting && c.liftT < t.liftHold && c.liftT + h >= t.liftHold) c.lifts += 1;
    c.liftT = coasting ? c.liftT + h : 0;
    c.throttle = !!input.throttle && !input.brake;
    c.braking = !!input.brake;
    let a;
    if (input.brake) {
      c.brakeHeld += h;
      const k = c.brakeHeld <= t.fadeFrom ? 1 : Math.max(t.fadeMin, 1 - ((c.brakeHeld - t.fadeFrom) / (t.fadeTo - t.fadeFrom)) * (1 - t.fadeMin));
      a = -(t.brake * gf * k + coast);
      if (c.v > 12) c.grip -= t.wearBrake * h;
    } else {
      c.brakeHeld = Math.max(0, c.brakeHeld - h);
      if (input.throttle && c.v < vTop) {
        const pull = t.accel * c.pull * (c.slingT > 0 ? t.slingPull : 1) * (c.launchT > 0 ? t.launchPull : 1);
        a = pull * (1 - Math.pow(c.v / vTop, t.accelPow));
      } else a = -coast;
    }

    // a bend: over its line's speed the car slides towards the outside, and scrubs
    const b = this.bendAt(c.d);
    const limit = b ? bendSafe(b, c.y, gf, t) : 0;
    c.slipPeak = b ? Math.max(c.slipPeak, c.v - limit) : 0;
    c.slip = b ? Math.max(0, c.v - (limit - Math.min(t.slipOver * c.slipPeak, t.slipOverMax * limit))) : 0;
    if (c.slip <= 0) c.slipPeak = 0;
    if (c.slip > 0) {
      a -= t.slipScrub * c.slip;
      c.y += b.side * t.slipPush * c.slip * h;
      if (c.steerT <= 0) c.lane = clamp(Math.round(c.y), 0, 2);
      c.grip -= t.wearSlip * c.slip * h;
      this.offRoad(c, b);
    }
    c.grip = clamp(c.grip, 0, 1);
    c.v = Math.max(0, c.v + a * h);
    c.d += (c.v * h) / (b ? bendLen(b, c.y, t) : 1);
    const into = this.bendAt(c.d);
    if (into && c.prevD < into.from) c.under.set(into, Math.min(c.under.get(into) ?? Infinity, bendSafe(into, c.y, gf, t) - c.v));
    if (c.state === 'run' && c.ghost <= 0) this.hitObstacles(c);
    this.passLamps(c);
    return undefined;
  }

  changeLane(c, dir) {
    if (c.y === c.lane) c.fromLane = c.lane; // (mid-glide it still came from where the glide began)
    c.lane += dir;
    c.steerT = this.tune.laneTime;
    if (c.v > 20) {
      c.grip -= this.tune.wearLane;
      c.v *= 1 - this.tune.laneScrub;
    }
    this.emit('lane', { id: c.id, lane: c.lane });
  }

  offRoad(c, b) {
    const over = b.side > 0 ? c.y > 2.45 : c.y < -0.45;
    if (!over) return;
    if (b.outside === 'wall') {
      this.spin(c, 'wall');
      return;
    }
    // the straw: soft, costly, and it puts the car back on the road
    c.y = b.side > 0 ? 2.45 : -0.45;
    c.v *= 1 - this.tune.baleLoss;
    c.slip = c.slipPeak = 0; // (the straw has it: one hit, not one every step)
    c.grip -= this.tune.wearStraw;
    c.offroads += 1;
    this.emit('straw', { id: c.id });
  }

  hitObstacles(c) {
    const t = this.tune;
    for (const o of this.obstacles) {
      if (o.gone || Math.abs(c.y - o.lane) > 0.55) continue;
      const len = o.len ?? (o.kind === 'cart' ? 3 : 1);
      if (c.d + CAR_LEN / 2 < o.d || c.d - CAR_LEN / 2 > o.d + len) continue;
      if (o.kind === 'bale') {
        o.gone = true;
        c.v *= 1 - t.baleLoss;
        c.grip -= t.wearBale;
        c.offroads += 1;
        this.emit('bale', { id: c.id, d: o.d, lane: o.lane });
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

  passLamps(c) {
    for (const l of this.lamps) {
      if (l > c.lampD && c.d >= l) {
        c.lampD = l;
        if (c === this.jo) {
          this.lampRivals = this.rivals.map((r) => ({ r, d: r.d, v: r.v, y: r.y, lane: r.lane, finished: r.finished, state: r.state }));
          this.emit('lamp', { d: l });
        }
      }
    }
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
    c.y = c.prevY = c.lane = c.fromLane = 1;
    c.v = 0;
    c.slip = c.slipPeak = 0;
    c.brakeHeld = 0;
    Object.assign(c, { slingT: 0, slingCool: 0, armed: false, draft: 0, inDraft: false, steerT: 0 }); // (nothing carries over from before the lamp)
    c.resets += 1;
    c.state = now ? 'run' : 'reset';
    c.stateT = t.resetAt;
    if (now) {
      c.v = t.rollOut;
      c.ghost = t.ghost;
    }
    // the road goes back with Jo: everybody where they were when he passed that
    // lamp. The clock does not, so a spin still costs its time (no lamp: no change)
    if (c === this.jo && this.lampRivals) {
      for (const { r, d, v, y, lane, finished, state } of this.lampRivals) {
        Object.assign(r, { d, prevD: d, v, y, prevY: y, lane, fromLane: lane, finished, state, slip: 0, slipPeak: 0, ghost: t.ghost });
      }
    }
    this.emit('reset', { id: c.id, d: c.lampD, now });
  }

  // cars touch only within a lane and a car's length (a glide counts)
  contacts() {
    const t = this.tune;
    const c = this.jo;
    for (const r of this.rivals) {
      if (c.state !== 'run' || r.state !== 'run' || c.ghost > 0 || r.ghost > 0) continue;
      if (Math.abs(c.d - r.d) >= CAR_LEN || Math.abs(c.y - r.y) >= 0.6) continue;
      if ((c.touchAgain.get(r.id) ?? -Infinity) > this.t) continue;
      c.touchAgain.set(r.id, this.t + t.contactGap);
      const [back, front] = c.d < r.d ? [c, r] : [r, c];
      const sameLane = Math.abs(c.y - r.y) < 0.2;
      const closing = back.v - front.v;
      c.rubs += 1;
      if (sameLane && closing > t.hitClosing) {
        // a real hit slows both
        back.v *= 1 - t.hitLoss;
        front.v *= 1 - t.hitLoss;
        back.d = front.d - CAR_LEN - 0.05;
        this.emit('hit', { id: r.id, closing });
      } else {
        // a rub: a small push, a sound, both lose 10 percent
        c.v *= 1 - t.rubLoss;
        r.v *= 1 - t.rubLoss;
        if (sameLane) back.d = front.d - CAR_LEN - 0.05;
        else if (c.y !== c.lane) c.lane = c.fromLane; // the door is shut: back where you came from
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
        if (Math.abs(c.y - r.y) < 0.4 && gap >= t.draftNear * CAR_LEN && gap <= t.draftFar * CAR_LEN) inD = true;
      }
    }
    c.inDraft = inD;
    if (inD) c.draft = Math.min(1, c.draft + h / t.draftFill);
    else c.draft = Math.max(0, c.draft - t.draftLeak * h);
    if (c.draft >= 1 && !c.armed) {
      c.armed = true;
      this.emit('armed');
    } else if (c.armed && c.draft < t.draftKeep) c.armed = false;
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
      this.result = { place, time: this.t, gap, flags: { rubs: c.rubs, spins: c.spins, slings: c.slings, lifts: c.lifts, offroads: c.offroads, resets: c.resets, launched: this.launched, slowest: slowBend && { name: slowBend.name, under: slowBy }, clean: !c.rubs && !c.spins && !c.offroads } };
      this.emit('finish', this.result);
    }
  }
}
