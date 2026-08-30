import { sfx } from '../systems/audio.js';

// D4 — a gate is visibly chained until its flags are true, then it opens
// with a distant clank you can hear from anywhere in the level.
export default class Gate {
  constructor(scene, def, tileTexture, tint) {
    this.scene = scene;
    this.id = def.id;
    this.requires = def.requires || [];
    this.timed = !!def.timed;
    this.state = 'chained';
    this.tiles = [];

    const T = 32;
    const px = (t) => t * T + T / 2;
    for (let r = def.ty; r < def.ty + (def.h || 5); r++) {
      const img = scene.add.image(def.wx, px(r), tileTexture((def.tx * 7 + r * 13) % 3)).setTint(tint);
      scene.physics.add.existing(img, true);
      scene.solids.add(img);
      this.tiles.push(img);
    }
    // chains across the face
    this.chains = [0, 1].map((i) =>
      scene.add.rectangle(def.wx, px(def.ty) + 26 + i * 52, 30, 5, 0x4a4a56).setDepth(21)
    );
    scene.add.rectangle(def.wx, px(def.ty) - 20, 22, 3, 0x2a2a34).setDepth(19);
    this.light = scene.add.circle(def.wx, px(def.ty) - 20, 5, 0xe83a2a).setDepth(22);
    this.bar = null;
  }

  satisfied(flags) {
    return this.requires.every((f) => flags[f]);
  }

  open() {
    if (this.state !== 'chained') return;
    this.state = 'opening';
    this.light.setFillStyle(0x50c878);
    sfx('clang'); // heard level-wide: "distant clank"
    this.chains.forEach((c) =>
      this.scene.tweens.add({ targets: c, y: c.y + 40, alpha: 0, duration: 350, onComplete: () => c.destroy() })
    );
    this.tiles.forEach((t) => {
      if (t.body) t.body.enable = false;
      this.scene.tweens.add({ targets: t, alpha: 0, duration: 400 });
    });
    this.scene.time.delayedCall(420, () => {
      this.state = 'open';
    });
  }

  // timed variant: a shrinking light bar
  openFor(ms) {
    this.open();
    if (!this.bar) this.bar = this.scene.add.rectangle(this.light.x, this.light.y - 10, 30, 4, 0xf2d580).setDepth(22);
    this.scene.tweens.add({ targets: this.bar, width: 0, duration: ms });
  }
}
