// Era ambience (THE MASTER'S LADDER, then any dream): a small kit of
// synthesised world sounds and loops written as RECIPES (data), so a later
// audio pass can retune or reuse them without touching code. Pure (no
// WebAudio): a loop is (sampleRate) → Float32Array, mono, seamless.
//
//   SOUNDS.<name>(buf, sr, r, opts)   paints one sound family into a buffer
//   RECIPES.<loop> = { seconds, seed, layers: [[sound, opts], …], gain }
//   ERA_LOOPS.<loop>(sr)              renders a recipe (merged into LOOPS)
//
// Sounds: swallows (high chirps in bursts), chatter (voices: noise through
// moving vowel formants), fountain (band-passed water with a slow ripple),
// bell (inharmonic partials, a long tail), scrape (a pestle or a trowel:
// filtered noise strokes at a steady rate), crackle (a hearth), bubbles (an
// alembic), clink (glass), steps (footsteps on flags), chisel (a metallic
// tick), quill (a scratch), murmur (a low room bed), wind (a soft wash),
// drone (a held open fifth, the organ's breath in an empty church).

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

// a two-pole resonant band-pass (RBJ biquad), in place over `src` → new array
function bandpass(src, sr, f, q) {
  const w = (2 * Math.PI * f) / sr;
  const alpha = Math.sin(w) / (2 * q);
  const b0 = alpha;
  const a0 = 1 + alpha;
  const a1 = -2 * Math.cos(w);
  const a2 = 1 - alpha;
  const out = new Float32Array(src.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < src.length; i++) {
    const x = src[i];
    const y = (b0 * x - b0 * x2 - a1 * y1 - a2 * y2) / a0;
    out[i] = y;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
  }
  return out;
}

function lowpass1(src, k) {
  const out = new Float32Array(src.length);
  let y = 0;
  for (let i = 0; i < src.length; i++) {
    y += k * (src[i] - y);
    out[i] = y;
  }
  return out;
}

function noise(n, r) {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = r() * 2 - 1;
  return out;
}

// add `src` into `buf` from sample i0 (wrapping: loops are circular)
function addAt(buf, src, i0, vol, env = null) {
  const L = buf.length;
  for (let i = 0; i < src.length; i++) buf[(i0 + i) % L] += src[i] * vol * (env ? env(i / src.length) : 1);
}

function tone(sr, dur, f, { decay = 3, attack = 0.005, shape = 'sine', glide = 0, vib = 0, vibHz = 5 } = {}) {
  const n = Math.floor(dur * sr);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.min(1, t / attack) * Math.exp((-decay * t) / dur);
    const ff = f + glide * (t / dur) + (vib ? Math.sin(t * 2 * Math.PI * vibHz) * vib : 0);
    ph += (2 * Math.PI * ff) / sr;
    out[i] = (shape === 'tri' ? (2 / Math.PI) * Math.asin(Math.sin(ph)) : Math.sin(ph)) * env;
  }
  return out;
}

export const SOUNDS = {
  // swallows: bursts of 3–7 quick high chirps, each a fast downward glide
  swallows(buf, sr, r, { rate = 0.4, vol = 0.05, lo = 3000, hi = 6000 } = {}) {
    const dur = buf.length / sr;
    for (let k = 0; k < dur * rate; k++) {
      let t = r() * dur;
      const n = 3 + Math.floor(r() * 5);
      for (let c = 0; c < n; c++) {
        const f = lo + r() * (hi - lo);
        addAt(buf, tone(sr, 0.05 + r() * 0.03, f, { decay: 2, glide: -f * 0.25, shape: 'tri' }), Math.floor(t * sr), vol * (0.6 + r() * 0.4));
        t += 0.07 + r() * 0.06;
      }
    }
  },
  // voices: syllables of noise through two vowel formants, in phrases
  chatter(buf, sr, r, { voices = 4, vol = 0.05, pitch = 1 } = {}) {
    const dur = buf.length / sr;
    const VOWELS = [[700, 1200], [500, 1500], [300, 2200], [400, 900], [600, 1700]];
    for (let v = 0; v < voices; v++) {
      let t = r() * 2;
      const p = pitch * (0.85 + r() * 0.35);
      while (t < dur - 0.4) {
        const syl = 3 + Math.floor(r() * 8);
        for (let s = 0; s < syl; s++) {
          const len = 0.09 + r() * 0.12;
          const [f1, f2] = VOWELS[Math.floor(r() * VOWELS.length)];
          const src = noise(Math.floor(len * sr), r);
          const a = bandpass(src, sr, f1 * p, 6);
          const b = bandpass(src, sr, f2 * p, 8);
          for (let i = 0; i < a.length; i++) a[i] = a[i] + b[i] * 0.6;
          addAt(buf, a, Math.floor(t * sr), vol, (x) => Math.sin(Math.PI * x));
          t += len * (0.8 + r() * 0.4);
        }
        t += 0.4 + r() * 1.6;
      }
    }
  },
  // water: a steady band of noise with a slow ripple and bright droplets
  fountain(buf, sr, r, { vol = 0.06, lo = 1000, hi = 5000 } = {}) {
    const n = buf.length;
    const src = noise(n, r);
    const band = bandpass(src, sr, Math.sqrt(lo * hi), 0.6);
    for (let i = 0; i < n; i++) buf[i] += band[i] * vol * (0.75 + 0.25 * Math.sin((i / sr) * 2 * Math.PI * 0.7) * Math.sin((i / sr) * 2 * Math.PI * 0.23));
    for (let k = 0; k < (n / sr) * 6; k++) addAt(buf, tone(sr, 0.03, 1800 + r() * 2400, { decay: 4, glide: 600 }), Math.floor(r() * n), vol * 0.25);
  },
  // a church bell: inharmonic partials (hum, prime, minor third, fifth,
  // nominal…), a long tail; `strikes` tolls `gap` s apart from `at`
  bell(buf, sr, r, { f = 220, vol = 0.06, at = 1, strikes = 1, gap = 3.2, tail = 7 } = {}) {
    const PARTIALS = [[0.5, 0.35], [1, 0.6], [1.19, 0.4], [1.5, 0.25], [2, 0.45], [2.51, 0.15], [3.01, 0.1]];
    for (let s = 0; s < strikes; s++) {
      const i0 = Math.floor((at + s * gap) * sr);
      for (const [m, a] of PARTIALS) addAt(buf, tone(sr, tail * (m < 1 ? 1.3 : 1 / Math.sqrt(m)), f * m, { decay: 3.2, attack: 0.002 }), i0, vol * a);
      addAt(buf, noise(Math.floor(0.01 * sr), r), i0, vol * 0.3, (x) => 1 - x); // the clapper
    }
  },
  // a pestle in a mortar, a muller on the slab, a trowel: strokes of
  // filtered noise at a steady rate, a little uneven
  scrape(buf, sr, r, { rate = 1.2, vol = 0.05, f = 900, len = 0.32 } = {}) {
    const dur = buf.length / sr;
    for (let t = 0.1; t < dur; t += (1 / rate) * (0.92 + r() * 0.16)) {
      const src = bandpass(noise(Math.floor(len * sr), r), sr, f * (0.9 + r() * 0.2), 1.2);
      addAt(buf, src, Math.floor(t * sr), vol, (x) => Math.sin(Math.PI * x) ** 0.6);
    }
  },
  // a hearth: a low roar and pops
  crackle(buf, sr, r, { vol = 0.05, pops = 6 } = {}) {
    const n = buf.length;
    const roar = lowpass1(noise(n, r), 0.01);
    for (let i = 0; i < n; i++) buf[i] += roar[i] * vol * 2.2;
    for (let k = 0; k < (n / sr) * pops; k++) addAt(buf, noise(Math.floor(0.004 * sr), r), Math.floor(r() * n), vol * (0.5 + r()), (x) => (1 - x) ** 2);
  },
  // an alembic: a low simmer and bubbles that rise in pitch
  bubbles(buf, sr, r, { vol = 0.05, rate = 5 } = {}) {
    const n = buf.length;
    const sim = lowpass1(noise(n, r), 0.02);
    for (let i = 0; i < n; i++) buf[i] += sim[i] * vol * 1.5;
    for (let k = 0; k < (n / sr) * rate; k++) addAt(buf, tone(sr, 0.04 + r() * 0.04, 300 + r() * 500, { decay: 3, glide: 400 + r() * 500 }), Math.floor(r() * n), vol * 0.6);
  },
  // glass and a scale's chain: small bright clinks
  clink(buf, sr, r, { vol = 0.03, count = 4 } = {}) {
    const n = buf.length;
    for (let k = 0; k < count; k++) {
      const i0 = Math.floor(r() * n);
      const f = 2200 + r() * 1800;
      for (const m of [1, 2.76, 5.4]) addAt(buf, tone(sr, 0.4, f * m, { decay: 5 }), i0, vol / m);
    }
  },
  // footsteps on stone: soft low knocks in a walking rhythm, far away
  steps(buf, sr, r, { vol = 0.04, pace = 0.55, walks = 2 } = {}) {
    const dur = buf.length / sr;
    for (let w = 0; w < walks; w++) {
      let t = r() * dur * 0.5;
      const n = 4 + Math.floor(r() * 6);
      for (let s = 0; s < n && t < dur; s++, t += pace * (0.95 + r() * 0.1)) {
        addAt(buf, tone(sr, 0.08, 110 + r() * 30, { decay: 6 }), Math.floor(t * sr), vol);
        addAt(buf, bandpass(noise(Math.floor(0.03 * sr), r), sr, 1500, 2), Math.floor(t * sr), vol * 0.4, (x) => 1 - x);
      }
    }
  },
  // a mason's chisel on the dome side: a dry metallic tick every `every` s
  chisel(buf, sr, r, { vol = 0.025, every = 0.4, f = 3200, runs = 2 } = {}) {
    const dur = buf.length / sr;
    for (let k = 0; k < runs; k++) {
      let t = r() * dur * 0.6;
      const n = 6 + Math.floor(r() * 10);
      for (let s = 0; s < n && t < dur; s++, t += every) for (const m of [1, 1.47, 2.3]) addAt(buf, tone(sr, 0.06, f * m, { decay: 8 }), Math.floor(t * sr), vol / m);
    }
  },
  // a quill on paper: short high scratches in clusters
  quill(buf, sr, r, { vol = 0.02, clusters = 3 } = {}) {
    const dur = buf.length / sr;
    for (let c = 0; c < clusters; c++) {
      let t = r() * dur;
      for (let s = 0; s < 6 + r() * 8; s++, t += 0.08 + r() * 0.1) addAt(buf, bandpass(noise(Math.floor(0.05 * sr), r), sr, 4000, 3), Math.floor(t * sr), vol, (x) => Math.sin(Math.PI * x));
    }
  },
  // a room's low bed: distant voices and air, low-passed (the street through a wall)
  murmur(buf, sr, r, { vol = 0.05, k = 0.015 } = {}) {
    const n = buf.length;
    const bed = lowpass1(lowpass1(noise(n, r), k), k * 2);
    for (let i = 0; i < n; i++) buf[i] += bed[i] * vol * 4 * (0.7 + 0.3 * Math.sin((i / n) * Math.PI * 4));
  },
  // a soft open-air wash (the wind over roofs)
  wind(buf, sr, r, { vol = 0.04 } = {}) {
    const n = buf.length;
    const w = lowpass1(noise(n, r), 0.03);
    for (let i = 0; i < n; i++) buf[i] += w[i] * vol * 2 * (0.6 + 0.4 * Math.sin((i / n) * Math.PI * 2));
  },
  // the church's breath: a held open fifth (D + A), slow swell
  drone(buf, sr, r, { f = 73.4, vol = 0.03 } = {}) {
    const n = buf.length;
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const sw = 0.7 + 0.3 * Math.sin((i / n) * Math.PI * 2);
      buf[i] += vol * sw * (Math.sin(2 * Math.PI * f * t) + 0.6 * Math.sin(2 * Math.PI * f * 1.5 * t) + 0.25 * Math.sin(2 * Math.PI * f * 2 * t));
    }
  },
  // --- audio pass: the station, the stadium, the ward, a second clock ---
  // mains hum: a fundamental and its second harmonic, very low
  hum(buf, sr, r, { f = 60, vol = 0.02 } = {}) {
    for (let i = 0; i < buf.length; i++) {
      const t = i / sr;
      buf[i] += vol * (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(4 * Math.PI * f * t));
    }
  },
  // a monitor's beep (or a console's): `f` Hz every `every` s
  beeps(buf, sr, r, { f = 1000, every = 1, vol = 0.03, len = 0.09, offset = 0 } = {}) {
    const dur = buf.length / sr;
    for (let t = offset; t < dur; t += every) addAt(buf, tone(sr, len, f, { decay: 1, attack: 0.004 }), Math.floor(t * sr), vol, (x) => (x > 0.85 ? (1 - x) / 0.15 : 1));
  },
  // a clock's escapement: a tick every `every` s, tock a little lower
  ticks(buf, sr, r, { every = 1, vol = 0.05, f = 1900 } = {}) {
    const dur = buf.length / sr;
    let k = 0;
    for (let t = 0.05; t < dur - 0.02; t += every, k++) {
      addAt(buf, bandpass(noise(Math.floor(0.01 * sr), r), sr, k % 2 ? f * 0.82 : f, 4), Math.floor(t * sr), vol * 3, (x) => (1 - x) ** 2);
    }
  },
  // rain: a broad wash (1–6 kHz) and drops on hard things
  rain(buf, sr, r, { vol = 0.05, f = 2600, q = 0.5, drops = 6 } = {}) {
    const n = buf.length;
    const w = bandpass(noise(n, r), sr, f, q);
    for (let i = 0; i < n; i++) buf[i] += w[i] * vol * 2;
    for (let k = 0; k < (n / sr) * drops; k++) addAt(buf, tone(sr, 0.02, 1600 + r() * 2200, { decay: 6 }), Math.floor(r() * n), vol * 0.5);
  },
  // a crowd in a big space: a band of noise that swells and settles
  roar(buf, sr, r, { vol = 0.05, f = 700, swells = 2 } = {}) {
    const n = buf.length;
    const w = bandpass(noise(n, r), sr, f, 0.7);
    for (let i = 0; i < n; i++) buf[i] += w[i] * vol * 2 * (0.65 + 0.35 * Math.sin((i / n) * Math.PI * 2 * swells) ** 2);
  },
  // a pump or a vent: low air that breathes at `hz`
  pump(buf, sr, r, { vol = 0.04, hz = 0.2, k = 0.02 } = {}) {
    const n = buf.length;
    const w = lowpass1(noise(n, r), k);
    // whole cycles only, so the loop still meets itself
    const cycles = Math.max(1, Math.round((n / sr) * hz));
    for (let i = 0; i < n; i++) buf[i] += w[i] * vol * 3 * (0.6 + 0.4 * Math.sin((i / n) * Math.PI * 2 * cycles));
  },
  // a cheap baked echo: copies of the buffer, later and quieter (a stone room)
  echo(buf, sr, r, { delay = 0.11, taps = 4, fb = 0.45 } = {}) {
    const src = Float32Array.from(buf);
    for (let k = 1; k <= taps; k++) addAt(buf, lowpass1(src, 0.5 / k), Math.floor(k * delay * sr), fb ** k);
  },
};

// the loops, as data: [sound, options] layers over `seconds` (seamless)
export const RECIPES = {
  // the bottega: the muller on the slab, the hearth, the street through the wall
  rn_bottega: { seconds: 8, seed: 41, rms: -38, layers: [['murmur', { vol: 0.04 }], ['scrape', { rate: 1.2, vol: 0.05, f: 700 }], ['crackle', { vol: 0.03, pops: 5 }], ['echo', { delay: 0.07, taps: 2, fb: 0.25 }]] },
  // the street: swallows, voices, a cart, a hammer somewhere
  rn_street: { seconds: 12, seed: 42, rms: -36, layers: [['wind', { vol: 0.02 }], ['chatter', { voices: 3, vol: 0.035 }], ['swallows', { rate: 0.35, vol: 0.04 }], ['chisel', { vol: 0.012, every: 0.55, f: 1400, runs: 1 }]] },
  // the colour-seller: the alembic, glass, a creak, the street muffled
  rn_speziale: { seconds: 8, seed: 43, rms: -39, layers: [['murmur', { vol: 0.03 }], ['bubbles', { vol: 0.035, rate: 4 }], ['clink', { vol: 0.025, count: 3 }], ['echo', { delay: 0.06, taps: 2, fb: 0.22 }]] },
  // the square: the fountain, the crowd, swallows, the masons on the dome,
  // and the bell for the hour, once, far off
  rn_piazza: { seconds: 20, seed: 44, rms: -34, layers: [['fountain', { vol: 0.035 }], ['chatter', { voices: 6, vol: 0.03 }], ['swallows', { rate: 0.3, vol: 0.035 }], ['chisel', { vol: 0.015, every: 0.4 }], ['bell', { f: 196, vol: 0.035, at: 6, strikes: 1, tail: 9 }]] },
  // the guild hall: a stone echo, a quill, steps, a low murmur
  rn_hall: { seconds: 10, seed: 45, rms: -39, layers: [['murmur', { vol: 0.035, k: 0.02 }], ['quill', { vol: 0.018, clusters: 3 }], ['steps', { vol: 0.03, pace: 0.6, walks: 2 }], ['echo', { delay: 0.13, taps: 5, fb: 0.5 }]] },
  // the palazzo: the courtyard fountain far below, a door latch, quiet
  rn_palazzo: { seconds: 10, seed: 46, rms: -40, layers: [['fountain', { vol: 0.018, lo: 800, hi: 3000 }], ['steps', { vol: 0.02, pace: 0.7, walks: 1 }], ['clink', { vol: 0.012, count: 1 }], ['echo', { delay: 0.09, taps: 3, fb: 0.35 }]] },
  // the chapel: the long echo, a trowel on plaster, the rival's chisel across
  // the nave, pigeons up in the vault, the church's open fifth under it all
  rn_chapel: { seconds: 12, seed: 47, rms: -37, layers: [['drone', { f: 73.4, vol: 0.018 }], ['scrape', { rate: 0.5, vol: 0.03, f: 1200, len: 0.4 }], ['chisel', { vol: 0.012, every: 0.5, runs: 1 }], ['swallows', { rate: 0.12, vol: 0.02, lo: 1500, hi: 2600 }], ['steps', { vol: 0.02, walks: 1 }], ['echo', { delay: 0.21, taps: 6, fb: 0.6 }]] },

  // --- audio pass ------------------------------------------------------
  // Crossroads: the hall's air (low noise, a 60 Hz hum), and its crowd
  // (voices, feet, the hall's echo), mixed by how full the station is
  // (feedback 4, "the noise in the background is repetitive … not so
  // dominating": long loops, a second crowd of another length under the
  // first (src/audio/synthLoops.js LOOP_LAYERS) and quieter overall)
  hub_hall: { seconds: 21, seed: 51, rms: -43, layers: [['murmur', { vol: 0.05, k: 0.01 }], ['hum', { f: 60, vol: 0.005 }], ['echo', { delay: 0.17, taps: 4, fb: 0.5 }]] },
  hub_crowd: { seconds: 26, seed: 52, rms: -41, layers: [['chatter', { voices: 5, vol: 0.03, pitch: 0.9 }], ['steps', { vol: 0.03, pace: 0.5, walks: 4 }], ['echo', { delay: 0.17, taps: 4, fb: 0.5 }]] },
  hub_crowd_far: { seconds: 17, seed: 57, rms: -46, layers: [['chatter', { voices: 3, vol: 0.03, pitch: 1.05 }], ['steps', { vol: 0.02, pace: 0.7, walks: 2 }], ['echo', { delay: 0.23, taps: 5, fb: 0.55 }]] },
  // THE FINISH LINE (athlete, unlaunched): a stadium's crowd under the wind
  pistol: { seconds: 12, seed: 53, rms: -35, layers: [['roar', { vol: 0.05, f: 800, swells: 2 }], ['chatter', { voices: 6, vol: 0.02 }], ['wind', { vol: 0.02 }], ['echo', { delay: 0.25, taps: 3, fb: 0.35 }]] },
  // THE WHITE COAT (doctor, unlaunched): a ward's monitors, the vent
  monitors: { seconds: 8, seed: 54, rms: -38, layers: [['pump', { vol: 0.03, hz: 0.25 }], ['beeps', { f: 988, every: 1, vol: 0.03 }], ['beeps', { f: 1319, every: 0.8, vol: 0.012, offset: 0.37 }], ['echo', { delay: 0.08, taps: 2, fb: 0.25 }]] },
  // second layers (src/audio/synthLoops.js LOOP_LAYERS): other lengths
  rain_far: { seconds: 9, seed: 55, rms: -38, layers: [['rain', { vol: 0.05, f: 1800, q: 0.6, drops: 3 }]] },
  rain_window: { seconds: 9, seed: 56, rms: -42, layers: [['rain', { vol: 0.04, f: 1400, q: 0.7, drops: 5 }]] },
  clock_slow: { seconds: 9.59, seed: 57, rms: -42, layers: [['ticks', { every: 1.37, vol: 0.05, f: 1500 }]] },
  casino_murmur: { seconds: 10, seed: 58, rms: -38, layers: [['chatter', { voices: 5, vol: 0.03 }], ['clink', { vol: 0.02, count: 5 }], ['murmur', { vol: 0.02 }]] },
  station_vent: { seconds: 10, seed: 59, rms: -42, layers: [['pump', { vol: 0.04, hz: 0.2, k: 0.01 }]] },
  kitchen_fan: { seconds: 7, seed: 60, rms: -42, layers: [['pump', { vol: 0.03, hz: 0.43, k: 0.04 }], ['hum', { f: 120, vol: 0.006 }]] },
};

function seamless(buf, sr, fade = 0.3) {
  const n = Math.floor(fade * sr);
  const L = buf.length;
  for (let i = 0; i < n; i++) {
    const k = i / n;
    buf[i] = buf[i] * k + buf[L - n + i] * (1 - k);
  }
  return buf.subarray(0, L - n);
}

export function renderRecipe(rec, sr) {
  const r = rng(rec.seed || 1);
  const buf = new Float32Array(Math.floor((rec.seconds + 0.3) * sr));
  for (const [name, opts] of rec.layers) SOUNDS[name](buf, sr, r, opts || {});
  // level: to the recipe's RMS target (dBFS, default -36, the level of the
  // other dreams' beds), never past a -6 dBFS peak
  let peak = 0;
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    peak = Math.max(peak, Math.abs(buf[i]));
    sum += buf[i] * buf[i];
  }
  const rms = Math.sqrt(sum / buf.length) || 1e-9;
  let g = 10 ** ((rec.rms ?? -36) / 20) / rms;
  if (peak * g > 0.5) g = 0.5 / peak;
  if (g !== 1) for (let i = 0; i < buf.length; i++) buf[i] *= g;
  return seamless(buf, sr);
}

export const ERA_LOOPS = Object.fromEntries(Object.entries(RECIPES).map(([k, rec]) => [k, (sr) => renderRecipe(rec, sr)]));
