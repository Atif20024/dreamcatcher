import Phaser from 'phaser';
import { gaitInfo } from '../art/stride.js';
import { D } from '../builders/depths.js';

// Travelers: painted soft silhouettes with suitcases that walk IN — from the
// doors toward the platforms — and never toward Jo. Pooled; the count is the
// station's state (40 at 0 dreams, 0 at 5). They step through the same
// eight walk frames as everyone else, by distance, so feet never slide.
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
      .image(x, this.y, 'hub-traveler')
      .setOrigin(0.5, 1)
      .setDepth(D.INTERACT - 4)
      .setAlpha(0.42)
      .setTint(Phaser.Utils.Array.GetRandom([0x8a8aa0, 0x9a8a98, 0x8a9098, 0x7a7a90]));
    s.speed = Phaser.Math.Between(26, 54);
    s.phase = Math.random() * 100;
    s.stride = 0;
    s.setScale(0.78 + Math.random() * 0.16);
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
      // a frame per step of ground, scaled with the figure (a traveller drawn
      // at 0.86 steps 0.86 as far), so the planted foot stays put; the rig's
      // own walk carries the hip bob
      const [n, stepPx] = gaitInfo('hub-traveler').walk;
      const frame = (Math.floor(s.phase / (stepPx * s.scaleX)) % n) + 1;
      if (frame !== s.stride) {
        s.stride = frame;
        s.setTexture(`hub-traveler#${frame}`).setOrigin(0.5, 1);
        s.y = this.y;
      }
      if (s.x > this.x1) s.x = this.spawnX - Phaser.Math.Between(0, 200);
    }
  }
}
