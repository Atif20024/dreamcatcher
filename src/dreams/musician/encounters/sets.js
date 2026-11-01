// THE BIG STAGE's gigs: one engine (src/engines/rhythm.js) and one presenter
// ('rhythm' in src/play/encounterPresenters.js), staged in the room. The
// tunes are written here, in the degrees of the room's own key (music.js), so
// the call, Jo's answer and the band all agree. The verb grows across the dream:
//   the neon        two phrases, all notes, a tune: listen, then answer
//   the open mic    two songs: even bars, then the first rests (Delphine), then
//                   a push across the beat. Bar three of each song is measured
//   Ray's drill     he claps, Jo answers; the rests, then a whole empty bar
//   the set         three songs. Ray's rests, a phrase by ear, the blank (Jo
//                   goes blank and Nia's bass comes in from the dark; on
//                   Tally's list he mashes through it blind), a held last note
// How he played comes back as flags (gigFlags): the lines, the next gig's
// starting nerve and the ending read them. Nothing here can stop him finishing.
import { rhythm } from '../../../engines/rhythm.js';
import { MUSIC_KEYS } from '../music.js';

const KEYS = ['act1', 'act2'];
const scaleOf = (k) => ({ root: k.root, mode: k.mode, oct: 2 });

// a bar in shorthand: '0 2 . 4' is degrees and rests, one per slot
export function bar(text, extra = {}) {
  const slots = text.trim().split(/\s+/);
  return { beats: slots.map((n) => (n === '.' ? 0 : 1)), notes: slots.map((n) => (n === '.' ? null : Number(n))), ...extra };
}

// perfect / froze / rushed, under the gig's name
export function gigFlags(name, r) {
  return { [`${name}_played`]: true, [`${name}_perfect`]: !!r.perfect, [`${name}_froze`]: r.freezes > 0, [`${name}_rushed`]: !!r.rushed };
}

const flagsFor = (name) => (r, F) => Object.assign(F, gigFlags(name, r));

export const neon = {
  id: 'neon',
  title: 'THE NEON',
  engine: rhythm,
  scale: scaleOf(MUSIC_KEYS.cellar),
  // (the alley hears the cellar's trio through the wall: same key, same tempo)
  params: { bpm: 86, gap: 1, phrases: [bar('0 2 3'), bar('3 2 0 -1')], retries: 3, lead: 2 },
  presenter: 'world',
  view: 'rhythm',
  camera: { zoom: 1.25 },
  keys: KEYS,
  hint: 'listen, then [E] or [Q] on each note',
  lead: 'the sign hums. listen…',
  pose: 'play_trumpet',
  onFlags: flagsFor('neon'),
  onWin: 'neon_done',
};

export const cellarPhrases = () => [
  bar('0 2 3 4', { song: 0 }),
  bar('4 3 2 3 4', { song: 0 }),
  bar('7 6 . 4', { song: 0, third: true, breath: 1400 }),
  bar('4 . 2 0', { song: 1 }),
  bar('0 . 2 3 . 4 . .', { song: 1, div: 0.5 }),
  bar('4 3 . 2 0 . . .', { song: 1, div: 0.5, third: true }),
];

export const cellarGig = {
  id: 'cellar_gig',
  title: 'OPEN MIC',
  engine: rhythm,
  scale: scaleOf(MUSIC_KEYS.cellar),
  params: { bpm: 86, gap: 1, retries: 1, phrases: cellarPhrases() },
  cues: {
    phrase: { 2: { who: 'delphine', text: "That hole in the bar? Leave it, honey. It's part of the song." } },
    songs: ['FIRST SONG', 'SECOND SONG'],
  },
  presenter: 'world',
  view: 'rhythm',
  camera: { zoom: 1.3 },
  keys: KEYS,
  hint: '[E] or [Q] on a note; nothing on a ring',
  lead: 'nine chairs. Delphine counts you in…',
  pose: 'play_trumpet',
  onFlags: flagsFor('cellar'),
  onWin: 'cellar_done',
};

// Ray claps, Jo answers on the horn. No nerve: nobody is watching but Ray.
// The last bar is the whole lesson, and the first sight of the blank.
export const rayDrill = {
  id: 'ray_drill',
  title: "RAY'S LESSON",
  engine: rhythm,
  scale: scaleOf(MUSIC_KEYS.cellar),
  params: { bpm: 86, gap: 1, retries: 2, nervePerMiss: 0, nerveRelief: 0, lead: 2, phrases: [bar('0 2 . 4', { voice: 'clap' }), bar('. . . .')] },
  nerve: false,
  presenter: 'world',
  view: 'rhythm',
  camera: { zoom: 1.25 },
  keys: KEYS,
  hint: 'he claps. you answer. leave the holes alone',
  lead: 'Ray puts his cigarette down…',
  pose: 'play_trumpet',
  onFlags: flagsFor('ray_drill'),
  onWin: 'ray_drill_done',
};

// the set list depends on the run: Nia (rests, the blank, her bass) or
// Mr. Tally (no rests, no silences, the blank played blind). A rest filled
// on his list hammers the note before it. The band is in E Mixolydian.
export function bigSetPhrases(F = {}) {
  const tally = !!F.choice_tally;
  const song1 = [bar('0 4 . 7'), bar('7 . 6 4'), bar('2 3 4 .', { third: true }), bar('4 . 0 .', { breath: 1500 })].map((p) => ({ ...p, song: 0 }));
  // (Tally's third bar stays on the quarters: filled eighths would be four taps a second)
  const push = tally ? bar('4 4 6 7', { third: true }) : bar('4 . 4 6 . 7 . .', { div: 0.5, third: true });
  const song2 = [bar('7 6 . 4 2'), bar('. 2 4 7'), push, bar('7 . 6 4 0', { breath: 1500 })].map((p) => ({ ...p, song: 1 }));
  const song3 = [bar('4 6 7 . 9'), bar('9 . 7 6 4')];
  // bar three of the last song is the blank itself: on Nia's list the rush
  // is playing into it at all
  const blank = tally
    ? [bar('7 7 7 7', { blind: true, third: true }), bar('7 7 7 7 7', { blind: true })]
    : [{ beats: [0, 0, 0, 0], notes: [0, 0, 3, 4], voice: 'bass', third: true }, bar('0 . 4 7', { blind: true })];
  return [...song1, ...song2, ...[...song3, ...blank, { hold: 4, notes: [7] }].map((p) => ({ ...p, song: 2 }))];
}

// what the run has earned or cost by the time the set starts
export function bigSetParams(F = {}) {
  return {
    bpm: 120,
    gap: 1,
    retries: 1,
    rests: !F.choice_tally,
    lead: 4, // the crowd claps him in
    phrases: bigSetPhrases(F),
    nervePerMiss: F.choice_nia ? 18 : 14,
    // he stood there once, in the Cellar, and he remembers
    nerve: F.cellar_froze ? 24 : 0,
    // Ray's drill, clean: a rest stops being frightening
    nerveRelief: F.ray_drill_perfect ? 16 : 12,
    // a drummer who follows you gives; a click track does not (N4: and he
    // cues the third bar, bigSetCues.thirdAhead; letting him go costs both)
    window: F.marcus_stays ? 170 : 150,
  };
}

export function bigSetCues(F = {}) {
  const nia = !!F.choice_nia;
  const marcus = !!F.marcus_stays;
  return {
    songs: nia ? ['TUESDAY', 'NINE CHAIRS', 'ROUND THE BACK'] : ['BIG NIGHT', 'HANDS UP', 'BIG NIGHT AGAIN'],
    soloist: nia ? 'nia_set' : null,
    thirdAhead: marcus ? { who: 'marcus', text: 'Third bar coming. On me.' } : null,
    third: nia ? { who: 'nia', text: 'Third bar.' } : marcus ? { who: 'marcus', text: 'Easy. It comes to you.' } : { who: 'session', text: "You're a hair ahead of the click, man." },
    freeze: marcus ? { who: 'marcus', text: 'Hey. Eyes on me. I got it.' } : nia ? { who: 'nia', text: "I've got the bar. Come in when I do." } : { who: 'session', text: "Click's still going, man." },
  };
}

export const bigSet = {
  id: 'big_set',
  title: 'THE SET',
  engine: rhythm,
  scale: scaleOf(MUSIC_KEYS.stage),
  params: bigSetParams,
  cues: bigSetCues,
  presenter: 'world',
  view: 'rhythm',
  camera: { zoom: 1.2 },
  keys: KEYS,
  hint: '[E] or [Q] on a note; nothing on a ring',
  lead: 'eight thousand people clap you in…',
  pose: 'play_trumpet',
  onFlags: flagsFor('set'),
  onWin: 'set_done',
};

// the card at the end: what happened to the third bar, and who heard it
export function endingLines(F = {}) {
  let third;
  if (F.set_rushed) third = F.choice_nia ? 'Third bar. Every time. Somebody was listening.' : 'You rushed the third bar. Nobody was listening for it.';
  else third = F.choice_nia ? "You didn't rush the third bar. Somebody was listening." : "You didn't rush the third bar. Nobody was listening for it.";
  return ['Eleven minutes, and then the next act.', third, ...(F.marcus_stays ? ["Marcus drove home Sunday. The napkin is still on his boy's wall."] : [])];
}
