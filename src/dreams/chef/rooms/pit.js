// THE PIT: the plongeur's end of the kitchen, white tile, steam, a floor that
// is always wet by the sink. Bastien, seventeen, sprays and sings. The rail
// teaches itself here: plates to the rack, coppers scoured and hung on the
// high hooks (a climb), a tureen to the hatch against a soft clock. Clearing
// it earns the apron, and the door at the far end opens.
import { grid } from '../../gambler/rooms/grid.js';

const g = grid(46, 14);
g.fill(0, 0, 45, 3);
g.fill(0, 12, 45, 13);
g.fill(0, 4, 1, 11);
g.fill(44, 4, 45, 11);
g.put(26, 9, '===');
g.put(29, 7, '=======');

export default {
  id: 'pit',
  origin: { tx: 40, ty: 0 },
  grid: g.rows(),
  material: 'quarry_tile',
  regions: [
    { rect: [0, 0, 45, 3], material: 'glazed_wall' },
    { rect: [0, 4, 1, 11], material: 'glazed_wall' },
    { rect: [44, 4, 45, 11], material: 'glazed_wall' },
    { rect: [26, 7, 35, 9], material: 'kitchen_plank' },
  ],
  decor: [],
  props: [
    ...[7, 16, 25, 34, 43].map((x) => ({ prop: 'tile_band', x, y: 12, layer: 'back' })),
    { prop: 'swing_door', x: 3, y: 12, layer: 'back' },
    { prop: 'wash_sink', x: 12, y: 12 },
    { prop: 'pipe_run', x: 12, y: 4, dy: 8, layer: 'back' },
    { prop: 'wet_floor', x: 16, y: 12, layer: 'fg', dy: 2 },
    { prop: 'scour_bench', x: 21, y: 12 },
    { prop: 'plate_rack', x: 26, y: 12, layer: 'back' },
    { prop: 'copper_hooks', x: 32, y: 6, dy: 10, layer: 'back' },
    { prop: 'hatch', x: 39, y: 12, layer: 'back' },
    { prop: 'swing_door_cold', x: 42, y: 12, layer: 'back' },
    { prop: 'wireless', x: 6, y: 7, layer: 'back' },
    { prop: 'hanging_bulb', x: 12, y: 4, dy: 8 },
    { prop: 'hanging_bulb', x: 30, y: 4, dy: 8 },
  ],
  lights: [{ x: 12, y: 6, r: 150, color: 0xfff2d8 }, { x: 30, y: 6, r: 160, color: 0xfff2d8 }],
  enclosure: { backWall: 'plaster', wainscot: false, posts: 0, ceiling: true, pillars: true, frames: [{ x: 2, y: 9, w: 2, h: 3 }, { x: 41, y: 9, w: 2, h: 3 }], palette: { wall: 0xdcd8c8, wood: 0x6a6a64, accent: 0x8a8678, deep: 0x4a4a48, lit: 0xfff8e8 } },
  light: { tint: 0xfff8f0 },
  backdrop: null,
  ambience: 'fs_pit',
  acoustics: 'room',
  events: 'kitchen',
  music: { state: 'quiet', key: 'pit' },
  objective: [{ text: 'pit' }, { text: 'to_cold', flag: 'apron' }],
  titleCard: 'THE PIT',
  // the rail verb and the kitchen verb read these
  service: 'pit',
  wet: [13, 18],
  vents: [{ x: 23, y0: 8, y1: 11, every: 4, off: 1 }, { x: 36, y0: 8, y1: 11, every: 4, off: 3 }],
  runners: [{ npc: 'porter', speed: 52, bark: 'Trolley!', load: 'trolley' }],
  life: [{ npc: 'bastien', kind: 'hose' }],
  entities: [
    { type: 'portal', id: 'pit>yard', kind: 'door', x: 3, y: 11, to: { room: 'yard', portal: 'yard>pit' }, door: { prompt: 'out to the yard', fade: 220 } },
    { type: 'checkpoint', id: 'cp_pit', label: 'THE PIT', x: 5, y: 11 },
    { type: 'sign', text: 'SINK', x: 12, y: 6, board: 0x2a2a34, ink: 0xf2e6cc, rim: 0x8a8678 },
    { type: 'sign', text: 'SCOUR', x: 21, y: 7, board: 0x2a2a34, ink: 0xf2e6cc, rim: 0x8a8678 },
    { type: 'sign', text: 'RACK', x: 26, y: 5, board: 0x2a2a34, ink: 0xf2e6cc, rim: 0x8a8678 },
    { type: 'sign', text: 'HOOKS', x: 34, y: 5, board: 0x2a2a34, ink: 0xf2e6cc, rim: 0x8a8678 },
    { type: 'sign', text: 'HATCH', x: 39, y: 6, board: 0x2a2a34, ink: 0xf2e6cc, rim: 0x8a8678 },
    { type: 'sign', text: 'COLD STORE. APRONS ONLY', x: 39, y: 9, dx: 20, board: 0x2a3440, ink: 0xdcecf4, rim: 0x8a9aa8, scale: 1, size: 'body' },
    { type: 'npc', id: 'bastien', cast: 'npc-rv-bastien', x: 9, y: 11, facing: 1, turns: false, talk: [{ conv: 'bastien_after', if: 'apron' }, { conv: 'bastien' }] },
    { type: 'moment', id: 'm3', x: 7, y: 11, prompt: 'listen to Bastien', beat: 'moment_bastien' },
    { type: 'npc', id: 'porter', cast: 'npc-rv-porter', x: 24, y: 11, facing: 1, pace: [23, 37] },
    { type: 'npc', id: 'marguerite_pit', cast: 'npc-rv-marguerite', x: 37, y: 11, facing: -1, when: 'pit_clear' },
    { type: 'portal', id: 'pit>cold', kind: 'door', x: 42, y: 11, to: { room: 'cold', portal: 'cold>pit' }, door: { prompt: 'into the cold store', fade: 220, requires: ['apron'], locked: 'no apron, no cold store', lockedLine: "That door is for the brigade. I'm not one yet: clear the rail first." } },
    // the hooks pay: up where the climb goes
    { type: 'coins', id: 'c_p1', x: 30, y: 5, n: 5, dx: 1 },
    { type: 'coins', id: 'c_p2', x: 14, y: 10, n: 3, dx: 2 },
  ],
};
