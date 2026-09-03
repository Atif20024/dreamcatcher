import Phaser from 'phaser';
import { D } from '../builders/depths.js';

// Travelers: silhouettes with suitcases that walk IN — from the doors toward
// the platforms — and never toward Jo. Pooled; the count is the station's
// state (40 at 0 dreams, 0 at 5).
export default class Silhouettes {
  constructor(scene, { count, y, x0, x1, spawnX }) {
    this.scene = scene;
    this.y = y;
    this.x0 = x0;
    this.x1 = x1;
    this.spawnX = spawnX;
    this.list = [];
    // the count is the station's state; what is DRAWN is capped so the
    // concourse never reads as clutter -- the rest is implied by the queue
    for (let i = 0; i < Math.min(count, 14); i++) this.add(Phaser.Math.Between(x0, x1));
  }

  add(x) {
    const s = this.scene.add
      .image(x, this.y - 11, 'hub', 'hub-traveler_0')
      .setDepth(D.INTERACT - 4)
      .setAlpha(0.28)
      .setTint(Phaser.Utils.Array.GetRandom([0x2a2a34, 0x2e2630, 0x262a30]));
    s.speed = Phaser.Math.Between(26, 54);
    s.phase = Math.random() * 100;
    s.setScale(2 * (0.75 + Math.random() * 0.15));
    this.list.push(s);
  }

  setCount(n) {
    const m = Math.min(n, 14);
    while (this.list.length > m) this.list.pop().destroy();
    while (this.list.length < m) this.add(Phaser.Math.Between(this.x0, this.x1));
  }

  update(dt) {
    for (const s of this.list) {
      s.x += s.speed * dt;
      s.phase += s.speed * dt;
      s.setFrame(Math.floor(s.phase / 22) % 2 ? 'hub-traveler_1' : 'hub-traveler_0');
      if (s.x > this.x1) s.x = this.spawnX - Phaser.Math.Between(0, 200);
    }
  }
}
