// Babble (audio pass, advice §3 "NPC chatter as a murmur"): a voice with no
// words. A buzzy source (a saw at the speaker's pitch, a 6 Hz jitter of
// ±3%, a breath of noise) through three vowel formants that glide from
// syllable to syllable. 4–8 syllables of 90–140 ms make a burst; a question
// rises at the end. Pure (no WebAudio): (sampleRate, opts) → Float32Array,
// so the offline tests measure exactly what the game plays.
//
// Vowel targets (F1/F2, Hz): a 700/1200, e 500/1800, i 300/2200, o 500/900,
// u 350/700. F3 sits at 2.5 kHz (a low voice) or 2.9 kHz (a high one).
export const VOWELS = Object.freeze({ a: [700, 1200], e: [500, 1800], i: [300, 2200], o: [500, 900], u: [350, 700] });
const V = Object.values(VOWELS);

export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

// a stable number for a name (a speaker always sounds like themselves)
export function hashId(id) {
  let h = 2166136261;
  for (const ch of String(id)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// the syllables of a burst: [{ t, dur, f1, f2 }]
export function babblePlan(seed, { syllables = null, secs = null } = {}) {
  const r = rng(seed);
  const n = secs ? Math.max(4, Math.round(secs / 0.13)) : syllables || 4 + Math.floor(r() * 5);
  const out = [];
  let t = 0.01;
  let last = -1;
  for (let k = 0; k < n; k++) {
    let vi = Math.floor(r() * V.length);
    if (vi === last) vi = (vi + 1) % V.length;
    last = vi;
    const dur = 0.09 + r() * 0.05;
    out.push({ t, dur, f1: V[vi][0], f2: V[vi][1] });
    t += dur + (r() < 0.2 ? 0.03 + r() * 0.05 : 0.008);
  }
  return out;
}

function bpCoefs(f, q, sr) {
  const w = (2 * Math.PI * Math.min(f, sr * 0.45)) / sr;
  const alpha = Math.sin(w) / (2 * q);
  const a0 = 1 + alpha;
  return { b0: alpha / a0, a1: (-2 * Math.cos(w)) / a0, a2: (1 - alpha) / a0 };
}

export function renderBabble(sr, { f0 = 110, seed = 1, syllables = null, secs = null, question = false, breath = 0.1, lp = null, peak = 0.5 } = {}) {
  const plan = babblePlan(seed, { syllables, secs });
  const last = plan[plan.length - 1];
  const total = last.t + last.dur + 0.06;
  const n = Math.floor(total * sr);
  const out = new Float32Array(n);
  const r = rng(seed * 7 + 3);
  const f3 = f0 > 160 ? 2900 : 2500;
  const st = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 3 biquads × (x1 x2 y1 y2)
  let ph = 0;
  let si = 0;
  let c = null;
  const jit = r() * 6.28;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    while (si < plan.length - 1 && t > plan[si].t + plan[si].dur) si++;
    const s = plan[si];
    const prev = plan[Math.max(0, si - 1)];
    // the pitch: a slow fall, a question's rise, a little jitter
    const u = t / total;
    const contour = question && u > 0.65 ? 0.92 + (u - 0.65) * 1.0 : 1 - 0.1 * u;
    const f = f0 * contour * (1 + 0.03 * Math.sin(2 * Math.PI * 6 * t + jit));
    ph += f / sr;
    if (ph >= 1) ph -= 1;
    // a band-limited saw (polyBLEP)
    const dt = f / sr;
    let saw = 2 * ph - 1;
    if (ph < dt) {
      const x = ph / dt;
      saw -= x + x - x * x - 1;
    } else if (ph > 1 - dt) {
      const x = (ph - 1) / dt;
      saw -= x * x + x + x + 1;
    }
    const src = saw * 0.6 + (r() * 2 - 1) * breath;
    // the formants glide over the first 40% of each syllable
    if (i % 32 === 0) {
      const g = Math.min(1, Math.max(0, (t - s.t) / (s.dur * 0.4)));
      const F1 = prev.f1 + (s.f1 - prev.f1) * g;
      const F2 = prev.f2 + (s.f2 - prev.f2) * g;
      c = [bpCoefs(F1, 5, sr), bpCoefs(F2, 8, sr), bpCoefs(f3, 10, sr)];
    }
    let y = 0;
    const amp = [1, 0.6, 0.25];
    for (let k = 0; k < 3; k++) {
      const q = c[k];
      const o = k * 4;
      const yk = q.b0 * src - q.b0 * st[o + 1] - q.a1 * st[o + 2] - q.a2 * st[o + 3];
      st[o + 1] = st[o];
      st[o] = src;
      st[o + 3] = st[o + 2];
      st[o + 2] = yk;
      y += yk * amp[k];
    }
    // each syllable's envelope: 15 ms in, 30 ms out
    const a = Math.min(1, (t - s.t) / 0.015) * Math.min(1, Math.max(0, (s.t + s.dur - t) / 0.03));
    out[i] = y * Math.max(0, a);
  }
  if (lp) {
    // a PA horn or a wall: two one-pole low-passes at `lp` Hz
    const k = 1 - Math.exp((-2 * Math.PI * lp) / sr);
    for (let pass = 0; pass < 2; pass++) {
      let z = 0;
      for (let i = 0; i < n; i++) out[i] = z += k * (out[i] - z);
    }
  }
  let pk = 0;
  for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(out[i]));
  const g = pk > 0 ? peak / pk : 0;
  for (let i = 0; i < n; i++) out[i] *= g;
  return out;
}
