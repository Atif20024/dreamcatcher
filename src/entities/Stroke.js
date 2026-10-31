import Phaser from 'phaser';
import { PIGMENTS } from '../systems/paint.js';

const T = 32;

// §3.3 — a stroke in the air: a ribbon of one-way tiles laid under Jo's feet
// while the brush is held and he moves, up to six tiles long. It is a
// platform while wet; then it dries and flakes away. A second pass over a wet
// tile makes it thick: permanent for the room, at double the paint. The
// Mistral drags wet tiles downwind.
export default class Stroke {
  constructor(scene, colour, { onTile } = {}) {
    this.scene = scene;
    this.colour = colour;
    this.tiles = []; // { img, body, tx, ty, thick, bornAt }
    this.keys = new Set();
    this.max = 6;
    this.done = false;
    this.bornAt = scene.time.now;
    this.wet = PIGMENTS[colour] ? PIGMENTS[colour].wet : 4000;
    this.onTile = onTile;
    this.slipUntil = scene.time.now + 500; // wet paint: slippery for half a second
  }

  get length() {
    return this.tiles.length;
  }

  // lay a tile at this world tile. Returns false when the ribbon is full.
  add(tx, ty, { thick = false } = {}) {
    const s = this.scene;
    const k = `${tx},${ty}`;
    if (this.keys.has(k)) return true;
    if (this.tiles.length >= this.max) return false;
    if (s.built.solidAt(tx, ty)) return true; // paint on a wall is just paint
    const img = s.add.image(tx * T + T / 2, ty * T - 10 + 7, `pt-stroke-${this.colour}`).setDepth(-9.5).setAlpha(0.95);
    img.setAngle((Math.random() - 0.5) * 4); // nothing is tidy
    s.physics.add.existing(img, true);
    img.body.setSize(T, 12).setOffset(0, 0);
    img.body.checkCollision.down = false;
    img.body.checkCollision.left = false;
    img.body.checkCollision.right = false;
    s.strokeGroup.add(img);
    const tile = { img, tx, ty, thick, bornAt: s.time.now, drift: 0 };
    img.strokeTile = tile;
    img.stroke = this;
    this.tiles.push(tile);
    this.keys.add(k);
    if (this.onTile) this.onTile(tile);
    return true;
  }

  // the second pass: a wet tile under a new stroke goes thick
  thicken(tile) {
    if (tile.thick) return;
    tile.thick = true;
    tile.img.setScale(1, 1.4).setAlpha(1);
    this.scene.tweens.add({ targets: tile.img, scaleY: 1.25, duration: 200, yoyo: true });
  }

  // the Mistral bends wet strokes downwind: whole px, so the body follows
  bend(wind, dt) {
    for (const t of this.tiles) {
      if (t.thick || !t.img.body) continue;
      t.drift += wind * dt * 0.35;
      const px = Math.round(t.drift);
      if (px !== 0) {
        t.img.x += px;
        t.drift -= px;
        t.img.body.updateFromGameObject();
      }
    }
  }

  update(time) {
    const age = time - this.bornAt;
    for (const t of this.tiles) {
      if (t.thick || t.gone) continue;
      const k = age / this.wet;
      if (k > 0.7) t.img.setAlpha(0.95 - (k - 0.7) * 2.5);
      if (age > this.wet) this.flake(t);
    }
    const alive = this.tiles.some((t) => !t.gone);
    if (!alive) this.done = true;
  }

  flake(t) {
    t.gone = true;
    if (t.img.body) t.img.body.enable = false;
    const s = this.scene;
    for (let i = 0; i < 4; i++) {
      const f = s.add.rectangle(t.img.x - 12 + i * 8, t.img.y, 5, 3, PIGMENTS[this.colour].hex).setDepth(-9).setAngle(Phaser.Math.Between(-40, 40));
      s.tweens.add({ targets: f, y: f.y + 40 + i * 6, alpha: 0, angle: f.angle + 90, duration: 600, ease: 'quad.in', onComplete: () => f.destroy() });
    }
    t.img.destroy();
  }

  // the room is repainted / the dream forgets: everything goes
  destroy() {
    for (const t of this.tiles) if (!t.gone) {
      t.gone = true;
      t.img.destroy();
    }
    this.done = true;
  }
}
