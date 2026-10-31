// THE LAST HAND's music by place (src/audio/MusicDirector.js keys). A river
// saloon in 1884 had a four-piece: a parlour upright, a banjo, a snare
// played with brushes, a clarinet, playing schottisches and waltzes in the
// major keys of a dance floor (G and D). The band is in the saloon only and
// never stops; on the quay it comes through the boat's walls. The card room
// has no band: one low string pad. The purser's office and the pilot house
// have none at all (a clock that never ticks; the wheel through the floor).
// Up on the deck the pad comes back with the clarinet alone. The landing
// has no music. Kept subtle: these sit under the ambience.
const G2 = 98.0;
const D3 = 146.83;
const A2 = 110.0;

const BAND = { base: 'upright', lead: 'clarinet', pulse: 'banjo', danger: null };

export const MUSIC_KEYS = {
  // through the hull: the saloon's schottische, far and soft
  quay: { gain: 0.45, bpm: 108, root: G2, mode: 'ionian', motif: [4, 7, 9, 7, 4, 2, 0, 2], voices: BAND, pulseChord: [4, 7], leadOctave: 4 },
  // the saloon: a schottische in G, the banjo on the off-beats, the piano
  // comping chords, the clarinet with the tune
  saloon: { gain: 0.7, bpm: 108, root: G2, mode: 'ionian', motif: [4, 7, 9, 7, 4, 2, 0, 2, 4, 4, 2, 0], voices: BAND, pulseChord: [4, 7], leadOctave: 4, walk: [0, 4, 0, 4, 3, 4, 1, 4], pad: { voice: 'parlour', every: 2, notes: [[0, 4, 7], [0, 4, 7], [5, 9, 12], [7, 11, 14]], oct: 4, vol: 0.05 } },
  // the card room: one low pad, very quiet (it drops when Jo reads well)
  cards: { gain: 0.5, bpm: 60, root: A2, mode: 'aeolian', motif: [null], voices: { base: 'strings_low', lead: null, pulse: null, danger: null }, walk: [0, 0, 0, 0, 5, 5, 3, 3] },
  // the purser's office: nothing (the clock that never ticks)
  office: { gain: 0, bpm: 60, root: A2, mode: 'aeolian', motif: [null], voices: { base: null, lead: null, pulse: null, danger: null } },
  // the hurricane deck: the pad again, a clarinet line over it, D major
  deck: { gain: 0.55, bpm: 72, root: D3 / 2, mode: 'ionian', motif: [9, 7, 4, null, 2, 4, 7, null], voices: { base: 'strings_low', lead: 'clarinet', pulse: null, danger: null }, leadEvery: 2, leadOctave: 4, walk: [0, 0, 3, 3, 4, 4, 0, 0] },
  // the pilot house and the landing: no music, only the wheel and the water
  pilot: { gain: 0, bpm: 60, root: D3, mode: 'ionian', motif: [null], voices: { base: null, lead: null, pulse: null, danger: null } },
  landing: { gain: 0, bpm: 60, root: D3, mode: 'ionian', motif: [null], voices: { base: null, lead: null, pulse: null, danger: null } },
};
