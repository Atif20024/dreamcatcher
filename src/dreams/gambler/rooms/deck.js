// THE HURRICANE DECK: up the companion stair into the wind before dawn, the
// first grey light on the river. Grey salted planks, the ship's bell, coils
// of line; an open skylight hatch to jump (a fall goes down to the boiler
// deck: back to the last lamp). The texas cabin stands across the deck: up
// its ladder onto the roof, where the escape pipes blow off steam on their
// own beat beside the chimneys (TILT makes them harder to time: a tilted
// head misjudges the gaps, and the edges of the world blur). The pilot house
// door is at the end of the roof. Off the stern, the jackstaff's ratlines go
// up to a crosstree for the brave.
import { grid } from './grid.js';

const g = grid(50, 30);
g.fill(0, 26, 49, 29); // the hurricane deck
g.clear(7, 26, 9, 29); // the open skylight hatch
g.fill(16, 19, 40, 25); // the texas cabin (its roof is the way on)
g.ladder(15, 18, 25); // its ladder
g.put(42, 12, '=======');  // the crosstree
g.ladder(45, 12, 25, [12]); // the ratlines up the jackstaff's stays

// the escape pipes on the texas roof: each blows a column of steam
// (room columns; rows are the steam's extent) on its own beat
export const VENTS = [
  { x: 21, y0: 13, y1: 18, period: 2600, on: 1100, phase: 0 },
  { x: 29, y0: 13, y1: 18, period: 2600, on: 1100, phase: 1300 },
];

export default {
  id: 'deck',
  origin: { tx: 0, ty: 80 },
  grid: g.rows(),
  material: 'hurricane_deck',
  regions: [{ rect: [16, 20, 40, 25], material: 'hull_white' }],
  decor: [],
  air: [0, 49],
  vents: VENTS,
  props: [
    { prop: 'cabin_door_white', x: 3, y: 26, layer: 'back' },
    { prop: 'ship_bell', x: 12, y: 26 },
    { prop: 'rope_coil', x: 5, y: 26 },
    { prop: 'rope_coil', x: 43, y: 26 },
    { prop: 'chimney', x: 25, y: 19, layer: 'back' },
    { prop: 'chimney', x: 33, y: 19, layer: 'back' },
    { prop: 'escape_pipe', x: 21, y: 19 },
    { prop: 'escape_pipe', x: 29, y: 19 },
    { prop: 'pilot_house', x: 37, y: 19, layer: 'back' },
    { prop: 'texas_face', x: 15, y: 26, dx: 16, layer: 'fg' },
    { prop: 'ratline', x: 45, y: 26, layer: 'back' },
    { prop: 'ratline', x: 45, y: 19, layer: 'back' },
  ],
  enclosure: { fgFoliage: [], frames: [] },
  light: { tint: 0xe4e0ec },
  backdrop: { set: 'verrane_dawn', horizon: 27 },
  ambience: 'gm_deck',
  acoustics: 'open',
  music: { state: 'explore', key: 'deck' },
  objective: [{ text: 'deck' }],
  titleCard: 'THE HURRICANE DECK',
  entities: [
    { type: 'portal', id: 'deck>office', kind: 'door', x: 3, y: 25, to: { room: 'office', portal: 'office>deck' }, door: { prompt: 'down to the office', fade: 260 } },
    { type: 'checkpoint', id: 'cp_deck', label: 'THE HURRICANE DECK', x: 5, y: 25 },
    { type: 'npc', id: 'dev_deck', cast: 'npc-lq-dev', x: 12, y: 25, facing: -1, pace: [10, 14], talk: [{ conv: 'dev_deck' }] },
    { type: 'checkpoint', id: 'cp_texas', label: 'THE TEXAS ROOF', x: 17, y: 18 },
    { type: 'sign', text: 'PILOT HOUSE', x: 35, y: 13, board: 0x5a1e26, scale: 2 },
    { type: 'portal', id: 'deck>pilot', kind: 'door', x: 35, y: 18, to: { room: 'pilot', portal: 'pilot>deck' }, door: { prompt: 'into the pilot house', fade: 220 } },
    // half dimes: over the hatch, between the pipes (timed), up the ratlines
    { type: 'coins', id: 'c_hatch', x: 7, y: 23, n: 3 },
    { type: 'coins', id: 'c_pipes', x: 23, y: 16, n: 4 },
    { type: 'coins', id: 'c_ratlines', x: 42, y: 10, n: 6 },
    { type: 'shard', x: 47, y: 10 },
  ],
};
