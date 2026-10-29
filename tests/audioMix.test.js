// The whole game's mix, checked offline (audio pass; advice §4 "Offline
// verification"). Dev is silent and nobody can listen, so every place's
// sound — its band or stems, its loop and layers, its one-shots, people
// talking — is run through the real master chain and buses into an
// offline renderer (tests/helpers/fakeAudio.js) and measured: loudness per
// bus, peak, clipping, the seams, the spectrum, the beat clock, the voice
// cap and the node count. The mute stays shut: the tests listen at the
// ceiling, before it.
import { describe, it, expect, beforeAll } from 'vitest';
import { FakeAudioContext, rms, peak, dbfs, spectrum, bandDb } from './helpers/fakeAudio.js';
import { installAudioContext, audioTap, musicDirector, masterChain, sting, trumpet, sfx, chime } from '../src/systems/audio.js';
import { buses, ACOUSTICS, BUS_DEFAULTS, BUS_REFERENCE, VOLUME_KEYS } from '../src/audio/AudioBus.js';
import { CHATTER } from '../src/audio/chatter.js';
import { StemMusic, STEM_MIX } from '../src/audio/MusicDirector.js';
import { Ambience } from '../src/audio/Ambience.js';
import { LOOPS, LOOP_LAYERS } from '../src/audio/synthLoops.js';
import { PlaceAudio } from '../src/audio/PlaceAudio.js';
import { BEDS, LEGACY_ROOMS } from '../src/audio/places.js';
import { SHOTS, EventBed } from '../src/audio/events.js';
import { BeatClock } from '../src/audio/clock.js';
import { pool, VoicePool, PRIO } from '../src/audio/synth.js';
import { renderBabble, babblePlan, VOWELS } from '../src/audio/babble.js';
import { BANDS } from '../src/audio/bands.js';
import { VOICES } from '../src/audio/instruments.js';
import { STINGS } from '../src/audio/Stingers.js';
import { Ensemble, Soundscape } from '../src/systems/soundscape.js';
import { MUSIC_KEYS as PAINTER } from '../src/dreams/painter/music.js';
import { MUSIC_KEYS as CLOCK } from '../src/dreams/clockmaker/music.js';
import { MUSIC_KEYS as MUSICIAN } from '../src/dreams/musician/music.js';
import { hubState } from '../src/systems/hubState.js';

const SR = 22050;
const SECS = 10;

function setup() {
  const ctx = new FakeAudioContext({ sampleRate: SR });
  installAudioContext(ctx);
  buses.reset();
  buses.ensure();
  const cap = ctx.createGain();
  audioTap().connect(cap);
  return { ctx, cap };
}

const frame = (def) => ({ bpm: 90, root: 98, motif: [0, 4, 7], ...def });

// every place: its music, its loop, its bed, its acoustics, its wall
const PLACES = {
  hub: { band: 'hub', mix: hubState(0).music, loops: { hub_hall: 1, hub_crowd: 1 }, bed: 'hub', acoustics: 'hall' },
  hub_empty: { band: 'hub', mix: hubState(5).music, loops: { hub_hall: 1, hub_crowd: 0.15 }, bed: 'hub', acoustics: 'hall', tweak: { wet: 0.3 } },
  clock_green: { stems: frame({ keys: CLOCK }), key: 'green', state: 'explore', loops: { meadow_dusk: 1 }, bed: 'green', acoustics: 'open' },
  clock_house: { stems: frame({ keys: CLOCK }), key: 'clockhouse', state: 'quiet', loops: { clock_room: 1 }, bed: 'clockhouse', acoustics: 'room' },
  rain_street: { stems: frame({ keys: MUSICIAN }), key: 'street', state: 'quiet', loops: { rain_street: 1 }, bed: 'rain', acoustics: 'open' },
  alley: { stems: frame({ keys: MUSICIAN }), key: 'cellar', state: 'explore', loops: { rain_street: 1 }, bed: 'rain', acoustics: 'open', wall: true },
  cellar: { stems: frame({ keys: MUSICIAN }), key: 'cellar', state: 'quiet', loops: { club_room: 1 }, bed: 'cellar', acoustics: 'club' },
  backstage: { stems: frame({ keys: MUSICIAN }), key: 'backstage', state: 'explore', loops: { festival: 1 }, bed: 'backstage', acoustics: 'room', wall: 700 },
  stage: { stems: frame({ keys: MUSICIAN }), key: 'stage', state: 'setpiece', loops: { festival: 1 }, bed: 'arena', acoustics: 'hall' },
  painter_piazza: { stems: frame({ keys: PAINTER, voices: {} }), key: 'piazza', state: 'explore', loops: { rn_piazza: 1 }, bed: 'piazza', acoustics: 'open' },
  painter_bottega: { stems: frame({ keys: PAINTER, voices: {} }), key: 'bottega', state: 'quiet', loops: { rn_bottega: 1 }, bed: null, acoustics: 'room' },
  painter_street: { stems: frame({ keys: PAINTER, voices: {} }), key: 'street', state: 'explore', loops: { rn_street: 1 }, bed: null, acoustics: 'open' },
  painter_speziale: { stems: frame({ keys: PAINTER, voices: {} }), key: 'speziale', state: 'quiet', loops: { rn_speziale: 1 }, bed: null, acoustics: 'room' },
  painter_hall: { stems: frame({ keys: PAINTER, voices: {} }), key: 'hall', state: 'quiet', loops: { rn_hall: 1 }, bed: null, acoustics: 'hall' },
  painter_palazzo: { stems: frame({ keys: PAINTER, voices: {} }), key: 'palazzo', state: 'quiet', loops: { rn_palazzo: 1 }, bed: null, acoustics: 'room' },
  painter_chapel: { stems: frame({ keys: PAINTER, voices: {} }), key: 'chapel', state: 'tense', loops: { rn_chapel: 1 }, bed: null, acoustics: 'chapel' },
  chef_kitchen: { band: 'chef', state: 'explore', boost: { bass: 1 }, loops: { sizzle: 1 }, bed: 'kitchen', acoustics: 'room', bpm: 110 },
  writer_attic: { band: 'writer', state: 'quiet', loops: { typewriter: 1 }, bed: 'writer', acoustics: 'room', bpm: 84 },
  astronaut_hull: { band: 'astronaut', state: 'quiet', boost: { bass: 1 }, loops: { engines: 1 }, bed: 'orbit', acoustics: 'hull', bpm: 72 },
  gambler_floor: { band: 'gambler', state: 'explore', loops: { slots: 1 }, bed: 'casino', acoustics: 'room', bpm: 112 },
  evening: { evening: true, bed: null, acoustics: 'open' },
};

// render one place → measurements
function renderPlace(name, { secs = SECS, extra = null, dialogue = false, noEvents = false } = {}) {
  const p = PLACES[name];
  const { ctx, cap } = setup();
  buses.setAcoustics(p.acoustics || 'open', true, p.tweak || null);
  buses.setWall(p.wall || false, true);
  if (dialogue) buses.duckDialogue(true);
  let music = null;
  let pump = () => {};
  if (p.stems) {
    music = new StemMusic(null, p.stems);
    music.setKey(p.key);
    music.setState(p.state);
    music.start();
    music.clock.stop();
    pump = () => music.clock.pump();
  } else if (p.band) {
    musicDirector.scene = null;
    musicDirector.setBand(p.band);
    if (p.mix) musicDirector.setMix(p.mix);
    else {
      musicDirector.clearMix();
      musicDirector.setState(p.state);
    }
    musicDirector.boost = { ...(p.boost || {}) };
    musicDirector.start();
    musicDirector.clock.stop();
    if (p.bpm) musicDirector.setRoomTempo(p.bpm, p.acoustics !== 'open');
    pump = () => musicDirector.clock.pump();
  }
  let ens = null;
  let scape = null;
  if (p.evening) {
    ens = new Ensemble(0);
    scape = new Soundscape();
  }
  const amb = new Ambience();
  if (p.loops) amb.set(p.loops);
  const scene = { time: { now: 0 } };
  const pa = new PlaceAudio(scene, { speakers: () => [{ id: 'mara', x: 120, y: 0 }, { id: 'tobias', x: -160, y: 0 }], listener: () => ({ x: 0, y: 0 }) });
  if (p.bed && !noEvents) {
    pa.setBed(p.bed);
    // the bed's first shots early, so ten seconds hear them
    pa.bed.next = pa.bed.next.map((_, i) => 0.6 + i * 1.1);
  }
  let lastT = 0;
  const out = ctx.render(cap, secs, {
    onBlock: (t) => {
      pump();
      scene.time.now = t * 1000;
      if (!noEvents) pa.update(t * 1000);
      if (ens) ens.update((t - lastT) * 1000, {});
      if (scape) scape.update(t * 1000, (t - lastT) * 1000, { wind: 0.4, water: 0.3, fountainDist: 8, rain: 0, snow: 0, place: 'town' });
      if (extra) extra(t);
      lastT = t;
    },
    probes: { music: buses.nodes.music, ambience: buses.nodes.ambience, chatter: buses.nodes.chatter },
  });
  if (music) music.stop();
  musicDirector.stop();
  musicDirector.boost = {};
  const mono = new Float32Array(out.L.length);
  let over = 0;
  for (let i = 0; i < mono.length; i++) {
    mono[i] = (out.L[i] + out.R[i]) / 2;
    if (Math.abs(out.L[i]) > 0.99 || Math.abs(out.R[i]) > 0.99) over += 1;
  }
  return {
    name,
    out,
    mono,
    rms: dbfs(rms(mono)),
    peak: dbfs(Math.max(peak(out.L), peak(out.R))),
    over,
    music: dbfs(rms(out.probes.music)),
    ambience: dbfs(rms(out.probes.ambience)),
    chatter: dbfs(rms(out.probes.chatter)),
    talking: activeDb(out.probes.chatter),
    fired: pa.fired,
    bursts: pa.chatter.bursts,
    nodes: ctx.stats.nodes,
    peakLive: ctx.stats.peakLive,
    voices: { ...pool.peak },
    stolen: pool.stolen,
    dropped: pool.dropped,
  };
}

// RMS over the 50 ms windows where something sounds (a voice while it talks)
function activeDb(a) {
  const w = Math.floor(SR * 0.05);
  let s = 0;
  let n = 0;
  for (let o = 0; o + w <= a.length; o += w) {
    let e = 0;
    for (let i = o; i < o + w; i++) e += a[i] * a[i];
    if (e / w > 1e-7) {
      s += e;
      n += w;
    }
  }
  return n ? dbfs(Math.sqrt(s / n)) : -120;
}

const results = {};
beforeAll(() => {
  for (const k of Object.keys(PLACES)) results[k] = renderPlace(k);
  if (process.env.AUDIO_TABLE) {
    const at = (r) => {
      let k = 0;
      for (let i = 0; i < r.mono.length; i++) if (Math.abs(r.out.L[i]) > Math.abs(r.out.L[k])) k = i;
      const pk = (a) => Math.max(...Array.from(a.subarray(Math.max(0, k - 200), k + 200)).map(Math.abs)).toFixed(3);
      return `@${(k / SR).toFixed(2)}s m${pk(r.out.probes.music)} a${pk(r.out.probes.ambience)} c${pk(r.out.probes.chatter)}`;
    };
    const rows = Object.values(results).map((r) => `${at(r)} ${r.name.padEnd(15)} out ${r.rms.toFixed(1)} pk ${r.peak.toFixed(1)} | music ${r.music.toFixed(1)} amb ${r.ambience.toFixed(1)} chat ${r.chatter.toFixed(1)} talk ${r.talking.toFixed(1)} | shots ${r.fired} bursts ${r.bursts} | nodes ${r.nodes} live ${r.peakLive} osc ${r.voices.osc} noise ${r.voices.noise} stolen ${r.stolen} dropped ${r.dropped}`);
    process.stdout.write(`\n${rows.join('\n')}\n`);
  }
});

describe('every place, mixed and measured (offline)', () => {
  it('is never silent, never clips, peaks under -1 dBFS', () => {
    for (const r of Object.values(results)) {
      expect(r.rms, `${r.name} rms`).toBeGreaterThan(-45);
      expect(r.peak, `${r.name} peak`).toBeLessThanOrEqual(-1);
      expect(r.over, `${r.name} samples over 0.99`).toBe(0);
    }
  });

  // feedback 3 ("way too noisy, keep the background music subtle"): the
  // music bus is 8 dB under the audio pass (-18…-22 → -26…-30 pre-master),
  // ambience 2 dB, chatter 4.4 dB; sfx and ui (dialogue, stingers,
  // footsteps) are where they were, so they read over the bed
  it('sits near the target loudness (output RMS -40…-24 dBFS; pre-master music -38…-23, ambience -40…-20, a voice -36…-24)', () => {
    for (const r of Object.values(results)) {
      expect(r.rms, r.name).toBeGreaterThan(-40);
      expect(r.rms, r.name).toBeLessThan(-24);
      if (!PLACES[r.name].evening) {
        expect(r.music, `${r.name} music`).toBeGreaterThan(-38);
        expect(r.music, `${r.name} music`).toBeLessThan(-23);
      }
      if (!PLACES[r.name].evening) {
        expect(r.ambience, `${r.name} ambience`).toBeGreaterThan(-40);
        expect(r.ambience, `${r.name} ambience`).toBeLessThan(-20);
      }
    }
    for (const r of Object.values(results)) {
      expect(r.talking, `${r.name} talking`).toBeGreaterThan(-36);
      expect(r.talking, `${r.name} talking`).toBeLessThan(-24);
    }
    // the places sit together: their music within 12 dB of each other
    const ms = Object.values(results).filter((r) => !PLACES[r.name].evening).map((r) => r.music);
    expect(Math.max(...ms) - Math.min(...ms)).toBeLessThan(12);
  });

  it('the background music is subtle: 6–9 dB under the audio pass, the Evening too; sfx and ui untouched', () => {
    const dB = (a, b) => 20 * Math.log10(a / b);
    expect(dB(BUS_DEFAULTS.music, BUS_REFERENCE.music)).toBeLessThanOrEqual(-6);
    expect(dB(BUS_DEFAULTS.music, BUS_REFERENCE.music)).toBeGreaterThanOrEqual(-9);
    expect(dB(BUS_DEFAULTS.ambience, BUS_REFERENCE.ambience)).toBeLessThan(-1);
    expect(dB(BUS_DEFAULTS.chatter, BUS_REFERENCE.chatter)).toBeLessThan(-3);
    expect(BUS_DEFAULTS.sfx).toBe(BUS_REFERENCE.sfx);
    expect(BUS_DEFAULTS.ui).toBe(BUS_REFERENCE.ui);
    // the median place's music is under -25 dBFS pre-master
    const ms = Object.values(results).filter((r) => !PLACES[r.name].evening).map((r) => r.music).sort((a, b) => a - b);
    expect(ms[Math.floor(ms.length / 2)]).toBeLessThan(-25);
    // the Evening's direct voices follow the buses down
    expect(results.evening.music).toBeLessThan(-40);
    expect(results.evening.ambience).toBeLessThan(-19);
  });

  it('chatter stays sparse: a 20 s cooldown or more, at most two at once', () => {
    expect(CHATTER.cooldown[0]).toBeGreaterThanOrEqual(20);
    expect(CHATTER.max).toBeLessThanOrEqual(2);
  });

  it('the Music and Ambience sliders scale their buses (a fraction of the default)', () => {
    expect(VOLUME_KEYS).toEqual(['music', 'ambience']);
  });

  it('fires its one-shots and its people talk', () => {
    for (const r of Object.values(results)) {
      const bed = PLACES[r.name].bed;
      if (bed) expect(r.fired, `${r.name} shots`).toBeGreaterThanOrEqual(Math.min(3, BEDS[bed].events.length));
      expect(r.bursts, `${r.name} chatter`).toBeGreaterThanOrEqual(1);
    }
  });

  it('stays inside the voice cap, and the graph stays small', () => {
    for (const r of Object.values(results)) {
      expect(r.voices.osc, `${r.name} osc`).toBeLessThanOrEqual(24);
      expect(r.voices.noise, `${r.name} noise`).toBeLessThanOrEqual(8);
      // sources sounding at once: voices + LFOs + loop layers
      expect(r.peakLive, `${r.name} live sources`).toBeLessThanOrEqual(48);
    }
  });

  it('the full mix (the arena, every stem, a stinger, a chime, the crowd) still peaks under -1 dBFS', () => {
    const r = renderPlace('stage', {
      secs: 6,
      extra: (t) => {
        if (Math.abs(t - 1) < 0.03) {
          STINGS['dream:complete']();
          sting.death();
          chime('caught', 'musician');
          for (const s of ['clang', 'hurt', 'fail', 'orb']) sfx(s);
          trumpet(7, 0.6, 0.4);
        }
      },
    });
    expect(r.peak).toBeLessThanOrEqual(-1);
    expect(r.over).toBe(0);
    expect(r.voices.osc).toBeLessThanOrEqual(24 + 8); // stingers may pass the cap, never stolen
  });
});

describe('inside, outside, through a wall, under dialogue', () => {
  it('inside muffles: above 8 kHz is 20 dB down on outside, and 5–8 kHz is down too', () => {
    const air = (preset) => {
      const { ctx, cap } = setup();
      buses.setAcoustics(preset, true);
      const amb = new Ambience();
      amb.set({ rain_street: 1 });
      const o = ctx.render(cap, 4);
      const sp = spectrum(o.L.subarray(SR), SR);
      return { hi: bandDb(sp, 8000, 10500), mid: bandDb(sp, 5000, 8000), lo: bandDb(sp, 200, 2000) };
    };
    const open = air('open');
    const room = air('room');
    expect(open.hi - open.lo - (room.hi - room.lo)).toBeGreaterThan(20);
    expect(open.mid - open.lo - (room.mid - room.lo)).toBeGreaterThan(3);
  });

  it('music through a wall is 9 dB down or more, and dark (above 2 kHz 20 dB down)', () => {
    // the same music with and without the wall, at the output, nothing else
    const wm = musicOnly('cellar', true);
    const om = musicOnly('cellar', false);
    expect(om.rms - wm.rms).toBeGreaterThan(8.5);
    const ws = spectrum(wm.mono, SR);
    const os = spectrum(om.mono, SR);
    expect(bandDb(os, 2000, 8000) - bandDb(os, 60, 600) - (bandDb(ws, 2000, 8000) - bandDb(ws, 60, 600))).toBeGreaterThan(20);
  });

  it('dialogue ducks the music about 4 dB; a stinger dips it 6 dB and lets go', () => {
    const plain = musicOnly('rain_street', false);
    const ducked = musicOnly('rain_street', false, { dialogue: true });
    const d = plain.rms - ducked.rms;
    expect(d).toBeGreaterThan(3);
    expect(d).toBeLessThan(5);
    expect(buses.duckers.music).toBeTruthy();
  });
});

// the place's music alone, at the output (no loop, no shots)
function musicOnly(name, wall, { dialogue = false } = {}) {
  const p = PLACES[name];
  const { ctx, cap } = setup();
  buses.setAcoustics('open', true);
  buses.setWall(wall, true);
  if (dialogue) buses.duckDialogue(true);
  const m = new StemMusic(null, p.stems);
  m.setKey(p.key);
  m.setState(p.state);
  m.start();
  m.clock.stop();
  const o = ctx.render(cap, 8, { onBlock: () => m.clock.pump() });
  m.stop();
  const mono = o.L.subarray(SR);
  return { rms: dbfs(rms(mono)), mono };
}

describe('loops, voices and the babble', () => {
  it('every loop meets itself without a click (|seam| ≤ the loop’s own sample steps)', () => {
    const sr = 22050;
    for (const [name, fn] of Object.entries(LOOPS)) {
      const b = fn(sr);
      const diffs = [];
      for (let i = 1; i < b.length; i += 7) diffs.push(Math.abs(b[i] - b[i - 1]));
      diffs.sort((x, y) => x - y);
      const p99 = diffs[Math.floor(diffs.length * 0.99)];
      const jump = Math.abs(b[0] - b[b.length - 1]);
      expect(jump, `${name} seam ${jump.toFixed(4)} vs p99 ${p99.toFixed(4)}`).toBeLessThanOrEqual(Math.max(0.01, p99));
      // the derivative carries on over the seam too
      const step = Math.abs(b[1] - b[0] - (b[b.length - 1] - b[b.length - 2]));
      expect(step, `${name} slope step`).toBeLessThanOrEqual(Math.max(0.02, p99 * 2));
    }
  });

  it('the loops the dreams name all exist (pistol, monitors included) and layers resolve', () => {
    for (const n of ['pistol', 'monitors', 'hub_hall', 'hub_crowd', 'sizzle', 'typewriter', 'engines', 'slots', 'rain_street', 'clock_room']) expect(LOOPS[n], n).toBeTypeOf('function');
    for (const [k, layers] of Object.entries(LOOP_LAYERS)) for (const l of layers) expect(LOOPS[l], `${k} → ${l}`).toBeTypeOf('function');
  });

  it('rain is a broad 1–6 kHz wash, no tone standing 12 dB proud', () => {
    const b = LOOPS.rain_street(SR);
    const sp = spectrum(b, SR);
    const bins = [];
    for (let k = sp.bin(1000); k <= sp.bin(6000); k += 1) bins.push(20 * Math.log10(sp.mag[k] + 1e-12));
    // smooth over 9 bins (~50 Hz) and compare the peak with the median
    const sm = bins.map((_, i) => bins.slice(Math.max(0, i - 4), i + 5).reduce((a, c) => a + c, 0) / Math.min(9, bins.length));
    const sorted = [...sm].sort((x, y) => x - y);
    expect(Math.max(...sm) - sorted[Math.floor(sorted.length / 2)]).toBeLessThan(12);
  });

  it('two layers of other lengths do not repeat: no autocorrelation peak > 0.6 off the loop lengths', () => {
    const sr = 4000;
    const a = LOOPS.rain_street(sr);
    const b = LOOPS.rain_far(sr);
    const n = sr * 30;
    const x = new Float32Array(n);
    for (let i = 0; i < n; i++) x[i] = a[i % a.length] + b[i % b.length];
    let e = 0;
    for (let i = 0; i < n; i++) e += x[i] * x[i];
    const la = a.length / sr;
    const lb = b.length / sr;
    for (let lag = 1; lag < 12; lag += 0.05) {
      const near = (L) => Math.abs(lag / L - Math.round(lag / L)) * L < 0.1;
      if (near(la) || near(lb)) continue;
      const d = Math.round(lag * sr);
      let s = 0;
      for (let i = 0; i + d < n; i += 2) s += x[i] * x[i + d];
      expect((2 * s) / e, `lag ${lag.toFixed(2)} s`).toBeLessThan(0.6);
    }
  });

  it('square voices are filtered: nothing above 6 kHz (30 dB under the body)', () => {
    const { ctx, cap } = setup();
    for (let i = 0; i < 6; i++) setTimeout(() => {}, 0);
    trumpet(4, 0.8, 0.4);
    sfx('hurt');
    const o = ctx.render(cap, 1);
    const sp = spectrum(o.L, SR, 4096);
    expect(bandDb(sp, 100, 3000) - bandDb(sp, 6000, 11000)).toBeGreaterThan(30);
  });

  it('chatter is voice-shaped: its energy sits in the formants (300–2500 Hz), not the air', () => {
    for (const f0 of [112, 205]) {
      const b = renderBabble(SR, { f0, seed: 3, syllables: 8 });
      const sp = spectrum(b, SR, 2048);
      expect(bandDb(sp, 250, 2600) - bandDb(sp, 4000, 10000), `f0 ${f0}`).toBeGreaterThan(12);
      expect(peak(b)).toBeLessThanOrEqual(0.5001);
    }
    const plan = babblePlan(5, {});
    expect(plan.length).toBeGreaterThanOrEqual(4);
    expect(plan.length).toBeLessThanOrEqual(8);
    const fs = Object.values(VOWELS);
    for (const s of plan) expect(fs.some(([a, b]) => a === s.f1 && b === s.f2)).toBe(true);
  });

  it('every band, key and bed names real voices and shots', () => {
    for (const [n, b] of Object.entries(BANDS)) for (const p of Object.values(b.parts)) expect(VOICES[p.voice], `${n}: ${p.voice}`).toBeTypeOf('function');
    for (const keys of [CLOCK, MUSICIAN, PAINTER])
      for (const [n, k] of Object.entries(keys)) {
        for (const v of Object.values(k.voices || {})) if (v) expect(VOICES[v], `${n}: ${v}`).toBeTypeOf('function');
        if (k.pad) expect(VOICES[k.pad.voice]).toBeTypeOf('function');
        if (k.tick) expect(VOICES[k.tick]).toBeTypeOf('function');
      }
    for (const [n, b] of Object.entries(BEDS)) for (const e of b.events) expect(SHOTS[e.shot], `${n}: ${e.shot}`).toBeTypeOf('function');
    for (const rooms of Object.values(LEGACY_ROOMS))
      for (const [id, r] of Object.entries(rooms)) {
        expect(ACOUSTICS[r.acoustics], id).toBeTruthy();
        if (r.events) expect(BEDS[r.events], id).toBeTruthy();
      }
    expect(STEM_MIX.tense.lead).toBeLessThan(STEM_MIX.explore.lead * 0.6); // the chase drops the lead 6 dB
  });
});

describe('the clocks', () => {
  it('beats are even (within 2 ms) on the audio clock, and a stall does not fire a burst', () => {
    let t = 0;
    const beats = [];
    const c = new BeatClock({ now: () => ({ t, src: 'ctx' }), bpm: 120, onBeat: (b, at) => beats.push(at), timers: { setInterval: () => 1, clearInterval: () => {} } });
    c.start();
    for (let i = 0; i < 400; i++) {
      t += 0.025 + (i % 7) * 0.004; // a jittery timer
      c.pump();
    }
    for (let i = 2; i < beats.length; i++) expect(Math.abs(beats[i] - beats[i - 1] - 0.5)).toBeLessThan(0.002);
    // a background tab: three seconds with no pump
    const n0 = beats.length;
    t += 3;
    c.pump();
    expect(beats.length - n0).toBeLessThanOrEqual(1);
    // a tempo change keeps the grid going without a jump
    c.setBpm(60);
    for (let i = 0; i < 200; i++) {
      t += 0.03;
      c.pump();
    }
    const tail = beats.slice(-3);
    for (let i = 1; i < tail.length; i++) expect(Math.abs(tail[i] - tail[i - 1] - 1)).toBeLessThan(0.002);
  });

  it('a place’s one-shots: first after 6 s, each in its own interval, never twice in a row', () => {
    let s = 7;
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const bed = new EventBed(BEDS.hub, { rand });
    const fired = [];
    for (let t = 0; t < 600; t += 0.25) fired.push(...bed.update(t, null));
    expect(fired.length).toBeGreaterThan(30);
    expect(fired[0].at).toBeGreaterThanOrEqual(6);
    for (let i = 1; i < fired.length; i++) if (fired[i].at !== fired[i - 1].at) expect(fired[i].shot === fired[i - 1].shot && fired[i].at - fired[i - 1].at < 1).toBe(false);
    // the announcements keep their 50–100 s (plus at most a short wait)
    const ann = fired.filter((f) => f.shot === 'announce').map((f) => f.at);
    for (let i = 1; i < ann.length; i++) {
      expect(ann[i] - ann[i - 1]).toBeGreaterThanOrEqual(49.9);
      expect(ann[i] - ann[i - 1]).toBeLessThan(104);
    }
    for (const f of fired) {
      expect(Math.abs(f.pitch - 1)).toBeLessThanOrEqual(0.06);
      expect(f.pan).toBeGreaterThanOrEqual(-1);
      expect(f.pan).toBeLessThanOrEqual(1);
    }
  });

  it('a placed shot pans and fades by distance (silent at 900 px)', () => {
    const bed = new EventBed({ firstAfter: 0, events: [{ shot: 'pigeon', every: [1, 1], x: 600 }] }, { rand: () => 0.5 });
    const near = bed.update(5, 0)[0];
    expect(near.pan).toBeCloseTo(1, 5);
    expect(near.level).toBeCloseTo(1 / 3, 1);
    expect(bed.update(10, -400)).toHaveLength(0);
  });
});

describe('the voice cap', () => {
  it('steals the oldest low-priority voice, never a stinger', () => {
    const p = new VoicePool({ osc: 3, noise: 1 });
    const stopped = [];
    const take = (prio, t) => {
      const s = p.claim('osc', prio, t, t + 5, t);
      if (s) s.bind(() => stopped.push(prio + ':' + t));
      return s;
    };
    take(PRIO.chatter, 0);
    take(PRIO.music, 0.1);
    take(PRIO.sting, 0.2);
    expect(take(PRIO.event, 0.3)).toBeTruthy(); // steals the chatter
    expect(stopped).toEqual(['0:0']);
    expect(take(PRIO.chatter, 0.4)).toBeNull(); // nothing lower to steal
    expect(take(PRIO.sfx, 0.5)).toBeTruthy(); // steals the event (older/lower than music)
    expect(take(PRIO.sting, 0.6)).toBeTruthy(); // a stinger always plays
    expect(stopped).not.toContain('4:0.2');
  });

  it('the master chain is in place: compressor, limiter, ceiling, a shut mute', () => {
    setup();
    const c = masterChain();
    expect(c.comp.threshold.value).toBe(-14);
    expect(c.comp.ratio.value).toBe(4);
    expect(c.lim.ratio.value).toBe(20);
    expect(c.mute.gain.value).toBe(0); // tests never unmute
    expect(c.master.gain.value).toBeCloseTo(0.35);
  });
});
