// StemMusic (plan 2.13): the MusicDirector extended to stems for a
// framework dream. Four stems — base (a walking bass from the motif's root),
// pulse (brushes), lead (the dream's motif), danger (a low throb) — mixed by
// state, crossfaded over a beat, on the music bus (silent when music is off;
// the beat clock still runs and is emitted on the scene as 'beat').
//
//   music = { bpm: 84, root: 196, motif: [0, 4, 7, 9, 7, 4], stems: [...] }
//   states: quiet, explore, tense, setpiece, ending (room.music.state or a beat)
//
// Voices and keys (THE MASTER'S LADDER, for any dream): `voices` gives each
// stem an instrument from VOICES (lute, recorder, shawm, organ, organ_flute,
// glass, frame_drum, drone, lute_pulse); `mode` walks the bass in a church
// mode; `meter` 6 gives a 6/8 lilt. `keys` are named settings a room picks
// with room.music.key (bpm, root, motif, mode, voices, meter), so the music
// follows the place: inside, outside, the hall, the chapel. Without voices
// the stems play exactly as before.
import { busTone, busNoise, busSynth } from './AudioBus.js';
import { isMusicOff } from '../systems/audio.js';

export const STEM_MIX = {
  quiet: { base: 0.4, pulse: 0, lead: 0.25, danger: 0 },
  explore: { base: 0.8, pulse: 0.5, lead: 0.45, danger: 0 },
  tense: { base: 0.7, pulse: 0.8, lead: 0.2, danger: 0.7 },
  setpiece: { base: 1, pulse: 1, lead: 1, danger: 0 },
  ending: { base: 0.3, pulse: 0, lead: 0.8, danger: 0 },
  silent: { base: 0, pulse: 0, lead: 0, danger: 0 },
};

export const MODES = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
};
// a degree of a mode → semitones (degrees past 7 climb an octave)
export function degree(mode, d) {
  const m = MODES[mode] || MODES.ionian;
  const o = Math.floor(d / 7);
  return m[((d % 7) + 7) % 7] + 12 * o;
}

const semi = (root, s) => root * 2 ** (s / 12);

// the instruments, as synth recipes (beat = ms per beat). Plucked, blown,
// bowed-free: lute, recorder, shawm, a portative organ, a frame drum.
export const VOICES = {
  // plucked: a triangle with a fast decay, darkened, and a quiet octave buzz
  lute: (f, beat, vol) => {
    busSynth('music', { freq: f, type: 'triangle', dur: 0.7, vol, filter: { type: 'lowpass', f: 2000 } });
    busSynth('music', { freq: f * 2, type: 'sawtooth', dur: 0.3, vol: vol * 0.12, filter: { type: 'lowpass', f: 1800 } });
  },
  lute_pulse: (f, beat, vol) => VOICES.lute(f, beat, vol * 0.6),
  // breathy and soft: a sine with a gentle attack, vibrato, a puff of air
  recorder: (f, beat, vol) => {
    busSynth('music', { freq: f, type: 'sine', attack: 0.05, hold: (beat / 1000) * 0.7, dur: 0.25, vol, vib: f * 0.006, vibHz: 5 });
    busNoise('music', 0.06, vol * 0.12, 2600, 0, 1.5);
  },
  // the square's reed: a saw through a nasal band
  shawm: (f, beat, vol) => busSynth('music', { freq: f, type: 'sawtooth', attack: 0.02, hold: (beat / 1000) * 0.6, dur: 0.2, vol: vol * 0.8, filter: { type: 'bandpass', f: 1200, q: 2.5 } }),
  // a portative organ: drawbar sines, held
  organ: (f, beat, vol) => [1, 2, 3].forEach((m, i) => busSynth('music', { freq: f * m, attack: 0.06, hold: (beat / 1000) * 1.6, dur: 0.4, vol: vol * [1, 0.5, 0.25][i] })),
  organ_flute: (f, beat, vol) => [1, 2].forEach((m, i) => busSynth('music', { freq: f * m, attack: 0.08, hold: (beat / 1000) * 0.9, dur: 0.35, vol: vol * [1, 0.35][i] })),
  // glassy partials (the colour-seller's jars)
  glass: (f, beat, vol) => [1, 2.76].forEach((m, i) => busSynth('music', { freq: f * m, dur: 1.6, vol: vol * [0.6, 0.25][i] })),
  // a frame drum: a muffled skin and a low thump
  frame_drum: (f, beat, vol) => {
    busNoise('music', 0.12, vol * 0.5, 180, 0, 0.7);
    busSynth('music', { freq: 88, dur: 0.16, vol: vol * 0.6 });
  },
  // an open fifth held under a bar
  drone: (f, beat, vol, bar) => [1, 1.5].forEach((m) => busSynth('music', { freq: f * m, attack: 0.4, hold: (bar / 1000) * 0.85, dur: 0.6, vol: vol * 0.5 })),
};

export class StemMusic {
  constructor(scene, def = {}) {
    this.scene = scene;
    this.def = { bpm: 84, root: 98, motif: [0, 4, 7, 9, 7, 4, 2, 0], ...def };
    this.cur = this.def;
    this.key = null;
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

  // a named setting from def.keys (room.music.key): the place's music
  setKey(name) {
    const k = (this.def.keys || {})[name];
    if (!k || name === this.key) return false;
    this.key = name;
    this.cur = { ...this.def, ...k, voices: { ...(this.def.voices || {}), ...(k.voices || {}) } };
    if (k.bpm) this.setBpm(k.bpm);
    return true;
  }

  tick() {
    const b = this.beat++;
    if (this.scene && this.scene.events) this.scene.events.emit('beat', b);
    if (isMusicOff()) return;
    const target = STEM_MIX[this.state] || STEM_MIX.quiet;
    for (const k of Object.keys(this.level)) this.level[k] += (target[k] - this.level[k]) * 0.5;
    const c = this.cur;
    const L = this.level;
    if (c.voices) return this.tickVoices(b, c, L);
    const { root, motif } = c;
    const walk = [0, 2, 4, 5, 7, 5, 4, 2];
    if (L.base > 0.05) busTone('music', semi(root, walk[b % 8]), 0.32, 'triangle', 0.16 * L.base);
    if (L.pulse > 0.05 && b % 2 === 1) busNoise('music', 0.08, 0.05 * L.pulse, 6500);
    if (L.lead > 0.05 && b % 2 === 0) busTone('music', semi(root * 4, motif[(b >> 1) % motif.length]), 0.55, 'sine', 0.05 * L.lead);
    if (L.danger > 0.05) busTone('music', root / 2, 0.2, 'sawtooth', 0.04 * L.danger);
    return null;
  }

  // the era band: the voice per stem, the bass walking the mode
  tickVoices(b, c, L) {
    const beatMs = 60000 / this.bpm;
    const meter = c.meter || 4;
    const pos = b % meter;
    const v = c.voices;
    const play = (stem, f, vol) => v[stem] && VOICES[v[stem]] && VOICES[v[stem]](f, beatMs, vol, beatMs * meter);
    const walk = c.walk || [0, 2, 4, 3, 4, 2, 1, 0];
    if (L.base > 0.05 && (meter === 6 ? pos % 3 === 0 : true)) play('base', semi(c.root, degree(c.mode, walk[Math.floor(b / (meter === 6 ? 3 : 1)) % walk.length])), 0.14 * L.base);
    if (L.pulse > 0.05 && (meter === 6 ? pos === 0 || pos === 3 : pos % 2 === 1)) play('pulse', c.root, 0.12 * L.pulse);
    const every = c.leadEvery || 2;
    if (L.lead > 0.05 && b % every === 0) play('lead', semi(c.root * (c.leadOctave || 4), c.motif[Math.floor(b / every) % c.motif.length]), 0.06 * L.lead);
    // the drone breathes once a bar, under everything (quiet or not)
    const dl = Math.max(L.danger, c.droneAlways ? 0.5 : 0);
    if (dl > 0.05 && pos === 0) play('danger', c.root / 2, 0.08 * dl);
    return null;
  }
}
