// THE STOPPED HOUR's music by place (audio pass; src/audio/MusicDirector.js
// keys): a lazy pastoral folk waltz on the green — a music box over
// pizzicato oom-pah-pah, a fiddle holding long notes — and in the clock
// house the same tune slowed to a glass music box alone, over the ticking of
// the escapement. G, A = 440. Outside is open; the clock house is a room.
const G2 = 98.0;

const WALTZ = [7, null, 9, 11, null, 9, 7, null, 4, 2, null, null, 4, 5, 7, 9, null, 7, 4, null, 2, 0, null, null];

export const MUSIC_KEYS = {
  // the green: Ionian G, 3/4 at 78; the bass on one, the pizzicato on two and three
  green: {
    bpm: 78,
    gain: 1.5,
    root: G2,
    mode: 'ionian',
    meter: 3,
    motif: WALTZ,
    voices: { base: 'pizz', pulse: 'pizz', lead: 'music_box', danger: 'throb' },
    walk: [0, 4, 3, 4, 0, 4, 1, 4],
    pulseRoot: G2 * 2,
    pulseChord: [4, 7],
    leadEvery: 1,
    leadOctave: 4,
    pad: { voice: 'fiddle', every: 6, notes: [12, 11, 9, 7], oct: 2, vol: 0.05 },
    tick: 'tick',
    tickVol: 0.025,
  },
  // the lane at dusk: the same waltz, slower, no fiddle
  lane: { bpm: 72, gain: 1.5, root: G2, mode: 'ionian', meter: 3, motif: WALTZ, voices: { base: 'pizz', pulse: 'pizz', lead: 'music_box', danger: 'throb' }, walk: [0, 4, 3, 4], pulseRoot: G2 * 2, pulseChord: [4, 7], leadEvery: 1, leadOctave: 4 },
  // the bell yard: the setpiece, a little quicker, the fiddle in
  yard: {
    bpm: 84,
    gain: 1.3,
    root: G2,
    mode: 'ionian',
    meter: 3,
    motif: WALTZ,
    voices: { base: 'pizz', pulse: 'pizz', lead: 'music_box', danger: 'throb' },
    walk: [0, 4, 3, 4, 0, 4, 1, 4],
    pulseRoot: G2 * 2,
    pulseChord: [4, 7],
    leadEvery: 1,
    leadOctave: 4,
    pad: { voice: 'fiddle', every: 3, notes: [12, 11, 9, 7, 9, 11], oct: 2, vol: 0.05 },
  },
  // the clock house: Aeolian G, 54, the glass box alone over the escapement;
  // danger is the tick-tock speeding up (the tense state plays 8% faster)
  clockhouse: {
    bpm: 54,
    gain: 4,
    root: G2,
    mode: 'aeolian',
    meter: 3,
    motif: [7, null, 8, 10, null, 8, 7, null, 3, 2, null, null],
    voices: { base: null, pulse: null, lead: 'music_box', danger: 'throb' },
    leadEvery: 1,
    leadOctave: 4,
    tick: 'tick',
    tickVol: 0.1,
    dangerEvery: 1,
    droneAlways: false,
  },
};
