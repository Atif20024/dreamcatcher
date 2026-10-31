// The instruments, as synth recipes (audio pass). Every dream's band is
// built from these: StemMusic (framework dreams) names them per stem in
// `voices`, the station's and the legacy dreams' bands (src/audio/bands.js)
// name them per part. A voice is (f, beatMs, vol, barMs, at) → sound, where
// `at` is the beat's exact time on the audio clock (src/audio/clock.js).
//
// Era and place by timbre (advice §2): plucked lute and recorder for the
// Renaissance; a music box and a fiddle for the clockmaker's green; an
// upright bass, brushes, a cup-muted trumpet and a Rhodes for the rain-night
// jazz; saw power chords and a kick for the arena; a pass-side wireless for
// the kitchen; a felt piano for the writer; a 70s synth for the station in
// orbit; vibes for the casino lounge; a nylon guitar and harmonica for the
// Evening. Nothing raw-square unless filtered (src/audio/synth.js).
import { voice, noiseVoice, busNode, PRIO } from './synth.js';

// where music goes: the music bus, or an insert a band asks for (the radio)
let musicDest = null;
export function setMusicDest(node) {
  musicDest = node || null;
}
function dest() {
  return musicDest || busNode('music');
}

// one synth note on the music bus, at the beat's time
export function syn(o, at, prio = PRIO.music) {
  const d = dest();
  if (!d) return null;
  return voice(d.context, d, { ...o, at: at ?? null, prio });
}
export function hiss(o, at, prio = PRIO.music) {
  const d = dest();
  if (!d) return null;
  return noiseVoice(d.context, d, { ...o, at: at ?? null, prio });
}

// a pulse instrument is the first to give way under the voice cap
const PULSE = PRIO.music - 1;

export const VOICES = {
  // --- the Renaissance (THE MASTER'S LADDER, unchanged in sound) ---------
  lute: (f, beat, vol, bar, at) => {
    syn({ freq: f, type: 'triangle', dur: 0.7, vol, filter: { type: 'lowpass', f: 2000 } }, at);
    syn({ freq: f * 2, type: 'sawtooth', dur: 0.3, vol: vol * 0.12, filter: { type: 'lowpass', f: 1800 } }, at);
  },
  lute_pulse: (f, beat, vol, bar, at) => VOICES.lute(f, beat, vol * 0.6, bar, at),
  recorder: (f, beat, vol, bar, at) => {
    syn({ freq: f, type: 'sine', attack: 0.05, hold: (beat / 1000) * 0.7, dur: 0.25, vol, vib: f * 0.006, vibHz: 5 }, at);
    hiss({ dur: 0.06, vol: vol * 0.12, f: 2600, q: 1.5, env: 'lin' }, at, PULSE);
  },
  shawm: (f, beat, vol, bar, at) => syn({ freq: f, type: 'sawtooth', attack: 0.02, hold: (beat / 1000) * 0.6, dur: 0.2, vol: vol * 0.8, filter: { type: 'bandpass', f: 1200, q: 2.5 } }, at),
  organ: (f, beat, vol, bar, at) => [1, 2, 3].forEach((m, i) => syn({ freq: f * m, attack: 0.06, hold: (beat / 1000) * 1.6, dur: 0.4, vol: vol * [1, 0.5, 0.25][i] }, at)),
  organ_flute: (f, beat, vol, bar, at) => [1, 2].forEach((m, i) => syn({ freq: f * m, attack: 0.08, hold: (beat / 1000) * 0.9, dur: 0.35, vol: vol * [1, 0.35][i] }, at)),
  glass: (f, beat, vol, bar, at) => [1, 2.76].forEach((m, i) => syn({ freq: f * m, dur: 1.6, vol: vol * [0.6, 0.25][i] }, at)),
  frame_drum: (f, beat, vol, bar, at) => {
    hiss({ dur: 0.12, vol: vol * 0.5, f: 180, q: 0.7, env: 'lin' }, at, PULSE);
    syn({ freq: 88, dur: 0.16, vol: vol * 0.6 }, at, PULSE);
  },
  drone: (f, beat, vol, bar, at) => [1, 1.5].forEach((m) => syn({ freq: f * m, attack: 0.4, hold: (bar / 1000) * 0.85, dur: 0.6, vol: vol * 0.5 }, at)),

  // --- THE LAST HAND, 1884: a river saloon's four-piece ----------------
  // a parlour upright, a little out (two strings 7 cents apart, a bright attack)
  parlour: (f, beat, vol, bar, at) => {
    syn({ freq: f, dur: 1.0, vol, attack: 0.003, detune: 7 }, at);
    syn({ freq: f, dur: 0.8, vol: vol * 0.5, attack: 0.003, detune: -5 }, at);
    syn({ freq: f * 3, dur: 0.18, vol: vol * 0.12, attack: 0.002 }, at);
  },
  // a five-string banjo: a fast pluck, a nasal ring off the skin head
  banjo: (f, beat, vol, bar, at) => {
    syn({ freq: f, type: 'triangle', dur: 0.28, vol: vol * 1.1, attack: 0.002 }, at, PULSE);
    syn({ freq: f * 2, type: 'sawtooth', dur: 0.12, vol: vol * 0.22, attack: 0.002, filter: { type: 'bandpass', f: 1800, q: 2 } }, at, PULSE);
  },
  // a boxwood clarinet: odd harmonics (a square, softened), breath, a slow vibrato
  clarinet: (f, beat, vol, bar, at) => {
    syn({ freq: f, type: 'square', attack: 0.05, hold: (beat / 1000) * 0.9, dur: 0.3, vol: vol * 0.55, vib: f * 0.004, vibHz: 4.8, filter: { type: 'lowpass', f: 1500 } }, at);
    hiss({ dur: 0.05, vol: vol * 0.06, f: 3000, q: 1.2, env: 'lin' }, at, PULSE);
  },
  // a low string pad (the card room's one sound): bowed, very soft
  strings_low: (f, beat, vol, bar, at) => [1, 1.003, 2].forEach((m, i) => syn({ freq: f * m, type: 'sawtooth', attack: 0.9, hold: (bar / 1000) * 0.85, dur: 1.0, vol: vol * [0.45, 0.45, 0.12][i], filter: { type: 'lowpass', f: 520 } }, at)),

  // --- the station: a night-terminus piano, a pad, a bass ---------------
  // piano: sine partials 1x and 2x, a 4 ms attack, a long decay, 3 cents apart
  piano: (f, beat, vol, bar, at) => {
    syn({ freq: f, dur: 1.2, vol, attack: 0.004, detune: 3 }, at);
    syn({ freq: f * 2, dur: 0.7, vol: vol * 0.3, attack: 0.004, detune: -3 }, at);
  },
  // a felt piano: softer hammer, darker, a long tail (the writer, the Evening)
  felt_piano: (f, beat, vol, bar, at) => {
    syn({ freq: f, dur: 2.6, vol, attack: 0.012, filter: { type: 'lowpass', f: 1400 } }, at);
    syn({ freq: f * 2, dur: 1.1, vol: vol * 0.18, attack: 0.012 }, at);
  },
  pad: (f, beat, vol, bar, at) => [1, 1.004].forEach((m) => syn({ freq: f * m, type: 'sawtooth', attack: 0.5, hold: (bar / 1000) * 0.9, dur: 0.9, vol: vol * 0.5, filter: { type: 'lowpass', f: 700 } }, at)),
  bass: (f, beat, vol, bar, at) => syn({ freq: f, type: 'triangle', dur: 0.3, vol }, at),

  // --- the clockmaker's green: a music box, a fiddle, pizzicato -----------
  music_box: (f, beat, vol, bar, at) => {
    syn({ freq: f, dur: 1.4, vol, attack: 0.003 }, at);
    syn({ freq: f * 2.76, dur: 0.5, vol: vol * 0.22, attack: 0.003 }, at);
  },
  fiddle: (f, beat, vol, bar, at) => syn({ freq: f, type: 'sawtooth', attack: 0.09, hold: (beat / 1000) * 1.2, dur: 0.35, vol: vol * 0.7, vib: f * 0.008, vibHz: 5, filter: { type: 'lowpass', f: 1800 } }, at),
  pizz: (f, beat, vol, bar, at) => syn({ freq: f, type: 'triangle', dur: 0.12, vol: vol * 1.2, attack: 0.003 }, at),
  // the clock house's pulse: an escapement tick
  tick: (f, beat, vol, bar, at) => {
    hiss({ dur: 0.02, vol: vol * 0.6, f: 3400, q: 3, env: 'lin' }, at, PULSE);
    syn({ freq: 2100, dur: 0.02, vol: vol * 0.3, attack: 0.002 }, at, PULSE);
  },
  // danger: a low sine that swells and falls once a beat (1 Hz AM, no LFO)
  throb: (f, beat, vol, bar, at) => syn({ freq: f, attack: (beat / 1000) * 0.45, dur: (beat / 1000) * 0.5, vol: vol * 1.3 }, at),

  // --- rain-night jazz (the musician) -----------------------------------
  upright: (f, beat, vol, bar, at) => {
    syn({ freq: f, type: 'triangle', dur: 0.36, vol: vol * 1.2, attack: 0.006, filter: { type: 'lowpass', f: 600 } }, at);
  },
  brush: (f, beat, vol, bar, at) => hiss({ dur: 0.11, vol: vol * 0.45, f: 6500, q: 0.9, env: 'lin' }, at, PULSE),
  muted_trumpet: (f, beat, vol, bar, at) => syn({ freq: f, type: 'sawtooth', attack: 0.015, hold: (beat / 1000) * 0.35, dur: 0.22, vol: vol * 1.3, vib: f * 0.004, vibHz: 5.5, filter: { type: 'bandpass', f: 1100, q: 3 } }, at),
  rhodes: (f, beat, vol, bar, at) => {
    syn({ freq: f, dur: 1.3, vol, attack: 0.005 }, at);
    syn({ freq: f * 2, dur: 0.35, vol: vol * 0.25, attack: 0.003 }, at);
  },

  // --- the arena: 80s rock-pop ---------------------------------------------
  power_chord: (f, beat, vol, bar, at) => [1, 1.004, 1.5].forEach((m, i) => syn({ freq: f * m, type: 'sawtooth', attack: 0.01, hold: (beat / 1000) * 0.6, dur: 0.25, vol: vol * [0.45, 0.45, 0.3][i], filter: { type: 'lowpass', f: 3000 } }, at)),
  kick: (f, beat, vol, bar, at) => syn({ freq: 120, glide: 45, dur: 0.12, vol: vol * 1.6, attack: 0.002 }, at, PULSE),
  snare: (f, beat, vol, bar, at) => hiss({ dur: 0.14, vol: vol * 0.8, f: 1800, q: 0.8 }, at, PULSE),
  arp: (f, beat, vol, bar, at) => syn({ freq: f, type: 'square', dur: 0.14, vol: vol * 0.5, attack: 0.005, filter: { type: 'lowpass', f: 2500 } }, at),
  // through the stage door: the PA's lead, a little driven, far away
  dist_lead: (f, beat, vol, bar, at) => {
    syn({ freq: f, type: 'triangle', dur: 0.3, vol, hold: (beat / 1000) * 0.3, filter: { type: 'lowpass', f: 1600 } }, at);
    syn({ freq: f * 3, type: 'sine', dur: 0.2, vol: vol * 0.25 }, at);
  },
  shaker: (f, beat, vol, bar, at) => hiss({ dur: 0.05, vol: vol * 0.35, f: 8000, q: 1.2, env: 'lin' }, at, PULSE),

  // --- the kitchen's wireless: swing, through a radio ---------------------
  radio_horn: (f, beat, vol, bar, at) => syn({ freq: f, type: 'sawtooth', attack: 0.015, hold: (beat / 1000) * 0.25, dur: 0.2, vol: vol * 0.9, filter: { type: 'lowpass', f: 2500 } }, at),
  crackle: (f, beat, vol, bar, at) => hiss({ dur: 0.012, vol: vol * 0.5, f: 2800, q: 2, env: 'lin' }, at, PULSE),

  // --- the writer: a typewriter as the pulse -----------------------------
  type_tap: (f, beat, vol, bar, at) => hiss({ dur: 0.025, vol: vol * 0.55, f: 1100, q: 2.5, env: 'lin' }, at, PULSE),

  // --- in orbit: a 70s synth --------------------------------------------
  synth_pad: (f, beat, vol, bar, at) => [1, 1.006].forEach((m) => syn({ freq: f * m, type: 'triangle', attack: 0.8, hold: (bar / 1000) * 0.8, dur: 1.2, vol: vol * 0.6, filter: { type: 'lowpass', f: 600, to: 1800 } }, at)),
  plink: (f, beat, vol, bar, at) => syn({ freq: f, dur: 0.35, vol, attack: 0.003 }, at),
  heartbeat: (f, beat, vol, bar, at) => {
    syn({ freq: 55, dur: 0.12, vol: vol * 1.6, attack: 0.004 }, at, PULSE);
    syn({ freq: 50, dur: 0.14, vol: vol * 1.1, attack: 0.004 }, at === undefined || at === null ? null : at + 0.22, PULSE);
  },

  // --- the casino lounge -------------------------------------------------
  vibes: (f, beat, vol, bar, at) => {
    syn({ freq: f, dur: 1.0, vol, attack: 0.003 }, at);
    syn({ freq: f * 4, dur: 0.3, vol: vol * 0.18, attack: 0.003 }, at);
  },
  soft_trumpet: (f, beat, vol, bar, at) => syn({ freq: f, type: 'sawtooth', attack: 0.06, hold: (beat / 1000) * 1.2, dur: 0.5, vol: vol * 0.8, vib: f * 0.004, vibHz: 4.5, filter: { type: 'lowpass', f: 2200 } }, at),

  // --- the Evening -------------------------------------------------------
  nylon: (f, beat, vol, bar, at) => {
    syn({ freq: f, type: 'triangle', dur: 0.9, vol, attack: 0.004, filter: { type: 'lowpass', f: 2000 } }, at);
    syn({ freq: f, type: 'sawtooth', dur: 0.3, vol: vol * 0.12, filter: { type: 'lowpass', f: 2000 } }, at);
  },
  harmonica: (f, beat, vol, bar, at) => syn({ freq: f, type: 'sawtooth', attack: 0.08, hold: (beat / 1000) * 0.8, dur: 0.3, vol: vol * 0.8, vib: f * 0.006, vibHz: 5, filter: { type: 'bandpass', f: 1500, q: 1.4 } }, at),
};

// a chord on one voice (piano comping, a power chord's root+fifth)
export function chord(voiceName, freqs, beat, vol, bar, at) {
  const v = VOICES[voiceName];
  if (!v) return;
  freqs.forEach((f) => v(f, beat, vol, bar, at));
}
