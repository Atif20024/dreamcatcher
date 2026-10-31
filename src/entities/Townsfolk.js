import Phaser from 'phaser';
import { laughSfx } from '../systems/audio.js';
import { uiText } from '../ui/text.js';
import { barkMs, claimBark, onCamera } from '../ui/barks.js';
import { castFrame } from '../art/baked.js';
import { Stride } from '../art/stride.js';
import { redrawProp } from '../art/propKit.js';

// A person in the long evening. Not physics: they walk the ground by
// querying the scene's surface (scene.groundY), step their legs by distance
// travelled (feet never slide), laugh with their whole head, talk in speech
// bubbles, and cast a long shadow east because the sun is low in the west.
const DEPTH = 11;

export default class Townsfolk {
  constructor(scene, id, def, x, y, { key = `ev-p-${id}`, sit = false, still = false, flip = false } = {}) {
    this.scene = scene;
    this.id = id;
    this.def = def;
    this.key = key;
    this.kid = !!(def.look && def.look.kid);
    // the rigged cast are baked at their real height (a kid is 1.25 m, ~56 px):
    // no runtime shrinking (round 2 WP2, src/art/rig/cast.js)
    this.scale = 1;
    // phase 2 motion: the legs play from the ground actually covered, in this
    // person's gait (a kid bounces on six frames, the old stroll on short
    // steps); standing, they work through a task loop (src/art/stride.js)
    this.gait = new Stride(scene, key);
    this.walkKey = null;
    this.voice = def.voice || 1;
    this.home = { x, y };
    this.x = x;
    this.y = scene.groundY(x, y - 40);
    this.shadow = scene.add.image(x, this.y, 'ev-shadow').setOrigin(0.05, 0.5).setDepth(DEPTH - 2).setAlpha(0.3).setTint(0x2a3050);
    this.rim = scene.add.image(x, this.y, key).setOrigin(0.5, 1).setDepth(DEPTH - 0.5).setScale(this.scale).setTintFill(0xffd890).setAlpha(0.55);
    this.art = scene.add.image(x, this.y, key).setOrigin(0.5, 1).setDepth(DEPTH).setScale(this.scale).setFlipX(flip);
    this.state = sit ? 'sit' : 'idle';
    this.still = still;
    this.target = null;
    this.onArrive = null;
    this.lastX = x;
    this.free = false; // hands empty (put their thing down)
    this.bubble = null;
    this.bubbleUntil = 0;
    this.laughUntil = 0;
    this.busy = null; // an activity has them
    this.talking = null; // a conversation has them
    this.inside = false;
    this.speed = this.kid ? 70 : 55;
    this.visible = true;
    this.carrying = null; // a thing they picked up (kindness memory)
    this.idleT = Math.random() * 4000;
    this.lastLineAt = -99999;
    this.bob = Math.random() * 6;
    this.hop = 0; // a skip, a stamp in a puddle: lifts the drawing, not the feet
    this.tall = this.art.height || 76;
    this.seat = null;
    if (sit) this.placeSeat();
    this.frameKey();
  }

  get tex() {
    const free = this.free ? '-free' : '';
    const laughing = this.scene.time.now < this.laughUntil;
    if (this.state === 'sit') return laughing ? `${this.key}-sitlaugh` : `${this.key}-sit`;
    if (laughing) return `${this.key}-laugh`;
    // talking: the gesture loop while their line is up
    if (this.bubble && this.state !== 'walk' && !this.free) {
      const k = `${this.key}-talk#${(Math.floor(this.scene.time.now / 160) % 4) + 1}`;
      if (castFrame(this.scene, k)) return k;
    }
    if (this.walkKey) return this.walkKey;
    // standing about: the task loop (sweeping, reading, wiping…)
    if (this.state === 'idle' && !this.free && !this.still && !this.busy) return this.gait.idle(this.scene.time.now + this.idleT);
    return free ? `${this.key}-free` : this.key;
  }

  frameKey() {
    const k = this.tex;
    if (this.art.texture.key !== k && this.scene.textures.exists(k)) {
      this.art.setTexture(k);
      this.rim.setTexture(k);
    }
  }

  // ---- verbs ------------------------------------------------------------------

  walkTo(x, onArrive = null, speed = null) {
    if (this.inside) return;
    this.target = x;
    this.onArrive = onArrive;
    this.state = 'walk';
    if (speed) this.walkSpeed = speed;
    else this.walkSpeed = this.speed;
  }

  // a person sitting at Jo's scale needs something under them: a chair,
  // unless they are on a bench or the low wall
  placeSeat() {
    const s = this.scene;
    const near = (p) => p && Math.abs(p.x - this.x) < 34;
    if (this.seat || (s.world && ((s.world.benches || []).some(near) || near(s.world.marks && s.world.marks.wall_seat)))) return;
    redrawProp(s, 'ev-chair', 0, 0);
    this.seat = s.add.image(this.x - (this.art.flipX ? -4 : 4), this.y, 'ev-chair').setOrigin(0.5, 1).setDepth(DEPTH - 0.6).setFlipX(this.art.flipX);
  }

  sitDown() {
    this.target = null;
    this.state = 'sit';
    this.placeSeat();
    this.frameKey();
  }

  stand() {
    if (this.state === 'sit') this.state = 'idle';
    if (this.seat) this.seat.destroy();
    this.seat = null;
    this.frameKey();
  }

  look(x) {
    if (Math.abs(x - this.x) > 4) this.art.setFlipX(x < this.x);
  }

  laugh(loud = true) {
    this.laughUntil = this.scene.time.now + 1000;
    // head back, shoulders up: a bob, not a word
    this.scene.tweens.add({ targets: this.art, angle: this.art.flipX ? 4 : -4, duration: 110, yoyo: true, repeat: 3 });
    if (loud && this.scene.canHear && this.scene.canHear(this.x, 14)) laughSfx(this.voice);
    this.frameKey();
  }

  say(text, ms = null, { slow = 1 } = {}) {
    if (!this.visible || this.inside) return 0;
    if (this.def.silent) {
      // Ray: a smile, that's the whole bit
      text = '(smiles)';
    }
    if (text === '~') {
      this.laugh();
      return 900;
    }
    const plain = text.replace(/\*/g, '');
    const dur = (ms || barkMs(plain)) * slow;
    const s = this.scene;
    if (this.bubble) this.bubble.destroy();
    this.bubble = null;
    this.bubbleUntil = s.time.now + dur;
    this.lastLineAt = s.time.now;
    // §8: an off-screen line is not drawn, and nothing talks over the ending
    const by = this.y - this.tall - 6;
    if (!onCamera(s, this.x, by) || s.quietBarks) return dur;
    // body type in sentence case on the §8 plate, one bubble in reach at a time
    this.bubble = uiText(s, this.x, by, plain, { size: 'body', color: '#f2e9d8', align: 'center', wordWrap: { width: 230 } })
      .setOrigin(0.5, 1)
      .setDepth(62);
    claimBark(s, this.bubble);
    this.bubbleUntil = s.time.now + dur;
    this.lastLineAt = s.time.now;
    return dur;
  }

  hide() {
    this.visible = false;
    this.inside = true;
    [this.art, this.rim, this.shadow, this.seat].forEach((o) => o && o.setVisible(false));
    if (this.bubble) this.bubble.setVisible(false);
  }

  show() {
    this.visible = true;
    this.inside = false;
    [this.art, this.rim, this.shadow, this.seat].forEach((o) => o && o.setVisible(true));
  }

  teleport(x) {
    this.x = x;
    this.lastX = x;
    this.y = this.scene.groundY(x, this.y - 40);
    this.target = null;
  }

  // ---- per frame --------------------------------------------------------------

  update(time, delta, light) {
    if (!this.visible) return;
    const dt = delta / 1000;
    if (this.state === 'walk' && this.target !== null) {
      const dx = this.target - this.x;
      const step = Math.sign(dx) * Math.min(Math.abs(dx), this.walkSpeed * dt);
      this.x += step;
      this.art.setFlipX(dx < 0);
      this.y = this.scene.groundY(this.x, this.y - 40);
      if (Math.abs(dx) < 1.5) {
        this.state = 'idle';
        const cb = this.onArrive;
        this.onArrive = null;
        if (cb) cb();
        // the callback may have destroyed them (the wedding party walks off
        // the edge of the square): a destroyed Image has no scene to setTexture
        if (!this.art.active) return;
      }
    }
    // legs from the ground covered this frame, however it was covered (a
    // walkTo, a hand held, an activity sliding them along): never a slide
    // (on a bike she rolls: no steps)
    const riding = !!(this.busy && this.busy.bike);
    const moved = this.state === 'sit' || riding ? 0 : this.x - this.lastX;
    this.lastX = this.x;
    this.gait.free = this.free;
    this.walkKey = this.gait.next(moved, delta);
    if (this.walkKey && !this.scene.textures.exists(this.walkKey) && !castFrame(this.scene, this.walkKey)) this.walkKey = null;
    this.frameKey();
    // breathing: a one-pixel rise and fall, sitting or standing
    const breath = this.still ? 0 : Math.sin(time / 900 + this.bob) * 0.6;
    // the hips drop on recoil and rise on high, like Jo's
    const hips = 0; // the rig's walk carries its own hip bob
    this.art.setPosition(this.x, this.y + breath - this.hop + hips);
    this.rim.setPosition(this.x - 1.5, this.y + breath - this.hop + hips).setFlipX(this.art.flipX).setAngle(this.art.angle);
    this.shadow.setPosition(this.x - 4, this.y - 1);
    if (light) {
      this.art.setTint(light.ambient);
      this.rim.setTintFill(light.rim).setAlpha(light.rimAlpha);
      this.shadow.setTint(light.shadow).setAlpha(light.shadowAlpha).setScale(light.shadowLen * (this.tall / 76), 1);
    }
    if (this.bubble) {
      this.bubble.setPosition(this.x, this.y - this.tall - 6 - (this.state === 'sit' ? -14 : 0));
      if (time > this.bubbleUntil) {
        const b = this.bubble;
        this.bubble = null;
        this.scene.tweens.add({ targets: b, alpha: 0, duration: 250, onComplete: () => b.destroy() });
      }
    }
    if (this.carrying) this.carrying.setPosition(this.x + (this.art.flipX ? -10 : 10), this.y - this.tall * 0.42);
  }

  destroy() {
    [this.art, this.rim, this.shadow, this.bubble, this.carrying, this.seat].forEach((o) => o && o.destroy());
  }
}

export const clampX = (x, a, b) => Phaser.Math.Clamp(x, a, b);
