import { buildHubMap } from './map.js';

// Crossroads Station — five rooms across, each two screens tall. The roof
// (row 8) and the undercroft (rows 28-32) run through every room, so a
// room's objects include whatever stands above and below it.
const FULL = buildHubMap();
const slice = (x0, x1) => FULL.map((row) => row.slice(x0, x1 + 1));
const L = (worldCol, x0) => worldCol - x0;

// platform bays: [world col of the bay's first tile] per platform 1..8
export const BAYS = [80, 87, 94, 101, 110, 117, 124, 131];

const bay = (x0, p) => {
  const c = BAYS[p - 1];
  return [
    { type: 'platform', platform: p, x: L(c + 3, x0), y: 25, x0: L(c, x0), w: 7 },
    { type: 'board_post', platform: p, x: L(c + 1, x0), y: 24 },
    { type: 'bench', x: L(c + 5, x0), y: 25, platform: p },
    { type: 'lamp', x: L(c + 6, x0), y: 22, platform: p },
    { type: 'train', platform: p, x: L(c + 3, x0), y: 24 },
  ];
};

export default [
  {
    id: 'steps',
    section: 'steps',
    allowNoFoes: true,
    grid: slice(0, 29),
    music: { section: 'hub', bpm: 104, state: 'hub' },
    bg: { far: 'rain_city', mid: 'station_facade', near: 'railings', landmark: 'station_sign' },
    objects: [
      { type: 'spawn', x: 3, y: 29 },
      { type: 'rain', x: 0, y: 0, w: 30 },
      { type: 'kiosk', x: 6, y: 29 },
      { type: 'queue', x: 4, y: 29, to: 24 },
      { type: 'npc', who: 'ro', x: 17, y: 25 },
      { type: 'shoeshine', x: 18, y: 25 },
      { type: 'door', x: 20, y: 25, chained: true },
      { type: 'door', x: 22, y: 25, chained: false },
      { type: 'door', x: 24, y: 25, chained: true },
      { type: 'clock', x: 14, y: 3 },
      { type: 'hall_entry', x: 26, y: 25 },
    ],
  },
  {
    id: 'hall',
    section: 'hall',
    allowNoFoes: true,
    grid: slice(30, 79),
    music: { section: 'hub', bpm: 104, state: 'hub' },
    bg: { far: 'hall_vault', mid: 'ticket_hall', near: 'ticket_booths', landmark: 'great_clock' },
    objects: [
      { type: 'board', x: L(47, 30), y: 11 },
      { type: 'npc', who: 'pemberton', x: L(48, 30), y: 25 },
      { type: 'desk', x: L(48, 30), y: 25 },
      { type: 'booths', x: L(40, 30), y: 25 },
      { type: 'phones', x: L(44, 30), y: 25 },
      { type: 'bench', x: L(38, 30), y: 25, sleeper: true },
      { type: 'npc', who: 'sleeper', x: L(38, 30), y: 25 },
      { type: 'moment', id: 'moment2', x: L(39, 30), y: 25, kind: 'bench' },
      { type: 'fountain', x: L(56, 30), y: 25 },
      { type: 'pigeons', x: L(53, 30), y: 25 },
      { type: 'flowers', x: L(60, 30), y: 25 },
      { type: 'npc', who: 'flower', x: L(61, 30), y: 25 },
      { type: 'cart', x: L(65, 30), y: 25 },
      { type: 'cart', x: L(68, 30), y: 25 },
      { type: 'lostfound', x: L(66, 30), y: 22 },
      { type: 'npc', who: 'busker', x: L(70, 30), y: 25 },
      { type: 'moment', id: 'moment1', x: L(70, 30), y: 25, kind: 'duet' },
      { type: 'npc', who: 'bilal', x: L(46, 30), y: 17 },
      { type: 'cafe', x: L(50, 30), y: 17 },
      { type: 'dumbwaiter', x: L(57, 30), y: 17 },
      { type: 'dumbwaiter', x: L(57, 30), y: 25 },
      { type: 'npc', who: 'sweeper', x: L(34, 30), y: 25 },
      { type: 'lofts', x: L(42, 30), y: 7 },
      { type: 'tea_kitchen', x: L(44, 30), y: 32 },
      { type: 'cages', x: L(62, 30), y: 32 },
      { type: 'hatch', x: L(62, 30), y: 8 },
    ],
  },
  {
    id: 'platforms_a',
    section: 'platforms',
    allowNoFoes: true,
    grid: slice(80, 109),
    music: { section: 'hub', bpm: 104, state: 'hub' },
    bg: { far: 'hall_vault', mid: 'shed_ribs', near: 'shed_lamps', landmark: 'train_shed' },
    objects: [
      ...bay(80, 1),
      ...bay(80, 2),
      ...bay(80, 3),
      ...bay(80, 4),
      { type: 'npc', who: 'kite', x: L(100, 80), y: 7 },
      { type: 'moment', id: 'moment3', x: L(100, 80), y: 7, kind: 'kite' },
    ],
  },
  {
    id: 'platforms_b',
    section: 'platforms',
    allowNoFoes: true,
    grid: slice(110, 139),
    music: { section: 'hub', bpm: 104, state: 'hub' },
    bg: { far: 'hall_vault', mid: 'shed_ribs', near: 'shed_lamps', landmark: 'shed_clock' },
    objects: [
      ...bay(110, 5),
      ...bay(110, 6),
      ...bay(110, 7),
      ...bay(110, 8),
      { type: 'water_tower', x: L(122, 110), y: 5 },
      { type: 'signal_box', x: L(114, 110), y: 32 },
      { type: 'lost_dreams', x: L(126, 110), y: 32 },
    ],
  },
  {
    id: 'gate',
    section: 'gate',
    allowNoFoes: true,
    grid: slice(140, 149),
    music: { section: 'hub', bpm: 104, state: 'hub' },
    bg: { far: 'gate_dark', mid: 'shed_ribs', near: 'railings', landmark: 'no_passengers' },
    objects: [
      { type: 'turnstile', x: L(143, 140), y: 24 },
      { type: 'gate', id: 'service_gate', x: L(146, 140), y: 12, h: 14, requires: ['meta.dreamsCaught>=2'] },
      { type: 'sign', x: L(146, 140), y: 8, text: 'NO PASSENGERS' },
      { type: 'gate_slot', x: L(146, 140), y: 30 },
    ],
  },
];
