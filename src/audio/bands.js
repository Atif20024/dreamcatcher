// The station's and the legacy dreams' bands (audio pass). Until now every
// one of these places shared one swing band (a walking bass, brushes, an
// 8-note piano chord and a raw square trumpet). Each now has its own
// players, key and tempo (advice §2), still mixed by the old part names so
// every existing mix table (HubState, the casino's rooms) keeps working:
//
//   bass · brushes · piano · trumpet (the lead) · pad · hum · danger
//
// A part: { voice (src/audio/instruments.js), every (beats), offset,
//   walk (mode degrees) | chord (degrees) | motif (semitones, null = rest) |
//   freqs (Hz), oct (× root), vol, chance, swing (fraction of a beat) }
// A band: { bpm, gain (its level against the other places, measured
//   offline), ref (the room bpm the dream was written at: a room's bpm
//   scales the band's tempo by room/ref), root (Hz), mode, meter, insert }
const F2 = 87.31;
const C2 = 65.41;
const A2 = 110.0;
const D2 = 73.42;
const E2 = 82.41;
const G2 = 98.0;

// the Orb melody the sweeper hums when the station is empty
const ORB_HUM = [659, 784, 988, 1319, 988, 784].map((f) => f / 2);

export const BANDS = {
  // Crossroads: a night terminus, late 40s. Solo piano, a distant band,
  // stripped as dreams are caught (HubState's mix). F Lydian, 72.
  hub: {
    bpm: 72,
    gain: 1.3,
    ref: 94,
    root: F2,
    mode: 'lydian',
    parts: {
      bass: { voice: 'bass', every: 1, walk: [0, 2, 4, 3, 4, 2, 1, 0], oct: 1, vol: 0.15 },
      brushes: { voice: 'brush', every: 2, offset: 1, vol: 0.12 },
      piano: { voice: 'piano', every: 4, chord: [0, 2, 4, 6], oct: 4, vol: 0.035 },
      trumpet: { voice: 'soft_trumpet', every: 4, offset: 2, motif: [12, 14, 16, 18, 16, 14, 12, 9], oct: 4, vol: 0.045 },
      pad: { voice: 'pad', every: 8, chord: [0, 4], oct: 2, vol: 0.08 },
      hum: { voice: 'piano', every: 2, freqs: ORB_HUM, vol: 0.06 },
      danger: { voice: 'throb', every: 1, freqs: [F2 / 2], vol: 0.05 },
    },
  },
  // the kitchen: radio swing from the wireless on the pass, C Ionian, 112,
  // band-limited like a radio (400–3400 Hz) with a little crackle
  chef: {
    bpm: 112,
    gain: 1.6,
    ref: 100,
    root: C2,
    mode: 'ionian',
    insert: 'radio',
    parts: {
      bass: { voice: 'bass', every: 1, walk: [0, 2, 4, 5, 7, 5, 4, 2], oct: 2, vol: 0.16 },
      brushes: { voice: 'brush', every: 2, offset: 1, vol: 0.14, swing: 0.16 },
      piano: { voice: 'piano', every: 4, chord: [0, 2, 4], oct: 4, vol: 0.04 },
      trumpet: { voice: 'radio_horn', every: 2, motif: [7, 9, 12, null, 9, 7, 4, null], oct: 4, vol: 0.05 },
      pad: { voice: 'crackle', every: 1, chance: 0.45, vol: 0.12 },
      danger: { voice: 'throb', every: 1, freqs: [C2], vol: 0.05 },
    },
  },
  // the writer: a solo felt piano, one note at a time; the typewriter is
  // the pulse. A Dorian, 60.
  writer: {
    bpm: 60,
    gain: 1.6,
    ref: 90,
    root: A2,
    mode: 'dorian',
    parts: {
      bass: { voice: 'felt_piano', every: 4, walk: [0, 3, 4, 2], oct: 1, vol: 0.09 },
      brushes: { voice: 'type_tap', every: 1, chance: 0.7, vol: 0.12, swing: 0.25 },
      piano: { voice: 'felt_piano', every: 8, offset: 4, chord: [2, 4], oct: 2, vol: 0.04 },
      trumpet: { voice: 'felt_piano', every: 2, motif: [12, 10, 7, null, 15, 14, 12, null], oct: 2, vol: 0.06 },
      pad: { voice: 'pad', every: 8, chord: [0], oct: 1, vol: 0.05 },
      danger: { voice: 'throb', every: 1, freqs: [A2 / 2], vol: 0.05 },
    },
  },
  // the station in orbit: a sparse 70s synth. D Lydian, 66; a heartbeat
  // sub when someone has seen him.
  astronaut: {
    bpm: 66,
    gain: 1.0,
    ref: 84,
    root: D2,
    mode: 'lydian',
    parts: {
      bass: { voice: 'bass', every: 2, walk: [0, 0, 4, 3], oct: 1, vol: 0.12 },
      brushes: { voice: 'plink', every: 1, offset: 0, motif: [24, 31, 28, 35, 30, 31], oct: 1, vol: 0.025 },
      piano: { voice: 'synth_pad', every: 8, chord: [0, 2, 4], oct: 2, vol: 0.05 },
      trumpet: { voice: 'plink', every: 2, motif: [12, 16, 18, 19, 18, 16, null, 11], oct: 4, vol: 0.045 },
      pad: { voice: 'synth_pad', every: 8, chord: [0, 4], oct: 2, vol: 0.06 },
      danger: { voice: 'heartbeat', every: 2, freqs: [55], vol: 0.06 },
    },
  },
  // the casino: smoky lounge swing, 50s, F Dorian, vibes and a slow horn
  gambler: {
    bpm: 124,
    gain: 0.6,
    ref: 96,
    root: F2,
    mode: 'dorian',
    parts: {
      bass: { voice: 'upright', every: 1, walk: [0, 2, 3, 4, 5, 4, 3, 1], oct: 1, vol: 0.15 },
      brushes: { voice: 'brush', every: 2, offset: 1, vol: 0.14, swing: 0.17 },
      piano: { voice: 'vibes', every: 4, chord: [0, 2, 4, 6], oct: 4, vol: 0.03 },
      trumpet: { voice: 'soft_trumpet', every: 4, motif: [10, 12, 15, 12, 10, 7, 5, 7], oct: 4, vol: 0.05 },
      pad: { voice: 'pad', every: 8, chord: [0, 4], oct: 2, vol: 0.06 },
      danger: { voice: 'throb', every: 1, freqs: [F2 / 2], vol: 0.05 },
    },
  },
  // the old Musician scene (?legacy=1): rain-night jazz noir, D Dorian
  musician: {
    bpm: 96,
    gain: 1.0,
    ref: 100,
    root: D2,
    mode: 'dorian',
    parts: {
      bass: { voice: 'upright', every: 1, walk: [0, 2, 4, 3, 4, 2, 1, 0], oct: 1, vol: 0.15 },
      brushes: { voice: 'brush', every: 2, offset: 1, vol: 0.13, swing: 0.16 },
      piano: { voice: 'rhodes', every: 4, chord: [0, 2, 4, 6], oct: 4, vol: 0.03 },
      trumpet: { voice: 'muted_trumpet', every: 2, motif: [12, 15, 17, null, 15, 12, 10, null], oct: 4, vol: 0.05 },
      pad: { voice: 'pad', every: 8, chord: [0, 4], oct: 2, vol: 0.06 },
      danger: { voice: 'throb', every: 1, freqs: [D2 / 2], vol: 0.05 },
    },
  },
  // the old Yellow House (?legacy=1) keeps the swing band it was written
  // for, its trumpet now filtered
  painter: {
    bpm: 100,
    gain: 1.0,
    ref: 100,
    root: G2,
    mode: 'ionian',
    parts: {
      bass: { voice: 'bass', every: 1, walk: [0, 1, 2, 3, 4, 3, 2, 1], oct: 1, vol: 0.18 },
      brushes: { voice: 'brush', every: 2, offset: 1, vol: 0.14 },
      piano: { voice: 'piano', every: 4, chord: [3, 5, 7, 9], oct: 2, vol: 0.035 },
      trumpet: { voice: 'radio_horn', every: 2, motif: [12, 14, 17, 19], oct: 2, vol: 0.05 },
      pad: { voice: 'pad', every: 8, chord: [3], oct: 1, vol: 0.06 },
      danger: { voice: 'throb', every: 1, freqs: [G2 / 2], vol: 0.05 },
    },
  },
  // the Evening composes its own music (systems/soundscape.js Ensemble):
  // the director only keeps the beat
  evening: { bpm: 76, ref: 76, root: D2, mode: 'ionian', parts: {} },
  silent: { bpm: 90, ref: 90, root: D2, mode: 'ionian', parts: {} },
};

// the scene's place (ui/theme.js placeOf) → its band
export function bandFor(place) {
  return BANDS[place] ? place : 'hub';
}

// a band's tempo in a room: the room's bpm scales it (within reason), and
// inside plays 10% slower (advice §2 "rule for all places")
export function bandBpm(band, roomBpm, inside = false) {
  const b = BANDS[band] || BANDS.hub;
  const k = roomBpm ? Math.max(0.75, Math.min(1.3, roomBpm / b.ref)) : 1;
  return Math.round(b.bpm * k * (inside ? 0.9 : 1));
}
