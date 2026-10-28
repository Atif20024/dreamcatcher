// AudioBus (plan 2.13): music, ambience, sfx and ui buses under the
// master gain of src/systems/audio.js, with volumes from Settings. The music
// bus follows the game's music switch ([M], the pause menu): off means 0.
// Everything degrades to silence when WebAudio is unavailable.
import { audioCtx, audioOut, isMusicOff } from '../systems/audio.js';
import { getSettings } from '../utils/save.js';

export const BUS_DEFAULTS = Object.freeze({ music: 0.8, ambience: 0.55, sfx: 0.9, ui: 0.8 });

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
    for (const name of Object.keys(BUS_DEFAULTS)) {
      const g = ctx.createGain();
      g.connect(out);
      this.nodes[name] = g;
    }
    this.apply();
    return this.nodes;
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
