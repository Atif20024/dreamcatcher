// Ambience (plan 2.13): a loop per room (room.ambience, else the dream's
// `ambientLoop`), crossfaded by the RoomGraph's blend t, on the ambience
// bus. Loops are synthesised once (src/audio/synthLoops.js) and cached as
// AudioBuffers. Legacy scenes use it too: BaseLevel plays the dream's
// `ambientLoop` from src/data/dreams.js.
//
// Audio pass: a loop may name extra layers (LOOP_LAYERS) of a different,
// incommensurate length (rain 6 s + 9 s, two clocks 1.0 s + 1.37 s), played
// together under one gain, so the bed never repeats the same way twice. A
// room fades in over ~400 ms and out over ~800 ms; a name with no loop is
// skipped (once, with a warning) instead of failing. Every layer starts at
// a random point in its loop, slightly off pitch, so no visit repeats.
import { buses } from './AudioBus.js';
import { LOOPS, LOOP_LAYERS } from './synthLoops.js';

const cache = new Map();
const warned = new Set();
// a few older loops were written hot: their level against the rest
// (measured offline, tests/audioMix.test.js)
export const LOOP_GAIN = { rain_street: 0.6, festival: 0.55 };

function bufferFor(name) {
  const ctx = buses.ctx();
  if (!ctx) return null;
  if (!LOOPS[name]) {
    if (!warned.has(name)) {
      warned.add(name);
      console.warn(`[ambience] no loop named "${name}"`);
    }
    return null;
  }
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
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(out);
    const srcs = [buf, ...(LOOP_LAYERS[name] || []).map(bufferFor).filter(Boolean)].map((b) => {
      const src = ctx.createBufferSource();
      src.buffer = b;
      src.loop = true;
      src.connect(gain);
      // each layer starts somewhere random in its loop, a touch off pitch:
      // the same room never sounds the same way twice
      src.playbackRate.value = 0.97 + Math.random() * 0.06;
      src.start(0, Math.random() * b.duration);
      return src;
    });
    const v = { src: srcs[0], srcs, gain, level: 0 };
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
        v.gain.gain.setTargetAtTime(lv * (LOOP_GAIN[name] ?? 1), ctx.currentTime, 0.13);
      }
    }
    for (const [name, v] of this.voices) {
      if (levels[name] !== undefined) continue;
      v.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.27);
      // stopped and unplugged once it has faded (no idle nodes left running)
      for (const src of v.srcs) src.stop(ctx.currentTime + 2);
      v.srcs[0].onended = () => {
        try {
          v.gain.disconnect();
        } catch {
          /* gone */
        }
      };
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
