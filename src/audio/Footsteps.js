// Footsteps (plan 2.13, critique F5.7): the AnimationController's contact
// events ('footstep' on the planted frames) + the surface under Jo's feet
// (Terrain.surfaceAt: the room material's `surface`) → a synthesised step
// on the sfx bus. Six surfaces; anything unknown sounds like stone.
import { busTone, busNoise } from './AudioBus.js';

export const SURFACES = {
  stone: (v) => {
    busNoise('sfx', 0.05, 0.16 * v, 2600, 0, 1.4);
    busTone('sfx', 180, 0.04, 'triangle', 0.05 * v);
  },
  grass: (v) => busNoise('sfx', 0.09, 0.12 * v, 1800, 0, 0.6),
  wood: (v) => {
    busTone('sfx', 120, 0.07, 'triangle', 0.14 * v, 0, 90);
    busNoise('sfx', 0.03, 0.06 * v, 900);
  },
  tile: (v) => {
    busNoise('sfx', 0.03, 0.12 * v, 4200, 0, 2);
    busTone('sfx', 900, 0.02, 'sine', 0.03 * v);
  },
  carpet: (v) => busNoise('sfx', 0.07, 0.08 * v, 500, 0, 0.5),
  metal: (v) => {
    busTone('sfx', 660, 0.12, 'square', 0.03 * v, 0, 640);
    busNoise('sfx', 0.03, 0.08 * v, 3000);
  },
};

export class Footsteps {
  constructor({ surfaceAt }) {
    this.surfaceAt = surfaceAt;
    this.count = 0;
    this.last = null;
  }

  // feet: { x, y } world px; speed scales the volume a touch
  step(feet, speed = 200) {
    const s = this.surfaceAt(Math.floor(feet.x / 32), Math.floor((feet.y + 4) / 32)) || 'stone';
    this.count += 1;
    this.last = s;
    const v = Math.min(1, 0.55 + speed / 600);
    try {
      (SURFACES[s] || SURFACES.stone)(v);
    } catch {
      /* no audio */
    }
    return s;
  }
}
