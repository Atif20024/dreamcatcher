import Phaser from 'phaser';
import BaseLevel from './BaseLevel.js';
import { atlasFrames, atlasMeta } from '../systems/atlases.js';

// The proof for the ground-speed lock: three Jos walking on a tiled floor at
// three speeds (1x px/s), frame chosen by distance travelled. The scene
// measures each walker's planted-foot world x every frame and reports the
// largest drift while a foot is down. Open with ?scene=rigtest.
const SPEEDS = [60, 100, 140]; // walk, brisk, run-speed (1x px/s)
const T = 32;

export default class RigTestScene extends BaseLevel {
  constructor() {
    super('RigTest');
  }

  create() {
    const cam = this.cameras.main;
    this.add.rectangle(480, 270, 960, 540, 0x2a2a3e);
    this.walkFrames = atlasFrames(this, 'jo', 'walk');
    const meta = atlasMeta(this, 'jo');
    this.stride = meta.stride.walk;
    this.contacts = meta.contacts.walk;
    this.walkers = SPEEDS.map((speed, i) => {
      const y = 150 + i * 150;
      // a tiled floor: alternating tiles so motion against it is visible
      for (let tx = 0; tx < 32; tx++) {
        this.add.rectangle(tx * T + T / 2, y + T / 2, T, T, tx % 2 ? 0x8a8e9a : 0x6a6e7a).setStrokeStyle(1, 0x3a3a44);
      }
      const art = this.add.image(80, y, 'jo', this.walkFrames[0]).setOrigin(0.5, 1).setScale(2);
      const hat = this.add.image(80, y - 74, 'jo', 'hat').setOrigin(0.5, 1).setScale(2);
      this.add.text(8, y - 120, `${speed} px/s (1x)   fps = v*N/(2S) = ${((speed * this.walkFrames.length) / (2 * this.stride)).toFixed(1)}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#f2e6cc',
      });
      const readout = this.add.text(8, y - 104, '', { fontFamily: 'monospace', fontSize: '12px', color: '#7ec87e' });
      return { speed, art, hat, y, phase: 0, idx: 0, prevIdx: -1, lastFoot: null, maxDrift: 0, sumDrift: 0, readout, samples: 0 };
    });
    this.report = { maxDrift: {}, done: false };
    this.add.text(8, 8, 'ground-speed lock proof — planted-foot drift at each frame step (should be ≤ 1 px at 2x, mean ≈ 0)', { fontFamily: 'monospace', fontSize: '12px', color: '#c8c0b0' });
  }

  update(time, delta) {
    const N = this.walkFrames.length;
    const pxPerFrame = (2 * this.stride) / N;
    for (const w of this.walkers) {
      const dx1x = (w.speed * delta) / 1000;
      w.worldX = (w.worldX === undefined ? w.art.x : w.worldX) + dx1x * 2;
      w.phase = (w.phase + dx1x) % (2 * this.stride);
      const idx = Math.floor(w.phase / pxPerFrame) % N;
      // draw the sprite at the frame's phase boundary, not the body's exact
      // x: the planted foot then sits still until the next frame steps it
      const overshoot = w.phase - idx * pxPerFrame;
      w.art.x = w.worldX - overshoot * 2;
      w.idx = idx;
      w.art.setFrame(this.walkFrames[idx]);
      w.hat.setPosition(w.art.x, w.art.y - 74);
      // Where the planted foot's contact pixel is in the world (2x). The
      // sprite moves every tick and the frame only every 2S/N px, so the
      // honest test is taken when the frame STEPS: the planted foot must be
      // where it was at the previous step (sprite advanced 2.5 px, contact
      // offset moved back 2-3 px). Drift is the residual of that, and the
      // mean slide over a planted phase must be ~0.
      if (idx !== w.prevIdx) {
        const foot = w.art.x + this.contacts[idx] * 2;
        if (w.lastFoot !== null && idx !== 0 && idx !== N / 2) {
          const drift = foot - w.lastFoot;
          w.maxDrift = Math.max(w.maxDrift, Math.abs(drift));
          w.sumDrift += drift;
          w.samples++;
        }
        w.lastFoot = foot;
        w.prevIdx = idx;
      }
      w.readout.setText(`frame ${idx}  contact ${this.contacts[idx]}  step drift max ${w.maxDrift.toFixed(2)} px, mean ${(w.samples ? w.sumDrift / w.samples : 0).toFixed(2)} px  (${w.samples} steps)`);
      if (w.worldX > 1000) {
        // a new lap: the next frame step must not compare across the jump
        w.worldX = 80;
        w.lastFoot = null;
        w.prevIdx = -1;
      }
      this.report.maxDrift[w.speed] = { max: w.maxDrift, mean: w.samples ? w.sumDrift / w.samples : 0 };
    }
  }
}
