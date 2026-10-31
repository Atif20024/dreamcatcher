// THE CARD ROOM: aft of the saloon, lower and smokier. No band; a riffle,
// chips cut into stacks, ice in a glass. Three round tables of green baize,
// each under its green-shaded lamp: Judge Harlan Voe alone at the first,
// Madame Sorrel and Nico Tarn at the second; when both are beaten the three
// of them sit down together at the third. Lou stands at Jo's shoulder. Aft,
// French doors stand open on the guard: the rail, the river at night. That
// is where TILT comes down (ten seconds of walking it). The door past the
// guard goes to the purser's office.
import { grid } from './grid.js';

const g = grid(60, 14);
g.fill(0, 0, 59, 3);
g.fill(0, 12, 59, 13);
g.fill(0, 4, 1, 11);
g.fill(58, 4, 59, 11);

export const TABLES = { t1: 10, t2: 22, t3: 34 };
// the guard (room columns): walking here takes the air
export const AIR = [43, 53];

export default {
  id: 'cards',
  origin: { tx: 80, ty: 40 },
  grid: g.rows(),
  material: 'saloon_oak',
  regions: [
    { rect: [0, 0, 59, 3], material: 'ceiling_white' },
    { rect: [0, 4, 1, 11], material: 'walnut_panel' },
    { rect: [58, 4, 59, 11], material: 'walnut_panel' },
  ],
  decor: [],
  air: AIR,
  props: [
    { prop: 'cabin_door', x: 3, y: 12, layer: 'back' },
    { prop: 'guard_view', x: 42, y: 12, layer: 'back' },
    { prop: 'stateroom', x: 16, y: 12, layer: 'back' },
    { prop: 'stateroom', x: 28, y: 12, layer: 'back' },
    { prop: 'cabin_door', x: 56, y: 12, layer: 'back' },
    { prop: 'table_lamp', x: TABLES.t1, y: 4, dy: -16 },
    { prop: 'table_lamp', x: TABLES.t2, y: 4, dy: -16 },
    { prop: 'table_lamp', x: TABLES.t3, y: 4, dy: -16 },
    { prop: 'card_table', x: TABLES.t1, y: 12 },
    { prop: 'card_table', x: TABLES.t2, y: 12 },
    { prop: 'card_table', x: TABLES.t3, y: 12 },
    { prop: 'saloon_chair', x: TABLES.t1 - 2, y: 12 },
    { prop: 'saloon_chair', x: TABLES.t2 - 2, y: 12 },
    { prop: 'saloon_chair', x: TABLES.t3 - 2, y: 12 },
    // the players' chairs (they sit facing the table)
    { prop: 'saloon_chair', x: TABLES.t1 + 2, y: 12, dx: 6, flip: true },
    { prop: 'saloon_chair', x: TABLES.t2 + 1, y: 12, dx: 6, flip: true },
    { prop: 'saloon_chair', x: TABLES.t2 + 3, y: 12, dx: 6, flip: true },
    { prop: 'saloon_chair', x: TABLES.t3 + 1, y: 12, dx: 6, flip: true },
    { prop: 'saloon_chair', x: TABLES.t3 + 2, y: 12, dx: 16, flip: true },
    { prop: 'saloon_chair', x: TABLES.t3 + 3, y: 12, dx: 26, flip: true },
    { prop: 'carpet_runner', x: 2, y: 12, layer: 'fg', dy: 2 },
    { prop: 'carpet_runner', x: 24, y: 12, layer: 'fg', dy: 2 },
  ],
  lights: [{ x: 48, y: 8, r: 120, color: 0x8aa0d0 }],
  enclosure: { backWall: 'panelled', wainscot: true, posts: 6, ceiling: true, pillars: true, frames: [{ x: 2, y: 9, w: 2, h: 3 }, { x: 55, y: 9, w: 2, h: 3 }], palette: { wall: 0x3a2a20, wood: 0x2a160e, accent: 0x2e6a4a, deep: 0x120a06, lit: 0xd8b080 } },
  light: { tint: 0xf0e8d8 },
  backdrop: null,
  ambience: 'gm_cards',
  acoustics: 'room',
  music: { state: 'quiet', key: 'cards' },
  objective: [
    { text: 'tables' },
    { text: 'table3', flag: 'table3_open' },
    { text: 'to_office', flag: 'tables_done' },
  ],
  titleCard: 'THE CARD ROOM',
  entities: [
    { type: 'portal', id: 'cards>saloon', kind: 'door', x: 3, y: 11, to: { room: 'saloon', portal: 'saloon>cards' }, door: { prompt: 'back to the saloon', fade: 220 } },
    { type: 'checkpoint', id: 'cp_cards', label: 'THE CARD ROOM', x: 5, y: 11 },
    { type: 'sign', text: 'NO CREDIT AT THE TABLES. APPLY TO THE PURSER', x: 30, y: 6, board: 0x2a160e, scale: 2, wrap: 330 },
    { type: 'sign', text: 'THE GUARD: TAKE THE AIR', x: 48, y: 5, board: 0x2a160e, scale: 2 },
    { type: 'sign', text: 'PURSER', x: 56, y: 6, board: 0x2a160e, scale: 2 },
    // the first two tables, until the three of them move to the third
    { type: 'npc', id: 'voe1', cast: 'npc-lq-voe', x: TABLES.t1 + 2, y: 11, pose: 'sit', facing: -1, unless: 'table3_open', talk: [{ conv: 'voe_after', if: 't1_won' }, { conv: 'voe_first' }] },
    { type: 'npc', id: 'sorrel2', cast: 'npc-lq-sorrel', x: TABLES.t2 + 1, y: 11, pose: 'sit', facing: -1, unless: 'table3_open', talk: [{ conv: 'sorrel' }] },
    { type: 'npc', id: 'nico2', cast: 'npc-lq-nico', x: TABLES.t2 + 3, y: 11, pose: 'sit', facing: -1, unless: 'table3_open', talk: [{ conv: 'nico' }] },
    { type: 'npc', id: 'voe3', cast: 'npc-lq-voe', x: TABLES.t3 + 1, y: 11, pose: 'sit', facing: -1, when: 'table3_open', talk: [{ conv: 'voe_table3' }] },
    { type: 'npc', id: 'sorrel3', cast: 'npc-lq-sorrel', x: TABLES.t3 + 2, y: 11, dx: 10, pose: 'sit', facing: -1, when: 'table3_open', talk: [{ conv: 'sorrel' }] },
    { type: 'npc', id: 'nico3', cast: 'npc-lq-nico', x: TABLES.t3 + 3, y: 11, dx: 20, pose: 'sit', facing: -1, when: 'table3_open', talk: [{ conv: 'nico' }] },
    { type: 'npc', id: 'lou_cards', cast: 'npc-lq-lou', x: 6, y: 11, facing: 1, follow: [4, 54], talk: [{ conv: 'lou_tilt', if: 'tilted' }, { conv: 'lou_cards' }] },
    { type: 'encounter', id: 't1', x: TABLES.t1 - 2, y: 11, anchor: { x: TABLES.t1, y: 8 }, prompt: "sit in Lou's chair", unless: 't1_won' },
    { type: 'encounter', id: 't2', x: TABLES.t2 - 2, y: 11, anchor: { x: TABLES.t2 + 1, y: 8 }, prompt: "sit in Lou's chair", unless: 't2_won' },
    { type: 'encounter', id: 't3', x: TABLES.t3 - 2, y: 11, anchor: { x: TABLES.t3 + 2, y: 8 }, prompt: "sit in Lou's chair", when: 'table3_open', unless: 't3_won' },
    { type: 'portal', id: 'cards>office', kind: 'door', x: 56, y: 11, to: { room: 'office', portal: 'office>cards' }, door: { prompt: "to the purser's office", fade: 220, requires: ['tables_done'], locked: 'three tables first', lockedLine: "Lou wants a pot from every table before the purser sees us." } },
    // half dimes: dropped along the guard (the air is the way to them)
    { type: 'coins', id: 'c_guard', x: 44, y: 10, n: 4 },
  ],
};
