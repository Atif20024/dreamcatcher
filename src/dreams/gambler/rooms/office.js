// THE PURSER'S OFFICE: a close dry room, the brass cage over a walnut
// counter, the ship's safe, a clock that never ticks. Mr Pell remembers
// names and never raises his voice; he keeps the marker book. Fifty on Jo's
// word, quick and kind. Past the cage a narrow corridor runs aft to the
// companion stair up to the hurricane deck. Every marker signed brings its
// ceiling down a tile (src/dreams/gambler/verbs/boat.js) and dims its lamp a
// notch, and once there is one, Crake walks it behind Jo. He never runs.
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
    { prop: 'stair_up', x: 43, y: 12, layer: 'back' },
  ],
  lights: [],
  enclosure: { backWall: 'panelled', wainscot: true, posts: 5, ceiling: true, pillars: false, frames: [{ x: 2, y: 9, w: 2, h: 3 }, { x: 17, y: 6, w: 1, h: 6 }], palette: { wall: 0x4a3424, wood: 0x2a160e, accent: 0xc8a050, deep: 0x120a06, lit: 0xd8b080 } },
  light: { tint: 0xf2e6d4 },
  backdrop: null,
  ambience: 'gm_office',
  acoustics: 'room',
  music: { state: 'quiet', key: 'office' },
  objective: [{ text: 'corridor' }],
  titleCard: "THE PURSER'S OFFICE",
  entities: [
    { type: 'portal', id: 'office>cards', kind: 'door', x: 3, y: 11, to: { room: 'cards', portal: 'cards>office' }, door: { prompt: 'back to the card room', fade: 220 } },
    { type: 'checkpoint', id: 'cp_office', label: "THE PURSER'S OFFICE", x: 14, y: 11 },
    { type: 'sign', text: 'PURSER', x: 9, y: 5, board: 0x22284a, scale: 1 },
    { type: 'sign', text: 'MARKERS ON YOUR WORD. SETTLED AT THE LANDING', x: 14, y: 6, board: 0x2a160e, scale: 1, wrap: 200 },
    { type: 'sign', text: 'HURRICANE DECK', x: 43, y: 5, board: 0x2a160e, scale: 1 },
    { type: 'npc', id: 'pell', cast: 'npc-lq-pell', x: 9, y: 11, facing: -1, talk: [{ conv: 'pell_full', if: 'marker3' }, { conv: 'pell_again', if: 'met_pell' }, { conv: 'pell_first' }] },
    // Crake comes when there is a marker in the book; he walks the corridor
    { type: 'foe', kind: 'crake', x: 19, y: 11, patrol: [18, 42], when: 'marker1' },
    { type: 'portal', id: 'office>deck', kind: 'door', x: 43, y: 11, to: { room: 'deck', portal: 'deck>office' }, door: { prompt: 'up to the hurricane deck', fade: 260 } },
    // half dimes on top of the cage
    { type: 'coins', id: 'c_cage', x: 6, y: 6, n: 5 },
  ],
};
