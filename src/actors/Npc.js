// Npc (plan 2.5/2.6): a speaking character on the shared rig pipeline.
// Drawn from its atlas (src/art/characters/<id>/manifest.js) through an
// AnimationController, standing on its feet anchor. It idles (with a task
// loop if its manifest has one), turns to face Jo when he is near, plays
// `talk` while it is the speaker in a scene box, and offers [E] through
// Interaction. It never starts a conversation by itself.
import { AnimationController } from '../art/AnimationController.js';
import { characterManifest, castFrame } from '../art/baked.js';
import { gaitInfo } from '../art/stride.js';
import { D } from '../builders/depths.js';

// A cast person (round 2 WP2: the rigged cast baked into the people packs,
// 'npc-delphine', 'foe-roadie', 'ev-p-baker' …) instead of a manifest rig:
// { cast: 'npc-delphine' } plays the person's idle loop standing, the talk
// loop while speaking, and `-sit` / `-sitlaugh` when seated (pose: 'sit').
class CastBody {
  constructor(scene, key, x, y, depth, pose) {
    this.scene = scene;
    this.key = key;
    this.pose = pose;
    const base = pose === 'sit' && castFrame(scene, `${key}-sit`) ? `${key}-sit` : castFrame(scene, key) ? key : null;
    this.ok = !!base;
    this.img = base ? scene.add.image(x, y, base).setDepth(depth) : scene.add.rectangle(x, y - 40, 24, 80, 0x8a6a5a).setDepth(depth);
    this.g = gaitInfo(key);
    this.talkN = 0;
    while (this.talkN < 8 && castFrame(scene, `${key}-talk#${this.talkN + 1}`)) this.talkN += 1;
  }

  frame(time, talking, laughing) {
    const k = this.key;
    if (this.pose === 'sit') return laughing && castFrame(this.scene, `${k}-sitlaugh`) ? `${k}-sitlaugh` : `${k}-sit`;
    if (talking && this.talkN) return `${k}-talk#${(Math.floor(time / 140) % this.talkN) + 1}`;
    const [n, fps] = this.g.idle || [1, 5];
    if (n > 1) {
      const f = `${k}-idle#${(Math.floor((time / 1000) * fps) % n) + 1}`;
      if (castFrame(this.scene, f)) return f;
    }
    return k;
  }
}

export class Npc {
  constructor(scene, { id, x, y, rig, cast = null, pose = null, outfit = 'street', facing = -1, task = null, depth = D.PLAYER - 1, turns = true }) {
    this.scene = scene;
    this.id = id;
    this.rig = rig || cast;
    this.x = x;
    this.y = y; // the feet (floor top)
    this.facing = facing;
    this.task = task;
    this.turns = turns && pose !== 'sit';
    if (cast) {
      this.body = new CastBody(scene, cast, x, y, depth, pose);
      this.ok = this.body.ok;
      this.anim = null;
      this.img = this.body.img;
      this.hat = null;
      this.talking = false;
      this.t = 0;
      return;
    }
    const m = characterManifest(rig);
    this.ok = !!m && scene.textures.exists(rig);
    this.anim = this.ok ? new AnimationController(m, { outfit }) : null;
    this.img = this.ok ? scene.add.image(x, y, rig, this.anim.frameName()).setDepth(depth) : scene.add.rectangle(x, y - 40, 24, 80, 0x8a6a5a).setDepth(depth);
    this.hat = this.ok ? scene.add.image(x, y, rig).setDepth(depth + 0.1).setVisible(false) : null;
    this.talking = false;
    this.lookAt = null;
    this.t = 0;
  }

  // a seated cast person laughs (or a standing one talks) for a moment
  laugh(ms = 1200) {
    this.laughUntil = this.scene.time.now + ms;
  }

  // the conversation's speaker changed
  setTalking(on) {
    this.talking = on;
    if (!this.anim) return;
    if (on && this.anim.m.animations.talk) this.anim.hold('talk');
    else this.anim.release();
  }

  update(dt, jo) {
    this.t += dt;
    if (jo && this.turns) {
      const dx = jo.x - this.x;
      if (Math.abs(dx) < 260) this.facing = Math.sign(dx) || this.facing;
    }
    if (this.body) {
      const f = this.body.frame(this.scene.time.now, this.talking, this.scene.time.now < (this.laughUntil || 0));
      if (this.body.ok && this.img.texture.key !== f && castFrame(this.scene, f)) this.img.setTexture(f);
      this.img.setPosition(this.x, this.y).setFlipX(this.facing < 0);
      return;
    }
    if (!this.anim) return;
    // the task loop between glances: every few seconds a one-shot
    if (this.task && !this.talking && this.t > 4500) {
      this.t = 0;
      this.anim.playOnce(this.task);
    }
    this.anim.update(dt, { x: this.x, y: this.y, facing: this.facing, grounded: true, vx: 0, vy: 0, inputX: 0, ev: {} });
    const f = this.anim.frameName();
    this.img.setFrame(f).setPosition(this.x, this.y).setFlipX(this.facing < 0);
    const hf = this.anim.hatFrame();
    const tex = this.scene.textures.get(this.rig);
    if (this.hat && tex.has(hf)) this.hat.setFrame(hf).setPosition(this.x, this.y).setFlipX(this.facing < 0).setVisible(true);
    else if (this.hat) this.hat.setVisible(false);
  }

  destroy() {
    this.img.destroy();
    if (this.hat) this.hat.destroy();
  }
}

export default Npc;
