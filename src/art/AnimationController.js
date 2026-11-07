// AnimationController (plan §2.5.3): one per actor. Pure JS — no Phaser —
// so the state mapping and the stride lock unit-test in Node.
//
//   const anim = new AnimationController(manifest, { outfit: 'street' });
//   anim.update(dtMs, snapshot)      // every frame, from physics + input
//   anim.frameName()                 // 'jo/street/side/run/03'
//   anim.playOnce('swing')           // a verb pose; returns a Promise
//
// States come from physics + input + body.blocked, never from an animation
// ending alone (skill §5). Missing animations degrade along the manifest's
// fallback chain (logged once). Walk/run/climb are stride-locked: the frame
// advances by ground covered (manifest `step`, 1× px per frame), so a
// planted foot never slides.

const AIR = new Set(['rise', 'apex', 'fall', 'jump_anticipate', 'wall_jump', 'wall_slide']);
// verbs that may play on the ground or in the air
const ANYWHERE = new Set(['hurt', 'caught', 'swing', 'pen', 'brush', 'interact', 'celebrate', 'play_trumpet', 'death']);
// one-shots that any movement input cuts short (after `minFrames`)
const SOFT = { land: 1, hard_land: 3, idle_fidget: 0, interact: 2, celebrate: 3, wake: 2, shrug: 1, run_start: 0 };

const GAIT = { walkBelow: 110, runAbove: 240 }; // screen px/s

// The pure state choice: physics/input snapshot → animation name.
// s: { grounded, vx, vy, inputX, crouch, climbing, wallSlide, pushing,
//      carrying, floating, dead, gait, walkOnly, idleFor }
export function resolveState(s) {
  if (s.dead) return 'death';
  if (s.floating) return 'float';
  if (s.climbing) return Math.abs(s.vy) > 10 ? 'climb' : 'climb_idle';
  const ax = Math.abs(s.vx);
  if (!s.grounded) {
    if (s.wallSlide) return 'wall_slide';
    if (s.vy < -150) return 'rise';
    if (s.vy > 150) return 'fall';
    return 'apex';
  }
  if (s.crouch) return ax > 20 ? 'crouch_walk' : 'crouch';
  if (s.pushing) return 'push';
  if (s.carrying) return ax > 12 ? 'carry_walk' : 'carry_idle';
  if (s.tool === 'brush' && ax > 12) return 'brush_hold';
  if (ax > 12) {
    if (s.walkOnly || ax < GAIT.walkBelow) return 'walk';
    if (ax < GAIT.runAbove) return 'jog';
    return 'run';
  }
  if (s.pockets) return 'pockets';
  return 'idle';
}

// transitions that insert a one-shot between two states (skid, turn, start,
// land, the jump's anticipation)
export function transitionInsert(prev, next, s, ev = {}) {
  if (s.crouch && s.grounded) return null; // ducking (or under a low ceiling) wins
  if (ev.landed) return ev.landed.hard ? 'hard_land' : 'land';
  if (ev.wallJumped) return 'wall_jump';
  if (ev.jumped) return 'jump_anticipate';
  if (!s.grounded || s.crouch || s.carrying || s.walkOnly) return null;
  const ax = Math.abs(s.vx);
  const running = prev === 'run' || prev === 'jog' || prev === 'run_start';
  // a reversal at speed (Jo's velocity flips in two ticks, so the last
  // frame's speed is what counts)
  const pvx = s.prevVx != null ? s.prevVx : s.vx;
  if (s.inputX && pvx && Math.sign(s.inputX) !== Math.sign(pvx) && Math.abs(pvx) > 150) return 'turn';
  if (!s.inputX && running && ax > 120) return 'skid';
  if (s.inputX && (prev === 'idle' || prev === 'pockets') && (next === 'walk' || next === 'jog' || next === 'run')) return 'run_start';
  return null;
}

export class AnimationController {
  constructor(manifest, opts = {}) {
    this.m = manifest;
    this.id = manifest.id;
    this.outfit = opts.outfit || (manifest.outfits && manifest.outfits[0]) || 'street';
    this.view = opts.view || 'side';
    this.scale = manifest.scale || 1;
    this.has = opts.has || ((anim) => !!(manifest.animations[anim] && manifest.animations[anim].frames > 0));
    this.warned = new Set();
    this.state = null; // the physics state
    this.name = null; // the animation actually playing
    this.oneShot = null; // { name, resolve, minFrames, forced }
    this.frame = 0;
    this.phase = 0;
    this.t = 0;
    this.done = false;
    this.idleFor = 0;
    this.lastX = null;
    this.lastY = null;
    this.events = [];
    this.onEvent = null;
    this.plantLog = null; // [] to record stride frame boundaries (dev checks)
    this.set('idle');
  }

  // the playable animation for a wanted one, following fallbacks
  pick(name) {
    let cur = name;
    const seen = new Set();
    while (cur && !this.has(cur)) {
      if (!this.warned.has(cur)) {
        this.warned.add(cur);
        if (typeof console !== 'undefined') console.warn(`[anim] ${this.id}: no "${cur}", falling back`);
      }
      seen.add(cur);
      const fb = this.m.animations[cur] && this.m.animations[cur].fallback;
      cur = fb && !seen.has(fb) ? fb : cur === 'idle' ? null : 'idle';
    }
    return cur || 'idle';
  }

  meta(name = this.name) {
    return this.m.animations[name] || { fps: 8, loop: true, frames: 1 };
  }

  set(name, { force = false } = {}) {
    const a = this.pick(name);
    if (a === this.name && !force) return a;
    this.name = a;
    this.plantSeq = (this.plantSeq || 0) + 2; // a new bout: the foot chain restarts
    this.frame = 0;
    this.phase = 0;
    this.t = 0;
    this.done = false;
    this.emit(0);
    return a;
  }

  // a verb pose that holds until it ends (or a harder state cuts it)
  playOnce(name, { minFrames = 0, hold = false } = {}) {
    if (this.oneShot && this.oneShot.resolve) this.oneShot.resolve(false);
    return new Promise((resolve) => {
      this.oneShot = { name: this.pick(name), resolve, minFrames, forced: true, hold };
      this.set(this.oneShot.name, { force: true });
    });
  }

  // a looping verb pose held until release() (trumpet, typing, sitting)
  hold(name) {
    if (this.held === name) return;
    this.held = name;
    if (this.oneShot && this.oneShot.resolve) this.oneShot.resolve(false);
    this.oneShot = null;
    this.set(name, { force: true });
  }
  release() {
    this.held = null;
  }

  endOneShot(ok = true) {
    const o = this.oneShot;
    this.oneShot = null;
    if (o && o.resolve) o.resolve(ok);
  }

  emit(frame) {
    const ev = this.meta().events && this.meta().events[frame];
    if (ev) {
      this.events.push(ev);
      if (this.onEvent) this.onEvent(ev, this.name, frame);
    }
  }

  // dt in ms; s = the snapshot (see resolveState) plus x, y (screen px),
  // facing (1/-1) and ev ({ jumped, wallJumped, landed: {hard} , hurt })
  update(dt, s) {
    this.events.length = 0;
    const ev = s.ev || {};
    const dx = this.lastX == null ? 0 : s.x - this.lastX;
    const dy = this.lastY == null ? 0 : s.y - this.lastY;
    this.lastX = s.x;
    this.lastY = s.y;
    const prevState = this.state;
    const want = resolveState(s);
    this.state = want;
    this.idleFor = want === 'idle' && !this.held ? this.idleFor + dt : 0;

    if (this.held) {
      // a held pose yields only to falling, dying or a forced one-shot
      if (s.dead) this.held = null;
      else if (!s.grounded && !s.floating && !s.climbing) this.held = null;
      else {
        if (!this.oneShot) this.set(this.held);
        this.advance(dt, dx, dy, s);
        return this.frameName();
      }
    }

    // one-shots: forced verbs (hurt, swing) and transition inserts
    const o = this.oneShot;
    if (o && this.shouldCut(o, s, ev)) this.endOneShot(false);
    if (!this.oneShot) {
      const ins = s.dead ? null : transitionInsert(prevState, want, { ...s, prevVx: this.prevVx }, ev);
      if (ins && this.has(this.pick(ins)) && this.pick(ins) !== this.name) {
        this.oneShot = { name: this.pick(ins), resolve: null, forced: false };
        this.set(this.oneShot.name, { force: true });
      } else if (want === 'idle' && this.idleFor > 6000 && this.has('idle_fidget')) {
        this.idleFor = -4000;
        this.oneShot = { name: 'idle_fidget', resolve: null, forced: false };
        this.set('idle_fidget', { force: true });
      } else {
        this.set(want);
      }
    }
    this.advance(dt, dx, dy, s);
    this.prevVx = s.vx;
    return this.frameName();
  }

  // does the world overrule a playing one-shot?
  shouldCut(o, s, ev) {
    const n = o.name;
    if (n === 'death') return !s.dead;
    if (s.dead) return true;
    if (s.crouch && s.grounded && !/crouch/.test(n)) return true; // never stand up into a ceiling
    const airborne = !s.grounded && !s.climbing && !s.floating;
    if (airborne && !AIR.has(n) && !ANYWHERE.has(n)) return true;
    if (!airborne && AIR.has(n) && !o.forced && n !== 'jump_anticipate') return true;
    if (SOFT[n] != null && s.inputX && this.frame >= SOFT[n] && n !== 'run_start') return true;
    if (n === 'run_start' && !s.inputX) return true;
    if (n === 'skid' && s.inputX && Math.abs(s.vx) > 150 && Math.sign(s.inputX) === Math.sign(s.vx)) return true;
    if (!o.forced && (ev.jumped || ev.wallJumped)) return true;
    return false;
  }

  advance(dt, dx, dy, s) {
    const m = this.meta();
    const n = m.frames || 1;
    const before = this.frame;
    if (m.mode === 'stride') {
      const dist = Math.abs(m.axis === 'y' ? dy : dx) / this.scale; // 1× px
      const p0 = this.phase;
      this.phase += dist / m.step;
      const crossed = Math.floor(this.phase) - Math.floor(p0);
      if (crossed > 0 && this.plantLog) {
        // where the body was when the frame boundary was crossed (exact)
        const k = (Math.floor(p0) + 1 - p0) / (this.phase - p0 || 1);
        const bx = s.x - dx + dx * k;
        this.plantSeq = (this.plantSeq || 0) + 1;
        this.plantLog.push({ seq: this.plantSeq, anim: this.name, frame: Math.floor(this.phase) % n, x: bx, facing: s.facing || 1 });
        if (this.plantLog.length > 400) this.plantLog.shift();
      }
      // a one-shot stride (run_start): ends when the ground is covered, or
      // after maxMs if he is not getting anywhere (pushing a wall)
      this.t += dt / 1000;
      if (!m.loop && (this.phase >= n || (m.maxMs && this.t * 1000 >= m.maxMs))) {
        this.frame = n - 1;
        if (this.done) return;
        this.done = true;
        const o = this.oneShot;
        if (o && o.name === this.name) this.endOneShot(true);
        if (m.next) this.set(m.next, { force: true });
        else if (s) this.set(resolveState(s), { force: true });
        return;
      }
      this.frame = Math.floor(this.phase) % n;
    } else {
      this.t += (dt / 1000) * m.fps;
      let f = Math.floor(this.t);
      if (f >= n) {
        if (m.loop) f %= n;
        else {
          f = n - 1;
          if (!this.done) {
            this.done = true;
            const o = this.oneShot;
            if (o && o.name === this.name && !o.hold) {
              this.endOneShot(true);
              if (m.next) this.set(m.next, { force: true });
              else if (s) this.set(resolveState(s), { force: true });
              return;
            }
            if (m.next) {
              this.set(m.next, { force: true });
              return;
            }
          }
        }
      }
      this.frame = f;
    }
    if (this.frame !== before) this.emit(this.frame);
  }

  frameName() {
    return `${this.id}/${this.outfit}/${this.view}/${this.name}/${String(this.frame).padStart(2, '0')}`;
  }
  hatFrame() {
    return `${this.frameName()}/hat`;
  }
  data() {
    const fd = this.m.frameData && this.m.frameData[this.name];
    return (fd && fd[this.frame]) || null;
  }
}
