// FIVE-STAR DREAM's music by place (src/audio/MusicDirector.js keys). In 1957
// the kitchen's music is the wireless on the shelf: a dance band, C major, a
// walking bass, brushes, a muted horn. It is one radio, so it changes by how
// close you are: through the wall in the yard, plain in prep, up and hot on
// the line (the burners run on its beat, and each sitting pushes the tempo).
// The cold store and the dining room have none at all.
const C2 = 65.41;
const BAND = { base: 'upright', lead: 'muted_trumpet', pulse: 'brush', danger: null };
const WALK = [0, 2, 4, 5, 7, 5, 4, 2];
const TUNE = [7, 9, 12, null, 9, 7, 4, null];
const SILENT = { gain: 0, bpm: 112, root: C2, mode: 'ionian', motif: [null], voices: { base: null, lead: null, pulse: null, danger: null } };

export const MUSIC_KEYS = {
  yard: { gain: 0.32, bpm: 112, root: C2, mode: 'ionian', motif: TUNE, voices: BAND, walk: WALK, leadEvery: 2, leadOctave: 4 },
  pit: { gain: 0.4, bpm: 112, root: C2, mode: 'ionian', motif: TUNE, voices: BAND, walk: WALK, leadEvery: 2, leadOctave: 4 },
  cold: SILENT,
  prep: { gain: 0.6, bpm: 112, root: C2, mode: 'ionian', motif: TUNE, voices: BAND, walk: WALK, leadEvery: 2, leadOctave: 4 },
  // three sittings: the same tune, hotter
  line1: { gain: 0.65, bpm: 116, root: C2, mode: 'ionian', motif: TUNE, voices: BAND, walk: WALK, leadEvery: 2, leadOctave: 4 },
  line2: { gain: 0.72, bpm: 124, root: C2, mode: 'ionian', motif: [7, 9, 12, 14, 12, 9, 7, 4], voices: BAND, walk: WALK, leadEvery: 1, leadOctave: 4 },
  line3: { gain: 0.8, bpm: 132, root: C2 * 1.122, mode: 'ionian', motif: [12, 14, 16, 14, 12, 9, 12, 7], voices: BAND, walk: WALK, leadEvery: 1, leadOctave: 4 },
  // his side of the window: the band gone thin, one low note under his voice
  pass: { gain: 0.3, bpm: 60, root: C2, mode: 'ionian', motif: [null], voices: { base: 'strings_low', lead: null, pulse: null, danger: null }, walk: [0, 0, 5, 5, 3, 3, 0, 0] },
  dining: SILENT,
};
