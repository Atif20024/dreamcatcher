// The tracks (data only: the engine and the node tests read it). Stage 1 has
// one test road, flat, on the Pinewood stretch of the Calvessa Coast. A bend's
// `safe` is the speed it holds in m/s on new tyres; `side` is where it throws
// you (1 towards the near verge, -1 towards the far one); `outside` is what
// is there (straw is soft, a wall spins you back to the lamp).
//
// A lane is a line (src/engines/race.js): in a bend `safe` is the middle lane's
// speed, the outside holds `lineSpeed` more and is `lineLen` longer, the inside
// the reverse. What follows a bend decides which is best, so each is a choice:
//   the sweeper   little to save on the inside, a long straight to carry speed down
//   the kink      much to save, and the wall bend straight after it wastes any speed
//   the wall bend much to save and a long straight after: the outside pays most, and it is by the wall
// tests/race.test.js pins that no line wins them all, and lints every track: a
// wall's outside pays, and skipping the brake at the straw costs the race's slack.
import { COAST } from './themes.js';

// the pedals on a pad: the triggers and the d-pad's sides; lanes on the d-pad only,
// so a thumb holding the stick for the throttle cannot flick a lane by tilting
export const RACE_PAD = {
  right: ['b7', 'b15', 'ax0+'],
  left: ['b6', 'b14', 'ax0-'],
  up: ['b12'],
  down: ['b13'],
};

export const TRACKS = {
  test: {
    id: 'test',
    title: 'PINEWOOD STRETCH',
    theme: COAST,
    length: 1200,
    countdown: 3,
    gridLane: 1,
    passPlace: 1, // one placeholder rival: the real races pass on a top 3 (design §3)
    prize: { 1: 12, 2: 6 }, // brass nuts
    target: 44.5, // Ottavia's time, on the card: the best the bots find, on the best lines
    lamps: [250, 500, 700, 950], // never more than 250 m back, on a road this short
    bends: [
      { name: 'sweeper', from: 340, to: 430, safe: 24, side: 1, outside: 'straw', lineLen: 0.05, lineSpeed: 2 },
      { name: 'kink', from: 720, to: 790, safe: 21, side: 1, outside: 'straw', lineLen: 0.16, lineSpeed: 1.5 },
      { name: 'wall bend', from: 850, to: 935, safe: 19, side: -1, outside: 'wall', lineLen: 0.2, lineSpeed: 3 },
    ],
    obstacles: [
      { d: 540, lane: 2, kind: 'cart' },
      { d: 610, lane: 0, kind: 'bale' },
      { d: 660, lane: 1, kind: 'bale' },
      { d: 1040, lane: 2, kind: 'cart' },
    ],
    // (on the screen on the grid, a lane over: a launch held straight passes him at 5.4 s;
    // pull in behind him and the draft is full by 1.2 s, with 3.6 s to his bumper)
    rival: { id: 'roche', livery: 'roche', d: 13, lane: 2, pull: 1, top: 0.96 },
  },
};
