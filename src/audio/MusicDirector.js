// StemMusic (plan 2.13): the MusicDirector extended to stems for a
// framework dream. Four stems — base (a walking bass from the motif's root),
// pulse (brushes), lead (the dream's motif), danger (a low throb) — mixed by
// state, crossfaded over a beat, on the music bus (silent when music is off;
// the beat clock still runs and is emitted on the scene as 'beat').
//
//   music = { bpm: 84, root: 196, motif: [0, 4, 7, 9, 7, 4], stems: [...] }
//   states: quiet, explore, tense, setpiece, ending (room.music.state or a beat)
//
// Voices and keys (THE MASTER'S LADDER, then every framework dream):
// `voices` gives each stem an instrument from VOICES
// (src/audio/instruments.js); `mode` walks the bass in a church mode;
// `meter` 3 is a waltz (oom-pah-pah), 6 a 6/8 lilt. `keys` are named
// settings a room picks with room.music.key (bpm, root, motif, mode, voices,
// meter), so the music follows the place: inside, outside, the hall.
// Without voices the stems play the plain default band.
//
// Audio pass: the clock runs on the audio clock with a look-ahead
// (src/audio/clock.js), every note lands on its beat's exact time; `catch()`
// cuts the band for 250 ms and lays one low pad note (advice §2 "catch").
import { busTone, busNoise } from './AudioBus.js';
import { isMusicOff, audioCtx } from '../systems/audio.js';
import { VOICES } from './instruments.js';
import { BeatClock, audioNow } from './clock.js';
import { MODES, degree, semi } from './modes.js';

export { VOICES, MODES, degree };

export const STEM_MIX = {
  quiet: { base: 0.4, pulse: 0, lead: 0.25, danger: 0 },
  explore: { base: 0.8, pulse: 0.5, lead: 0.45, danger: 0 },
  // the chase (advice §2): the throb in, the lead down 6 dB, notes shorter
  tense: { base: 0.7, pulse: 0.8, lead: 0.22, danger: 0.7 },
  setpiece: { base: 1, pulse: 1, lead: 1, danger: 0 },
  ending: { base: 0.3, pulse: 0, lead: 0.8, danger: 0 },
  silent: { base: 0, pulse: 0, lead: 0, danger: 0 },
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
    this.clock = null;
    this.bpm = this.def.bpm;
    this.hushUntil = 0;
  }

  get timer() {
    return this.clock && this.clock.running ? this.clock : null;
  }

  start() {
    this.stop();
    const c = audioCtx();
    this.clock = new BeatClock({
      now: () => audioNow(c),
      bpm: this.bpm,
      onBeat: (b, at) => this.tick(b, at),
      emit: (b, ms) => setTimeout(() => this.clock && this.scene && this.scene.events && this.scene.events.emit('beat', b), ms),
    });
    this.clock.start();
  }

  stop() {
    if (this.clock) this.clock.stop();
    this.clock = null;
  }

  // the chase (tense) also plays 8% faster
  setState(s) {
    if (!STEM_MIX[s]) return;
    const was = this.state;
    this.state = s;
    if ((was === 'tense') !== (s === 'tense') && this.clock) this.clock.setBpm(this.bpm * (s === 'tense' ? 1.08 : 1));
  }

  setBpm(b) {
    if (b && b !== this.bpm) {
      this.bpm = b;
      if (this.clock) this.clock.setBpm(b * (this.state === 'tense' ? 1.08 : 1));
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

  // Jo is caught: everything stops for a breath, then one low pad note
  catch() {
    const c = audioCtx();
    const now = c ? c.currentTime : 0;
    this.hushUntil = now + 0.25;
    for (const k of Object.keys(this.level)) this.level[k] = 0;
    if (!isMusicOff()) busTone('music', this.cur.root / 2, 2, 'triangle', 0.08, 0.25);
  }

  tick(b, at = null) {
    this.beat = b + 1;
    if (isMusicOff()) return null;
    const c = audioCtx();
    if (c && at !== null && at < this.hushUntil) return null;
    const target = STEM_MIX[this.state] || STEM_MIX.quiet;
    for (const k of Object.keys(this.level)) this.level[k] += (target[k] - this.level[k]) * 0.5;
    const cur = this.cur;
    const L = this.level;
    if (cur.voices) return this.tickVoices(b, cur, L, at);
    const { root, motif } = cur;
    const when = c && at !== null ? Math.max(0, at - c.currentTime) : 0;
    const walk = [0, 2, 4, 5, 7, 5, 4, 2];
    if (L.base > 0.05) busTone('music', semi(root, walk[b % 8]), 0.32, 'triangle', 0.16 * L.base, when);
    if (L.pulse > 0.05 && b % 2 === 1) busNoise('music', 0.08, 0.05 * L.pulse, 6500, when);
    if (L.lead > 0.05 && b % 2 === 0) busTone('music', semi(root * 4, motif[(b >> 1) % motif.length]), 0.55, 'sine', 0.05 * L.lead, when);
    if (L.danger > 0.05) busTone('music', root / 2, 0.2, 'sawtooth', 0.04 * L.danger, when);
    return null;
  }

  // the era band: the voice per stem, the bass walking the mode
  tickVoices(b, c, L, at = null) {
    // the chase plays 8% faster (the beat itself), with shorter lead notes
    const beatMs = 60000 / this.bpm;
    const meter = c.meter || 4;
    const pos = b % meter;
    const v = c.voices;
    // a key's `gain` levels the place against the others (the mix table)
    const G = c.gain ?? 1;
    const play = (stem, f, vol, len = beatMs) => v[stem] && VOICES[v[stem]] && VOICES[v[stem]](f, len, vol * G, beatMs * meter, at);
    const walk = c.walk || [0, 2, 4, 3, 4, 2, 1, 0];
    // the bass: every beat (4/4), the downbeat (3/4), each half bar (6/8)
    const baseOn = meter === 6 ? pos % 3 === 0 : meter === 3 ? pos === 0 : true;
    const step = meter === 6 ? Math.floor(b / 3) : meter === 3 ? Math.floor(b / 3) : b;
    if (L.base > 0.05 && baseOn) play('base', semi(c.root, degree(c.mode, walk[step % walk.length])), 0.14 * L.base);
    // the pulse: the off-beats (4/4), beats 2 and 3 (3/4), 1 and 4 (6/8)
    const pulseOn = meter === 6 ? pos === 0 || pos === 3 : meter === 3 ? pos !== 0 : pos % 2 === 1;
    if (L.pulse > 0.05 && pulseOn) for (const n of c.pulseChord || [0]) play('pulse', semi(c.pulseRoot || c.root, n), (0.12 * L.pulse) / Math.sqrt((c.pulseChord || [0]).length));
    const every = c.leadEvery || 2;
    const leadLen = this.state === 'tense' ? beatMs * 0.6 : beatMs;
    if (L.lead > 0.05 && b % every === 0) {
      const n = c.motif[Math.floor(b / every) % c.motif.length];
      if (n !== null && n !== undefined) play('lead', semi(c.root * (c.leadOctave || 4), n), 0.06 * L.lead, leadLen);
    }
    // the drone breathes once a bar, under everything (quiet or not)
    const dl = Math.max(L.danger, c.droneAlways ? 0.5 : 0);
    if (dl > 0.05 && (c.dangerEvery ? b % c.dangerEvery === 0 : pos === 0)) play('danger', c.root / 2, 0.08 * dl);
    // an always-on tick (the clock house's escapement, the arena's kick)
    if (c.tick && VOICES[c.tick] && L.base > 0.05) VOICES[c.tick](c.root, beatMs, (c.tickVol ?? 0.08) * G, beatMs * meter, at);
    // a pad or comping voice (a fiddle over the waltz, Rhodes chords): one
    // note or chord every `every` beats, following the base stem's level
    const pd = c.pad;
    if (pd && VOICES[pd.voice] && L.base > 0.05 && b % pd.every === 0) {
      const n = pd.notes[Math.floor(b / pd.every) % pd.notes.length];
      for (const x of Array.isArray(n) ? n : [n]) VOICES[pd.voice](semi(c.root * (pd.oct || 2), x), beatMs, pd.vol * L.base * G, beatMs * meter, at);
    }
    return null;
  }
}
