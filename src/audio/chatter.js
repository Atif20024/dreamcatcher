// ChatterVoice (audio pass, advice §3): people talk in short bursts as Jo
// passes them. Within 220 px of someone who is not already in a scene, a
// burst of babble (src/audio/babble.js) plays from where they stand: panned
// by dx, low-passed by distance (4 kHz near, 1.2 kHz far), silent at
// 320 px. Each speaker has a voice of their own (low or high, and a pitch,
// both from their id) and an 8–12 s cooldown; at most three talk at once.
//
// Cheap on purpose: a burst is one buffer source, a filter, a panner and a
// gain, made when it starts and unplugged when it ends. The babble buffers
// are rendered once per context (four low voices, four high) and shared.
import { renderBabble, hashId } from './babble.js';
import { busNode, PRIO, pool } from './synth.js';

export const CHATTER = Object.freeze({ near: 220, far: 320, cooldown: [8, 12], max: 3, level: 0.6, check: 0.25 });

const banks = new WeakMap();
// a cached babble buffer for this context
function bankBuffer(ctx, key, opts) {
  let m = banks.get(ctx);
  if (!m) {
    m = new Map();
    banks.set(ctx, m);
  }
  if (m.has(key)) return m.get(key);
  const data = renderBabble(ctx.sampleRate, opts);
  const b = ctx.createBuffer(1, data.length, ctx.sampleRate);
  b.getChannelData(0).set(data);
  m.set(key, b);
  return b;
}

// a voice's bank entry: low (0) or high (1), one of four bursts
function burstOpts(high, k) {
  return { f0: high ? 205 : 112, seed: 101 + k * 17 + (high ? 7 : 0), syllables: 4 + ((k * 3) % 5), question: k === 2 };
}

// play a babble buffer into `dest` (a bus or a panner) at time `at`
export function playBabble(dest, at, { f0 = 115, secs = null, syllables = null, question = false, lp = null, vol = 0.4, seed = 7, rate = 1, prio = PRIO.chatter } = {}) {
  if (!dest) return null;
  const ctx = dest.context;
  const key = `x:${f0}:${secs}:${syllables}:${question}:${lp}:${seed}`;
  const buf = bankBuffer(ctx, key, { f0, secs, syllables, question, lp, seed });
  const t = Math.max(ctx.currentTime, at ?? ctx.currentTime);
  const end = t + buf.duration / rate;
  const slot = pool.claim('noise', prio, t, end, ctx.currentTime);
  if (!slot) return null;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = rate;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(g).connect(dest);
  src.start(t);
  src.onended = () => {
    try {
      g.disconnect();
    } catch {
      /* gone */
    }
  };
  slot.bind((now) => src.stop(now + 0.02));
  return { src, end };
}

export function voiceOf(id) {
  const h = hashId(id);
  return { high: (h & 1) === 1, rate: 0.92 + ((h >>> 3) % 17) / 100, bank: (h >>> 9) % 4 };
}

export class Chatter {
  constructor({ bus = 'chatter', rand = Math.random } = {}) {
    this.bus = bus;
    this.rand = rand;
    this.cool = new Map();
    this.active = [];
    this.nextCheck = 0;
    this.bursts = 0;
    this.log = [];
  }

  // now: s; listener { x, y }; speakers [{ id, x, y, talking }]
  update(now, listener, speakers) {
    if (now < this.nextCheck || !listener) return null;
    this.nextCheck = now + CHATTER.check;
    this.active = this.active.filter((e) => e > now);
    if (this.active.length >= CHATTER.max) return null;
    let best = null;
    for (const s of speakers || []) {
      if (!s || s.talking || s.id === undefined) continue;
      const dx = s.x - listener.x;
      const d = Math.hypot(dx, (s.y || listener.y) - listener.y);
      if (d > CHATTER.near) continue;
      if ((this.cool.get(s.id) || 0) > now) continue;
      if (!best || d < best.d) best = { s, d, dx };
    }
    if (!best) return null;
    const { s, d, dx } = best;
    const [lo, hi] = CHATTER.cooldown;
    this.cool.set(s.id, now + lo + (hi - lo) * this.rand());
    const v = voiceOf(s.id);
    const k = (v.bank + this.bursts++) % 4;
    const shot = { id: s.id, d, pan: Math.max(-1, Math.min(1, dx / CHATTER.far)) * 0.8, lp: 4000 - Math.min(1, d / CHATTER.far) * 2800, level: CHATTER.level * Math.max(0, 1 - d / CHATTER.far), rate: v.rate, high: v.high, k, at: now };
    this.log.push(shot);
    if (this.log.length > 16) this.log.shift();
    const played = this.play(shot);
    this.active.push(now + (played ? played.dur : 1.2));
    return shot;
  }

  play(shot) {
    const out = busNode(this.bus);
    if (!out) return null;
    const ctx = out.context;
    const buf = bankBuffer(ctx, `b:${shot.high ? 1 : 0}:${shot.k}`, burstOpts(shot.high, shot.k));
    const t = ctx.currentTime + 0.02;
    const dur = buf.duration / shot.rate;
    const slot = pool.claim('noise', PRIO.chatter, t, t + dur, ctx.currentTime);
    if (!slot) return null;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = shot.rate;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = shot.lp;
    const pan = ctx.createStereoPanner();
    pan.pan.value = shot.pan;
    const g = ctx.createGain();
    g.gain.value = shot.level;
    src.connect(lp).connect(pan).connect(g).connect(out);
    src.start(t);
    src.onended = () => {
      try {
        g.disconnect();
        pan.disconnect();
        lp.disconnect();
      } catch {
        /* gone */
      }
    };
    slot.bind((now) => src.stop(now + 0.02));
    return { dur };
  }

  state() {
    return { bursts: this.bursts, active: this.active.length, last: this.log.length ? this.log[this.log.length - 1].id : null };
  }
}
