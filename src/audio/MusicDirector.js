// StemMusic (plan 2.13): the MusicDirector extended to stems for a
// framework dream. Four stems — base (a walking bass from the motif's root),
// pulse (brushes), lead (the dream's motif), danger (a low throb) — mixed by
// state, crossfaded over a beat, on the music bus (silent when music is off;
// the beat clock still runs and is emitted on the scene as 'beat').
//
//   music = { bpm: 84, root: 196, motif: [0, 4, 7, 9, 7, 4], stems: [...] }
//   states: quiet, explore, tense, setpiece, ending (room.music.state or a beat)
import { busTone, busNoise } from './AudioBus.js';
import { isMusicOff } from '../systems/audio.js';

export const STEM_MIX = {
  quiet: { base: 0.4, pulse: 0, lead: 0.25, danger: 0 },
  explore: { base: 0.8, pulse: 0.5, lead: 0.45, danger: 0 },
  tense: { base: 0.7, pulse: 0.8, lead: 0.2, danger: 0.7 },
  setpiece: { base: 1, pulse: 1, lead: 1, danger: 0 },
  ending: { base: 0.3, pulse: 0, lead: 0.8, danger: 0 },
  silent: { base: 0, pulse: 0, lead: 0, danger: 0 },
};

const semi = (root, s) => root * 2 ** (s / 12);

export class StemMusic {
  constructor(scene, def = {}) {
    this.scene = scene;
    this.def = { bpm: 84, root: 98, motif: [0, 4, 7, 9, 7, 4, 2, 0], ...def };
    this.state = 'quiet';
    this.level = { base: 0, pulse: 0, lead: 0, danger: 0 };
    this.beat = 0;
    this.timer = null;
    this.bpm = this.def.bpm;
  }

  start() {
    this.stop();
    this.timer = setInterval(() => this.tick(), 60000 / this.bpm);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  setState(s) {
    if (STEM_MIX[s]) this.state = s;
  }

  setBpm(b) {
    if (b && b !== this.bpm) {
      this.bpm = b;
      if (this.timer) this.start();
    }
  }

  tick() {
    const b = this.beat++;
    if (this.scene && this.scene.events) this.scene.events.emit('beat', b);
    if (isMusicOff()) return;
    const target = STEM_MIX[this.state] || STEM_MIX.quiet;
    for (const k of Object.keys(this.level)) this.level[k] += (target[k] - this.level[k]) * 0.5;
    const { root, motif } = this.def;
    const L = this.level;
    const walk = [0, 2, 4, 5, 7, 5, 4, 2];
    if (L.base > 0.05) busTone('music', semi(root, walk[b % 8]), 0.32, 'triangle', 0.16 * L.base);
    if (L.pulse > 0.05 && b % 2 === 1) busNoise('music', 0.08, 0.05 * L.pulse, 6500);
    if (L.lead > 0.05 && b % 2 === 0) busTone('music', semi(root * 4, motif[(b >> 1) % motif.length]), 0.55, 'sine', 0.05 * L.lead);
    if (L.danger > 0.05) busTone('music', root / 2, 0.2, 'sawtooth', 0.04 * L.danger);
  }
}
