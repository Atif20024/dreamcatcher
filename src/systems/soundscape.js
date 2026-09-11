import { audioCtx, audioOut, playTone, playFx, playNoise, isMusicOff } from './audio.js';

// §6 — sound in the long evening. Ambience first: every place is a real
// soundscape of continuous loops (wind, water, the fountain at three
// distances, rain on four materials) and one-shots on their own clocks (a
// bicycle bell, distant kids, a radio two streets over). Then, much quieter,
// the Ensemble: a small band that wanders — one stem at a time, changing on
// TIME, never on place — and always stays in Jo's key when he plays.

// C major pentatonic, two octaves: whatever Jo presses sounds right
export const KEY = [262, 294, 330, 392, 440, 523, 587, 659, 784, 880];
// the Orb theme — the tune every dream ended on — in three pieces: Bo has the
// first four notes, Adaeze hums the middle, a window radio has the end
export const ORB_THEME = [659, 784, 988, 1319, 1175, 988, 784, 880, 784, 659, 587, 659];
export const THEME_PARTS = { bo: [0, 4], adaeze: [4, 8], radio: [8, 12] };

let noiseBuf = null;
function noiseBuffer(c) {
  if (noiseBuf) return noiseBuf;
  const len = c.sampleRate * 2;
  noiseBuf = c.createBuffer(1, len, c.sampleRate);
  const d = noiseBuf.getChannelData(0);
  let b = 0;
  for (let i = 0; i < len; i++) {
    // slightly brown: softer than white, closer to air and water
    b = (b + (Math.random() * 2 - 1) * 0.12) * 0.985;
    d[i] = b * 3 + (Math.random() * 2 - 1) * 0.15;
  }
  return noiseBuf;
}

class Loop {
  constructor(c, out, type, freq, q = 0.8) {
    this.c = c;
    this.src = c.createBufferSource();
    this.src.buffer = noiseBuffer(c);
    this.src.loop = true;
    this.src.playbackRate.value = 0.7 + Math.random() * 0.6;
    this.f = c.createBiquadFilter();
    this.f.type = type;
    this.f.frequency.value = freq;
    this.f.Q.value = q;
    this.g = c.createGain();
    this.g.gain.value = 0;
    this.src.connect(this.f).connect(this.g).connect(out);
    this.src.start();
  }
  set(vol, freq, tc = 0.6) {
    const t = this.c.currentTime;
    this.g.gain.setTargetAtTime(Math.max(0, vol), t, tc);
    if (freq) this.f.frequency.setTargetAtTime(freq, t, tc);
  }
  stop() {
    try {
      this.g.gain.setTargetAtTime(0, this.c.currentTime, 0.2);
      this.src.stop(this.c.currentTime + 1);
    } catch {
      /* gone */
    }
  }
}

export class Soundscape {
  constructor() {
    this.c = audioCtx();
    this.out = audioOut();
    this.loops = {};
    this.next = {};
    this.duck = 1; // snow eats the ambience
    if (!this.c || !this.out) return;
    // the ambience bus sits under everything else
    this.bus = this.c.createGain();
    this.bus.gain.value = 0.9;
    this.bus.connect(this.out);
    const L = (k, type, f, q) => (this.loops[k] = new Loop(this.c, this.bus, type, f, q));
    L('wind', 'lowpass', 500, 0.5);
    L('water', 'lowpass', 380, 0.6);
    L('fountain', 'bandpass', 1500, 0.9);
    L('rain_stone', 'bandpass', 2200, 0.7);
    L('rain_tin', 'highpass', 3800, 1.4);
    L('rain_water', 'lowpass', 900, 0.5);
    L('rain_cloth', 'lowpass', 520, 0.4);
    L('fire', 'bandpass', 900, 1.2);
    L('bees', 'bandpass', 220, 6);
  }

  // mix: { wind, water, fountainDist (tiles, or null), rain, rainMaterial,
  //        fire, bees, snow, place, inside }
  update(time, delta, m) {
    if (!this.c) return;
    const lp = this.loops;
    this.duck += ((m.snow > 0.3 ? 0.18 : 1) - this.duck) * Math.min(1, delta / 4000);
    const d = this.duck;
    lp.wind.set((0.05 + m.wind * 0.22) * d, 300 + m.wind * 900);
    lp.water.set((m.water || 0) * 0.25 * d);
    // the fountain sounds different from three distances
    const fd = m.fountainDist;
    if (fd === null || fd === undefined || fd > 26) lp.fountain.set(0);
    else if (fd < 3) lp.fountain.set(0.16 * d, 3200);
    else if (fd < 10) lp.fountain.set(0.08 * d, 1700);
    else lp.fountain.set(0.03 * d, 700);
    // rain on stone, on tin, on water, on cloth: mixed by what's above Jo
    const r = m.rain || 0;
    const mat = m.rainMaterial || 'stone';
    lp.rain_stone.set(r * (mat === 'stone' ? 0.3 : 0.1));
    lp.rain_tin.set(r * (mat === 'tin' ? 0.22 : 0.02));
    lp.rain_water.set(r * (mat === 'water' ? 0.35 : 0.06));
    lp.rain_cloth.set(r * (mat === 'cloth' ? 0.4 : 0.03));
    lp.fire.set((m.fire || 0) * 0.12);
    lp.bees.set((m.bees || 0) * 0.05);

    // one-shots on their own clocks, per place
    const t = time;
    const every = (k, lo, hi, fn) => {
      if (this.next[k] === undefined) this.next[k] = t + lo + Math.random() * (hi - lo);
      if (t >= this.next[k]) {
        this.next[k] = t + lo + Math.random() * (hi - lo);
        if (d > 0.5) fn();
      }
    };
    const p = m.place;
    const town = !m.road;
    if (town && m.snow < 0.3 && m.rain < 0.3) {
      every('birds', 2500, 7000, () => [0, 0.09, 0.2].forEach((w, i) => playFx(2400 + Math.random() * 900 - i * 120, 0.07, 'sine', 0.025, w)));
      every('kids', 9000, 22000, () => [0, 0.14, 0.3].forEach((w) => playFx(700 + Math.random() * 300, 0.12, 'triangle', 0.012, w, 900)));
      every('bell_bike', 25000, 60000, () => [1760, 1760].forEach((f, i) => playFx(f, 0.12, 'triangle', 0.035, i * 0.14)));
    }
    if (town && m.rain < 0.5) {
      // a radio two streets over, playing something you can't quite hear —
      // the end of the Orb theme, low-passed by distance into a murmur
      every('radio', 30000, 70000, () => ORB_THEME.slice(...THEME_PARTS.radio).forEach((f, i) => playTone(f / 2, 0.4, 'triangle', 0.012, i * 0.45)));
    }
    if (p === 'lake' || p === 'first_stars') every('frogs', 1500, 5000, () => playFx(180 + Math.random() * 60, 0.09, 'square', 0.02, 0, 140));
    if (p === 'foothills') every('sheep', 5000, 12000, () => [0, 0.25].forEach((w) => playFx(1180 + Math.random() * 200, 0.5, 'sine', 0.025, w)));
    if (p === 'pines' || p === 'foothills') every('owl', 14000, 30000, () => [0, 0.5].forEach((w, i) => playFx(420 - i * 30, 0.45, 'sine', 0.04, w, 380)));
    if (m.snow > 0.3) every('far_bell', 16000, 26000, () => {
      playFx(392, 3.2, 'sine', 0.05);
      playFx(784, 2.2, 'sine', 0.02);
    });
  }

  // silence, for a moment: after the rain stops, there's only dripping
  drips(seconds = 5) {
    for (let i = 0; i < seconds * 4; i++) playFx(1200 + Math.random() * 900, 0.06, 'sine', 0.04, i * 0.25 + Math.random() * 0.2, 700);
  }

  stop() {
    Object.values(this.loops).forEach((l) => l.stop());
  }
}

// ---------------------------------------------------------------------------
// the Ensemble
// ---------------------------------------------------------------------------
// solo piano → muted trumpet → upright bass → a full minute of nothing →
// guitar → round again. Each stem is a generative phrase in the pentatonic.
const STEMS = [
  { id: 'piano', secs: 95 },
  { id: 'trumpet', secs: 85 },
  { id: 'bass', secs: 90 },
  { id: 'silence', secs: 60 },
  { id: 'guitar', secs: 90 },
];

export class Ensemble {
  constructor(seed = Math.random()) {
    this.i = Math.floor(seed * STEMS.length);
    this.t = 0;
    this.beat = 0;
    this.acc = 0;
    this.bpm = 66;
    this.duck = 1; // sitting steps the music down
    this.source = null; // 'bo' — the times you turn a corner and it's him
    this.road = null; // on the road the rules change (B5)
    this.theme = 0; // at the treeline the whole theme comes back
    this.volume = 1;
  }

  stem() {
    return STEMS[this.i].id;
  }

  update(delta, { duck = 1, source = null, road = null, sourceVol = 1 }) {
    this.duck += (duck - this.duck) * Math.min(1, delta / 1500);
    this.source = source;
    this.sourceVol = sourceVol;
    this.road = road;
    this.t += delta;
    if (this.t > STEMS[this.i].secs * 1000) {
      this.t = 0;
      this.i = (this.i + 1) % STEMS.length;
    }
    const beatMs = 60000 / this.bpm;
    this.acc += delta;
    while (this.acc >= beatMs) {
      this.acc -= beatMs;
      this.tick(this.beat++);
    }
  }

  tick(b) {
    if (isMusicOff()) return;
    const v = 0.9 * this.duck * this.volume;
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    // B5 — the road has its own music, thinning as the light does
    if (this.road) {
      const r = this.road;
      if (r.stage === 'piano' && b % 2 === 0) playTone(pick(KEY.slice(0, 6)), 1.6, 'sine', 0.05 * v);
      if (r.stage === 'bass' && b % 2 === 0) playTone(pick([65, 73, 82, 98, 110]), 0.9, 'triangle', 0.09 * v);
      if (r.stage === 'held' && b % 16 === 0) {
        playTone(392, 7, 'square', 0.012 * v);
        playTone(392, 7, 'sine', 0.03 * v);
      }
      if (r.stage === 'band') this.themeTick(b, v * r.amount);
      return;
    }
    // Bo plays it himself when you're close enough to see him
    if (this.source === 'bo') {
      if (b % 2 === 0) {
        const f = b % 16 < 8 ? ORB_THEME[(b >> 1) % 4] / 2 : pick(KEY.slice(2, 8));
        const sv = (this.sourceVol || 1) * v;
        playTone(f, 0.5, 'square', 0.022 * sv);
        playTone(f * 1.006, 0.5, 'sawtooth', 0.012 * sv);
        playTone(f / 2, 0.5, 'triangle', 0.02 * sv);
      }
      return;
    }
    switch (this.stem()) {
      case 'piano':
        if (b % 2 === 0 && Math.random() < 0.8) playTone(pick(KEY.slice(0, 8)), 1.4, 'sine', 0.05 * v);
        if (b % 8 === 0) [KEY[0] / 2, KEY[2] / 2, KEY[4] / 2].forEach((f, i) => playTone(f, 2.4, 'sine', 0.025 * v, i * 0.04));
        break;
      case 'trumpet':
        // muted: a square with most of its edge filed off
        if (b % 3 === 0 && Math.random() < 0.7) {
          const f = pick(KEY.slice(3, 9));
          playTone(f, 0.7, 'triangle', 0.035 * v);
          playTone(f * 2, 0.4, 'sine', 0.008 * v);
        }
        break;
      case 'bass':
        playTone(pick([65, 73, 82, 98, 110, 98]), 0.6, 'triangle', 0.08 * v);
        break;
      case 'guitar':
        if (b % 2 === 0) {
          const f = pick(KEY.slice(0, 7));
          playTone(f, 0.9, 'triangle', 0.035 * v);
          playTone(f * 1.5, 0.6, 'sine', 0.012 * v, 0.03);
        }
        break;
      default:
        break; // a whole minute of nothing
    }
  }

  // the Orb theme, finally whole, slow, like nobody's performing it
  themeTick(b, v) {
    const i = Math.floor(b / 2) % (ORB_THEME.length + 4);
    if (b % 2 === 0 && i < ORB_THEME.length) {
      playTone(ORB_THEME[i] / 2, 1.8, 'sine', 0.05 * v);
      playTone(ORB_THEME[i] / 2, 1.2, 'triangle', 0.015 * v);
    }
    if (b % 4 === 0) playTone([65, 82, 98, 110][(b / 4) % 4], 1.6, 'triangle', 0.07 * v);
    if (b % 8 === 0) [262, 330, 392].forEach((f, k) => playTone(f, 3, 'sine', 0.02 * v, k * 0.05));
  }
}

// Jo's trumpet in the evening: snapped into the key, so it's never wrong
export function joNote(step, dur = 0.35) {
  const f = KEY[((step % KEY.length) + KEY.length) % KEY.length];
  playFx(f, dur, 'square', 0.12);
  playFx(f, dur, 'sawtooth', 0.05);
  playFx(f * 2, dur * 0.7, 'sine', 0.04);
}

export { playNoise };
