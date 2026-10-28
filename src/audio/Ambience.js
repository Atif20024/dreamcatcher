// Ambience (plan 2.13): a loop per room (room.ambience, else the dream's
// `ambientLoop`), crossfaded by the RoomGraph's blend t, on the ambience
// bus. Loops are synthesised once (src/audio/synthLoops.js) and cached as
// AudioBuffers. Legacy scenes use it too: BaseLevel plays the dream's
// `ambientLoop` from src/data/dreams.js.
import { buses } from './AudioBus.js';
import { LOOPS } from './synthLoops.js';

const cache = new Map();

function bufferFor(name) {
  const ctx = buses.ctx();
  if (!ctx || !LOOPS[name]) return null;
  if (cache.has(name)) return cache.get(name);
  const data = LOOPS[name](ctx.sampleRate);
  const b = ctx.createBuffer(1, data.length, ctx.sampleRate);
  b.getChannelData(0).set(data);
  cache.set(name, b);
  return b;
}

export class Ambience {
  constructor() {
    this.voices = new Map(); // name → { src, gain, level }
  }

  voice(name) {
    if (this.voices.has(name)) return this.voices.get(name);
    const ctx = buses.ctx();
    const buf = bufferFor(name);
    const out = buses.bus('ambience');
    if (!ctx || !buf || !out) return null;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(gain).connect(out);
    src.start();
    const v = { src, gain, level: 0 };
    this.voices.set(name, v);
    return v;
  }

  // levels: { name: 0..1 } — anything not named fades out (and stops)
  set(levels) {
    const ctx = buses.ctx();
    if (!ctx) return;
    for (const [name, lv] of Object.entries(levels)) {
      if (!name || name === 'null') continue;
      const v = this.voice(name);
      if (v && Math.abs(v.level - lv) > 0.01) {
        v.level = lv;
        v.gain.gain.setTargetAtTime(lv, ctx.currentTime, 0.15);
      }
    }
    for (const [name, v] of this.voices) {
      if (levels[name] !== undefined) continue;
      v.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
      const src = v.src;
      setTimeout(() => {
        try {
          src.stop();
        } catch {
          /* already stopped */
        }
      }, 1500);
      this.voices.delete(name);
    }
  }

  // a blend between two rooms' loops (same loop → one voice at full)
  blend(a, b, t) {
    const lv = {};
    if (a) lv[a] = (lv[a] || 0) + (b ? 1 - t : 1);
    if (b) lv[b] = (lv[b] || 0) + t;
    this.set(lv);
  }

  stop() {
    this.set({});
  }

  state() {
    return Object.fromEntries([...this.voices].map(([k, v]) => [k, Math.round(v.level * 100) / 100]));
  }
}

export const ambience = new Ambience();
