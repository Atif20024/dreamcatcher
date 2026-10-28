// Npc (plan 2.5/2.6): a speaking character on the shared rig pipeline.
// Drawn from its atlas (src/art/characters/<id>/manifest.js) through an
// AnimationController, standing on its feet anchor. It idles (with a task
// loop if its manifest has one), turns to face Jo when he is near, plays
// `talk` while it is the speaker in a scene box, and offers [E] through
// Interaction. It never starts a conversation by itself.
import { AnimationController } from '../art/AnimationController.js';
import { characterManifest } from '../art/baked.js';
import { D } from '../builders/depths.js';

export class Npc {
  constructor(scene, { id, x, y, rig, outfit = 'street', facing = -1, task = null, depth = D.PLAYER - 1 }) {
    this.scene = scene;
    this.id = id;
    this.rig = rig;
    this.x = x;
    this.y = y; // the feet (floor top)
    this.facing = facing;
    this.task = task;
    const m = characterManifest(rig);
    this.ok = !!m && scene.textures.exists(rig);
    this.anim = this.ok ? new AnimationController(m, { outfit }) : null;
    this.img = this.ok ? scene.add.image(x, y, rig, this.anim.frameName()).setDepth(depth) : scene.add.rectangle(x, y - 40, 24, 80, 0x8a6a5a).setDepth(depth);
    this.hat = this.ok ? scene.add.image(x, y, rig).setDepth(depth + 0.1).setVisible(false) : null;
    this.talking = false;
    this.lookAt = null;
    this.t = 0;
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
    if (jo) {
      const dx = jo.x - this.x;
      if (Math.abs(dx) < 260) this.facing = Math.sign(dx) || this.facing;
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
