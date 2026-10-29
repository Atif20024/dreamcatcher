// THE MASTER'S LADDER's music by place (src/audio/MusicDirector.js keys): the
// city ran on lute, recorder, shawm and voices; churches and halls on the
// portative organ. Modal, never "minor for sad": Dorian and Mixolydian on D
// and G, A = 440. Outside is dry and lively; inside is slower and sounds the
// room (src/audio/AudioBus.js ACOUSTICS via room.acoustics). No brass, no
// keyboard but the organ, no drum kit: a frame drum at most.
// Motifs are semitones above root × leadOctave, written in the key's mode.
const D3 = 146.83;
const G3 = 196.0;

export const MUSIC_KEYS = {
  // the bottega: a slow Dorian dance on the lute, a pedal drone on D
  bottega: { bpm: 72, root: D3, mode: 'dorian', motif: [0, 2, 3, 5, 7, 5, 3, 2], voices: { base: 'lute', lead: 'lute', pulse: null, danger: 'drone' }, droneAlways: true, leadOctave: 2 },
  // the street: a recorder over the lute, Mixolydian in G, a 6/8 saltarello lilt
  street: { bpm: 100, root: G3, mode: 'mixolydian', meter: 6, motif: [7, 9, 10, 9, 7, 5, 4, 2, 4, 5, 7, 0], voices: { base: 'lute', lead: 'recorder', pulse: 'frame_drum', danger: null }, leadEvery: 1, leadOctave: 2 },
  // the colour-seller: sparse lute and a glassy shimmer
  speziale: { bpm: 60, root: D3, mode: 'dorian', motif: [12, 10, 7, 9, 5, 7], voices: { base: 'lute', lead: 'glass', pulse: null, danger: null }, leadEvery: 3, leadOctave: 2 },
  // the square: a shawm and a frame drum, a stately Dorian dance
  piazza: { bpm: 90, root: D3, mode: 'dorian', motif: [0, 3, 5, 7, 5, 3, 5, 2], voices: { base: 'lute', lead: 'shawm', pulse: 'frame_drum', danger: null }, leadOctave: 2 },
  // the guild hall: a portative organ, one note at a time
  hall: { bpm: 60, root: D3, mode: 'dorian', motif: [0, 2, 3, 2, 0, -2, 0, 5], voices: { base: 'organ_flute', lead: 'organ_flute', pulse: null, danger: 'drone' }, leadEvery: 2, leadOctave: 2, walk: [0, 0, 4, 4, 3, 3, 0, 0] },
  // the palazzo: a lute and recorder pavane, Mixolydian, courtly and cool
  palazzo: { bpm: 66, root: G3, mode: 'mixolydian', motif: [4, 5, 7, 5, 4, 2, 0, 2], voices: { base: 'lute', lead: 'recorder', pulse: null, danger: null }, leadOctave: 2 },
  // the chapel: the open fifth and an organ pad; the contest adds a lute
  // pulse and the tempo climbs (60 → 84, src/dreams/painter/verbs/sketch.js)
  chapel: { bpm: 60, root: D3, mode: 'dorian', motif: [0, 7, 5, 3, 2, 0], voices: { base: 'organ', lead: 'organ_flute', pulse: 'lute_pulse', danger: 'drone' }, droneAlways: true, leadEvery: 4, leadOctave: 2, walk: [0, 0, 4, 4] },
};
