// THE BIG STAGE's music by place (audio pass; src/audio/MusicDirector.js
// keys). The rain-night street and the alley are 50s jazz noir — a walking
// upright, brushes, a cup-muted trumpet, Rhodes chords — in D Dorian; the
// Blue Cellar is the same trio, slower and closer; behind the stage door
// it is rock in E Mixolydian, heard through the door; on the arena stage
// it is big 80s rock-pop: saw power chords, four on the floor, an arp.
// `gain` levels each place against the rest (measured offline).
// Inside vs outside comes from room.acoustics; the alley hears the cellar
// through its wall (room.music.wall), backstage hears the PA through a door.
const D2 = 73.42;
const E2 = 82.41;

const NOIR = [12, 15, 17, null, 15, 12, 10, null, 12, 10, 7, null, 5, 7, null, null];
const DM7 = [[0, 3, 7, 10], [5, 9, 12, 15], [0, 3, 7, 10], [7, 10, 14, 17]];

export const MUSIC_KEYS = {
  // the street in the rain: open air, the band in a doorway somewhere
  street: { bpm: 96, gain: 1.6, root: D2, mode: 'dorian', motif: NOIR, voices: { base: 'upright', pulse: 'brush', lead: 'muted_trumpet', danger: 'throb' }, leadOctave: 2, pad: { voice: 'rhodes', every: 4, notes: DM7, oct: 4, vol: 0.022 } },
  // the Blue Cellar: a slow trio, smoky; piano (Rhodes) chords every bar
  cellar: { bpm: 86, gain: 1.4, root: D2, mode: 'dorian', motif: [12, null, 15, 14, 12, null, 10, null], voices: { base: 'upright', pulse: 'brush', lead: 'rhodes', danger: 'throb' }, leadOctave: 2, pad: { voice: 'rhodes', every: 4, notes: DM7, oct: 4, vol: 0.028 } },
  // behind the stage door: the band is rock now, and it is on the other side
  backstage: { bpm: 110, root: E2, mode: 'mixolydian', motif: [12, 14, 16, null, 19, 16, 14, 12], voices: { base: 'bass', pulse: 'kick', lead: 'dist_lead', danger: 'throb' }, leadOctave: 2, walk: [0, 0, 4, 4, 6, 6, 4, 4] },
  // the arena: everything, on the beat
  stage: {
    bpm: 120,
    gain: 0.3,
    root: E2,
    mode: 'mixolydian',
    motif: [0, 7, 12, 16, 12, 7, 0, 7, 2, 9, 14, 17, 14, 9, 2, 9],
    voices: { base: 'power_chord', pulse: 'snare', lead: 'arp', danger: 'throb' },
    walk: [0, 0, 0, 0, 3, 3, 4, 4],
    leadEvery: 1,
    leadOctave: 4,
    tick: 'kick',
    tickVol: 0.1,
  },
};
