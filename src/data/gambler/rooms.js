import { buildGamblerMap, COLS, FLOOR, MEZZ, LOUNGE } from './map.js';

// D2 — rooms = grid + objects. Objects are written in WORLD columns and
// shifted to room-local ones here. y is the tile row the thing stands IN
// (its floor is the row below).
const FULL = buildGamblerMap();
const slice = (x0, x1) => FULL.map((row) => row.slice(x0, x1 + 1));

function room(def, x0, x1, objects) {
  return {
    ...def,
    grid: slice(x0, x1),
    objects: objects.map((o) => ({
      ...o,
      x: o.x - x0,
      patrol: o.patrol ? o.patrol.map((c) => c - x0) : undefined,
      x1: o.x1 !== undefined ? o.x1 - x0 : undefined,
    })),
  };
}

// a row of face-down cards: one object per card so the lint sees them as a run
const cardRow = (deck, def) => {
  const out = [];
  let i = 0;
  for (let x = def.x0; x <= def.x1; x += def.step) out.push({ type: 'card', x, y: def.y, deck, index: i++ });
  return out;
};

const M = MEZZ - 1; // the row Jo stands in on the casino floor
const L = LOUNGE - 1; // ...and in the lounge
const G = FLOOR - 1; // ...and on the ground

export default [
  room(
    { id: 'arrival', section: 'arrival', allowNoFoes: true, music: { bpm: 96, state: 'quiet' }, bg: { far: 'rain_night', mid: 'parking_structure', near: 'railings', landmark: 'meridian_sign' } },
    0, 39,
    [
      { type: 'spawn', x: 3, y: G },
      { type: 'coin', x: 10, y: G, breadcrumb: true },
      { type: 'prop', kind: 'valet', x: 16, y: G },
      { type: 'lamp', x: 22, y: G, kind: 'sodium' },
      { type: 'checkpoint', x: 24, y: G, id: 'CP0' },
      { type: 'npc', who: 'security', x: 31, y: G, id: 'doorman' },
      { type: 'prop', kind: 'door', x: 35, y: G },
      { type: 'panel', x: 33, y: G, puzzle: 'p1' },
      { type: 'gate', x: 39, y: 29, h: 5, id: 'g0', requires: ['p1'] },
    ]
  ),
  room(
    { id: 'floor', section: 'floor', music: { bpm: 112, state: 'explore' }, bg: { far: 'casino_wall', mid: 'slot_banks', near: 'brass_rails', landmark: 'chip_fountain' } },
    40, 159,
    [
      { type: 'checkpoint', x: 51, y: M, id: 'CP1a' },
      { type: 'coin', x: 45, y: 29, breadcrumb: true },
      { type: 'foe', kind: 'security', x: 56, y: M, patrol: [50, 60], human: true },
      // the slots canyon: three reels, read before you jump
      ...COLS.reels.map((r, i) => ({ type: 'reel', x: r.x, y: r.top, id: `reel${i}` })),
      { type: 'coin', x: 63, y: 22 },
      { type: 'coin', x: 68, y: 19 },
      { type: 'coins', x: 77, y: 16, n: 2 },
      { type: 'gate', x: 82, y: 14, h: 3, id: 'g_service', requires: ['slots777'] },
      { type: 'coins', x: 84, y: 16, n: 1 },
      { type: 'coins', x: 83, y: 15, n: 2, dx: 0.5 },
      { type: 'shard', x: 84, y: 15 },
      { type: 'coin', x: 60, y: M - 2 },
      // the pit: the Deal over the roulette floor; falling is a lower floor
      ...cardRow('pit', COLS.pitCards),
      { type: 'moment', x: 87, y: G, id: 'm1' },
      { type: 'prop', kind: 'crate', x: 88, y: G },
      { type: 'table', x: 94, y: G, id: 't_roul1', game: 'wheel', name: 'ROULETTE' },
      { type: 'foe', kind: 'security', x: 100, y: G, patrol: [90, 112], human: true },
      { type: 'foe', kind: 'runner', x: 104, y: G, patrol: [92, 110], human: true },
      { type: 'coins', x: 97, y: G - 2, n: 3 },
      { type: 'table', x: 106, y: G, id: 't_roul2', game: 'wheel', name: 'ROULETTE' },
      { type: 'mural', x: 100, y: 31, deck: 'pit', kind: 'tray' },
      { type: 'wheel', x: 115, y: G, id: 'wheel1', opens: 'g_roulette', colour: 'red' },
      { type: 'gate', x: 118, y: 30, h: 4, id: 'g_roulette', requires: ['wheel1'] },
      { type: 'coin', x: 121, y: G - 1 },
      { type: 'coin', x: 123, y: 27, breadcrumb: true },
      // the floor again: the cage, the fountain, Lou
      { type: 'npc', who: 'dede', x: 128, y: M },
      { type: 'dialogue', x: 128, y: M, id: 'd1' },
      { type: 'cage', x: 131, y: M, id: 'cage1' },
      { type: 'checkpoint', x: 134, y: M, id: 'CP1b' },
      { type: 'prop', kind: 'fountain', x: 140, y: M },
      { type: 'foe', kind: 'security', x: 143, y: M, patrol: [136, 146], human: true },
      { type: 'foe', kind: 'runner', x: 152, y: M, patrol: [146, 157], human: true },
      { type: 'coins', x: 144, y: M - 3, n: 2 },
      { type: 'checkpoint', x: 148, y: M, id: 'CP1c' },
      { type: 'lamp', x: 151, y: M, kind: 'big' },
      { type: 'npc', who: 'lou', x: 152, y: M },
      { type: 'table', x: 151, y: M, id: 't_lou', game: 'p2', name: 'TWENTY-ONE' },
      { type: 'coin', x: 157, y: M - 1, breadcrumb: true },
      { type: 'gate', x: 159, y: 21, h: 5, id: 'g1', requires: ['first_win'] },
    ]
  ),
  room(
    { id: 'lounge', section: 'lounge', music: { bpm: 84, state: 'quiet' }, bg: { far: 'velvet_wall', mid: 'low_lamps', near: 'curtains', landmark: 'cigar_lamp' } },
    160, 229,
    [
      { type: 'checkpoint', x: 169, y: L, id: 'CP2a' },
      { type: 'coin', x: 163, y: 21, breadcrumb: true },
      { type: 'npc', who: 'favour', x: 174, y: L, id: 'favour' },
      { type: 'table', x: 174, y: L, id: 't_favour', game: 'p3', name: 'CONCENTRATION' },
      { type: 'coins', x: 170, y: 13, n: 2 },
      { type: 'comp', x: 177, y: L, id: 'comp1', gives: 'chips', n: 2 },
      // the cigar terrace: a shuffled Deal; the tray is down in the smoke
      ...cardRow('terrace', COLS.terraceCards),
      { type: 'coins', x: 185, y: M - 1, n: 3 },
      { type: 'mural', x: 190, y: M, deck: 'terrace', kind: 'tray' },
      { type: 'smoke', x: 187, y: 22 },
      { type: 'coin', x: 196, y: 16, breadcrumb: true },
      // the piano bar
      { type: 'hide', x: 199, y: L, id: 'curtain_a' },
      { type: 'foe', kind: 'bouncer', x: 203, y: L, patrol: [198, 208], human: true },
      { type: 'comp', x: 200, y: L, id: 'comp2', gives: 'heart', n: 1 },
      { type: 'prop', kind: 'piano', x: 205, y: L },
      { type: 'npc', who: 'pianist', x: 206, y: L, id: 'pianist' },
      { type: 'moment', x: 204, y: L, id: 'm2' },
      { type: 'coins', x: 206, y: 12, n: 2 },
      // the billiards room: three balls, three pockets, one lift
      { type: 'hide', x: 210, y: L, id: 'curtain_b' },
      { type: 'comp', x: 211, y: L, id: 'comp3', gives: 'chips', n: 1 },
      { type: 'foe', kind: 'bouncer', x: 216, y: L, patrol: [212, 223], human: true },
      { type: 'ball', x: 212, y: L, id: 'ball1' },
      { type: 'pocket', x: 215, y: L, id: 'pocket1' },
      { type: 'ball', x: 217, y: L, id: 'ball2' },
      { type: 'pocket', x: 220, y: L, id: 'pocket2' },
      { type: 'ball', x: 221, y: L, id: 'ball3' },
      { type: 'pocket', x: 224, y: L, id: 'pocket3' },
      { type: 'coins', x: 218, y: 14, n: 2 },
      { type: 'checkpoint', x: 223, y: L, id: 'CP2b' },
      { type: 'lift', x: 226, y: L, id: 'lift' },
      { type: 'coin', x: 226, y: 15, breadcrumb: true },
      { type: 'gate', x: 229, y: 29, h: 5, id: 'g2', requires: ['key', 'lift_down'] },
    ]
  ),
  room(
    { id: 'backrooms', section: 'backrooms', music: { bpm: 76, state: 'quiet' }, bg: { far: 'concrete_wall', mid: 'numberless_doors', near: 'bare_bulbs', landmark: 'bare_bulb' } },
    230, 329,
    [
      { type: 'checkpoint', x: 232, y: G, id: 'CP3a' },
      { type: 'lamp', x: 240, y: G, kind: 'bulb' },
      { type: 'prop', kind: 'crate', x: 246, y: G },
      { type: 'npc', who: 'dealer', x: 247, y: G, id: 'cups_dealer' },
      { type: 'table', x: 246, y: G, id: 't_cups', game: 'p4', name: 'THREE CUPS' },
      { type: 'foe', kind: 'collector', x: 266, y: G, patrol: [236, 258], human: true, id: 'collector' },
      { type: 'window', x: 255, y: G, id: 'marker_window' },
      { type: 'coins', x: 252, y: G - 3, n: 2 },
      // the corridor: a deck nobody shows, over bare wire
      ...cardRow('corridor', COLS.corridorCards),
      { type: 'lamp', x: 270, y: G, kind: 'bulb' },
      { type: 'coins', x: 270, y: 27, n: 3 },
      { type: 'checkpoint', x: 285, y: G, id: 'CP3b' },
      { type: 'vent', x: 288, y: 30 },
      { type: 'pawn', x: 291, y: G, id: 'pawn' },
      { type: 'lamp', x: 294, y: G, kind: 'bulb' },
      { type: 'safe', x: 298, y: G, id: 'safe', opens: 'g_safe' },
      { type: 'gate', x: 299, y: 29, h: 5, id: 'g_safe', requires: ['safe'] },
      { type: 'checkpoint', x: 303, y: G, id: 'CP3c' },
      { type: 'lamp', x: 311, y: G, kind: 'baize' },
      { type: 'npc', who: 'widow', x: 309, y: G, id: 'widow' },
      { type: 'npc', who: 'kid', x: 313, y: G, id: 'kid' },
      { type: 'npc', who: 'accountant', x: 317, y: G, id: 'accountant' },
      { type: 'table', x: 312, y: G, id: 't_poker', game: 'p5', name: 'FIVE-CARD DRAW' },
      { type: 'coins', x: 322, y: G - 2, n: 2 },
      { type: 'prop', kind: 'videopoker', x: 326, y: G },
      { type: 'npc', who: 'sal', x: 325, y: G, id: 'sal_side', sit: true },
      { type: 'moment', x: 325, y: G, id: 'm3' },
      { type: 'gate', x: 329, y: 29, h: 5, id: 'g3', requires: ['p5'] },
    ]
  ),
  room(
    { id: 'carpark', section: 'carpark', allowNoFoes: true, music: { bpm: 70, state: 'quiet' }, bg: { far: 'dawn_sky', mid: 'car_decks', near: 'bollards', landmark: 'small_sign' } },
    330, 439,
    [
      { type: 'prop', kind: 'firedoor', x: 332, y: G },
      { type: 'lamp', x: 340, y: G, kind: 'sodium' },
      { type: 'prop', kind: 'car', x: 347, y: G },
      { type: 'coin', x: 356, y: 28, breadcrumb: true },
      { type: 'barrier', x: 365, y: M, id: 'arm' },
      { type: 'coins', x: 368, y: M - 2, n: 2 },
      { type: 'wet', x: 374, y: M },
      { type: 'coins', x: 376, y: M - 3, n: 3 },
      { type: 'van', x: 386, y: M, x1: 394, id: 'van' },
      { type: 'prop', kind: 'car', x: 382, y: G },
      { type: 'dice', x: 395, y: M, id: 'dice', bridge: COLS.diceBridge },
      { type: 'coins', x: 402, y: M - 2, n: 3 },
      { type: 'lamp', x: 400, y: G, kind: 'sodium' },
      { type: 'prop', kind: 'car', x: 404, y: G },
      { type: 'cage', x: 414, y: M, id: 'cage2' },
      { type: 'npc', who: 'dede', x: 415, y: M, id: 'dede2', behind: true },
      { type: 'coin', x: 418, y: M - 1, breadcrumb: true },
      { type: 'prop', kind: 'shelter', x: 430, y: G },
      { type: 'npc', who: 'sal', x: 431, y: G, id: 'sal' },
      { type: 'checkpoint', x: 434, y: G, id: 'CP4' },
      { type: 'gate', x: 439, y: 29, h: 5, id: 'g4', requires: ['sal'] },
    ]
  ),
  room(
    { id: 'lasthand', section: 'lasthand', allowNoFoes: true, music: { bpm: 60, state: 'quiet' }, bg: { far: 'dawn_sky', mid: 'car_decks', near: 'bollards', landmark: 'one_lamp' } },
    440, 479,
    [
      { type: 'prop', kind: 'booth', x: 446, y: G },
      { type: 'checkpoint', x: 448, y: G, id: 'CP5' },
      { type: 'prop', kind: 'car', x: 452, y: G },
      { type: 'lamp', x: 457, y: G, kind: 'baize' },
      { type: 'npc', who: 'favour', x: 459, y: G, id: 'favour2' },
      { type: 'table', x: 457, y: G, id: 't_last', game: 'p6', name: 'FACE UP' },
      { type: 'dialogue', x: 454, y: G, id: 'd8' },
      { type: 'prop', kind: 'car', x: 464, y: G },
      { type: 'coin', x: 470, y: G - 1, breadcrumb: true },
      { type: 'gate', x: 479, y: 29, h: 5, id: 'g5', requires: ['p6'] },
    ]
  ),
  room(
    { id: 'lostfound', section: 'lostfound', allowNoFoes: true, finale: true, music: { bpm: 60, state: 'quiet' }, bg: { far: 'staff_wall', mid: 'shelving', near: 'bollards', landmark: 'fluorescent' } },
    480, 519,
    [
      { type: 'prop', kind: 'staffdoor', x: 482, y: G },
      { type: 'prop', kind: 'umbrellas', x: 490, y: 29 },
      { type: 'coin', x: 495, y: 26 },
      { type: 'prop', kind: 'box', x: 504, y: G, id: 'box' },
      { type: 'orb', x: 504, y: G - 1 },
    ]
  ),
];
