import Phaser from 'phaser';
import { sfx } from '../systems/audio.js';

// D4 — six interactable subclasses sharing glint / nearBrighten / promptIcon
// so the player can always tell what is usable.
export class Interactable {
  constructor(scene, def, texture) {
    this.scene = scene;
    this.def = def;
    this.id = def.id;
    this.x = def.wx;
    this.y = def.wy;
    this.radius = def.radius || 46;
    this.used = false;
    this.enabled = () => true;

    this.sprite = texture ? scene.add.image(this.x, this.y, texture).setDepth(8) : null;
    this.glintTimer = scene.time.addEvent({ delay: 3000, loop: true, callback: () => this.glint() });
  }

  // 2-frame sparkle every 3s
  glint() {
    if (this.used || !this.enabled()) return;
    const s = this.scene.add.rectangle(this.x + 10, this.y - 14, 3, 3, 0xffffff, 0.9).setDepth(20);
    this.scene.tweens.add({
      targets: s,
      scale: 2.4,
      alpha: 0,
      duration: 380,
      onComplete: () => s.destroy(),
    });
  }

  nearBrighten(near) {
    if (this.sprite) this.sprite.setTint(near ? 0xffffff : 0xd8d8e0);
  }

  destroy() {
    this.glintTimer.remove();
    if (this.sprite) this.sprite.destroy();
  }
}

export class Lever extends Interactable {}
export class Valve extends Interactable {}
export class Pull extends Interactable {}
export class Carryable extends Interactable {}

export class Plate extends Interactable {
  constructor(scene, def, texture) {
    super(scene, def, texture);
    this.needs = def.needs || 1;
    this.on = false;
    this.bar = scene.add.rectangle(this.x, this.y + 14, 44, 6, 0x8a6844).setDepth(6);
  }

  setPressed(count) {
    const on = count >= this.needs;
    if (on !== this.on) {
      this.on = on;
      this.bar.setFillStyle(on ? 0x50c878 : 0x8a6844);
      this.bar.y = this.y + (on ? 17 : 14);
      sfx('click');
    }
    return on;
  }
}

// D4 — a Panel opens a puzzle-box and shows a red/amber/green pulse.
export class Panel extends Interactable {
  constructor(scene, def, texture) {
    super(scene, def, texture);
    this.light = scene.add.circle(this.x, this.y - 26, 5, 0xe83a2a).setDepth(20);
    this.state = 'locked';
    scene.tweens.add({ targets: this.light, alpha: 0.35, duration: 800, yoyo: true, repeat: -1 });
  }

  setState(s) {
    this.state = s;
    this.light.setFillStyle(s === 'solved' ? 0x50c878 : s === 'ready' ? 0xf2c078 : 0xe83a2a);
  }
}
