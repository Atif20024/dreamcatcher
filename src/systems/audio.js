// All audio is synthesized with WebAudio — no asset files.
// sfx(name) fires one-shots; stems are generative jazz-ish loops.
let ctx = null;
let master = null;
const stems = {};

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
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
};

export function sfx(name) {
  try {
    if (SFX[name]) SFX[name]();
  } catch {
    /* audio unavailable — stay silent */
  }
}

// --- generative stems ---------------------------------------------------
const BASS_WALK = [98, 110, 123, 131, 147, 131, 123, 110];
const PIANO_CHORD = [262, 330, 392, 494];

function startStem(name, intervalMs, fire) {
  if (stems[name]) return;
  ac();
  stems[name] = { step: 0, id: setInterval(() => fire(stems[name].step++), intervalMs) };
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
