// Church modes as semitone steps (shared by every band and stem player).
export const MODES = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
};
// a degree of a mode → semitones (degrees past 7 climb an octave)
export function degree(mode, d) {
  const m = MODES[mode] || MODES.ionian;
  const o = Math.floor(d / 7);
  return m[((d % 7) + 7) % 7] + 12 * o;
}
export const semi = (root, s) => root * 2 ** (s / 12);
