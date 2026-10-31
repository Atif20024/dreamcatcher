// Stingers (plan 2.13): short musical answers to the EventBus — a flag
// saved, a gate opening, a goal changing, an encounter won, the dream
// caught. They play on the sfx bus (heard with music off: they are feedback).
import { busTone, busNoise, buses } from './AudioBus.js';
import { chime } from '../systems/audio.js';

// round 2 WP6 (§9 "Sound"): a lamp lighting plays the station chime in the
// place's own voice (systems/audio.js `chime`, through the one master)
let chimePlace = 'hub';
export const STINGS = {
  'checkpoint:lit': (p) => (p && p.silent ? null : chime('lamp', chimePlace)),
  'gate:open': () => {
    busTone('sfx', 150, 0.5, 'square', 0.1);
    busNoise('sfx', 0.35, 0.15, 400);
    [392, 523].forEach((f, i) => busTone('sfx', f, 0.4, 'triangle', 0.08, 0.3 + i * 0.1));
  },
  'objective:changed': () => busTone('sfx', 880, 0.25, 'sine', 0.06),
  'encounter:end': (p) => (p && p.result && p.result.ok ? [523, 659, 784].forEach((f, i) => busTone('sfx', f, 0.3, 'triangle', 0.1, i * 0.09)) : null),
  'dream:complete': () => [659, 784, 988, 1319].forEach((f, i) => busTone('sfx', f, 0.8, 'sine', 0.12, i * 0.14)),
};

export class Stingers {
  constructor(bus, { place = 'hub' } = {}) {
    chimePlace = place;
    this.offs = Object.entries(STINGS).map(([ev, fn]) =>
      bus.on(ev, (p) => {
        try {
          // a stinger ducks the music (-6 dB, back over 800 ms)
          if (ev === 'gate:open' || ev === 'dream:complete' || ev === 'encounter:end') buses.duckSting();
          fn(p);
        } catch {
          /* no audio */
        }
      })
    );
  }

  destroy() {
    this.offs.forEach((off) => off());
    this.offs = [];
  }
}
