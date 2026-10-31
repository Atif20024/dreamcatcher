// THE BIG STAGE's three gigs: one engine (src/engines/rhythm.js, the old
// systems/rhythm.js call and response lifted out as pure logic) and one
// presenter ('rhythm' in src/play/encounterPresenters.js), staged in the
// room. The verb grows across the dream:
//   the neon        two phrases, all notes: listen, then answer (taught)
//   the open mic    six phrases, all notes (the first gig: nine chairs)
//   the set         three songs. Ray's rests (a hollow ring: leave it
//                   empty), a phrase by ear (blind), the blank: Jo goes
//                   blank and Nia's bass comes in from the dark; he plays
//                   nothing for a bar (or, on Tally's list, mashes through
//                   it blind), and a last note held for four beats.
import { rhythm } from '../../../engines/rhythm.js';

const KEYS = ['act1', 'act2'];

export const neon = {
  id: 'neon',
  title: 'THE NEON',
  engine: rhythm,
  params: { bpm: 88, phrases: [[1, 1, 1, 1], [1, 1, 1, 1]], retries: 3, lead: 2 },
  presenter: 'world',
  view: 'rhythm',
  camera: { zoom: 1.25 },
  keys: KEYS,
  hint: 'listen, then [E] or [Q] on each note',
  lead: 'the sign hums. listen…',
  pose: 'play_trumpet',
  onWin: 'neon_done',
};

export const cellarGig = {
  id: 'cellar_gig',
  title: 'OPEN MIC',
  engine: rhythm,
  params: {
    bpm: 96,
    retries: 2,
    phrases: [
      [1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1, 1],
    ],
  },
  presenter: 'world',
  view: 'rhythm',
  camera: { zoom: 1.3 },
  keys: KEYS,
  hint: '[E] or [Q] on every note',
  lead: 'nine chairs. Delphine counts you in…',
  pose: 'play_trumpet',
  onWin: 'cellar_done',
};

// the set list depends on the run: Nia (rests, the blank, her bass) or
// Mr. Tally (no rests, no silences, the blank played blind)
export function bigSetPhrases(F = {}) {
  const tally = !!F.choice_tally;
  const song1 = [[1, 1, 0, 1], [1, 0, 1, 1], [1, 1, 1, 0], [1, 0, 1, 0]];
  const song2 = [[1, 1, 0, 1, 1], [0, 1, 1, 1], [1, 1, 0, 1], [1, 0, 1, 1, 1]];
  const song3 = [[1, 1, 1, 0, 1], [1, 0, 1, 1, 1]];
  const blank = tally ? [{ beats: [1, 1, 1, 1], blind: true }, { beats: [1, 1, 1, 1, 1], blind: true }] : [{ beats: [0, 0, 0, 0], voice: 'bass' }, { beats: [1, 0, 1, 1], blind: true }];
  return [...song1, ...song2, ...song3, ...blank, { hold: 4 }];
}

export const bigSet = {
  id: 'big_set',
  title: 'THE SET',
  engine: rhythm,
  params: (F = {}) => ({ bpm: 120, retries: 2, rests: !F.choice_tally, phrases: bigSetPhrases(F), nervePerMiss: F.choice_nia ? 18 : 14 }),
  presenter: 'world',
  view: 'rhythm',
  camera: { zoom: 1.2 },
  keys: KEYS,
  hint: '[E] or [Q] on a note; nothing on a ring',
  lead: 'eleven minutes. the band counts you in…',
  pose: 'play_trumpet',
  onWin: 'set_done',
};
