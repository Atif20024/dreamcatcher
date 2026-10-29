// All audio is synthesized with WebAudio — no asset files.
// sfx(name) fires one-shots; the bands and stems are generative.
//
// The master chain (audio pass, advice §4): every sound in the game goes
//   source → (bus) → master (0.35) → compressor (-14 dB, 4:1) → trim →
//   limiter (-3 dB, 20:1) → trim → soft ceiling (-1 dBFS) → mute → speakers
// and the mute is the switch DEV_SILENT holds at 0. In development there is
// no AudioContext at all (nothing is scheduled, no audio thread runs on the
// 8 GB laptop); the offline tests install their own rendering context and
// listen at the ceiling, before the mute (tests/helpers/fakeAudio.js).
import { voice, noiseVoice, PRIO, pool, ceilingCurve, compressorMakeup, audioHooks } from '../audio/synth.js';
import { BeatClock, audioNow } from '../audio/clock.js';
import { VOICES, setMusicDest } from '../audio/instruments.js';
import { BANDS, bandBpm } from '../audio/bands.js';
import { degree } from '../audio/modes.js';

let ctx = null;
let master = null;
let chain = null;

// Music can be switched off ([M] or the HUD button); one-shot SFX and the
// instruments Jo plays himself stay audible. Remembered between sessions.
const MUTE_KEY = 'dreamcatcher.musicOff';
let musicOff = false;
try {
  musicOff = localStorage.getItem(MUTE_KEY) === '1';
} catch {
  /* no storage */
}
export function isMusicOff() {
  return musicOff;
}
export function setMusicOff(off) {
  musicOff = !!off;
  try {
    localStorage.setItem(MUTE_KEY, musicOff ? '1' : '0');
  } catch {
    /* no storage */
  }
  return musicOff;
}
export function toggleMusic() {
  return setMusicOff(!musicOff);
}

// Development is silent: every sound (music, effects, ambience, every bus)
// flows through `master` and the mute after it, so one switch mutes the
// lot. Opt back in with ?sound=1 in the URL or
// localStorage['dreamcatcher.devSound'] = '1'. Production builds are
// unaffected.
const DEV_SILENT = (() => {
  if (!(import.meta.env && import.meta.env.DEV)) return false; // (node lint: no env)
  try {
    // ?sound=1 turns sound on for this origin until ?sound=0 (agents test on
    // other ports, so their origins stay silent)
    const q = new URLSearchParams(window.location.search).get('sound');
    if (q === '1') localStorage.setItem('dreamcatcher.devSound', '1');
    if (q === '0') localStorage.removeItem('dreamcatcher.devSound');
    return localStorage.getItem('dreamcatcher.devSound') !== '1';
  } catch {
    return true;
  }
})();
export function isDevSilent() {
  return DEV_SILENT;
}

export const MASTER = Object.freeze({
  gain: 0.35,
  comp: { threshold: -14, knee: 0, ratio: 4, attack: 0.005, release: 0.2 },
  limit: { threshold: -3, knee: 0, ratio: 20, attack: 0.001, release: 0.1 },
  ceiling: 0.891, // -1 dBFS
});

function buildChain(c, muted) {
  master = c.createGain();
  master.gain.value = MASTER.gain;
  const comp = c.createDynamicsCompressor();
  const lim = c.createDynamicsCompressor();
  for (const [node, p] of [
    [comp, MASTER.comp],
    [lim, MASTER.limit],
  ]) {
    node.threshold.value = p.threshold;
    node.knee.value = p.knee;
    node.ratio.value = p.ratio;
    node.attack.value = p.attack;
    node.release.value = p.release;
  }
  // the browser's compressor adds make-up gain; take it off again, so the
  // chain only ever turns things down
  const trim1 = c.createGain();
  trim1.gain.value = 1 / compressorMakeup(MASTER.comp.threshold, MASTER.comp.ratio);
  const trim2 = c.createGain();
  trim2.gain.value = 1 / compressorMakeup(MASTER.limit.threshold, MASTER.limit.ratio);
  const ceil = c.createWaveShaper();
  ceil.curve = ceilingCurve(MASTER.ceiling);
  const mute = c.createGain();
  mute.gain.value = muted ? 0 : 1;
  master.connect(comp).connect(trim1).connect(lim).connect(trim2).connect(ceil).connect(mute).connect(c.destination);
  chain = { master, comp, trim1, lim, trim2, ceil, mute };
}

function ac() {
  if (ctx) {
    if (ctx.state === 'suspended' && !DEV_SILENT && !ctx.offline) ctx.resume();
    return ctx;
  }
  // dev is silent: no context, no nodes, no audio thread
  if (DEV_SILENT) return null;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  buildChain(ctx, false);
  return ctx;
}

// tests only: render the game's audio into an offline context. The mute
// stays shut; the test listens at the ceiling instead (audioTap).
export function installAudioContext(c) {
  ctx = c || null;
  pool.reset();
  if (c) {
    c.offline = true;
    buildChain(c, true);
  } else {
    master = null;
    chain = null;
  }
  return chain;
}
export function audioTap() {
  return chain ? chain.ceil : null;
}
export function masterChain() {
  return chain;
}

function tone(freq, dur, type = 'sine', vol = 0.5, when = 0, glideTo = null, extra = null) {
  const c = ac();
  if (!c) return;
  voice(c, master, { freq, dur, type, vol, when, glide: glideTo, prio: PRIO.sfx, ...(extra || {}) });
}

function noise(dur, vol = 0.3, freq = 1000, when = 0) {
  const c = ac();
  if (!c) return;
  noiseVoice(c, master, { dur, vol, f: freq, when, env: 'exp', prio: PRIO.sfx });
}

// a stinger ducks the music (-6 dB, 50 ms in, 800 ms out) — AudioBus
function duckSting() {
  try {
    if (audioHooks.sting) audioHooks.sting();
  } catch {
    /* no buses */
  }
}

const SFX = {
  bell: () => {
    tone(1560, 0.6, 'triangle', 0.5);
    tone(2340, 0.4, 'sine', 0.2);
  },
  chime: () => [523, 659, 784].forEach((f, i) => tone(f, 0.5, 'sine', 0.3, i * 0.09)),
  orb: () => [659, 784, 988, 1319].forEach((f, i) => tone(f, 0.9, 'sine', 0.25, i * 0.15)),
  hiss: () => noise(0.4, 0.25, 2400),
  steam: () => noise(0.6, 0.3, 1400),
  clang: () => {
    tone(220, 0.15, 'square', 0.3);
    noise(0.12, 0.3, 3000);
  },
  click: () => noise(0.04, 0.25, 2000),
  snap: () => noise(0.15, 0.5, 800),
  squish: () => tone(160, 0.2, 'sine', 0.4, 0, 60),
  buzz: () => tone(90, 0.25, 'sawtooth', 0.2),
  hurt: () => tone(200, 0.25, 'square', 0.35, 0, 80),
  jump: () => tone(300, 0.12, 'square', 0.12, 0, 420),
  pickup: () => [660, 880].forEach((f, i) => tone(f, 0.15, 'square', 0.2, i * 0.07)),
  deliver: () => [523, 784].forEach((f, i) => tone(f, 0.2, 'triangle', 0.3, i * 0.1)),
  next: () => tone(180, 0.3, 'square', 0.4, 0, 150),
  crack: () => noise(0.2, 0.4, 500),
  swing: () => noise(0.15, 0.15, 900),
  purr: () => tone(70, 0.8, 'sine', 0.15),
  pop: () => tone(500, 0.1, 'sine', 0.3, 0, 900),
  fail: () => [300, 240, 180].forEach((f, i) => tone(f, 0.25, 'square', 0.25, i * 0.15)),
  // --- station ---
  clack: () => noise(0.03, 0.22, 3200),
  whistle: () => {
    tone(880, 0.5, 'sine', 0.18);
    tone(1175, 0.5, 'sine', 0.12, 0.02);
  },
  scrape: () => noise(1.4, 0.3, 700),
  knock: () => tone(90, 0.18, 'square', 0.3, 0, 60),
  scratch: () => noise(0.12, 0.18, 4200),
  adding: () => [0, 0.09, 0.18, 0.3].forEach((w) => noise(0.03, 0.12, 2600, w)),
  tick: () => noise(0.015, 0.1, 5000),
  drip: () => tone(1400, 0.08, 'sine', 0.08, 0, 700),
  tea: () => [523, 659].forEach((f, i) => tone(f, 0.3, 'triangle', 0.14, i * 0.12)),
  coin_drop: () => [520, 390, 290].forEach((f, i) => tone(f, 0.12, 'square', 0.14, i * 0.05)),
  shard: () => [659, 880, 1319, 1760].forEach((f, i) => tone(f, 0.5, 'sine', 0.16, i * 0.09)),
  buy: () => [880, 660, 880, 1100].forEach((f, i) => tone(f, 0.1, 'triangle', 0.16, i * 0.06)),
  // --- the long evening ---
  hud_fade: () => tone(523, 0.9, 'sine', 0.08, 0, 392),
  shutter: () => {
    noise(0.05, 0.3, 3500);
    noise(0.09, 0.2, 1200, 0.06);
  },
  crunch: () => noise(0.07, 0.12, 700),
  splash: () => noise(0.12, 0.14, 1800),
  step: () => noise(0.03, 0.05, 900),
  thump: () => {
    tone(80, 0.25, 'sine', 0.25, 0, 50);
    noise(0.2, 0.15, 400);
  },
  groan: () => tone(220, 0.45, 'sawtooth', 0.05, 0, 160),
  far_bell: () => {
    tone(392, 3.2, 'sine', 0.07);
    tone(784, 2.2, 'sine', 0.03);
  },
  bike_bell: () => [1760, 1760].forEach((f, i) => tone(f, 0.12, 'triangle', 0.08, i * 0.14)),
  flap: () => [0, 0.08, 0.16].forEach((w) => noise(0.05, 0.12, 900, w)),
  purr_soft: () => tone(62, 1.2, 'sine', 0.1),
  meow: () => tone(700, 0.3, 'triangle', 0.08, 0, 520),
  // no square woof: a saw through a 600 Hz low-pass (advice §3)
  woof: () => tone(180, 0.18, 'sawtooth', 0.14, 0, 120, { filter: { type: 'lowpass', f: 600 } }),
  crackle: () => [0, 0.05, 0.12].forEach((w) => noise(0.03, 0.1, 2800, w)),
};

// Jo's trumpet: 12 pitches, brassy square+saw blend. Nia's bass: 6 pitches.
const TRUMPET_SCALE = [262, 294, 330, 349, 392, 440, 494, 523, 587, 659, 698, 784];
const BASS_SCALE = [65, 73, 82, 87, 98, 110];

export function trumpet(pitchIdx = 4, dur = 0.35, vol = 0.3) {
  try {
    const f = TRUMPET_SCALE[((pitchIdx % 12) + 12) % 12];
    // brass, not a buzzer: a 15 ms breath in and a 2.5 kHz low-pass
    const brass = { attack: 0.015, filter: { type: 'lowpass', f: 2500 } };
    tone(f, dur, 'square', vol * 0.55, 0, null, brass);
    tone(f, dur, 'sawtooth', vol * 0.25, 0, null, brass);
    tone(f * 2, dur * 0.7, 'sine', vol * 0.15, 0, null, { attack: 0.015 });
  } catch {
    /* silent */
  }
}

// a reedy accordion: two detuned squares under a low-pass, for the busker
export function accordion(pitchIdx = 4, dur = 0.4, vol = 0.22) {
  const scale = [262, 294, 330, 349, 392, 440, 494, 523, 587, 659, 698, 784];
  const f = scale[Math.max(0, Math.min(11, pitchIdx))];
  const reed = { attack: 0.02, filter: { type: 'lowpass', f: 2200 } };
  tone(f, dur, 'square', vol * 0.45, 0, null, reed);
  tone(f * 1.006, dur, 'sawtooth', vol * 0.25, 0, null, reed);
  tone(f / 2, dur, 'triangle', vol * 0.3);
}

export function bassNote(pitchIdx = 2, dur = 0.5, vol = 0.35) {
  try {
    const f = BASS_SCALE[((pitchIdx % 6) + 6) % 6];
    tone(f, dur, 'triangle', vol);
    tone(f * 2, dur * 0.5, 'sine', vol * 0.3);
  } catch {
    /* silent */
  }
}

// Collectibles §8 — the coin stinger's pitch rises with each coin taken
// within a second of the last (a combo), then resets.
export function coinSfx(combo = 0) {
  try {
    const step = Math.min(12, combo);
    const f = 784 * Math.pow(2, step / 12);
    tone(f, 0.12, 'square', 0.14);
    tone(f * 2, 0.1, 'sine', 0.08, 0.02);
  } catch {
    /* silent */
  }
}

// --- raw voices, for the evening's ensemble and ambience -----------------
// (the evening composes its own music from these; nothing else needs them)
export function playTone(freq, dur, type = 'sine', vol = 0.5, when = 0, glideTo = null) {
  if (musicOff) return;
  try {
    // music: on the music bus when the buses are up (ducking, the room)
    const out = busNode('music');
    // (at the level it was written for, direct to the master)
    const k = audioHooks.flat ? audioHooks.flat('music') : 1;
    if (out) voice(out.context, out, { freq, dur, type, vol: vol * k, when, glide: glideTo, prio: PRIO.music });
    else tone(freq, dur, type, vol, when, glideTo);
  } catch {
    /* silent */
  }
}
// one-shots that are sound effects, not music: they play with music off
export function playFx(freq, dur, type = 'sine', vol = 0.5, when = 0, glideTo = null) {
  try {
    tone(freq, dur, type, vol, when, glideTo);
  } catch {
    /* silent */
  }
}
export function playNoise(dur, vol = 0.3, freq = 1000, when = 0) {
  try {
    noise(dur, vol, freq, when);
  } catch {
    /* silent */
  }
}
export function audioCtx() {
  try {
    return ac();
  } catch {
    return null;
  }
}
export function audioOut() {
  return audioCtx() ? master : null;
}

// a laugh is a shape, not a word: three falling breaths at the speaker's pitch
export function laughSfx(pitch = 1) {
  try {
    [0, 0.13, 0.26, 0.4].forEach((w, i) => {
      tone((420 - i * 40) * pitch, 0.1, 'triangle', 0.09, w, (340 - i * 40) * pitch);
      noise(0.08, 0.05, 1600 * pitch, w);
    });
  } catch {
    /* silent */
  }
}

// --- round 2 WP6: the station chime --------------------------------------
// One two-note motif, a falling fourth, re-orchestrated per place (critique
// §9 "Sound"). It plays on the five identity moments: a board flip (a place
// title, CAUGHT), a lamp-checkpoint, boarding (the passing-train wipe), the
// dream's end and the Evening's YOU'RE HERE. Every voice is `tone`/`noise`,
// so it goes through `master`, and DEV_SILENT mutes it like everything else.
const FOURTH = 3 / 4; // the second note: a perfect fourth below the first
const bell = (f, when, vol, partials, decay) => partials.forEach(([m, a, type = 'sine']) => tone(f * m, decay * (m > 2 ? 0.6 : 1), type, vol * a, when));
export const CHIME_VOICES = Object.freeze({
  // the hall's own: a soft station bell (sine, a bright second partial)
  hub: { f: 784, gap: 0.42, voice: (f, w) => bell(f, w, 0.16, [[1, 1], [2, 0.32], [3, 0.08]], 1.6) },
  // the pass: a service bell, struck twice
  chef: { f: 1175, gap: 0.24, voice: (f, w) => bell(f, w, 0.13, [[1, 1, 'triangle'], [2.76, 0.35], [5.4, 0.12]], 0.9) },
  // Marcus's horn: brass, short, a little breath on the front
  musician: {
    f: 523,
    gap: 0.3,
    voice: (f, w) => {
      tone(f, 0.34, 'square', 0.07, w);
      tone(f, 0.34, 'sawtooth', 0.04, w);
      tone(f * 2, 0.22, 'sine', 0.03, w);
      noise(0.05, 0.03, 1800, w);
    },
  },
  // mission control: a radio beep, a click of carrier before each
  astronaut: {
    f: 1319,
    gap: 0.22,
    voice: (f, w) => {
      noise(0.02, 0.05, 3000, w);
      tone(f, 0.14, 'square', 0.05, w + 0.02);
    },
  },
  // the carriage-return bell of a typewriter
  writer: { f: 1568, gap: 0.26, voice: (f, w) => bell(f, w, 0.1, [[1, 1], [2.4, 0.3]], 0.7) },
  // a church bell across the square: hum, strike, minor third, fifth
  painter: { f: 523, gap: 0.6, voice: (f, w) => bell(f, w, 0.12, [[0.5, 0.5], [1, 1], [1.19, 0.35], [1.5, 0.25], [2, 0.3]], 2.4) },
  // a slot machine's pay chime: a quick sparkle on each note
  gambler: { f: 988, gap: 0.26, voice: (f, w) => [1, 1.5, 2].forEach((m, i) => tone(f * m, 0.3, 'triangle', 0.07 / (i + 1), w + i * 0.03)) },
  // the clock house: a tubular chime
  clockmaker: { f: 659, gap: 0.5, voice: (f, w) => bell(f, w, 0.13, [[1, 1], [2, 0.4], [3, 0.15], [4.07, 0.06]], 1.9) },
  // the town's bells, two towers, slightly out with each other
  evening: {
    f: 392,
    gap: 0.7,
    voice: (f, w) => {
      bell(f, w, 0.1, [[1, 1], [2, 0.3], [0.5, 0.4]], 3);
      bell(f * 1.004, w + 0.21, 0.06, [[1, 1], [2, 0.2]], 2.6);
    },
  },
  // and on the ridge, unaccompanied: one pure voice
  ridge: { f: 392, gap: 0.9, voice: (f, w) => tone(f, 2.2, 'sine', 0.09, w) },
});
// the scenarios read this event log (nothing is played to check it)
export const chimeLog = [];
let chimeSeq = 0;
export function chime(event = 'chime', place = 'hub') {
  const known = !!CHIME_VOICES[place];
  const v = known ? CHIME_VOICES[place] : CHIME_VOICES.hub;
  chimeLog.push({ event, place: known ? place : 'hub', at: Date.now(), seq: ++chimeSeq });
  if (chimeLog.length > 64) chimeLog.shift();
  duckSting();
  try {
    v.voice(v.f, 0);
    v.voice(v.f * FOURTH, v.gap);
  } catch {
    /* audio unavailable — stay silent */
  }
}

export function sfx(name) {
  try {
    if (SFX[name]) SFX[name]();
  } catch {
    /* audio unavailable — stay silent */
  }
}

// --- D7 MusicDirector ----------------------------------------------------
// The station's and the legacy dreams' music: one BAND per place
// (src/audio/bands.js), its parts mixed by state; each part's level eases
// over one beat when the state changes. The beat clock runs on the audio
// clock with a look-ahead (src/audio/clock.js) and is emitted on the scene
// as 'beat', so periodic hazards fire on the beat. Framework dreams use
// StemMusic (src/audio/MusicDirector.js) instead and stop this one.
const STATE_MIX = {
  quiet: { bass: 0.45, brushes: 0.0, piano: 0.25, trumpet: 0.0, pad: 0.35, danger: 0 },
  explore: { bass: 1.0, brushes: 0.55, piano: 0.5, trumpet: 0.0, pad: 0.0, danger: 0 },
  danger: { bass: 1.0, brushes: 1.0, piano: 0.3, trumpet: 0.25, pad: 0.0, danger: 0.7 },
  setpiece: { bass: 1.0, brushes: 1.0, piano: 0.7, trumpet: 1.0, pad: 0.0, danger: 0 },
  caught: { bass: 0.2, brushes: 0.0, piano: 0.0, trumpet: 0.0, pad: 0.7, danger: 0 },
};
const PARTS = ['bass', 'brushes', 'piano', 'trumpet', 'pad', 'hum', 'danger'];
const SOLO = [392, 440, 494, 523, 440, 392];

// the kitchen's wireless: a band-pass insert in front of the music bus
const inserts = new WeakMap();
function insertFor(kind, out) {
  if (!out || kind !== 'radio') return null;
  let m = inserts.get(out);
  if (!m) {
    m = {};
    inserts.set(out, m);
  }
  if (m[kind]) return m[kind];
  const c = out.context;
  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 400;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 3400;
  hp.connect(lp).connect(out);
  m[kind] = hp;
  return hp;
}

// a part's pitch(es) for a beat
export function partNotes(band, part, b) {
  const p = band.parts[part];
  if (!p) return [];
  const every = p.every || 1;
  const i = Math.floor(b / every);
  const root = band.root * (p.oct || 1);
  const s = (n) => root * 2 ** (n / 12);
  if (p.freqs) return [p.freqs[i % p.freqs.length]];
  if (p.walk) return [s(degree(band.mode, p.walk[i % p.walk.length]))];
  if (p.chord) return p.chord.map((d) => s(degree(band.mode, d)));
  if (p.motif) {
    const n = p.motif[i % p.motif.length];
    return n === null || n === undefined ? [] : [s(n)];
  }
  return [band.root];
}

export class MusicDirector {
  constructor() {
    this.state = 'quiet';
    this.band = 'hub';
    this.bpm = BANDS.hub.bpm;
    this.beat = 0;
    this.scene = null;
    this.clock = null;
    this.level = { bass: 0, brushes: 0, piano: 0, trumpet: 0, pad: 0, hum: 0, danger: 0 };
    this.custom = null;
    this.boost = {}; // the gig helpers below (music.bass() …) push a part up
  }

  // the place's band (src/audio/bands.js); its own tempo
  setBand(name) {
    this.band = BANDS[name] ? name : 'hub';
    this.setBpm(BANDS[this.band].bpm);
    return this.band;
  }

  // a room's tempo, scaled to the band (inside: 10% slower)
  setRoomTempo(roomBpm, inside = false) {
    this.setBpm(bandBpm(this.band, roomBpm, inside));
  }

  // The station drives its own mix from the HubState table rather than from
  // a named state; `custom` wins over `state` while set.
  setMix(mix) {
    this.custom = { bass: 0, brushes: 0, piano: 0, trumpet: 0, pad: 0, hum: 0, danger: 0, ...mix };
  }

  clearMix() {
    this.custom = null;
  }

  attach(scene) {
    this.scene = scene;
    this.start();
  }

  setBpm(bpm) {
    if (bpm && bpm !== this.bpm) {
      this.bpm = bpm;
      if (this.clock) this.clock.setBpm(bpm);
    }
  }

  setState(state) {
    if (!STATE_MIX[state] || state === this.state) return;
    this.state = state;
  }

  start() {
    this.stop();
    let c = null;
    try {
      c = ac();
    } catch {
      /* no audio */
    }
    this.clock = new BeatClock({
      now: () => audioNow(c),
      bpm: this.bpm,
      onBeat: (b, at) => this.tick(b, at),
      emit: (b, ms) => {
        const sc = this.scene;
        setTimeout(() => {
          if (sc && sc.events && sc === this.scene) sc.events.emit('beat', b);
        }, ms);
      },
    });
    this.clock.start();
  }

  // one beat of the band at time `at` (seconds on the audio clock)
  tick(b, at = null) {
    this.beat = b + 1;
    if (musicOff) return;
    const band = BANDS[this.band] || BANDS.hub;
    const target = this.custom || { ...STATE_MIX[this.state], hum: 0 };
    for (const k of PARTS) {
      const want = Math.max(target[k] || 0, this.boost[k] || 0);
      this.level[k] += (want - this.level[k]) * 0.5;
    }
    const out = busNode('music');
    if (!out) return;
    setMusicDest(insertFor(band.insert, out));
    const beatMs = 60000 / this.bpm;
    const meter = band.meter || 4;
    try {
      for (const k of PARTS) {
        const p = band.parts[k];
        const lv = this.level[k];
        if (!p || lv <= 0.05) continue;
        const every = p.every || 1;
        if (b % every !== (p.offset || 0) % every) continue;
        if (p.chance !== undefined && hash01(b * 31 + k.length) > p.chance) continue;
        const v = VOICES[p.voice];
        if (!v) continue;
        const t = at === null ? null : at + (p.swing || 0) * (beatMs / 1000);
        for (const f of partNotes(band, k, b)) v(f, beatMs, p.vol * lv * (band.gain ?? 1), beatMs * meter, t);
      }
      // the end-of-dream solo (music.soloPiano): the band's piano, alone
      if (this.boost.solo && b % 2 === 0) {
        const v = VOICES[(band.parts.piano && band.parts.piano.voice) || 'piano'] || VOICES.piano;
        v(SOLO[(b >> 1) % SOLO.length], beatMs, 0.09, beatMs * meter, at);
      }
    } finally {
      setMusicDest(null);
    }
  }

  stop() {
    if (this.clock) this.clock.stop();
    this.clock = null;
    this.custom = null;
  }
}

// a cheap deterministic 0..1 per beat (a part's `chance`)
function hash01(n) {
  let x = (n * 2654435761) >>> 0;
  x ^= x >>> 15;
  return (x % 1000) / 1000;
}

function busNode(name) {
  try {
    return audioHooks.bus ? audioHooks.bus(name) : null;
  } catch {
    return null;
  }
}

export const musicDirector = new MusicDirector();

// D7 — stingers (they duck the music: -6 dB for 800 ms)
const stung = (fn) => () => {
  duckSting();
  fn();
};
export const sting = {
  checkpoint: stung(() => [784, 1047].forEach((f, i) => tone(f, 0.35, 'sine', 0.25, i * 0.08))),
  gate: stung(() => {
    tone(150, 0.5, 'square', 0.18);
    noise(0.35, 0.2, 400);
  }),
  secret: stung(() => [659, 880, 1319].forEach((f, i) => tone(f, 0.4, 'triangle', 0.2, i * 0.1))),
  foeOut: stung(() => tone(180, 0.4, 'sawtooth', 0.2, 0, 70)),
  death: stung(() => [330, 262, 196, 147].forEach((f, i) => tone(f, 0.7, 'triangle', 0.22, i * 0.12))),
};

// --- the gig helpers (legacy scenes) ---------------------------------------
// Once their own setInterval swing band; now they push a part of the
// place's band up to full (on the director's audio clock), so a kitchen's
// "bass comes in" is the kitchen's bass. soloPiano is the band's piano alone.
export const music = {
  bass(on = true) {
    musicDirector.boost.bass = on ? 1 : 0;
  },
  piano(on = true) {
    musicDirector.boost.piano = on ? 1 : 0;
  },
  trumpet(on = true) {
    musicDirector.boost.trumpet = on ? 1 : 0;
  },
  soloPiano(on = true) {
    musicDirector.boost.solo = on ? 1 : 0;
  },
  stop(name) {
    if (name === 'solo') musicDirector.boost.solo = 0;
    else if (name) musicDirector.boost[name] = 0;
    else musicDirector.boost = {};
  },
};
