// THE PURSER'S OFFICE: a close dry room, the brass cage over a walnut
// counter, the ship's safe, a clock that never ticks. Mr Pell remembers
// names and never raises his voice; he keeps the marker book. Fifty on Jo's
// word, quick and kind. Past the cage a narrow corridor runs aft to the
// companion stair up to the hurricane deck. Every marker signed brings its
// ceiling down a tile (src/dreams/gambler/verbs/boat.js) and dims its lamp a
// notch, and once there is one, Crake walks it behind Jo. He never runs.
// The player who owes nothing gets the good of the room: the lamps at full
// glow, brass up under the high ceiling (the first plank takes it), and Mr
// Pell's old book left open on its stand, with a name in it.
import { grid } from './grid.js';

const g = grid(48, 14);
g.fill(0, 0, 47, 3); // the deck overhead
g.fill(18, 4, 41, 5); // the corridor's lower ceiling
g.fill(0, 12, 47, 13);
g.fill(0, 4, 1, 11);
g.fill(46, 4, 47, 11);
g.put(6, 8, '=======');  // the top of the cage (a ledge for the agile)

// the corridor the markers narrow: columns, and the rows its ceiling drops to
export const CORRIDOR = { x0: 18, x1: 41, rows: [6, 7, 8] };

export default {
  id: 'office',
  origin: { tx: 160, ty: 40 },
  grid: g.rows(),
  material: 'saloon_oak',
  regions: [
    { rect: [0, 0, 47, 3], material: 'ceiling_white' },
    { rect: [18, 4, 41, 5], material: 'walnut_panel' },
    { rect: [0, 4, 1, 11], material: 'walnut_panel' },
    { rect: [46, 4, 47, 11], material: 'walnut_panel' },
    { rect: [6, 8, 12, 8], material: 'main_deck' },
  ],
  decor: [],
  corridor: CORRIDOR,
  props: [
    { prop: 'cabin_door', x: 3, y: 12, layer: 'back' },
    { prop: 'safe', x: 5, y: 12, layer: 'back' },
    { prop: 'purser_cage', x: 9, y: 12 },
    { prop: 'wall_lamp', x: 24, y: 8, live: true },
    { prop: 'wall_lamp', x: 35, y: 8, live: true },
    { prop: 'book_stand', x: 30, y: 12, when: 'clean_book', live: true },
    { prop: 'stair_up', x: 43, y: 12, layer: 'back' },
  ],
  lights: [],
  enclosure: { backWall: 'panelled', wainscot: true, posts: 5, ceiling: true, pillars: false, frames: [{ x: 2, y: 9, w: 2, h: 3 }], palette: { wall: 0x4a3424, wood: 0x2a160e, accent: 0xc8a050, deep: 0x120a06, lit: 0xd8b080 } },
  light: { tint: 0xf2e6d4 },
  backdrop: null,
  ambience: 'gm_office',
  events: 'boat_cabin',
  acoustics: 'room',
  music: { state: 'quiet', key: 'office' },
  objective: [{ text: 'corridor' }],
  titleCard: "THE PURSER'S OFFICE",
  entities: [
    { type: 'portal', id: 'office>cards', kind: 'door', x: 3, y: 11, to: { room: 'cards', portal: 'cards>office' }, door: { prompt: 'back to the card room', fade: 220 } },
    { type: 'checkpoint', id: 'cp_office', label: "THE PURSER'S OFFICE", x: 14, y: 11 },
    { type: 'sign', text: 'PURSER', x: 9, y: 5, board: 0x22284a, scale: 2 },
    // a small brass plaque on the cage; Mr Pell says the rest himself
    { type: 'sign', text: 'MARKERS', size: 'small', x: 13, y: 8, dy: 6, board: 0x2a160e, padX: 6, padY: 3, scale: 2 },
    { type: 'sign', text: 'HURRICANE DECK', x: 43, y: 5, board: 0x2a160e, scale: 2 },
    { type: 'npc', id: 'pell', cast: 'npc-lq-pell', x: 9, y: 11, facing: -1, talk: [{ conv: 'pell_full', if: 'marker3' }, { conv: 'pell_again', if: 'marker1' }, { conv: 'pell_first' }, { conv: 'pell_clean', if: 'clean_book' }, { conv: 'pell_comped', if: 'met_pell' }] },
    // Crake comes when there is a marker in the book; he walks the corridor
    { type: 'foe', kind: 'crake', x: 19, y: 11, patrol: [18, 42], when: 'marker1' },
    { type: 'portal', id: 'office>deck', kind: 'door', x: 43, y: 11, to: { room: 'deck', portal: 'deck>office' }, door: { prompt: 'up to the hurricane deck', fade: 260 } },
    { type: 'moment', id: 'm_book', x: 30, y: 11, when: 'clean_book', prompt: 'read the open book', beat: 'moment_book' },
    // brass under the high ceiling, a good jump: a marker's plank closes it
    // (verbs/boat.js). By the numbers: JUMP 600 at GRAVITY 1200 rises 150 px; the
    // dream body is 72 tall over feet at y + 22, so under the row 5 ceiling Jo's
    // y stops at 242 (room px). The 34 px magnet would only just miss row 6
    // (y 208); row 7 (y 240) is taken with 88 px of rise or more.
    { type: 'coins', id: 'c_clean', x: 22, y: 7, n: 5 },
    // half dimes on top of the cage
    { type: 'coins', id: 'c_cage', x: 6, y: 6, n: 5 },
  ],
};
