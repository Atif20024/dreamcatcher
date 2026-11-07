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
//
// Lamps sit at most 20 m before every bend and carts, because a spin should cost its
// dark and a short run back, not a long road done twice.
//
// For the view: `light` (the sky from → to with distance), `lit` (stretches in [from, to]
// that a lamp pool or the quay lights; elsewhere at night the draw distance halves), and
// non-solid `things`: crowd, bunting, figure { who }, chair { gloves }, pitboard, gull_lamp,
// pitbox { len }, crossing { bell }. `rivals` is the grid (`livery` is carArt's name).
// `script` is the data race/script.js reads. `target` is Ottavia's time on the card, the expert's number; `ease` is what
// each failed try takes off the rivals' pace on this track (raceFor; TUNE.easePace otherwise).
import { COAST } from './themes.js';
import { compile } from '../../../engines/road.js';

// Who they are on the road (RACER_REBUILD_PLAN §1). k and margin are pace: how much of a
// bend's limit they take, how much braking road they leave
const ALDO = { id: 'aldo', livery: 'dante', style: 'station' };
const TEO = { id: 'teo', livery: 'brasca', style: 'dive', top: 1.02, wear: 3, k: 1.05, margin: 2 };
const DANTE = { id: 'dante', livery: 'dante', style: 'clean', top: 0.97, k: 0.97 };
const CASSIAN = { id: 'cassian', livery: 'roche', style: 'block', top: 1.015, k: 1, margin: 2 };

const COPPA_LAP = [
  { straight: 150 }, // the pit straight
  { bend: 'R', len: 60, safe: 18, outside: 'straw', name: 'harbour hairpin', lineLen: 0.12, lineSpeed: 2 },
  { straight: 290 }, // the Salt straight
  { bend: 'L', len: 50, safe: 23, outside: 'straw', name: 'terraces', lineLen: 0.24, lineSpeed: 1.5, hill: -4 },
  { straight: 20, hill: -4 },
  { bend: 'R', len: 50, safe: 23, outside: 'straw', name: 'terraces out', lineLen: 0.24, lineSpeed: 1.5 },
  { straight: 140, hill: 8 },
  { bend: 'R', len: 130, safe: 23, outside: 'wall', name: 'Gull Bend', lineLen: 0.05, lineSpeed: 2 },
  { straight: 110 },
];
const COPPA_LEN = 1000;
const everyLap = (list) => [...list, ...list.map((o) => (typeof o === 'number' ? o + COPPA_LEN : { ...o, d: o.d + COPPA_LEN }))];

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
    gate: { time: 37.5 }, // earn the seat: under Aldo's time on the sheet
    target: 31.2, // Ottavia's time, on the card: the fastest run needs the right line for each bend, on the limit
    prize: { 1: 12 },
    pieces: [
      { straight: 100 },
      { bend: 'R', len: 80, safe: 25, outside: 'straw', name: 'first sweeper', lineLen: 0.03, lineSpeed: 2 },
      { straight: 180 },
      { bend: 'L', len: 70, safe: 23, outside: 'straw', name: 'second sweeper', lineLen: 0.22, lineSpeed: 1.5 },
      { straight: 10 },
      { straight: 80, hill: 9 }, // the climb: its top is at 520 m, high enough that the right-hander is not there until it is
      { straight: 30, hill: -3 }, // over the top, and the road drops out of sight
      { bend: 'R', len: 70, safe: 19, outside: 'straw', name: 'blind right', lineLen: 0.3, lineSpeed: 2 },
      { straight: 180 },
    ],
    lamps: [90, 270, 350, 540, 680],
    things: [
      { d: 300, x: 0, kind: 'cart' },
      { d: 700, x: -0.7, kind: 'bale' }, // the run to the line: a door half a road wide to thread, at the top of third
      { d: 700, x: 0.6, kind: 'cart' },
    ],
    cues: [{ d: 440, id: 'crest' }],
  }),

  // Race 2: follow him. The quay teaches the draft and the sling, the hairpin is where
  // Teo goes by, and the road ends at the Gull Bend whatever you do. It cannot be failed.
  harbour: compile({
    id: 'harbour',
    title: 'HARBOUR NIGHT CUP',
    theme: COAST,
    countdown: 3,
    gate: { scripted: true },
    joLivery: 'heron',
    light: { from: 'dusk', to: 'night' },
    lit: [[0, 420], [660, 700], [980, 1010]],
    pieces: [
      { straight: 420 }, // the quay
      { bend: 'L', len: 70, safe: 19, outside: 'straw', name: 'harbour hairpin', lineLen: 0.12, lineSpeed: 2 },
      { straight: 190 },
      { bend: 'R', len: 60, safe: 27, outside: 'straw', name: 'fish market', lineLen: 0.06, lineSpeed: 2 },
      { straight: 260 },
      { bend: 'R', len: 160, safe: 24, outside: 'wall', name: 'Gull Bend', lineLen: 0.05, lineSpeed: 2 },
      { straight: 40 },
    ],
    lamps: [200, 410, 670, 730, 990],
    things: [
      { d: 60, kind: 'figure', who: 'ottavia' },
      { d: 64, kind: 'figure', who: 'tullio' },
      { d: 150, kind: 'crowd', side: 1 },
      { d: 380, kind: 'crowd', side: -1 },
      { d: 995, kind: 'gull_lamp' },
    ],
    cues: [
      { d: 80, id: 'stay_in_my_air' },
      { d: 190, id: 'tide' }, // (between his first word and Ottavia's, on the quay: nothing to brake for here)
      { d: 300, id: 'out_and_she_sings' },
      { d: 490, id: 'brasca' },
      { d: 1040, id: 'gull' },
    ],
    rivals: [
      { ...ALDO, d: 13.3, x: 0 },
      { ...TEO, d: -17, x: 0.5 },
    ],
    script: { gull: 'Gull Bend', hairpin: 'harbour hairpin', gullCue: 1040, patience: 70 },
  }),

  // Race 3: on the sheet. Two long straights where Cassian shuts the door, a chicane where
  // he can be had, a cart that decides whether you beat the gate, and a hairpin at the end
  // for whoever kept their tyres. Teo is bald by the crossing.
  salt: compile({
    id: 'salt',
    title: 'THE SALT ROAD CUP',
    theme: COAST,
    countdown: 3,
    gate: { place: 3 },
    target: 53, // (Ottavia's time: past Cassian, by the gap he gives)
    ease: 0.13,
    prize: { 1: 18, 2: 12, 3: 8 },
    joLivery: 'heron',
    light: { from: 'noon', to: 'noon' },
    oil: true,
    pieces: [
      { straight: 380 },
      { bend: 'L', len: 40, safe: 21, outside: 'straw', name: 'chicane', lineLen: 0.3, lineSpeed: 1.5 },
      { straight: 10 },
      { bend: 'R', len: 40, safe: 21, outside: 'straw', name: 'chicane out', lineLen: 0.3, lineSpeed: 1.5 },
      { straight: 430 },
      { bend: 'L', len: 80, safe: 26, outside: 'straw', name: 'salt pans', lineLen: 0.04, lineSpeed: 2 },
      { straight: 280 },
      { bend: 'R', len: 70, safe: 18, outside: 'straw', name: 'the drop', lineLen: 0.25, lineSpeed: 2 },
      { straight: 170 },
    ],
    lamps: [200, 370, 425, 620, 830, 890, 1100, 1250],
    things: [
      { d: 40, kind: 'figure', who: 'ottavia' },
      { d: 44, kind: 'figure', who: 'tullio' },
      { d: 48, kind: 'figure', who: 'nino' },
      { d: 52, kind: 'chair' },
      { d: 56, kind: 'pitboard' },
      { d: 640, x: -0.35, kind: 'cart' },
      { d: 720, kind: 'crossing', bell: 180 }, // the bell goes just out of the chicane: what you carried out of it is whether you make it
      { d: 700, kind: 'crowd', side: 1 },
      { d: 740, kind: 'crowd', side: -1 },
      { d: 740, kind: 'bunting' },
      { d: 1120, x: -0.1, kind: 'cart' },
      { d: 1420, x: -0.4, kind: 'bale' },
      { d: 1450, kind: 'crowd', side: 1 },
      { d: 1480, kind: 'bunting' },
    ],
    cues: [
      { d: 20, id: 'last_months' },
      { d: 500, id: 'the_cart' },
    ],
    rivals: [
      { ...CASSIAN, d: 24, x: 0.45 },
      { ...DANTE, d: 12, x: -0.45 },
      { ...TEO, d: -12, x: 0.3, wear: 4 },
    ],
    script: { boards: [56] },
  }),

  // Race 4: win. Two laps of the whole coast, the box at the end of the first, the Gull
  // lamp dark until Jo passes it, and on the second lap the wheel. Lap 1's tyres are
  // free (the box gives new ones); lap 2's are not.
  coppa: compile({
    id: 'coppa',
    title: 'THE COPPA CALVESSA',
    theme: COAST,
    countdown: 3,
    gate: { place: 1 },
    ease: 0.12,
    target: 84,
    joLivery: 'heron',
    light: { from: 'night', to: 'dawn' },
    lit: [[0, 150], [890, 1150], [1890, 2000]],
    oil: true,
    lapLen: COPPA_LEN,
    pieces: [...COPPA_LAP, ...COPPA_LAP],
    lamps: everyLap([140, 300, 490, 555, 750, 900]),
    things: [
      ...everyLap([
        { d: 30, kind: 'crowd', side: 1 },
        { d: 60, kind: 'crowd', side: -1 },
        { d: 100, kind: 'bunting' },
        { d: 230, kind: 'crowd', side: 1 },
        { d: 620, kind: 'crowd', side: -1 },
        { d: 900, kind: 'crowd', side: 1 },
        { d: 940, kind: 'crowd', side: -1 },
        { d: 980, kind: 'bunting' },
      ]),
      { d: 755, kind: 'gull_lamp' },
      { d: 950, kind: 'pitbox', len: 12 },
      { d: 940, kind: 'figure', who: 'ottavia' },
      { d: 943, kind: 'figure', who: 'tullio' },
      { d: 946, kind: 'figure', who: 'nino' },
      { d: 964, kind: 'chair', gloves: true },
      { d: 968, kind: 'pitboard' },
    ],
    cues: [
      { d: 20, id: 'two_laps' },
      { d: 850, id: 'the_box' },
      { d: 300, lap: 2, id: 'second_lap' },
    ],
    rivals: [
      { ...CASSIAN, d: 14, x: 0.45, doomed: true, newTyres: true }, // (rich: he buys a set on the day; nobody else does)
      { ...DANTE, d: -10, x: -0.45, top: 0.96, k: 0.93 }, // (off the plan's 0.97: a tidy car has about 4 s on him, in either branch)
      { ...TEO, d: -20, x: 0.45, top: 0.97, k: 0.96, wear: 3 },
    ],
    script: {
      box: { d: 950, len: 12, zone: 40 },
      lamp: 755,
      gull: 'Gull Bend',
      stalls: { cassian: 930, teo: 1005, dante: 1025 }, // (his first: nobody passes him for standing further up the road)
    },
  }),
};
