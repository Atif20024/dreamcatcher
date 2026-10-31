// Stride (phase 2 motion): a rigged person's legs are played from how far
// they actually moved, never from the clock. The gait table comes from the
// atlas bake (index.json `gaits`, see src/art/rig/gaits.js): per person the
// walk [frames, screen px a frame], the run (if any) and the speed where the
// walk gives way to it, and the idle loop. The planted foot moves exactly one
// step a frame in the art, so advancing one frame per step of ground covered
// means no foot ever slides — at any speed, under a tween, a velocity or a
// scripted `x +=`.
//
//   const s = new Stride(scene, 'pt-p-paul');
//   img.setTexture(s.next(dx, dtMs) || s.idle(time));
//
//   attachStride(scene, img, 'npc-nia')   // the easy way: watches img.x
import { atlasIndex, castFrame } from './baked.js';

const FALLBACK = { walk: [8, 6], run: null, runAbove: 95, idle: [1, 5] };

// the gait for a texture key (a variant 'foe-x~b' plays like 'foe-x')
export function gaitInfo(key) {
  const idx = atlasIndex();
  const g = idx && idx.gaits;
  return (g && (g[key] || g[String(key).replace(/~b$/, '')])) || FALLBACK;
}

export class Stride {
  constructor(scene, key, { free = false } = {}) {
    this.scene = scene;
    this.key = key;
    this.g = gaitInfo(key);
    this.phase = 0;
    this.v = 0; // smoothed speed, px/s
    this.running = false;
    this.free = free; // hands empty: the '-free#n' walk
    this.moving = false;
  }

  // dx: screen px moved this frame; dt: ms. A walk/run frame key while
  // moving, or null when standing (the caller picks the standing frame).
  next(dx, dt = 16.7, facing = 0) {
    const ax = Math.abs(dx);
    const inst = dt > 0 ? (ax * 1000) / dt : 0;
    this.v += (inst - this.v) * 0.35;
    if (ax < 0.02) {
      this.moving = false;
      this.phase = 0;
      if (this.v < 5) this.running = false;
      return null;
    }
    this.moving = true;
    const g = this.g;
    // hysteresis so a figure near the line doesn't flicker between gaits
    if (g.run && !this.free) {
      if (!this.running && this.v > g.runAbove + 8) this.running = true;
      else if (this.running && this.v < g.runAbove - 8) this.running = false;
    } else this.running = false;
    const [n, px] = this.running ? g.run : g.walk;
    // backing away (moving against the way he faces): the cycle runs backwards,
    // so the planted foot still sticks to the floor
    const back = facing && Math.sign(dx) !== facing;
    this.phase += (back ? -ax : ax) / px;
    const f = ((((Math.floor(this.phase) % n) + n) % n) + 1);
    if (this.running) return `${this.key}-run#${f}`;
    return this.free ? `${this.key}-free#${f}` : `${this.key}#${f}`;
  }

  // the standing frame: the idle loop (a task, a signature) or the base key
  idle(time) {
    const [n, fps] = this.g.idle || [1, 5];
    if (n > 1 && !this.free) {
      const k = `${this.key}-idle#${(Math.floor((time / 1000) * fps) % n) + 1}`;
      if (castFrame(this.scene, k)) return k;
    }
    return this.free ? `${this.key}-free` : this.key;
  }
}

// Watch an image's x and play its legs from it. Standing still it shows the
// idle loop (opts.idle = 'loop'), its base frame ('base'), or leaves the
// texture alone ('keep': a scene that sets talk/sit frames itself). Any
// texture the scene sets while it stands is respected until it moves again.
export function attachStride(scene, img, key, opts = {}) {
  if (!img || !castFrame(scene, `${key}#1`)) return null;
  const s = new Stride(scene, key, opts);
  const idleMode = opts.idle || 'loop';
  let lastX = img.x;
  let owned = null; // the texture key this helper set last
  const set = (k) => {
    if (!k || img.texture.key === k || !castFrame(scene, k)) return;
    img.setTexture(k);
    owned = k;
  };
  const tick = () => {
    if (!img.active || !img.scene) return detach();
    if (s.paused) {
      lastX = img.x;
      return;
    }
    const dx = img.x - lastX;
    lastX = img.x;
    const k = s.next(dx, scene.game.loop.delta || 16.7, opts.face === false ? (img.flipX ? -1 : 1) : 0);
    if (k) {
      s.wasMoving = true;
      // walking forwards: the art faces right, flipX faces left
      if (opts.face !== false && Math.abs(dx) > 0.3 && img.setFlipX) img.setFlipX(dx < 0);
      return set(k);
    }
    // standing: only touch frames this helper owns (or the base frame)
    const mine = owned === null ? img.texture.key === key : img.texture.key === owned;
    if (!mine) return;
    if (idleMode === 'loop') set(s.idle(scene.time.now));
    else if (idleMode === 'base') set(s.free ? `${key}-free` : key);
    else if (s.wasMoving) set(key);
    s.wasMoving = false;
  };
  const detach = () => {
    scene.events.off('postupdate', tick);
    return null;
  };
  scene.events.on('postupdate', tick);
  scene.events.once('shutdown', detach);
  s.detach = detach;
  return s;
}
