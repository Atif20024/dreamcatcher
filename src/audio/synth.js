// The one synth voice every sound in the game is built from (audio pass).
// Imports nothing, so systems/audio.js (the master), AudioBus (the buses)
// and the instruments can all share it without an import cycle.
//
//   voice(ctx, dest, { freq, dur, type, vol, at | when, attack, hold, glide,
//                      filter: { type, f, q }, vib, vibHz, prio, detune })
//   noiseVoice(ctx, dest, { dur, vol, f, q, at | when, env: 'exp' | 'lin', prio })
//
// Rules from docs/redesign/advice/audio_advice.md §4, enforced here so no
// caller can forget them:
//  - no hard steps: every voice ramps in (5 ms default; brass 15 ms)
//  - squares are never raw: a low-pass at 3 kHz or below, and above four a
//    second the next square is played as a triangle (softer, same pitch)
//  - raw saws get a 6 kHz low-pass
//  - a voice cap (24 oscillators, 8 noise sources): a new voice steals the
//    oldest lower-priority one, else it is dropped. Stingers are never stolen.
//  - noise reuses one shared buffer per context (no per-shot allocation)

export const PRIO = Object.freeze({ chatter: 0, event: 1, ambience: 1, music: 2, sfx: 3, ui: 3, sting: 4 });

// --- the voice cap ----------------------------------------------------------
export class VoicePool {
  constructor({ osc = 24, noise = 8 } = {}) {
    this.cap = { osc, noise };
    this.live = { osc: [], noise: [] };
    this.stolen = 0;
    this.dropped = 0;
    this.peak = { osc: 0, noise: 0 };
  }

  purge(now) {
    for (const k of ['osc', 'noise']) this.live[k] = this.live[k].filter((v) => v.end > now);
  }

  // → a slot (call slot.bind(stopFn)) or null when the voice must not play
  claim(kind, prio, start, end, now) {
    this.purge(now);
    const list = this.live[kind];
    if (list.length >= this.cap[kind]) {
      let victim = null;
      for (const v of list) if (v.prio < prio && v.prio < PRIO.sting && (!victim || v.prio < victim.prio || (v.prio === victim.prio && v.start < victim.start))) victim = v;
      if (victim) {
        list.splice(list.indexOf(victim), 1);
        this.stolen += 1;
        try {
          if (victim.stop) victim.stop(now);
        } catch {
          /* already gone */
        }
      } else if (prio < PRIO.sting) {
        this.dropped += 1;
        return null;
      }
    }
    const slot = { prio, start, end, stop: null, bind: (fn) => (slot.stop = fn) };
    list.push(slot);
    this.peak[kind] = Math.max(this.peak[kind], list.length);
    return slot;
  }

  count(now) {
    this.purge(now);
    return { osc: this.live.osc.length, noise: this.live.noise.length };
  }

  reset() {
    this.live = { osc: [], noise: [] };
    this.stolen = 0;
    this.dropped = 0;
    this.peak = { osc: 0, noise: 0 };
  }
}

export const pool = new VoicePool();

// late-bound links (set by AudioBus / systems/audio.js, read at call time)
export const audioHooks = {
  bus: null, // (name) → a bus GainNode or null
  sting: null, // () → duck the music under a stinger
  flat: null, // (bus) → the gain that undoes a bus's level and trim
};
export function busNode(name) {
  try {
    return audioHooks.bus ? audioHooks.bus(name) : null;
  } catch {
    return null;
  }
}

// squares: at most four a second (the rest play as triangles)
const squareTimes = [];
function squareOk(now) {
  while (squareTimes.length && squareTimes[0] < now - 1) squareTimes.shift();
  if (squareTimes.length >= 4) return false;
  squareTimes.push(now);
  return true;
}

const startOf = (ctx, o) => (o.at !== undefined && o.at !== null ? Math.max(ctx.currentTime, o.at) : ctx.currentTime + (o.when || 0));

export function voice(ctx, dest, o) {
  if (!ctx || !dest || !o || !o.freq) return null;
  const t = startOf(ctx, o);
  const dur = Math.max(0.01, o.dur ?? 0.3);
  const attack = Math.max(0.003, o.attack ?? 0.005);
  const hold = o.hold || 0;
  const end = t + attack + hold + dur;
  const slot = pool.claim('osc', o.prio ?? PRIO.sfx, t, end + 0.05, ctx.currentTime);
  if (!slot) return null;
  let type = o.type || 'sine';
  let filter = o.filter || null;
  if (type === 'square') {
    if (!squareOk(t)) type = 'triangle';
    else filter = filter && filter.type === 'lowpass' ? { ...filter, f: Math.min(filter.f || 3000, 3000) } : filter || { type: 'lowpass', f: 2800, q: 0.7 };
  } else if (type === 'sawtooth' && !filter) filter = { type: 'lowpass', f: 6000, q: 0.7 };
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = o.freq;
  if (o.detune) osc.detune.value = o.detune;
  if (o.glide) {
    osc.frequency.setValueAtTime(o.freq, t);
    osc.frequency.linearRampToValueAtTime(o.glide, end);
  }
  const vol = Math.max(0.0002, o.vol ?? 0.3);
  // silent until its start: a gain is 1 before its first event, and a
  // triangle starts at -1 (a full-scale click on the first sample)
  g.gain.value = 0;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  if (hold > 0) g.gain.setValueAtTime(vol, t + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0005, end);
  g.gain.linearRampToValueAtTime(0, end + 0.02);
  let node = osc;
  let f = null;
  if (filter) {
    f = ctx.createBiquadFilter();
    f.type = filter.type || 'lowpass';
    f.frequency.value = filter.f || 2000;
    f.Q.value = filter.q ?? 0.8;
    if (filter.to) {
      f.frequency.setValueAtTime(filter.f || 2000, t);
      f.frequency.linearRampToValueAtTime(filter.to, end);
    }
    node.connect(f);
    node = f;
  }
  node.connect(g);
  g.connect(dest);
  let lfo = null;
  if (o.vib) {
    lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = o.vibHz || 5;
    lg.gain.value = o.vib;
    lfo.connect(lg).connect(osc.frequency);
    lfo.start(t);
    lfo.stop(end + 0.05);
  }
  osc.start(t);
  osc.stop(end + 0.05);
  // free the graph as soon as the voice ends (the 8 GB laptop)
  osc.onended = () => {
    try {
      g.disconnect();
      if (f) f.disconnect();
    } catch {
      /* gone */
    }
  };
  slot.bind((now) => {
    g.gain.cancelScheduledValues(now);
    g.gain.setTargetAtTime(0, now, 0.01);
    osc.stop(now + 0.06);
    if (lfo) lfo.stop(now + 0.06);
  });
  return { osc, gain: g, end };
}

// one shared second of white noise per context
const noiseBufs = new WeakMap();
export function noiseBuffer(ctx) {
  let b = noiseBufs.get(ctx);
  if (b) return b;
  const len = Math.floor(ctx.sampleRate * 2);
  b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  let s = 0x9e3779b9;
  for (let i = 0; i < len; i++) {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    d[i] = ((s >>> 0) / 4294967296) * 2 - 1;
  }
  noiseBufs.set(ctx, b);
  return b;
}

export function noiseVoice(ctx, dest, o) {
  if (!ctx || !dest || !o) return null;
  const t = startOf(ctx, o);
  const dur = Math.max(0.01, o.dur ?? 0.1);
  const end = t + dur;
  const slot = pool.claim('noise', o.prio ?? PRIO.sfx, t, end + 0.05, ctx.currentTime);
  if (!slot) return null;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = o.type || 'bandpass';
  f.frequency.value = o.f || 1000;
  f.Q.value = o.q ?? 0.8;
  if (o.to) {
    f.frequency.setValueAtTime(o.f || 1000, t);
    f.frequency.linearRampToValueAtTime(o.to, end);
  }
  const g = ctx.createGain();
  const vol = Math.max(0.0002, o.vol ?? 0.2);
  const atk = Math.min(0.004, dur / 4);
  g.gain.value = 0;
  g.gain.setValueAtTime(0.0001, t);
  if (o.env === 'swell') {
    // a pass-by, a train far off: up over 40%, away over the rest
    g.gain.linearRampToValueAtTime(vol, t + dur * 0.4);
    g.gain.linearRampToValueAtTime(0, end);
  } else {
    g.gain.linearRampToValueAtTime(vol, t + atk);
    if (o.env === 'lin') g.gain.linearRampToValueAtTime(0, end);
    else {
      g.gain.exponentialRampToValueAtTime(0.0005, end);
      g.gain.linearRampToValueAtTime(0, end + 0.01);
    }
  }
  src.connect(f).connect(g).connect(dest);
  src.start(t, ((t * 7919) % 1.5) + 0.01);
  src.stop(end + 0.03);
  src.onended = () => {
    try {
      g.disconnect();
      f.disconnect();
    } catch {
      /* gone */
    }
  };
  slot.bind((now) => {
    g.gain.cancelScheduledValues(now);
    g.gain.setTargetAtTime(0, now, 0.01);
    src.stop(now + 0.06);
  });
  return { src, gain: g, end };
}

// a voice on a named bus (falls back to nothing when the buses are not up)
export function voiceOn(bus, o) {
  const dest = typeof bus === 'string' ? busNode(bus) : bus;
  return dest ? voice(dest.context, dest, o) : null;
}
export function noiseOn(bus, o) {
  const dest = typeof bus === 'string' ? busNode(bus) : bus;
  return dest ? noiseVoice(dest.context, dest, o) : null;
}

// a waveshaper curve: a soft ceiling (tanh), so nothing passes `ceil`
export function ceilingCurve(ceil = 0.891, n = 2048) {
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = ceil * Math.tanh(x / ceil);
  }
  return c;
}

// Chrome's DynamicsCompressor adds make-up gain: (1 / fullRangeGain)^0.6.
// The master chain trims it off again so the compressor only ever reduces.
export function compressorMakeup(threshold, ratio) {
  const full = threshold + -threshold / ratio; // dB out for a 0 dBFS input (hard knee)
  return 10 ** ((-full * 0.6) / 20);
}
