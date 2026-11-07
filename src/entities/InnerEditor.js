import Phaser from 'phaser';
import { D } from '../builders/depths.js';

// THE SECOND DRAFT §3.4 — not a person. A tall ink silhouette that walks
// behind Jo and erases what he has already crossed. Never attacks, never
// speaks, cannot be shoved. It stops at chapter gates and at any desk while
// Jo is typing. Being overtaken is "the page goes blank".
export default class InnerEditor {
  constructor(scene, { x, y, stopX, speed, waiting = false }) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.startX = x;
    this.stopX = stopX;
    this.speed = speed;
    this.active = false;
    this.waiting = waiting; // the attic: stands at the door, does not come in
    this.done = false;
    this.art = scene.add.image(x, y, 'wr-editor').setOrigin(0.5, 1).setDepth(D.FOE - 0.5).setAlpha(0.92);
    this.shadow = scene.add.image(x, y, 'wr-shadow').setOrigin(0.5, 0.5).setDepth(D.FOE - 1).setAlpha(0.8).setScale(1.4, 1);
    this.setVisible(waiting);
  }

  setVisible(v) {
    this.art.setVisible(v);
    this.shadow.setVisible(v);
  }

  start() {
    if (this.done) return;
    this.active = true;
    this.setVisible(true);
    this.art.setAlpha(0);
    this.scene.tweens.add({ targets: this.art, alpha: 0.92, duration: 1200 });
  }

  reset() {
    this.x = this.startX;
    this.art.x = this.x;
    this.active = false;
    this.setVisible(this.waiting);
  }

  // it turns and walks away (the press has printed)
  leave() {
    this.active = false;
    this.done = true;
    this.art.setFlipX(true);
    this.scene.tweens.add({ targets: this.art, x: this.x - 400, alpha: 0, duration: 4000, ease: 'sine.in', onComplete: () => this.setVisible(false) });
    this.scene.tweens.add({ targets: this.shadow, x: this.x - 400, alpha: 0, duration: 4000 });
  }

  update(time, dt, player) {
    // the ink never holds still
    this.art.setScale(1 + Math.sin(time / 300) * 0.03, 1 + Math.sin(time / 410) * 0.02);
    this.shadow.setPosition(this.x, this.y - 2);
    if (!this.active || this.done) return;
    const halted = player.typing || this.scene.puzzleActive || this.scene.dialogActive || this.scene.cardActive;
    if (!halted) {
      this.x = Math.min(this.stopX, this.x + this.speed * dt);
      this.art.x = this.x;
    }
    this.near = Math.abs(player.x - this.x) < 96;
    this.scene.eraseBehind(this.x - 24);
    if (this.x >= this.stopX) this.active = false;
    if (this.x > player.x + 6 && !player.typing) this.scene.pageGoesBlank(this);
  }
}
