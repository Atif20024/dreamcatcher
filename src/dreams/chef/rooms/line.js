// THE LINE at rush: the room the dream is for. Left to right: the reserve shelf
// (the long walk), the larder, the sauce (Marguerite), the stock burners in the
// aisle, the grill between them, the risotto, and at the end the hot window with
// Aurelio behind it: tasting, spiking, "Next." A plate rail runs over the
// burners: slower, safe, with the tips up there. Luc runs the aisle with a hot
// tray ("Behind!"). Brann calls the tickets. Three sittings, each hotter.
// The door past the window is Chef's: it opens for one plate only.
import { grid } from '../../gambler/rooms/grid.js';

const g = grid(62, 14);
g.fill(0, 0, 61, 3);
g.fill(0, 12, 61, 13);
g.fill(0, 4, 1, 11);
g.fill(60, 4, 61, 11);
g.put(23, 8, '='.repeat(24));
g.put(21, 10, '==');
g.put(47, 10, '==');

export default {
  id: 'line',
  origin: { tx: 190, ty: 0 },
  grid: g.rows(),
  material: 'quarry_tile',
  regions: [
    { rect: [0, 0, 61, 3], material: 'glazed_wall' },
    { rect: [0, 4, 1, 11], material: 'glazed_wall' },
    { rect: [60, 4, 61, 11], material: 'glazed_wall' },
    { rect: [21, 8, 48, 10], material: 'kitchen_plank' },
  ],
  decor: [],
  props: [
    ...[7, 16, 25, 34, 43, 52].map((x) => ({ prop: 'tile_band', x, y: 12, layer: 'back' })),
    { prop: 'swing_door', x: 3, y: 12, layer: 'back' },
    { prop: 'reserve_shelf', x: 6, y: 12, layer: 'back' },
    { prop: 'larder', x: 11, y: 12, layer: 'back' },
    { prop: 'sauce_bench', x: 20, y: 12 },
    { prop: 'copper_hooks', x: 19, y: 5, dy: 4, layer: 'back' },
    { prop: 'range', x: 36, y: 12, layer: 'back' },
    { prop: 'hood', x: 36, y: 4, layer: 'back' },
    { prop: 'grill_top', x: 36, y: 12 },
    { prop: 'stock_burner', x: 26, y: 12 },
    { prop: 'stock_burner', x: 29, y: 12 },
    { prop: 'stock_burner', x: 32, y: 12 },
    { prop: 'stock_burner', x: 40, y: 12 },
    { prop: 'stock_burner', x: 43, y: 12 },
    { prop: 'risotto_pot', x: 46, y: 12, dx: 8 },
    { prop: 'pass_window', x: 55, y: 12 },
    { prop: 'swing_door_chef', x: 59, y: 12, layer: 'back' },
    { prop: 'speaking_tube', x: 52, y: 8, layer: 'back' },
    { prop: 'hanging_bulb', x: 12, y: 4, dy: 4 },
    { prop: 'hanging_bulb', x: 24, y: 4, dy: 4 },
    { prop: 'hanging_bulb', x: 50, y: 4, dy: 4 },
  ],
  lights: [{ x: 12, y: 6, r: 150, color: 0xfff0d0 }, { x: 24, y: 6, r: 150, color: 0xfff0d0 }, { x: 36, y: 8, r: 260, color: 0xff9a50 }, { x: 55, y: 7, r: 170, color: 0xffb060 }],
  enclosure: { backWall: 'plaster', wainscot: false, posts: 0, ceiling: true, pillars: true, frames: [{ x: 2, y: 9, w: 2, h: 3 }, { x: 58, y: 9, w: 2, h: 3 }], palette: { wall: 0xd0c8b4, wood: 0x6a6a64, accent: 0x8a8678, deep: 0x3a3830, lit: 0xfff0d0 } },
  light: { tint: 0xfff0e0 },
  backdrop: null,
  ambience: 'fs_line',
  acoustics: 'room',
  events: 'kitchen',
  music: { state: 'setpiece', key: 'line1' },
  objective: [{ text: 'rush' }, { text: 'to_pass', flag: 'table1_sent' }],
  titleCard: 'THE LINE',
  service: 'line',
  flames: [
    { x: 26, off: 0 }, { x: 29, off: 2 }, { x: 32, off: 0 },
    { x: 40, off: 2 }, { x: 43, off: 0 },
  ],
  runners: [{ npc: 'luc', speed: 112, bark: 'Behind!' }],
  life: [{ npc: 'marguerite_line', kind: 'spoon' }, { npc: 'commis', kind: 'spoon' }, { npc: 'commis2', kind: 'spoon' }, { npc: 'aurelio_window', kind: 'taste' }],
  entities: [
    { type: 'portal', id: 'line>prep', kind: 'door', x: 3, y: 11, to: { room: 'prep', portal: 'prep>line' }, door: { prompt: 'back to prep', fade: 220 } },
    { type: 'checkpoint', id: 'cp_line', label: 'THE LINE', x: 8, y: 11 },
    { type: 'sign', text: 'RESERVE', x: 6, y: 4, dy: 12, board: 0x2a2a34, ink: 0xf2e6cc, rim: 0x8a8678 },
    { type: 'sign', text: 'LARDER', x: 11, y: 4, dy: 12, board: 0x2a2a34, ink: 0xf2e6cc, rim: 0x8a8678 },
    { type: 'sign', text: 'SAUCE', x: 20, y: 7, board: 0x2a2a34, ink: 0xf2e6cc, rim: 0x8a8678 },
    { type: 'sign', text: 'GRILL', x: 36, y: 9, dy: 12, board: 0x2a2a34, ink: 0xf2e6cc, rim: 0x8a8678 },
    { type: 'sign', text: 'RISOTTO', x: 46, y: 6, dx: 8, board: 0x2a2a34, ink: 0xf2e6cc, rim: 0x8a8678 },
    { type: 'sign', text: 'THE PASS', x: 55, y: 4, dy: 12, board: 0x2a1c16, ink: 0xf2d580 },
    { type: 'sign', text: 'CHEF ONLY', x: 59, y: 8, board: 0x4a1a18, ink: 0xf2e6cc, rim: 0xc8a050, scale: 1, size: 'body' },
    { type: 'npc', id: 'commis', cast: 'npc-rv-commis', x: 34, y: 11, facing: -1, depth: 'behind', turns: false },
    { type: 'npc', id: 'commis2', cast: 'npc-rv-commis2', x: 38, y: 11, facing: 1, depth: 'behind', turns: false },
    { type: 'npc', id: 'marguerite_line', cast: 'npc-rv-marguerite', x: 18, y: 11, facing: 1, depth: 'behind', turns: false, talk: [{ conv: 'm_line' }] },
    { type: 'npc', id: 'aurelio_window', cast: 'npc-rv-aurelio', x: 56, y: 11, facing: -1, depth: 'behind', turns: false },
    { type: 'npc', id: 'brann_line', cast: 'foe-sous-chef', x: 51, y: 11, facing: -1, depth: 'behind', turns: false },
    { type: 'npc', id: 'luc', cast: 'npc-rv-luc', x: 40, y: 11, facing: -1, pace: [14, 52] },
    { type: 'portal', id: 'line>pass', kind: 'door', x: 59, y: 11, to: { room: 'pass', portal: 'pass>line' }, door: { prompt: 'round to his side', fade: 300, requires: ['table1_sent'], locked: 'chef only', lockedLine: 'Nobody goes round. Nobody has ever gone round.' } },
    // the plate rail pays, and each tip is over a flame
    { type: 'coins', id: 'c_l1', x: 25, y: 7, n: 9, dx: 2 },
    { type: 'coins', id: 'c_l2', x: 26, y: 9, n: 3, dx: 3 },
    { type: 'coins', id: 'c_l3', x: 40, y: 9, n: 2, dx: 3 },
    { type: 'coins', id: 'c_l5', x: 27, y: 5, n: 6, dx: 3 },
    { type: 'coins', id: 'c_l4', x: 13, y: 7, n: 3, dx: 1 },
  ],
};
