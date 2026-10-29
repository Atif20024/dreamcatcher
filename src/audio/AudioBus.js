// AudioBus (plan 2.13): music, ambience, sfx and ui buses under the
// master gain of src/systems/audio.js, with volumes from Settings. The music
// bus follows the game's music switch ([M], the pause menu): off means 0.
// Everything degrades to silence when WebAudio is unavailable.
import { audioCtx, audioOut, isMusicOff } from '../systems/audio.js';
import { getSettings } from '../utils/save.js';
import { voice, noiseVoice, audioHooks, PRIO } from './synth.js';

// chatter (NPC babble, src/audio/chatter.js) follows the ambience slider
export const BUS_DEFAULTS = Object.freeze({ music: 0.8, ambience: 0.55, sfx: 0.9, ui: 0.8, chatter: 0.5 });
const SETTING_OF = { chatter: 'ambience' };
// calibration (audio pass, measured offline in tests/audioMix.test.js): the
// synth voices were written quiet; these bring each bus to its target level
// before the master (music -18 dBFS, ambience -26, chatter -26 while
// someone talks), separately from the player's volume settings
export const BUS_TRIM = Object.freeze({ music: 8, ambience: 4, sfx: 1, ui: 1, chatter: 3.5 });
// for callers written against the old direct-to-master level (the Evening)
export const flatGain = (bus) => 1 / ((BUS_DEFAULTS[bus] || 1) * (BUS_TRIM[bus] || 1));

// Ducking (advice §4): music -4 dB under dialogue (150 ms in, 600 ms out),
// -6 dB under a stinger (50 ms in, 800 ms out); ambience -3 dB under
// dialogue. A wall (room.music.wall): the music of the room next door,
// low-passed to 900 Hz and 9 dB down.
export const DUCK = Object.freeze({ dialogue: { music: 0.63, ambience: 0.71, chatter: 0.5 }, sting: 0.5, wall: { lp: 900, gain: 0.355 } });

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
  // audio pass: the jazz cellar (dry-ish, close), a casino's velvet lounge
  // (tighter), the hull of the station in orbit (long, dark)
  club: { lp: 5000, wet: 0.18, t60: 0.8 },
  lounge: { lp: 3800, wet: 0.14, t60: 0.7 },
  hull: { lp: 3000, wet: 0.22, t60: 2.0 },
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
    this.duckers = {};
    const room = this.buildRoom(ctx, out);
    // the wall stage on the music bus: a low-pass and a gain, open by default
    // (two low-passes in a row: a wall takes the top off steeply)
    const wallLp = ctx.createBiquadFilter();
    wallLp.type = 'lowpass';
    wallLp.frequency.value = 20000;
    wallLp.Q.value = -3.01;
    const wallLp2 = ctx.createBiquadFilter();
    wallLp2.type = 'lowpass';
    wallLp2.frequency.value = 20000;
    wallLp2.Q.value = -3.01;
    const wallG = ctx.createGain();
    wallLp.connect(wallLp2).connect(wallG).connect(room);
    this.wallNodes = { lp: wallLp, lp2: wallLp2, gain: wallG };
    for (const name of Object.keys(BUS_DEFAULTS)) {
      const g = ctx.createGain();
      // music, ambience and chatter sound the room; sfx and ui are dry
      if (name === 'music' || name === 'ambience' || name === 'chatter') {
        const d = ctx.createGain();
        g.connect(d).connect(name === 'music' ? wallLp : room);
        this.duckers[name] = d;
      } else g.connect(out);
      this.nodes[name] = g;
    }
    this.apply();
    this.setAcoustics(this.preset || 'open', true);
    this.setWall(this.wall || false, true);
    this.applyDuck(true);
    return this.nodes;
  }

  // music heard through a wall (true, or a cutoff in Hz); false = in the room
  setWall(on, instant = false) {
    this.wall = on || false;
    if (!this.wallNodes) return this.wall;
    const t = audioCtx().currentTime;
    const k = instant ? 0.01 : 0.3;
    const lp = on ? (typeof on === 'number' ? on : DUCK.wall.lp) : 20000;
    this.wallNodes.lp.frequency.setTargetAtTime(lp, t, k);
    this.wallNodes.lp2.frequency.setTargetAtTime(lp, t, k);
    this.wallNodes.gain.gain.setTargetAtTime(on ? DUCK.wall.gain : 1, t, k);
    return this.wall;
  }

  // dialogue on screen: hold the duck until it closes
  duckDialogue(on) {
    if (!!on === !!this.dialogue) return;
    this.dialogue = !!on;
    this.applyDuck();
  }

  // a stinger: a quick dip of the music, then back
  duckSting() {
    if (!this.duckers) return;
    const t = audioCtx().currentTime;
    const p = this.duckers.music.gain;
    const base = this.dialogue ? DUCK.dialogue.music : 1;
    p.cancelScheduledValues(t);
    p.setTargetAtTime(base * DUCK.sting, t, 0.017);
    p.setTargetAtTime(base, t + 0.35, 0.27);
    this.stingAt = t;
  }

  applyDuck(instant = false) {
    if (!this.duckers) return;
    const t = audioCtx().currentTime;
    for (const [name, d] of Object.entries(this.duckers)) {
      const v = this.dialogue ? DUCK.dialogue[name] : 1;
      d.gain.cancelScheduledValues(t);
      d.gain.setTargetAtTime(v, t, instant ? 0.01 : this.dialogue ? 0.05 : 0.2);
    }
  }

  // tests: forget the nodes (a new offline context builds its own)
  reset() {
    this.nodes = null;
    this.room = null;
    this.wallNodes = null;
    this.duckers = null;
    this.dialogue = false;
    this.wall = false;
    this.preset = 'open';
  }

  // the room stage: in → low-pass → out, and low-pass → send → combs → wet → out
  buildRoom(ctx, out) {
    // two low-passes in a row (24 dB/oct): inside really is muffled
    const lp0 = ctx.createBiquadFilter();
    lp0.type = 'lowpass';
    lp0.frequency.value = 20000;
    lp0.Q.value = -3.01;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 20000;
    lp.Q.value = -3.01;
    lp0.connect(lp);
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
      // no resonant bump in the loop (Q 1 dB peaks +2 dB at the cutoff:
      // with the hall's feedback that rang up without end) — flat, ≤ 1
      damp.Q.value = -3.01;
      send.connect(delay);
      delay.connect(damp).connect(fb).connect(delay);
      delay.connect(wet);
      return { d, fb };
    });
    this.room = { lp, lp0, send, wet, combs };
    return lp0;
  }

  // a preset from ACOUSTICS, eased in (a door: instant)
  setAcoustics(name, instant = false, tweak = null) {
    const p = { ...(ACOUSTICS[name] || ACOUSTICS.open), ...(tweak || {}) };
    this.preset = ACOUSTICS[name] ? name : 'open';
    if (!this.room) return this.preset;
    const ctx = audioCtx();
    const t = ctx.currentTime;
    const k = instant ? 0.01 : 0.25;
    this.room.lp.frequency.setTargetAtTime(p.lp, t, k);
    this.room.lp0.frequency.setTargetAtTime(p.lp, t, k);
    this.room.send.gain.setTargetAtTime(p.wet, t, k);
    let sum = 0;
    for (const c of this.room.combs) {
      const fb = p.wet ? combFeedback(c.d, p.t60) : 0;
      sum += 1 / (1 - fb * fb);
      c.fb.gain.setTargetAtTime(fb, t, k);
    }
    // normalise the combs' build-up so the tail sits at `wet`, not above it
    // (by RMS: four combs of noise add as power, each 1/(1-fb²))
    this.room.wet.gain.setTargetAtTime(1 / Math.sqrt(sum), t, k);
    return this.preset;
  }

  volume(name) {
    let v = BUS_DEFAULTS[name];
    try {
      const s = getSettings();
      const key = SETTING_OF[name] || name;
      if (s && s.volumes && typeof s.volumes[key] === 'number') v = s.volumes[key] * (SETTING_OF[name] ? BUS_DEFAULTS[name] / BUS_DEFAULTS[key] : 1);
    } catch {
      /* no save */
    }
    if (name === 'music' && isMusicOff()) v = 0;
    return v;
  }

  apply() {
    if (!this.nodes) return;
    const ctx = audioCtx();
    for (const [name, g] of Object.entries(this.nodes)) g.gain.setTargetAtTime(this.volume(name) * (BUS_TRIM[name] || 1), ctx.currentTime, 0.05);
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
// the synth voices and the master's stingers find the buses through here
audioHooks.bus = (name) => buses.bus(name);
audioHooks.sting = () => buses.duckSting();
audioHooks.flat = flatGain;

const BUS_PRIO = { music: PRIO.music, ambience: PRIO.event, chatter: PRIO.chatter, sfx: PRIO.sfx, ui: PRIO.ui };

// a short synth voice on a bus: (freq, dur, type, vol, when, glideTo)
export function busTone(bus, freq, dur, type = 'sine', vol = 0.3, when = 0, glideTo = null) {
  const ctx = buses.ctx();
  const out = buses.bus(bus);
  if (!ctx || !out) return;
  voice(ctx, out, { freq, dur, type, vol, when, glide: glideTo, prio: BUS_PRIO[bus] ?? PRIO.sfx });
}

// a burst of filtered noise on a bus (a linear fade to silence)
export function busNoise(bus, dur, vol = 0.2, freq = 1000, when = 0, q = 0.8) {
  const ctx = buses.ctx();
  const out = buses.bus(bus);
  if (!ctx || !out) return;
  noiseVoice(ctx, out, { dur, vol, f: freq, when, q, env: 'lin', prio: BUS_PRIO[bus] ?? PRIO.sfx });
}

// a shaped synth voice (the era instruments): an attack, an optional held
// sustain, an exponential release, an optional filter ({ type, f, q }) and
// vibrato (Hz of depth at vibHz)
export function busSynth(bus, { freq, dur = 0.5, type = 'sine', vol = 0.2, when = 0, at = null, attack = 0.005, hold = 0, filter = null, vib = 0, vibHz = 5 } = {}) {
  const ctx = buses.ctx();
  const out = buses.bus(bus);
  if (!ctx || !out || !freq) return;
  voice(ctx, out, { freq, dur, type, vol, when, at, attack, hold, filter, vib, vibHz, prio: BUS_PRIO[bus] ?? PRIO.sfx });
}
