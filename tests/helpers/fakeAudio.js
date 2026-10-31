// A small offline Web Audio renderer for the tests (audio pass). Node has no
// AudioContext, and dev is silent, so the game's real audio code — the
// master chain, the buses, the bands, the stems, the loops, the one-shots,
// the chatter — is run against this and rendered to arrays. Nothing is
// ever played. It implements the parts of the API the game uses:
//   Gain, Oscillator (band-limited saw/square, triangle, sine; detune; an
//   AudioParam input for vibrato), BiquadFilter (RBJ lowpass/highpass/
//   bandpass, k-rate), BufferSource (loop, playbackRate, offset), StereoPanner
//   (equal power), Delay (≥ one block, so feedback loops work),
//   DynamicsCompressor (Chrome's make-up gain included), WaveShaper,
//   AudioParam automation (set, linear, exponential, target, cancel).
// Blocks of 128 frames, stereo. Every node's output is cached per block.
const BLOCK = 128;

class Param {
  constructor(ctx, v, { min = -3.4e38, max = 3.4e38 } = {}) {
    this.ctx = ctx;
    this._v = v;
    this.ev = [];
    this.inputs = [];
    this.min = min;
    this.max = max;
  }
  get value() {
    return this.ev.length ? this.at(this.ctx.currentTime) : this._v;
  }
  set value(v) {
    this._v = v;
    if (this.ev.length) this.ev = this.ev.filter((e) => e.t < this.ctx.currentTime);
  }
  _add(e) {
    e.call = this.ctx.currentTime;
    // insertion in time order (stable)
    let i = this.ev.length;
    while (i > 0 && this.ev[i - 1].t > e.t) i--;
    this.ev.splice(i, 0, e);
    return this;
  }
  setValueAtTime(v, t) {
    return this._add({ k: 'set', v, t });
  }
  linearRampToValueAtTime(v, t) {
    return this._add({ k: 'lin', v, t });
  }
  exponentialRampToValueAtTime(v, t) {
    return this._add({ k: 'exp', v, t });
  }
  setTargetAtTime(v, t, tc) {
    return this._add({ k: 'tgt', v, t, tc: Math.max(1e-4, tc) });
  }
  cancelScheduledValues(t) {
    this.ev = this.ev.filter((e) => e.t < t);
    return this;
  }
  cancelAndHoldAtTime(t) {
    const v = this.at(t);
    this.cancelScheduledValues(t);
    return this.setValueAtTime(v, t);
  }
  // the value at time t (no inputs)
  at(t) {
    let v = this._v;
    let pt = 0;
    let pv = this._v;
    let tgt = null;
    for (let i = 0; i < this.ev.length; i++) {
      const e = this.ev[i];
      if (tgt) {
        // a running target, until this event's time
        const end = Math.min(t, e.t);
        v = tgt.v + (tgt.from - tgt.v) * Math.exp(-(end - tgt.t) / tgt.tc);
        if (t <= e.t && e.k !== 'lin' && e.k !== 'exp') return v;
        pt = end;
        pv = v;
        tgt = null;
        if (t < e.t) {
          // a ramp from the target's value at its start
          return e.k === 'lin' ? pv + (e.v - pv) * ((t - pt) / (e.t - pt)) : expRamp(pv, e.v, pt, e.t, t);
        }
      }
      if (e.k === 'set') {
        if (t < e.t) return v;
        v = e.v;
        pt = e.t;
        pv = v;
      } else if (e.k === 'lin' || e.k === 'exp') {
        const t0 = i === 0 || this.ev[i - 1].t === undefined ? Math.min(e.call, e.t) : pt;
        if (t < e.t) {
          if (t < t0) return v;
          return e.k === 'lin' ? pv + (e.v - pv) * ((t - t0) / Math.max(1e-9, e.t - t0)) : expRamp(pv, e.v, t0, e.t, t);
        }
        v = e.v;
        pt = e.t;
        pv = v;
      } else if (e.k === 'tgt') {
        if (t < e.t) return v;
        tgt = { v: e.v, t: e.t, tc: e.tc, from: v };
      }
    }
    if (tgt) v = tgt.v + (tgt.from - tgt.v) * Math.exp(-(t - tgt.t) / tgt.tc);
    return v;
  }
  // a block of values (k-rate: one value)
  block(t0, n, sr, krate = false) {
    const live = this.ev.length || this.inputs.length;
    if (!live) return this._v;
    if (krate && !this.inputs.length) return this.at(t0);
    const out = new Float32Array(n);
    if (this.ev.length) for (let i = 0; i < n; i++) out[i] = this.at(t0 + i / sr);
    else out.fill(this._v);
    for (const src of this.inputs) {
      const b = src.pull();
      for (let i = 0; i < n; i++) out[i] += b.L[i];
    }
    return krate ? out[0] : out;
  }
}
function expRamp(v0, v1, t0, t1, t) {
  if (v0 === 0 || v0 * v1 <= 0) return t >= t1 ? v1 : v0;
  return v0 * (v1 / v0) ** ((t - t0) / Math.max(1e-9, t1 - t0));
}

const ZERO = new Float32Array(BLOCK);

class Node {
  constructor(ctx, kind) {
    this.context = ctx;
    this.ctx = ctx;
    this.kind = kind;
    this.inputs = [];
    this.outputs = [];
    this.cacheBlock = -1;
    this.out = null;
    ctx.stats.created[kind] = (ctx.stats.created[kind] || 0) + 1;
    ctx.stats.nodes += 1;
  }
  connect(dst) {
    if (dst instanceof Param) {
      dst.inputs.push(this);
      return undefined;
    }
    this.outputs.push(dst);
    dst.inputs.push(this);
    return dst;
  }
  disconnect() {
    for (const o of this.outputs) {
      const i = o.inputs.indexOf(this);
      if (i >= 0) o.inputs.splice(i, 1);
    }
    this.outputs = [];
  }
  get done() {
    return false;
  }
  pull() {
    const c = this.ctx;
    if (this.cacheBlock === c.block) return this.out;
    this.cacheBlock = c.block;
    this.out = this.process();
    return this.out;
  }
  sumInputs() {
    const live = [];
    for (const n of this.inputs) {
      if (n.done) continue;
      live.push(n);
    }
    // drop finished sources from the graph (Chrome lets them go too)
    if (live.length !== this.inputs.length) this.inputs = this.inputs.filter((n) => !n.done || n.cacheBlock === this.ctx.block);
    if (!live.length) return null;
    if (live.length === 1) return live[0].pull();
    const L = new Float32Array(BLOCK);
    const R = new Float32Array(BLOCK);
    for (const n of live) {
      const b = n.pull();
      if (!b) continue;
      for (let i = 0; i < BLOCK; i++) {
        L[i] += b.L[i];
        R[i] += b.R[i];
      }
    }
    return { L, R };
  }
}

class Gain extends Node {
  constructor(ctx) {
    super(ctx, 'gain');
    this.gain = new Param(ctx, 1);
  }
  process() {
    const x = this.sumInputs();
    if (!x) return null;
    const g = this.gain.block(this.ctx.currentTime, BLOCK, this.ctx.sampleRate);
    if (typeof g === 'number') {
      if (g === 1) return x;
      const L = new Float32Array(BLOCK);
      const R = new Float32Array(BLOCK);
      for (let i = 0; i < BLOCK; i++) {
        L[i] = x.L[i] * g;
        R[i] = x.R[i] * g;
      }
      return { L, R };
    }
    const L = new Float32Array(BLOCK);
    const R = new Float32Array(BLOCK);
    for (let i = 0; i < BLOCK; i++) {
      L[i] = x.L[i] * g[i];
      R[i] = x.R[i] * g[i];
    }
    return { L, R };
  }
}

class Source extends Node {
  constructor(ctx, kind) {
    super(ctx, kind);
    this.t0 = null;
    this.t1 = Infinity;
    this.onended = null;
    this.ended = false;
  }
  start(t = 0) {
    this.t0 = Math.max(t, this.ctx.currentTime);
    this.ctx.live.add(this);
  }
  stop(t = 0) {
    this.t1 = Math.max(t, this.ctx.currentTime);
  }
  get done() {
    return this.ended;
  }
  // which frames of this block sound: [a, b)
  span() {
    const c = this.ctx;
    const sr = c.sampleRate;
    if (this.t0 === null) return null;
    const f0 = Math.round(this.t0 * sr) - c.frame;
    const f1 = Math.round(this.t1 * sr) - c.frame;
    if (f1 <= 0) {
      this.finish();
      return null;
    }
    if (f0 >= BLOCK) return null;
    return [Math.max(0, f0), Math.min(BLOCK, f1)];
  }
  finish() {
    if (this.ended) return;
    this.ended = true;
    this.ctx.live.delete(this);
    if (this.onended) this.ctx.endedQueue.push(this);
  }
}

class Osc extends Source {
  constructor(ctx) {
    super(ctx, 'osc');
    this.type = 'sine';
    this.frequency = new Param(ctx, 440);
    this.detune = new Param(ctx, 0);
    this.ph = 0;
  }
  process() {
    const sp = this.span();
    if (!sp) return null;
    const c = this.ctx;
    const sr = c.sampleRate;
    const f = this.frequency.block(c.currentTime, BLOCK, sr);
    const dt = this.detune.block(c.currentTime, BLOCK, sr, true);
    const k = 2 ** (dt / 1200);
    const out = new Float32Array(BLOCK);
    for (let i = sp[0]; i < sp[1]; i++) {
      const fi = (typeof f === 'number' ? f : f[i]) * k;
      const inc = fi / sr;
      let p = this.ph;
      let y;
      switch (this.type) {
        case 'square':
          y = (p < 0.5 ? 1 : -1) + blep(p, inc) - blep((p + 0.5) % 1, inc);
          break;
        case 'sawtooth':
          y = 2 * p - 1 - blep(p, inc);
          break;
        case 'triangle':
          y = p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
          break;
        default:
          y = Math.sin(2 * Math.PI * p);
      }
      out[i] = y;
      p += inc;
      this.ph = p - Math.floor(p);
    }
    if (sp[1] < BLOCK && Math.round(this.t1 * sr) - c.frame < BLOCK) this.finish();
    return { L: out, R: out };
  }
}
function blep(t, dt) {
  if (dt <= 0) return 0;
  if (t < dt) {
    const x = t / dt;
    return x + x - x * x - 1;
  }
  if (t > 1 - dt) {
    const x = (t - 1) / dt;
    return x * x + x + x + 1;
  }
  return 0;
}

class BufSrc extends Source {
  constructor(ctx) {
    super(ctx, 'buffer');
    this.buffer = null;
    this.loop = false;
    this.playbackRate = new Param(ctx, 1);
    this.pos = 0;
  }
  start(t = 0, offset = 0, dur) {
    super.start(t);
    this.pos = offset * (this.buffer ? this.buffer.sampleRate : this.ctx.sampleRate);
    if (dur !== undefined) this.t1 = this.t0 + dur;
  }
  process() {
    const sp = this.span();
    if (!sp || !this.buffer) return null;
    const d = this.buffer.getChannelData(0);
    const N = d.length;
    const rate = this.playbackRate.block(this.ctx.currentTime, BLOCK, this.ctx.sampleRate, true) * (this.buffer.sampleRate / this.ctx.sampleRate);
    const out = new Float32Array(BLOCK);
    for (let i = sp[0]; i < sp[1]; i++) {
      let p = this.pos;
      if (p >= N) {
        if (!this.loop) {
          this.finish();
          break;
        }
        p %= N;
      }
      const i0 = Math.floor(p);
      const fr = p - i0;
      const a = d[i0];
      const b = d[(i0 + 1) % N];
      out[i] = a + (b - a) * fr;
      this.pos = p + rate;
    }
    if (!this.loop && this.pos >= N) this.finish();
    return { L: out, R: out };
  }
}

class Biquad extends Node {
  constructor(ctx) {
    super(ctx, 'biquad');
    this.type = 'lowpass';
    this.frequency = new Param(ctx, 350);
    this.Q = new Param(ctx, 1);
    this.gain = new Param(ctx, 0);
    this.detune = new Param(ctx, 0);
    this.s = [0, 0, 0, 0, 0, 0, 0, 0];
  }
  coefs() {
    const c = this.ctx;
    const sr = c.sampleRate;
    const f = Math.min(sr * 0.49, Math.max(10, this.frequency.block(c.currentTime, BLOCK, sr, true)));
    // (lowpass/highpass Q is in dB and may be negative; bandpass Q is linear)
    const qv = this.Q.block(c.currentTime, BLOCK, sr, true);
    const q = this.type === 'bandpass' ? Math.max(1e-4, qv) : qv;
    const w = (2 * Math.PI * f) / sr;
    const cs = Math.cos(w);
    const sn = Math.sin(w);
    let b0;
    let b1;
    let b2;
    let a0;
    let a1;
    let a2;
    if (this.type === 'bandpass') {
      const alpha = sn / (2 * q);
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
      a0 = 1 + alpha;
      a1 = -2 * cs;
      a2 = 1 - alpha;
    } else {
      // Web Audio's lowpass/highpass Q is in dB
      const alpha = sn / (2 * 10 ** (q / 20));
      a0 = 1 + alpha;
      a1 = -2 * cs;
      a2 = 1 - alpha;
      if (this.type === 'highpass') {
        b0 = (1 + cs) / 2;
        b1 = -(1 + cs);
        b2 = (1 + cs) / 2;
      } else {
        b0 = (1 - cs) / 2;
        b1 = 1 - cs;
        b2 = (1 - cs) / 2;
      }
    }
    return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
  }
  process() {
    const x = this.sumInputs();
    if (!x) {
      this.s.fill(0);
      return null;
    }
    const [b0, b1, b2, a1, a2] = this.coefs();
    const L = new Float32Array(BLOCK);
    const R = x.L === x.R ? L : new Float32Array(BLOCK);
    const run = (inp, out, o) => {
      let [x1, x2, y1, y2] = this.s.slice(o, o + 4);
      for (let i = 0; i < BLOCK; i++) {
        const xi = inp[i];
        const y = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
        x2 = x1;
        x1 = xi;
        y2 = y1;
        y1 = y;
        out[i] = y;
      }
      this.s[o] = x1;
      this.s[o + 1] = x2;
      this.s[o + 2] = y1;
      this.s[o + 3] = y2;
    };
    run(x.L, L, 0);
    if (R !== L) run(x.R, R, 4);
    return { L, R };
  }
}

class Panner extends Node {
  constructor(ctx) {
    super(ctx, 'panner');
    this.pan = new Param(ctx, 0);
  }
  process() {
    const x = this.sumInputs();
    if (!x) return null;
    const p = this.pan.block(this.ctx.currentTime, BLOCK, this.ctx.sampleRate);
    const L = new Float32Array(BLOCK);
    const R = new Float32Array(BLOCK);
    for (let i = 0; i < BLOCK; i++) {
      const pi = Math.max(-1, Math.min(1, typeof p === 'number' ? p : p[i]));
      const a = ((pi + 1) / 2) * (Math.PI / 2);
      const m = x.L === x.R ? x.L[i] : (x.L[i] + x.R[i]) / 2;
      L[i] = m * Math.cos(a);
      R[i] = m * Math.sin(a);
    }
    return { L, R };
  }
}

class Delay extends Node {
  constructor(ctx, max = 1) {
    super(ctx, 'delay');
    this.delayTime = new Param(ctx, 0);
    this.size = Math.ceil((max + 0.1) * ctx.sampleRate) + BLOCK;
    this.bufL = new Float32Array(this.size);
    this.bufR = new Float32Array(this.size);
    this.w = 0;
    ctx.delays.push(this);
  }
  process() {
    // read: what went in delayTime ago (always ≥ one block back)
    const c = this.ctx;
    const d = Math.max(BLOCK, Math.round(this.delayTime.block(c.currentTime, BLOCK, c.sampleRate, true) * c.sampleRate));
    const L = new Float32Array(BLOCK);
    const R = new Float32Array(BLOCK);
    for (let i = 0; i < BLOCK; i++) {
      const r = (this.w + i - d + this.size * 4) % this.size;
      L[i] = this.bufL[r];
      R[i] = this.bufR[r];
    }
    return { L, R };
  }
  // after the block: write this block's input
  commit() {
    const x = this.sumInputs();
    for (let i = 0; i < BLOCK; i++) {
      const j = (this.w + i) % this.size;
      this.bufL[j] = x ? x.L[i] : 0;
      this.bufR[j] = x ? x.R[i] : 0;
    }
    this.w = (this.w + BLOCK) % this.size;
  }
}

class Compressor extends Node {
  constructor(ctx) {
    super(ctx, 'compressor');
    this.threshold = new Param(ctx, -24);
    this.knee = new Param(ctx, 30);
    this.ratio = new Param(ctx, 12);
    this.attack = new Param(ctx, 0.003);
    this.release = new Param(ctx, 0.25);
    this.env = 0; // dB of gain reduction
    this.reduction = 0;
  }
  process() {
    const x = this.sumInputs();
    if (!x) return null;
    const c = this.ctx;
    const sr = c.sampleRate;
    const th = this.threshold.value;
    const ratio = this.ratio.value;
    const atk = Math.exp(-1 / (Math.max(1e-4, this.attack.value) * sr));
    const rel = Math.exp(-1 / (Math.max(1e-4, this.release.value) * sr));
    // Chrome's make-up gain: (1 / full-range gain)^0.6
    const full = th + -th / ratio;
    const makeup = 10 ** ((-full * 0.6) / 20);
    const L = new Float32Array(BLOCK);
    const R = new Float32Array(BLOCK);
    let red = 0;
    for (let i = 0; i < BLOCK; i++) {
      const lvl = Math.max(Math.abs(x.L[i]), Math.abs(x.R[i]));
      const db = lvl > 1e-6 ? 20 * Math.log10(lvl) : -120;
      const over = db - th;
      const want = over > 0 ? over - over / ratio : 0; // dB to take off
      this.env = want > this.env ? atk * this.env + (1 - atk) * want : rel * this.env + (1 - rel) * want;
      const g = 10 ** (-this.env / 20) * makeup;
      L[i] = x.L[i] * g;
      R[i] = x.R[i] * g;
      red = Math.max(red, this.env);
    }
    this.reduction = -red;
    return { L, R };
  }
}

class Shaper extends Node {
  constructor(ctx) {
    super(ctx, 'shaper');
    this.curve = null;
    this.oversample = 'none';
  }
  process() {
    const x = this.sumInputs();
    if (!x || !this.curve) return x;
    const cv = this.curve;
    const n = cv.length;
    const map = (v) => {
      const p = ((Math.max(-1, Math.min(1, v)) + 1) / 2) * (n - 1);
      const i = Math.floor(p);
      const f = p - i;
      return i >= n - 1 ? cv[n - 1] : cv[i] + (cv[i + 1] - cv[i]) * f;
    };
    const L = new Float32Array(BLOCK);
    const R = x.L === x.R ? L : new Float32Array(BLOCK);
    for (let i = 0; i < BLOCK; i++) L[i] = map(x.L[i]);
    if (R !== L) for (let i = 0; i < BLOCK; i++) R[i] = map(x.R[i]);
    return { L, R };
  }
}

class Buffer {
  constructor(ch, len, sr) {
    this.numberOfChannels = ch;
    this.length = len;
    this.sampleRate = sr;
    this.duration = len / sr;
    this.data = Array.from({ length: ch }, () => new Float32Array(len));
  }
  getChannelData(i) {
    return this.data[i];
  }
}

export class FakeAudioContext {
  constructor({ sampleRate = 22050 } = {}) {
    this.sampleRate = sampleRate;
    this.frame = 0;
    this.block = 0;
    this.state = 'running';
    this.live = new Set();
    this.delays = [];
    this.endedQueue = [];
    this.stats = { created: {}, nodes: 0, peakLive: 0 };
    this.destination = new Gain(this);
    this.destination.kind = 'destination';
  }
  get currentTime() {
    return this.frame / this.sampleRate;
  }
  resume() {
    return Promise.resolve();
  }
  suspend() {
    return Promise.resolve();
  }
  createGain() {
    return new Gain(this);
  }
  createOscillator() {
    return new Osc(this);
  }
  createBufferSource() {
    return new BufSrc(this);
  }
  createBiquadFilter() {
    return new Biquad(this);
  }
  createStereoPanner() {
    return new Panner(this);
  }
  createDelay(max = 1) {
    return new Delay(this, max);
  }
  createDynamicsCompressor() {
    return new Compressor(this);
  }
  createWaveShaper() {
    return new Shaper(this);
  }
  createBuffer(ch, len, sr) {
    return new Buffer(ch, len, sr);
  }

  // render `seconds` of `node`'s output → { L, R }. onBlock(t) runs before
  // each block (a scheduler's pump, a scene's update)
  render(node, seconds, { onBlock = null, every = 0.05, probes = {} } = {}) {
    const n = Math.floor((seconds * this.sampleRate) / BLOCK) * BLOCK;
    const L = new Float32Array(n);
    const R = new Float32Array(n);
    const P = Object.fromEntries(Object.keys(probes).map((k) => [k, new Float32Array(n)]));
    let nextHook = this.currentTime;
    for (let o = 0; o < n; o += BLOCK) {
      if (onBlock && this.currentTime >= nextHook) {
        onBlock(this.currentTime);
        nextHook += every;
      }
      this.block += 1;
      const b = node.pull();
      if (b) {
        L.set(b.L, o);
        R.set(b.R, o);
      }
      for (const [k, pn] of Object.entries(probes)) {
        const pb = pn.pull();
        if (pb) for (let i = 0; i < BLOCK; i++) P[k][o + i] = (pb.L[i] + pb.R[i]) / 2;
      }
      for (const d of this.delays) d.commit();
      this.stats.peakLive = Math.max(this.stats.peakLive, this.live.size);
      this.frame += BLOCK;
      while (this.endedQueue.length) {
        const s = this.endedQueue.shift();
        try {
          s.onended();
        } catch {
          /* test */
        }
      }
    }
    return { L, R, probes: P };
  }
}

// --- measurements ---------------------------------------------------------
export const dbfs = (x) => 20 * Math.log10(Math.max(1e-9, x));
export function rms(a) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * a[i];
  return Math.sqrt(s / Math.max(1, a.length));
}
export function peak(a) {
  let p = 0;
  for (let i = 0; i < a.length; i++) p = Math.max(p, Math.abs(a[i]));
  return p;
}
// magnitude spectrum (Hann window, radix-2), averaged over frames
export function spectrum(a, sr, size = 4096) {
  const mag = new Float64Array(size / 2);
  let frames = 0;
  for (let o = 0; o + size <= a.length; o += size) {
    const re = new Float64Array(size);
    const im = new Float64Array(size);
    for (let i = 0; i < size; i++) re[i] = a[o + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1)));
    fft(re, im);
    for (let k = 0; k < size / 2; k++) mag[k] += Math.hypot(re[k], im[k]);
    frames += 1;
  }
  for (let k = 0; k < mag.length; k++) mag[k] /= Math.max(1, frames);
  return { mag, hz: (k) => (k * sr) / size, bin: (f) => Math.round((f * size) / sr) };
}
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const a = (-2 * Math.PI) / len;
    const wr = Math.cos(a);
    const wi = Math.sin(a);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let j = 0; j < len / 2; j++) {
        const ur = re[i + j];
        const ui = im[i + j];
        const vr = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci;
        const vi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr;
        re[i + j] = ur + vr;
        im[i + j] = ui + vi;
        re[i + j + len / 2] = ur - vr;
        im[i + j + len / 2] = ui - vi;
        const t = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = t;
      }
    }
  }
}
// energy in a band (sum of squared magnitudes), in dB
export function bandDb(sp, lo, hi) {
  let s = 0;
  for (let k = Math.max(1, sp.bin(lo)); k <= Math.min(sp.mag.length - 1, sp.bin(hi)); k++) s += sp.mag[k] ** 2;
  return 10 * Math.log10(s + 1e-20);
}
