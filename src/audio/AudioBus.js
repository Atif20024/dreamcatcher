// AudioBus (plan 2.13): music, ambience, sfx and ui buses under the
// master gain of src/systems/audio.js, with volumes from Settings. The music
// bus follows the game's music switch ([M], the pause menu): off means 0.
// Everything degrades to silence when WebAudio is unavailable.
import { audioCtx, audioOut, isMusicOff } from '../systems/audio.js';
import { getSettings } from '../utils/save.js';

export const BUS_DEFAULTS = Object.freeze({ music: 0.8, ambience: 0.55, sfx: 0.9, ui: 0.8 });

// Acoustics (THE MASTER'S LADDER, for every dream): music and ambience pass
// through one room stage, a low-pass (inside is muffled) and a send into a
// small feedback-comb reverb (inside has an echo). A room picks a preset
// with room.acoustics; rooms without one are 'open' (dry, unfiltered), so
// nothing changes for a dream that never asks. Data, so a later audio pass
// can retune it:  lp (Hz), wet (send level), t60 (s to fall 60 dB)
export const ACOUSTICS = Object.freeze({
  open: { lp: 20000, wet: 0, t60: 0.4 },
  room: { lp: 5200, wet: 0.16, t60: 0.9 },
  hall: { lp: 6500, wet: 0.24, t60: 1.6 },
  chapel: { lp: 6000, wet: 0.32, t60: 3.6 },
});
export const COMB_DELAYS = [0.0297, 0.0371, 0.0411, 0.0437];
// a comb's feedback for a decay time: always < 1 (stable)
export function combFeedback(delay, t60) {
  return Math.min(0.95, 10 ** ((-3 * delay) / Math.max(0.05, t60)));
}

class Buses {
  constructor() {
    this.nodes = null;
  }

  ensure() {
    if (this.nodes) return this.nodes;
    const ctx = audioCtx();
    const out = audioOut();
    if (!ctx || !out) return null;
    this.nodes = {};
    const room = this.buildRoom(ctx, out);
    for (const name of Object.keys(BUS_DEFAULTS)) {
      const g = ctx.createGain();
      // music and ambience sound the room; sfx and ui are dry
      g.connect(name === 'music' || name === 'ambience' ? room : out);
      this.nodes[name] = g;
    }
    this.apply();
    this.setAcoustics(this.preset || 'open', true);
    return this.nodes;
  }

  // the room stage: in → low-pass → out, and low-pass → send → combs → wet → out
  buildRoom(ctx, out) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 20000;
    lp.connect(out);
    const send = ctx.createGain();
    send.gain.value = 0;
    lp.connect(send);
    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    wet.connect(out);
    const combs = COMB_DELAYS.map((d) => {
      const delay = ctx.createDelay(0.1);
      delay.delayTime.value = d;
      const fb = ctx.createGain();
      fb.gain.value = 0;
      const damp = ctx.createBiquadFilter();
      damp.type = 'lowpass';
      damp.frequency.value = 3200;
      send.connect(delay);
      delay.connect(damp).connect(fb).connect(delay);
      delay.connect(wet);
      return { d, fb };
    });
    this.room = { lp, send, wet, combs };
    return lp;
  }

  // a preset from ACOUSTICS, eased in (a door: instant)
  setAcoustics(name, instant = false) {
    const p = ACOUSTICS[name] || ACOUSTICS.open;
    this.preset = ACOUSTICS[name] ? name : 'open';
    if (!this.room) return this.preset;
    const ctx = audioCtx();
    const t = ctx.currentTime;
    const k = instant ? 0.01 : 0.25;
    this.room.lp.frequency.setTargetAtTime(p.lp, t, k);
    this.room.send.gain.setTargetAtTime(p.wet, t, k);
    let sum = 0;
    for (const c of this.room.combs) {
      const fb = p.wet ? combFeedback(c.d, p.t60) : 0;
      sum += 1 / (1 - fb);
      c.fb.gain.setTargetAtTime(fb, t, k);
    }
    // normalise the combs' build-up so the tail sits at `wet`, not above it
    this.room.wet.gain.setTargetAtTime(1 / sum, t, k);
    return this.preset;
  }

  volume(name) {
    let v = BUS_DEFAULTS[name];
    try {
      const s = getSettings();
      if (s && s.volumes && typeof s.volumes[name] === 'number') v = s.volumes[name];
    } catch {
      /* no save */
    }
    if (name === 'music' && isMusicOff()) v = 0;
    return v;
  }

  apply() {
    if (!this.nodes) return;
    const ctx = audioCtx();
    for (const [name, g] of Object.entries(this.nodes)) g.gain.setTargetAtTime(this.volume(name), ctx.currentTime, 0.05);
  }

  bus(name) {
    const n = this.ensure();
    return n ? n[name] : null;
  }

  ctx() {
    return this.ensure() ? audioCtx() : null;
  }
}

export const buses = new Buses();

// a short synth voice on a bus: (freq, dur, type, vol, when, glideTo)
export function busTone(bus, freq, dur, type = 'sine', vol = 0.3, when = 0, glideTo = null) {
  const ctx = buses.ctx();
  const out = buses.bus(bus);
  if (!ctx || !out) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = ctx.currentTime + when;
  if (glideTo) o.frequency.linearRampToValueAtTime(glideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export function busNoise(bus, dur, vol = 0.2, freq = 1000, when = 0, q = 0.8) {
  const ctx = buses.ctx();
  const out = buses.bus(bus);
  if (!ctx || !out) return;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = b;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(out);
  src.start(ctx.currentTime + when);
}

// a shaped synth voice (the era instruments in MusicDirector VOICES): an
// attack, an optional held sustain, an exponential release, an optional
// filter ({ type, f, q }) and vibrato (cents-free: Hz of depth at vibHz)
export function busSynth(bus, { freq, dur = 0.5, type = 'sine', vol = 0.2, when = 0, attack = 0.005, hold = 0, filter = null, vib = 0, vibHz = 5 } = {}) {
  const ctx = buses.ctx();
  const out = buses.bus(bus);
  if (!ctx || !out || !freq) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = ctx.currentTime + when;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  if (hold > 0) g.gain.setValueAtTime(vol, t + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0008, t + attack + hold + dur);
  let node = o;
  if (filter) {
    const f = ctx.createBiquadFilter();
    f.type = filter.type || 'lowpass';
    f.frequency.value = filter.f || 2000;
    f.Q.value = filter.q ?? 0.8;
    node.connect(f);
    node = f;
  }
  node.connect(g).connect(out);
  if (vib) {
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = vibHz;
    lg.gain.value = vib;
    lfo.connect(lg).connect(o.frequency);
    lfo.start(t);
    lfo.stop(t + attack + hold + dur + 0.05);
  }
  o.start(t);
  o.stop(t + attack + hold + dur + 0.05);
}
