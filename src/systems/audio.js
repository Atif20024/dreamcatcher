// All audio is synthesized with WebAudio — no asset files.
// sfx(name) fires one-shots; stems are generative jazz-ish loops.
let ctx = null;
let master = null;
const stems = {};

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
// flows through `master`, so one switch mutes the lot. Opt back in with
// ?sound=1 in the URL or localStorage['dreamcatcher.devSound'] = '1'.
// Production builds are unaffected.
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

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = DEV_SILENT ? 0 : 0.35;
    master.connect(ctx.destination);
    if (DEV_SILENT) ctx.suspend();
  }
  if (ctx.state === 'suspended' && !DEV_SILENT) ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', vol = 0.5, when = 0, glideTo = null) {
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = c.currentTime + when;
  if (glideTo) o.frequency.linearRampToValueAtTime(glideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(dur, vol = 0.3, freq = 1000, when = 0) {
  const c = ac();
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  const g = c.createGain();
  const t = c.currentTime + when;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
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
  woof: () => tone(180, 0.18, 'square', 0.12, 0, 120),
  crackle: () => [0, 0.05, 0.12].forEach((w) => noise(0.03, 0.1, 2800, w)),
};

// Jo's trumpet: 12 pitches, brassy square+saw blend. Nia's bass: 6 pitches.
const TRUMPET_SCALE = [262, 294, 330, 349, 392, 440, 494, 523, 587, 659, 698, 784];
const BASS_SCALE = [65, 73, 82, 87, 98, 110];

export function trumpet(pitchIdx = 4, dur = 0.35, vol = 0.3) {
  try {
    const f = TRUMPET_SCALE[((pitchIdx % 12) + 12) % 12];
    tone(f, dur, 'square', vol * 0.55);
    tone(f, dur, 'sawtooth', vol * 0.25);
    tone(f * 2, dur * 0.7, 'sine', vol * 0.15);
  } catch {
    /* silent */
  }
}

// a reedy accordion: two detuned squares under a low-pass, for the busker
export function accordion(pitchIdx = 4, dur = 0.4, vol = 0.22) {
  const scale = [262, 294, 330, 349, 392, 440, 494, 523, 587, 659, 698, 784];
  const f = scale[Math.max(0, Math.min(11, pitchIdx))];
  tone(f, dur, 'square', vol * 0.45);
  tone(f * 1.006, dur, 'sawtooth', vol * 0.25);
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
    tone(freq, dur, type, vol, when, glideTo);
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
// Five states; each stem has its own gain that crossfades over one beat when
// the state changes. The beat clock is derived from audioCtx.currentTime and
// the current room's bpm, and is emitted on the scene so periodic hazards can
// fire on the beat instead of on their own timers.
const STATE_MIX = {
  quiet: { bass: 0.45, brushes: 0.0, piano: 0.25, trumpet: 0.0, pad: 0.35 },
  explore: { bass: 1.0, brushes: 0.55, piano: 0.5, trumpet: 0.0, pad: 0.0 },
  danger: { bass: 1.0, brushes: 1.0, piano: 0.3, trumpet: 0.45, pad: 0.0 },
  setpiece: { bass: 1.0, brushes: 1.0, piano: 0.7, trumpet: 1.0, pad: 0.0 },
  caught: { bass: 0.2, brushes: 0.0, piano: 0.0, trumpet: 0.0, pad: 0.7 },
};

const WALK = [98, 110, 123, 131, 147, 131, 123, 110];
const CHORD = [262, 330, 392, 494];

export class MusicDirector {
  constructor() {
    this.state = 'quiet';
    this.bpm = 100;
    this.beat = 0;
    this.scene = null;
    this.timer = null;
    this.gains = {};
    this.level = { bass: 0, brushes: 0, piano: 0, trumpet: 0, pad: 0, hum: 0 };
    this.custom = null;
  }

  // The station drives its own mix from the HubState table rather than from
  // a named state; `custom` wins over `state` while set.
  setMix(mix) {
    this.custom = { bass: 0, brushes: 0, piano: 0, trumpet: 0, pad: 0, hum: 0, ...mix };
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
      this.start();
    }
  }

  setState(state) {
    if (!STATE_MIX[state] || state === this.state) return;
    this.state = state;
  }

  start() {
    this.stop();
    const beatMs = 60000 / this.bpm;
    try {
      ac();
    } catch {
      /* no audio */
    }
    this.timer = setInterval(() => this.tick(), beatMs);
  }

  tick() {
    const target = this.custom || { ...STATE_MIX[this.state], hum: 0 };
    if (musicOff) {
      // keep the beat clock alive for hazards; just don't sound it
      const b = this.beat++;
      if (this.scene && this.scene.events) this.scene.events.emit('beat', b);
      return;
    }
    // crossfade one beat's worth toward the target mix
    for (const k of Object.keys(this.level)) {
      this.level[k] += (target[k] - this.level[k]) * 0.5;
    }
    const b = this.beat++;
    try {
      if (this.level.bass > 0.05) tone(WALK[b % 8], 0.3, 'triangle', 0.2 * this.level.bass);
      if (this.level.brushes > 0.05 && b % 2 === 1) noise(0.09, 0.09 * this.level.brushes, 6000);
      if (this.level.piano > 0.05 && b % 4 === 0) {
        CHORD.forEach((f, i) => tone(f, 0.5, 'sine', 0.05 * this.level.piano, i * 0.03));
      }
      if (this.level.trumpet > 0.05 && b % 2 === 0) {
        tone([392, 440, 523, 587][(b >> 1) % 4], 0.25, 'square', 0.05 * this.level.trumpet);
      }
      if (this.level.pad > 0.05 && b % 8 === 0) tone(131, 3.2, 'sine', 0.06 * this.level.pad);
      // the sweeper humming the Orb melody, unaccompanied
      if (this.level.hum > 0.05 && b % 2 === 0) {
        tone([659, 784, 988, 1319, 988, 784][(b >> 1) % 6] / 2, 0.9, 'sine', 0.05 * this.level.hum);
      }
    } catch {
      /* silent */
    }
    if (this.scene && this.scene.events) this.scene.events.emit('beat', b);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.custom = null;
  }
}

export const musicDirector = new MusicDirector();

// D7 — stingers
export const sting = {
  checkpoint: () => [784, 1047].forEach((f, i) => tone(f, 0.35, 'sine', 0.25, i * 0.08)),
  gate: () => {
    tone(150, 0.5, 'square', 0.18);
    noise(0.35, 0.2, 400);
  },
  secret: () => [659, 880, 1319].forEach((f, i) => tone(f, 0.4, 'triangle', 0.2, i * 0.1)),
  foeOut: () => tone(180, 0.4, 'sawtooth', 0.2, 0, 70),
  death: () => [330, 262, 196, 147].forEach((f, i) => tone(f, 0.7, 'triangle', 0.22, i * 0.12)),
};

// --- generative stems (legacy helpers kept for the gig sequences) --------
const BASS_WALK = [98, 110, 123, 131, 147, 131, 123, 110];
const PIANO_CHORD = [262, 330, 392, 494];

function startStem(name, intervalMs, fire) {
  if (stems[name]) return;
  ac();
  stems[name] = {
    step: 0,
    id: setInterval(() => {
      const st = stems[name];
      if (!st) return;
      const step = st.step++;
      if (!musicOff) fire(step);
    }, intervalMs),
  };
}

export const music = {
  bass(on = true) {
    if (!on) return this.stop('bass');
    startStem('bass', 420, (s) => tone(BASS_WALK[s % 8], 0.3, 'triangle', 0.22));
  },
  piano(on = true) {
    if (!on) return this.stop('piano');
    startStem('piano', 1680, () => {
      PIANO_CHORD.forEach((f, i) => tone(f * (Math.random() < 0.2 ? 1.12 : 1), 0.5, 'sine', 0.06, i * 0.03));
    });
  },
  trumpet(on = true) {
    if (!on) return this.stop('trumpet');
    startStem('trumpet', 840, (s) => {
      if (s % 3 !== 2) tone([392, 440, 523, 587][s % 4], 0.25, 'square', 0.05);
    });
  },
  soloPiano(on = true) {
    if (!on) return this.stop('solo');
    startStem('solo', 2200, (s) => {
      tone([392, 440, 494, 523, 440, 392][s % 6], 1.4, 'sine', 0.14);
    });
  },
  stop(name) {
    if (name) {
      if (stems[name]) clearInterval(stems[name].id);
      delete stems[name];
    } else {
      Object.keys(stems).forEach((k) => this.stop(k));
    }
  },
};
