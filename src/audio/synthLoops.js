// Procedural ambience loops (plan 2.13, 8.2 #6): every loop is synthesised
// here into a sample buffer once, so there are no downloads and nothing to
// credit. A loop is a function (sr) → Float32Array (mono, seamless: the end
// fades into the start). Pure (no WebAudio), so it can be unit-tested.
// Names include the `ambientLoop` ids declared in src/data/dreams.js.

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

// one-pole low-pass over white noise
function brown(n, r, k = 0.02) {
  const out = new Float32Array(n);
  let y = 0;
  for (let i = 0; i < n; i++) {
    y += k * (r() * 2 - 1 - y);
    out[i] = y;
  }
  return out;
}

function band(n, r, lo = 0.05, hi = 0.3) {
  // crude band-pass: high-passed low-pass noise
  const out = new Float32Array(n);
  let a = 0;
  let b = 0;
  for (let i = 0; i < n; i++) {
    a += hi * (r() * 2 - 1 - a);
    b += lo * (a - b);
    out[i] = a - b;
  }
  return out;
}

function addTone(buf, sr, t0, dur, f, vol, { glide = 0, vib = 0, shape = 'sine' } = {}) {
  const i0 = Math.floor(t0 * sr);
  const n = Math.floor(dur * sr);
  let ph = 0;
  for (let i = 0; i < n && i0 + i < buf.length; i++) {
    const t = i / sr;
    const env = Math.min(1, t / 0.01) * Math.exp((-3 * t) / dur);
    const ff = f + glide * (t / dur) + (vib ? Math.sin(t * 2 * Math.PI * 5) * vib : 0);
    ph += (2 * Math.PI * ff) / sr;
    const s = shape === 'tri' ? (2 / Math.PI) * Math.asin(Math.sin(ph)) : Math.sin(ph);
    buf[(i0 + i) % buf.length] += s * vol * env;
  }
}

function addClick(buf, sr, t0, vol, r, len = 0.006, tone = 0) {
  const i0 = Math.floor(t0 * sr);
  const n = Math.floor(len * sr);
  for (let i = 0; i < n; i++) {
    const e = 1 - i / n;
    const s = tone ? Math.sin((2 * Math.PI * tone * i) / sr) : r() * 2 - 1;
    buf[(i0 + i) % buf.length] += s * vol * e * e;
  }
}

function seamless(buf, sr, fade = 0.25) {
  const n = Math.floor(fade * sr);
  const L = buf.length;
  for (let i = 0; i < n; i++) {
    const k = i / n;
    buf[i] = buf[i] * k + buf[L - n + i] * (1 - k);
  }
  return buf.subarray(0, L - n);
}

function mixInto(buf, src, vol, mod = null) {
  for (let i = 0; i < buf.length; i++) buf[i] += src[i % src.length] * vol * (mod ? mod(i) : 1);
}

const crickets = (buf, sr, r, density = 3, f = 4200) => {
  const dur = buf.length / sr;
  for (let k = 0; k < dur * density; k++) {
    const t0 = r() * dur;
    for (let c = 0; c < 3; c++) addTone(buf, sr, t0 + c * 0.06, 0.035, f + r() * 600, 0.012, { shape: 'tri' });
  }
};

export const LOOPS = {
  // the proof dream
  dusk_lane(sr) {
    const r = rng(11);
    const n = sr * 8;
    const buf = new Float32Array(n);
    mixInto(buf, brown(n, r, 0.015), 0.5, (i) => 0.6 + 0.4 * Math.sin((i / n) * Math.PI * 2));
    crickets(buf, sr, r, 2);
    return seamless(buf, sr);
  },
  meadow_dusk(sr) {
    const r = rng(12);
    const n = sr * 8;
    const buf = new Float32Array(n);
    mixInto(buf, band(n, r, 0.02, 0.2), 0.12, (i) => 0.5 + 0.5 * Math.sin((i / n) * Math.PI * 4));
    crickets(buf, sr, r, 5, 4600);
    addTone(buf, sr, 3.1, 0.5, 420, 0.02, { glide: -60 });
    addTone(buf, sr, 3.7, 0.7, 400, 0.018, { glide: -50 });
    return seamless(buf, sr);
  },
  clock_room(sr) {
    const r = rng(13);
    const n = sr * 4;
    const buf = new Float32Array(n);
    for (let k = 0; k < 8; k++) addClick(buf, sr, k * 0.5, 0.18, r, 0.008, k % 2 ? 2100 : 1700);
    addTone(buf, sr, 0, 4, 55, 0.012);
    for (let k = 0; k < 14; k++) addClick(buf, sr, r() * 4, 0.04 + r() * 0.05, r, 0.004); // the stove crackle
    return seamless(buf, sr, 0.05);
  },
  bell_yard(sr) {
    const r = rng(14);
    const n = sr * 10;
    const buf = new Float32Array(n);
    mixInto(buf, brown(n, r, 0.03), 0.45, (i) => 0.5 + 0.5 * Math.sin((i / n) * Math.PI * 2));
    addTone(buf, sr, 1, 6, 196, 0.02);
    addTone(buf, sr, 1, 6, 392, 0.008);
    crickets(buf, sr, r, 1.5);
    return seamless(buf, sr);
  },
  // the ambientLoop ids in src/data/dreams.js
  sizzle(sr) {
    const r = rng(21);
    const n = sr * 4;
    const buf = new Float32Array(n);
    mixInto(buf, band(n, r, 0.3, 0.9), 0.05);
    for (let k = 0; k < 120; k++) addClick(buf, sr, r() * 4, 0.05 + r() * 0.08, r, 0.003);
    return seamless(buf, sr, 0.1);
  },
  tuning(sr) {
    const r = rng(22);
    const n = sr * 8;
    const buf = new Float32Array(n);
    mixInto(buf, brown(n, r, 0.01), 0.3);
    for (let k = 0; k < 6; k++) addTone(buf, sr, 0.5 + k * 1.2, 1.1, [220, 330, 294, 440, 247, 392][k], 0.02, { vib: 3 });
    return seamless(buf, sr);
  },
  typewriter(sr) {
    const r = rng(23);
    const n = sr * 6;
    const buf = new Float32Array(n);
    let t = 0.2;
    while (t < 5.2) {
      addClick(buf, sr, t, 0.12, r, 0.01, 900 + r() * 300);
      t += 0.09 + r() * 0.12;
    }
    addTone(buf, sr, 5.4, 0.12, 1600, 0.04);
    return seamless(buf, sr, 0.1);
  },
  cicadas(sr) {
    const r = rng(24);
    const n = sr * 6;
    const buf = new Float32Array(n);
    const b = band(n, r, 0.4, 0.95);
    mixInto(buf, b, 0.08, (i) => 0.5 + 0.5 * Math.sin((i / sr) * 2 * Math.PI * 28) * (0.6 + 0.4 * Math.sin((i / n) * Math.PI * 2)));
    return seamless(buf, sr);
  },
  engines(sr) {
    const r = rng(25);
    const n = sr * 6;
    const buf = new Float32Array(n);
    mixInto(buf, brown(n, r, 0.004), 1.2);
    addTone(buf, sr, 0, 6, 60, 0.03);
    addTone(buf, sr, 0, 6, 120, 0.012);
    return seamless(buf, sr);
  },
  slots(sr) {
    const r = rng(26);
    const n = sr * 8;
    const buf = new Float32Array(n);
    mixInto(buf, band(n, r, 0.01, 0.08), 0.25);
    for (let k = 0; k < 10; k++) addTone(buf, sr, r() * 7.5, 0.4, [1047, 1319, 1568][k % 3], 0.012);
    return seamless(buf, sr);
  },
};

export const LOOP_NAMES = Object.keys(LOOPS);
