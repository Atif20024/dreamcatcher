// THE LONG STRAIGHT's music, walk-in places only (src/audio/MusicDirector.js keys).
// On the road the engine is the music: RaceScene plays no bed at all, only stings.
// Here: the garage's wireless, a swing band heard through a small speaker; a single
// piano on the quay and at home; in the corridor, nothing.
const A2 = 110;
const RADIO = { base: 'upright', lead: 'muted_trumpet', pulse: 'brush', danger: null };
const PIANO = { base: null, lead: 'felt_piano', pulse: null, danger: null };
const LINE = [7, null, 10, 12, null, 10, 7, null, 3, 5, null, null];
const SILENT = { gain: 0, bpm: 72, root: A2, mode: 'aeolian', motif: [null], voices: { base: null, lead: null, pulse: null, danger: null } };

export const MUSIC_KEYS = {
  garage: { gain: 0.34, bpm: 140, root: A2, mode: 'aeolian', motif: [7, 10, 12, null, 10, 7, 3, null], voices: RADIO, walk: [0, 2, 3, 5, 7, 5, 3, 2], leadEvery: 2, leadOctave: 3 },
  quay: { gain: 0.5, bpm: 66, root: A2, mode: 'aeolian', motif: LINE, voices: PIANO, leadEvery: 1, leadOctave: 3 },
  kitchen: { gain: 0.4, bpm: 54, root: A2, mode: 'aeolian', motif: [7, null, null, 5, null, null, 3, null, null, null, null, null], voices: PIANO, leadEvery: 1, leadOctave: 3 },
  sable: { gain: 0.22, bpm: 80, root: A2, mode: 'ionian', motif: [4, null, 7, null, 9, null, 7, null], voices: { base: null, lead: 'clarinet', pulse: null, danger: null }, leadEvery: 2, leadOctave: 2 },
  corridor: SILENT,
  gull: SILENT,
  pit: SILENT,
};
