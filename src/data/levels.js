// Levels are 150x22 text grids, one char per 32px tile, built with put() so
// column positions are exact. Legend:
//   #  solid tile (theme)     ^  deadly hazard (theme: boards/knives)
//   S  spawn                  C  checkpoint flag
//   E  walker enemy (theme)   O  dream orb
//   K  sinking piano key      L  sweeping spotlight (musician)
//   R  critic (shoots)        B  beat-light strip, deadly when lit (musician)
//   <> conveyor belt          F  timed flame burst (chef)
//   I  slippery oil tile      D  dish stand   T  plating table (chef)
const W = 150;
const H = 22;

const blankRows = () => Array.from({ length: H }, () => '.'.repeat(W));
const put = (rows, r, c, s) => {
  rows[r] = rows[r].slice(0, c) + s + rows[r].slice(c + s.length);
};
const punchPit = (rows, a, b) => {
  put(rows, 20, a, '.'.repeat(b - a + 1));
  put(rows, 21, a, '.'.repeat(b - a + 1));
};

function buildMusician() {
  const rows = blankRows();
  put(rows, 20, 0, '#'.repeat(W));
  put(rows, 21, 0, '#'.repeat(W));
  punchPit(rows, 16, 27);
  punchPit(rows, 62, 75);

  put(rows, 19, 2, 'S');
  put(rows, 17, 8, '###');
  // piano-key bridge over the orchestra pit
  put(rows, 17, 16, 'KK');
  put(rows, 17, 20, 'KK');
  put(rows, 17, 24, 'KK');
  // spotlight corridor with broken boards — checkpoint before, safe lane between sweeps
  put(rows, 19, 31, 'C');
  put(rows, 2, 34, 'L');
  put(rows, 2, 44, 'L');
  put(rows, 19, 39, '^');
  put(rows, 19, 57, 'C');
  // critics' gallery over the second pit — one critic, duck under his words
  put(rows, 19, 60, 'C');
  put(rows, 17, 62, '####');
  put(rows, 15, 67, '####');
  put(rows, 17, 72, '####');
  put(rows, 13, 66, '##');
  put(rows, 12, 66, 'R');
  // sour notes + boards stretch
  put(rows, 19, 82, 'E');
  put(rows, 19, 86, '^^');
  put(rows, 19, 90, 'E');
  put(rows, 19, 94, '^^');
  put(rows, 19, 99, 'C');
  // beat-light gauntlet
  for (const c of [102, 106, 110, 114]) put(rows, 19, c, 'BB');
  // final ascent to the microphone
  put(rows, 18, 124, '####');
  put(rows, 16, 130, '#####');
  put(rows, 14, 137, '######');
  put(rows, 13, 144, '###');
  put(rows, 12, 145, 'O');
  return rows;
}

function buildChef() {
  const rows = blankRows();
  put(rows, 20, 0, '#'.repeat(W));
  put(rows, 21, 0, '#'.repeat(W));
  punchPit(rows, 16, 33);
  punchPit(rows, 68, 79);

  put(rows, 19, 2, 'S');
  put(rows, 17, 8, '#####');
  // conveyor counters over the wash pit
  put(rows, 17, 16, '<<<<<<');
  put(rows, 17, 25, '>>>>>>');
  // stove alley: timed flames, a runaway pot, the knife rack
  for (const c of [38, 43, 48, 53]) put(rows, 19, c, 'F');
  put(rows, 19, 45, 'E');
  put(rows, 19, 56, '^^');
  put(rows, 19, 61, 'C');
  put(rows, 19, 63, 'D');
  // the carry gauntlet: platforms, flame, oil slick, pots
  put(rows, 17, 70, '####');
  put(rows, 17, 76, '####');
  put(rows, 16, 77, 'F');
  put(rows, 19, 84, 'E');
  put(rows, 19, 92, 'E');
  put(rows, 20, 86, 'I'.repeat(12));
  for (const c of [103, 108, 113]) put(rows, 19, c, 'F');
  put(rows, 19, 118, '^^');
  put(rows, 20, 121, '<'.repeat(8));
  put(rows, 19, 130, 'C');
  put(rows, 19, 138, 'T');
  return rows;
}

export const LEVELS = {
  musician: {
    name: 'The Big Stage',
    theme: 'musician',
    message:
      'The crowd roared. The lights blazed.\nAnd after the last note… the silence felt the same.\n\nMaybe the next dream is the one.',
    map: buildMusician(),
  },
  chef: {
    name: 'Five-Star Dream',
    theme: 'chef',
    message:
      'Five stars. A perfect service.\nThe kitchen empties, and the hunger remains.\n\nMaybe the next dream is the one.',
    map: buildChef(),
  },
};
