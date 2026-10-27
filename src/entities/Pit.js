import { D } from '../builders/depths.js';
import { frameKeys } from '../utils/pixelart.js';

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
    this.phase = 0;
    this.art = scene.add.image(x, y, 'foe-pit').setOrigin(0.5, 1).setDepth(D.FOE - 0.5).setVisible(false);
    this.shadow = scene.add.image(x, y - 1, 'gm-shadow').setDepth(D.FOE - 1).setAlpha(0.8).setVisible(false);
    this.label = scene.add.text(x, y - 60, 'THE PIT', { fontFamily: 'monospace', fontSize: '9px', color: '#c8c0b0' }).setOrigin(0.5).setDepth(D.FOE).setVisible(false);
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
      this.phase += Math.abs(step);
      this.art.setFlipX(dx < 0);
      const f = Math.floor(this.phase / 22) % this.frames.length;
      this.art.setTexture(this.frames[f] || this.frames[0]);
    } else this.art.setTexture(this.frames[0]);
    // he keeps Jo's level: stairs are nothing to him
    this.y += (player.y + 22 - this.y) * 0.06;
    this.art.setPosition(this.x, this.y);
    this.shadow.setPosition(this.x, this.y - 1);
    this.label.setPosition(this.x, this.y - 62 + Math.sin(time / 500) * 2);
    this.near = Math.abs(dx) < 90;
    if (this.onReach) this.onReach(this.x, this.y);
  }
}
