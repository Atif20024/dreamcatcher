// THE DINING ROOM. The door is the cut: all night the kitchen has shouted, and
// through it there is nothing. A long dark room, candles, every table laid and
// nobody at any of them. On each table Jo served tonight, Jo's plate, untouched.
// He walks (he cannot run with this plate). Behind him the lamps click off.
// At the far end: table one, a card, an empty chair.
import { grid } from '../../gambler/rooms/grid.js';

const g = grid(62, 14);
g.fill(0, 0, 61, 2);
g.fill(0, 12, 61, 13);
g.fill(0, 3, 1, 11);
g.fill(60, 3, 61, 11);

export const TABLES = [
  { n: 2, x: 9 }, { n: 3, x: 15 }, { n: 4, x: 21 }, { n: 5, x: 27 },
  { n: 6, x: 33 }, { n: 7, x: 39 }, { n: 8, x: 45 }, { n: 9, x: 51 },
];

export default {
  id: 'dining',
  origin: { tx: 300, ty: 0 },
  grid: g.rows(),
  material: 'parquet',
  regions: [
    { rect: [0, 0, 61, 2], material: 'salle_wall' },
    { rect: [0, 3, 1, 11], material: 'salle_wall' },
    { rect: [60, 3, 61, 11], material: 'salle_wall' },
  ],
  decor: [],
  props: [
    { prop: 'swing_door_salle', x: 3, y: 12, layer: 'back' },
    ...[12, 24, 36, 48].flatMap((x) => [{ prop: 'tall_window', x, y: 10, layer: 'back' }, { prop: 'chandelier_salle', x: x + 6, y: 3, dy: -12 }]),
    ...TABLES.flatMap((t) => [
      { prop: 'table_laid', x: t.x, y: 12, layer: 'back' },
      { prop: 'plate_cold', x: t.x, y: 12, dy: -49, when: `sent${t.n}`, layer: 'mid' },
    ]),
    { prop: 'table_one', x: 57, y: 12 },
    { prop: 'plate_up', x: 57, y: 12, dy: -49, when: 'plate_set' },
  ],
  lights: [],
  enclosure: { backWall: 'panelled', wainscot: true, posts: 8, ceiling: true, pillars: true, frames: [{ x: 2, y: 9, w: 2, h: 3 }], palette: { wall: 0x3a2428, wood: 0x241416, accent: 0xa88a48, deep: 0x100808, lit: 0x8a6048 } },
  light: { tint: 0xc8bcd0 },
  lit: false,
  backdrop: null,
  ambience: 'fs_dining',
  acoustics: 'hall',
  events: null,
  music: { state: 'silent', key: 'dining' },
  objective: [{ text: 'walk' }, { text: 'catch', flag: 'orb_on' }],
  titleCard: null,
  service: 'dining',
  lamps: [...[12, 24, 36, 48].map((x) => ({ x: x + 6, y: 4, r: 1.3 })), ...TABLES.map((t) => ({ x: t.x, y: 9, r: 0.55 }))],
  lastLamp: { x: 57, y: 8 },
  entities: [
    { type: 'portal', id: 'dining>pass', kind: 'door', x: 3, y: 11, to: { room: 'pass', portal: 'pass>dining' }, door: { prompt: 'back', fade: 300, requires: ['_never'], locked: 'the door has swung shut', lockedLine: 'The plate is going cold.' } },
    { type: 'checkpoint', id: 'cp_dining', label: 'THE DINING ROOM', x: 6, y: 11 },
    ...TABLES.map((t) => ({ type: 'sign', text: String(t.n), x: t.x, y: 8, dy: 4, board: 0x2a2a34, ink: 0xf2e6cc, rim: 0x8a8678, scale: 1, size: 'body', padX: 5, padY: 3, depth: -8 })),
    { type: 'sign', text: 'MME LISLE', x: 57, y: 8, board: 0x2a1a14, ink: 0xf2ead8, rim: 0xc8a050, scale: 1, size: 'body' },
    { type: 'orb', id: 'orb', x: 57, y: 9, tint: 0xf2d580, when: 'orb_on' },
  ],
};
