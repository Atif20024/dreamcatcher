// The engines (THE LONG STRAIGHT): synth only, on the sfx bus. A sawtooth and a
// detuned square through a low-pass that opens with the revs, a sine an octave
// down for the exhaust, a slow flutter for age. Filtered noise for the road and
// for a sliding tyre. At most MAX_ENGINES cars are heard: Jo, then the nearest.
// The maths is pure (tests/race.test.js); `state()` says what is being asked of
// the oscillators, which is all a silent dev build can check.
//
//   const e = new EngineSynth();
//   e.update({ cars: [{ id, v, throttle, dx, closing, base, detune }], slip, speed, beat });
//   e.silence(true);  e.destroy();
import { buses } from './AudioBus.js';
import { revs } from '../engines/race.js';

export const MAX_ENGINES = 3;
const TC = 0.04; // s: how fast a voice follows (never a step)
const FLUTTER = 14; // cents: the voices' age, a slow wobble

// a car's note: pitch from the revs, the filter opens and it gets louder on the throttle
export function engineNote({ v, throttle, base = 52, detune = 6, closing = 0 }) {
  const r = revs(v, throttle);
  // (a real doppler is too small to hear at 36 m/s: three times it, for the pass)
  const doppler = 1 + (3 * closing) / 340;
  return {
    revs: r,
    freq: base * (1 + 3.4 * r) * doppler,
    detune,
    filter: 280 + (throttle ? 3400 : 1700) * r,
    gain: (0.05 + 0.1 * r) * (throttle ? 1 : 0.62),
  };
}

// HEAR THE DRAFT: pull the rival's note to Jo's, `beat.hz` off it, so the two
// engines beat at that rate (src/engines/race.js draftBeat has the maths). The
// flutter and the voice's own detune would beat as well, so they go as it tunes.
export function tuneToBeat(jo, rival, beat) {
  const k = beat.hear;
  const clean = (n) => ({ ...n, detune: n.detune * (1 - k), flutter: FLUTTER * (1 - k) });
  return {
    jo: clean(jo),
    rival: { ...clean(rival), freq: rival.freq + (jo.freq + beat.hz - rival.freq) * k, sub: rival.freq / 2 + (jo.freq / 2 + beat.hz - rival.freq / 2) * k },
  };
}

// how a car at dx metres sits in the mix
export const distanceGain = (dx) => 1 / (1 + (dx / 40) * (dx / 40));
export const panOf = (dx) => Math.max(-0.8, Math.min(0.8, dx / 60));

// who is heard: Jo always (the first car), then the nearest
export function pickAudible(cars, max = MAX_ENGINES) {
  const [jo, ...rest] = cars;
  return jo ? [jo, ...[...rest].sort((a, b) => Math.abs(a.dx) - Math.abs(b.dx)).slice(0, max - 1)] : [];
}

function noiseBuffer(ctx) {
  const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function makeVoice(ctx, dest) {
  const saw = ctx.createOscillator();
  saw.type = 'sawtooth';
  const sq = ctx.createOscillator();
  sq.type = 'square';
  const sub = ctx.createOscillator();
  sub.type = 'sine';
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 7;
  const lfoAmt = ctx.createGain();
  lfoAmt.gain.value = FLUTTER;
  lfo.connect(lfoAmt);
  lfoAmt.connect(saw.detune);
  lfoAmt.connect(sq.detune);
  const sqGain = ctx.createGain();
  sqGain.gain.value = 0.45;
  const subGain = ctx.createGain();
  subGain.gain.value = 0.7;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 1.2;
  const out = ctx.createGain();
  out.gain.value = 0;
  const pan = ctx.createStereoPanner();
  saw.connect(lp);
  sq.connect(sqGain);
  sqGain.connect(lp);
  sub.connect(subGain);
  subGain.connect(out);
  lp.connect(out);
  out.connect(pan);
  pan.connect(dest);
  const oscs = [saw, sq, sub, lfo];
  oscs.forEach((o) => o.start());
  return {
    set(n, gain, p, t) {
      saw.frequency.setTargetAtTime(n.freq, t, TC);
      sq.frequency.setTargetAtTime(n.freq, t, TC);
      sq.detune.setTargetAtTime(n.detune, t, TC);
      sub.frequency.setTargetAtTime(n.sub ?? n.freq / 2, t, TC);
      lfoAmt.gain.setTargetAtTime(n.flutter ?? FLUTTER, t, TC);
      lp.frequency.setTargetAtTime(n.filter, t, TC);
      out.gain.setTargetAtTime(gain, t, TC);
      pan.pan.setTargetAtTime(p, t, TC);
    },
    mute(t) {
      out.gain.setTargetAtTime(0, t, 0.03);
    },
    stop() {
      oscs.forEach((o) => {
        try {
          o.stop();
          o.disconnect();
        } catch {
          /* already gone */
        }
      });
      out.disconnect();
      pan.disconnect();
    },
  };
}

function makeNoise(ctx, dest, type, f, q) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  const flt = ctx.createBiquadFilter();
  flt.type = type;
  flt.frequency.value = f;
  flt.Q.value = q;
  const out = ctx.createGain();
  out.gain.value = 0;
  src.connect(flt);
  flt.connect(out);
  out.connect(dest);
  src.start();
  return { flt, out, stop: () => { src.stop(); src.disconnect(); out.disconnect(); } };
}

export class EngineSynth {
  // (a scenario hands it an OfflineAudioContext: the dev build has no live one)
  constructor({ ctx = buses.ctx(), dest = buses.bus('sfx') } = {}) {
    this.ctx = ctx;
    this.dest = dest;
    this.voices = [];
    this.silent = false;
    this.last = { voices: [], road: 0, squeal: 0 };
    if (!this.ctx || !this.dest) return;
    for (let i = 0; i < MAX_ENGINES; i++) this.voices.push(makeVoice(this.ctx, this.dest));
    this.road = makeNoise(this.ctx, this.dest, 'lowpass', 500, 0.7);
    this.squeal = makeNoise(this.ctx, this.dest, 'bandpass', 1800, 6);
  }

  update({ cars = [], slip = 0, speed = 0, beat = null } = {}) {
    if (this.silent) return;
    const heard = pickAudible(cars);
    const t = this.ctx ? this.ctx.currentTime : 0;
    const notes = new Map(heard.map((c) => [c.id, engineNote(c)]));
    const with_ = beat && notes.has(beat.id) && heard[0].id !== beat.id;
    if (with_) {
      const tuned = tuneToBeat(notes.get(heard[0].id), notes.get(beat.id), beat);
      notes.set(heard[0].id, tuned.jo);
      notes.set(beat.id, tuned.rival);
    }
    const voices = heard.map((c) => {
      const n = notes.get(c.id);
      return { id: c.id, ...n, gain: n.gain * distanceGain(c.dx), pan: panOf(c.dx) };
    });
    const road = 0.06 * Math.min(1, speed / 36);
    const squeal = Math.min(0.12, slip * 0.012);
    this.last = { voices, road, squeal, beat: with_ ? beat : null };
    this.voices.forEach((v, i) => (voices[i] ? v.set(voices[i], voices[i].gain, voices[i].pan, t) : v.mute(t)));
    if (this.road) {
      this.road.out.gain.setTargetAtTime(road, t, 0.1);
      this.squeal.out.gain.setTargetAtTime(squeal, t, 0.05);
      this.squeal.flt.frequency.setTargetAtTime(1400 + slip * 60, t, 0.05);
    }
  }

  // a pause, a card: no sound, nothing torn down
  silence(on) {
    if (on === this.silent) return;
    this.silent = on;
    if (!on || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.voices.forEach((v) => v.mute(t));
    if (this.road) {
      this.road.out.gain.setTargetAtTime(0, t, 0.03);
      this.squeal.out.gain.setTargetAtTime(0, t, 0.03);
    }
    this.last = { voices: [], road: 0, squeal: 0 };
  }

  state() {
    return { live: this.voices.length, silent: this.silent, ctx: this.ctx ? this.ctx.state : 'none', ...this.last };
  }

  destroy() {
    this.voices.forEach((v) => v.stop());
    this.voices = [];
    if (this.road) {
      this.road.stop();
      this.squeal.stop();
      this.road = this.squeal = null;
    }
  }
}
