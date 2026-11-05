// The tracks (data, compiled once: the engine and the node tests read them). A
// track is pieces in road order (src/engines/road.js): `{ straight: m }` or
// `{ bend: 'L' | 'R', len, safe, outside, name, lineSpeed, lineLen, hill }`.
// `safe` is the speed the road's middle holds in m/s on new tyres; `outside` is
// what is there (straw is soft, a wall spins you back to the lamp). `things`
// stand in the road by distance, x in road widths.
//
// In a bend the outside holds `lineSpeed` more and is `lineLen` longer, the inside
// the reverse. What follows a bend decides which is best, so each is a choice:
//   the sweeper   little to save on the inside, a long straight to carry speed down
//   the kink      much to save, and another bend straight after wastes any speed
// tests/race.test.js pins that no line wins them all.
import { COAST } from './themes.js';
import { compile } from '../../../engines/road.js';

// the pedals on a pad: the triggers and the d-pad's sides; lanes on the d-pad only,
// so a thumb holding the stick for the throttle cannot flick a lane by tilting
export const RACE_PAD = {
  right: ['b7', 'b15', 'ax0+'],
  left: ['b6', 'b14', 'ax0-'],
  up: ['b12'],
  down: ['b13'],
};

export const TRACKS = {
  // the flat road to tune on (dropped in stage F)
  test: compile({
    id: 'test',
    title: 'PINEWOOD STRETCH',
    theme: COAST,
    countdown: 3,
    gate: { place: 1 }, // one placeholder rival
    prize: { 1: 12, 2: 6 }, // brass nuts
    target: 44.5, // Ottavia's time, on the card
    pieces: [
      { straight: 340 },
      { bend: 'L', len: 90, safe: 24, outside: 'straw', name: 'sweeper', lineLen: 0.05, lineSpeed: 2 },
      { straight: 290 },
      { bend: 'L', len: 70, safe: 21, outside: 'straw', name: 'kink', lineLen: 0.16, lineSpeed: 1.5 },
      { straight: 60 },
      { bend: 'R', len: 85, safe: 19, outside: 'wall', name: 'wall bend', lineLen: 0.2, lineSpeed: 3 },
      { straight: 265 },
    ],
    lamps: [330, 500, 710, 840, 950], // one at every bend's way in, so a spin costs seconds
    things: [
      { d: 540, x: 0.6, kind: 'cart' },
      { d: 610, x: -0.6, kind: 'bale' },
      { d: 660, x: 0, kind: 'bale' },
      { d: 1040, x: 0.6, kind: 'cart' },
    ],
    rival: { id: 'roche', livery: 'roche', d: 13, x: 0.5, pull: 1, top: 0.96, style: 'clean' },
  }),

  // Race 1: steer, gas, brake, the boards, the push in a bend. The climb hides the
  // tight right behind its crest, and the boards start on the climb: trust them.
  pinewood: compile({
    id: 'pinewood',
    title: 'PINEWOOD HILL-CLIMB',
    theme: COAST,
    countdown: 3,
    gate: { time: 34 }, // earn the seat: under Aldo's time on the sheet
    prize: { 1: 12 },
    pieces: [
      { straight: 100 },
      { bend: 'R', len: 80, safe: 25, outside: 'straw', name: 'first sweeper', lineLen: 0.03, lineSpeed: 2 },
      { straight: 180 },
      { bend: 'L', len: 70, safe: 23, outside: 'straw', name: 'second sweeper', lineLen: 0.14, lineSpeed: 1.5 },
      { straight: 10 },
      { straight: 80, hill: 6 }, // the climb: its top is at 520 m
      { straight: 30, hill: -2 }, // over the top, and the road drops out of sight
      { bend: 'R', len: 70, safe: 19, outside: 'straw', name: 'blind right', lineLen: 0.08, lineSpeed: 2 },
      { straight: 180 },
    ],
    lamps: [90, 350, 540],
    things: [{ d: 300, x: 0, kind: 'cart' }],
    cues: [{ d: 440, id: 'crest' }],
  }),
};
