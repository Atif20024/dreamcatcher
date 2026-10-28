import { D } from '../builders/depths.js';
import { frameKeys } from '../utils/pixelart.js';
import { castFrame } from '../art/baked.js';
import { Stride } from '../art/stride.js';
import { uiText } from '../ui/text.js';

// THE LAST HAND §2 — The Pit. A pit boss who follows Jo at half his speed
// once Jo is "up" more than ten chips. Never grabs, never speaks; every
// table he arrives at closes. The Inner Editor's follow logic, in a suit.
export default class Pit {
  constructor(scene, { x, y, speed, onReach }) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.startX = x;
    this.speed = speed;
    this.onReach = onReach;
    this.active = false;
    this.frames = frameKeys(scene, 'foe-pit', 3);
    this.gait = castFrame(scene, 'foe-pit#1') ? new Stride(scene, 'foe-pit') : null;
    this.art = scene.add.image(x, y, 'foe-pit').setOrigin(0.5, 1).setDepth(D.FOE - 0.5).setVisible(false);
    this.shadow = scene.add.image(x, y - 1, 'gm-shadow').setDepth(D.FOE - 1).setAlpha(0.8).setVisible(false);
    this.label = uiText(scene, x, y - 60, 'THE PIT', { fontSize: '9px', color: '#c8c0b0' }).setOrigin(0.5).setDepth(D.FOE).setVisible(false);
  }

  start(fromX, y) {
    if (this.active) return;
    this.active = true;
    this.x = fromX;
    this.y = y;
    this.art.setPosition(this.x, this.y).setVisible(true).setAlpha(0);
    this.shadow.setVisible(true);
    this.label.setVisible(true);
    this.scene.tweens.add({ targets: this.art, alpha: 1, duration: 900 });
  }

  stop() {
    this.active = false;
    this.art.setVisible(false);
    this.shadow.setVisible(false);
    this.label.setVisible(false);
  }

  update(time, dt, player) {
    if (!this.active) return;
    const halted = this.scene.puzzleActive || this.scene.dialogActive || this.scene.cardActive;
    const dx = player.x - this.x;
    if (!halted && Math.abs(dx) > 40) {
      const step = Math.sign(dx) * this.speed * dt;
      this.x += step;
      this.art.setFlipX(dx < 0);
      // phase 2 motion: his legs follow the ground he covers (a jog at this
      // speed), never a three-frame shuffle
      const k = this.gait ? this.gait.next(step, dt * 1000) : null;
      this.art.setTexture(k && castFrame(this.scene, k) ? k : this.frames[0]);
    } else {
      if (this.gait) this.gait.next(0, dt * 1000);
      this.art.setTexture(this.gait ? this.gait.idle(time) : this.frames[0]);
    }
    // he keeps Jo's level: stairs are nothing to him
    this.y += (player.y + 22 - this.y) * 0.06;
    this.art.setPosition(this.x, this.y);
    this.shadow.setPosition(this.x, this.y - 1);
    this.label.setPosition(this.x, this.y - 62 + Math.sin(time / 500) * 2);
    this.near = Math.abs(dx) < 90;
    if (this.onReach) this.onReach(this.x, this.y);
  }
}
