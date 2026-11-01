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

// Why each number is what it is: docs/redesign/round2/RACER_STAGE1_REPORT.md
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
  slipPush: 0.22, // lanes/s per m/s over a bend's speed
  slipScrub: 0.6, // m/s² per m/s over it (a slide costs speed)
  gripMin: 0.75, // bald tyres: never worse than a fair 25 percent
  wearBrake: 0.02, // grip/s under hard braking
  wearLane: 0.006, // grip per lane change at speed
  wearSlip: 0.015, // grip/s per m/s of slide
  wearBale: 0.03,
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
});

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// how much grip does a tyre at `grip` (0..1) still give? 1 new, TUNE.gripMin bald
export const gripFactor = (grip, t = TUNE) => t.gripMin + (1 - t.gripMin) * clamp(grip, 0, 1);
export const gripBand = (grip) => (grip >= 0.6 ? 'green' : grip >= 0.3 ? 'worn' : 'bald');

// the road needed to get from v to `safe` under the brake (coasting drag ignored: a margin)
export const brakeDistance = (v, safe, gf = 1, t = TUNE) => (v <= safe ? 0 : (v * v - safe * safe) / (2 * t.brake * gf));

// what the engine note follows (no gears: one long pull). 0.18 idle … 1 at the
// top speed; the throttle lifts it a little, as it does on a real car
export function revs(v, throttle = false, vMax = TUNE.vMax) {
  const r = 0.18 + 0.82 * Math.pow(clamp(v / vMax, 0, 1.2), 0.8);
  return Math.min(1.15, r + (throttle ? 0.05 : 0));
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
    this.t = -(track.countdown ?? 3); // the lights: racing starts at 0
    this.acc = 0;
    this.events = [];
    this.result = null;
    this.edges = { laneUp: false, laneDown: false, sling: false };
    this.launchTried = false;
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

  // what is coming, per lane, for the sight strip (the view is 18 m ahead at speed)
  ahead(range = 150) {
    const c = this.jo;
    const out = [];
    for (const o of this.obstacles) {
      const dist = o.d - c.d;
      if (!o.gone && dist > 0 && dist < range) out.push({ kind: o.kind, lane: o.lane, dist });
    }
    for (const r of this.rivals) {
      const dist = r.d - c.d;
      if (dist > 0 && dist < range) out.push({ kind: 'car', lane: r.lane, dist });
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
      const safe = b.safe * 0.97 * gf;
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
      const glide = h / t.laneTime;
      c.y = Math.abs(dy) <= glide ? c.lane : c.y + Math.sign(dy) * glide;
    }

    // the pedals (the brake wins)
    const gf = gripFactor(c.grip, t);
    const vTop = t.vMax * c.top * (1 + (c.inDraft ? t.draftSpeed : 0) + (c.slingT > 0 ? t.slingSpeed : 0));
    const coast = t.coast + t.coastAero * c.v * c.v;
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

    // a bend: over its speed the car slides towards the outside, and scrubs
    const b = this.bendAt(c.d);
    c.slip = b ? Math.max(0, c.v - b.safe * gf) : 0;
    if (c.slip > 0) {
      a -= t.slipScrub * c.slip;
      c.y += b.side * t.slipPush * c.slip * h;
      if (c.steerT <= 0) c.lane = clamp(Math.round(c.y), 0, 2);
      c.grip -= t.wearSlip * c.slip * h;
      this.offRoad(c, b);
    }
    c.grip = clamp(c.grip, 0, 1);
    c.v = Math.max(0, c.v + a * h);
    c.d += c.v * h;
    if (c.state === 'run' && c.ghost <= 0) this.hitObstacles(c);
    this.passLamps(c);
    return undefined;
  }

  changeLane(c, dir) {
    c.fromLane = c.lane;
    c.lane += dir;
    c.steerT = this.tune.laneTime;
    if (c.v > 20) c.grip -= this.tune.wearLane;
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
    c.grip -= this.tune.wearBale;
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
        this.emit('bump', { id: c.id });
      }
      return;
    }
  }

  passLamps(c) {
    for (const l of this.lamps) {
      if (l > c.lampD && c.d >= l) {
        c.lampD = l;
        if (c === this.jo) this.emit('lamp', { d: l });
      }
    }
  }

  // a hard thing: the car spins, and the lamp has it back in TUNE.backAt seconds
  spin(c, why) {
    if (c.state !== 'run') return;
    c.state = 'spin';
    c.stateT = 0;
    c.spins += 1;
    c.slip = 0;
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
    c.slip = 0;
    c.brakeHeld = 0;
    c.state = now ? 'run' : 'reset';
    c.stateT = t.resetAt;
    if (now) {
      c.v = t.rollOut;
      c.ghost = t.ghost;
    }
    this.emit('reset', { id: c.id, d: c.lampD });
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
      if (c !== this.jo) continue;
      const place = 1 + this.rivals.filter((r) => r.finished !== null).length;
      this.result = { place, time: this.t, flags: { rubs: c.rubs, spins: c.spins, slings: c.slings, clean: !c.rubs && !c.spins && !c.offroads } };
      this.emit('finish', this.result);
    }
  }
}
