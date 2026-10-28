// RAIN ON THE MARQUEE: THE BIG STAGE opens on a wet city street at night.
// The Meridian's marquee across the pavement names the dream (Saturday, the
// Big Stage); a horn in a shop window answers Jo's first note; the Blue
// Cellar's bouncer sends musicians round the back. The bus shelter, the
// parked car and a shop awning are the high road (it pays); the iron arch at
// the far end is the alley mouth (a seam: no cut).
import { grid } from './grid.js';

const g = grid(72, 20);
g.fill(0, 16, 71, 19); // the street
g.fill(0, 15, 13, 15); // the theatre's raised pavement
g.put(14, 15, '\\'); // its kerb ramp down to the street
g.put(42, 13, '=====');  // the bus shelter roof
g.put(48, 14, '=====');  // the parked car's roof
g.put(57, 12, '=======');  // the shop awning
g.put(63, 14, '==='); // the dumpster's lid by the alley mouth (a ledge: the bin is drawn)

export default {
  id: 'street',
  origin: { tx: 0, ty: 0 },
  grid: g.rows(),
  material: 'wet_setts',
  regions: [{ rect: [0, 15, 14, 15], material: 'dock_concrete' }],
  decor: ['wet_puddles'],
  props: [
    { prop: 'theatre_front', x: 7, y: 15, layer: 'back' },
    { prop: 'street_lamp', x: 15, y: 16 },
    { prop: 'horn_shop', x: 21, y: 16, layer: 'back' },
    { prop: 'cellar_front', x: 31, y: 16, layer: 'back' },
    { prop: 'street_lamp', x: 38, y: 16 },
    { prop: 'street_tree', x: 39, y: 16, dx: 40, layer: 'back' },
    { prop: 'bus_shelter', x: 44, y: 16 },
    { prop: 'parked_car', x: 50, y: 16, dx: 16 },
    { prop: 'brick_row', x: 60, y: 16, layer: 'back' },
    { prop: 'hydrant', x: 55, y: 16 },
    { prop: 'street_lamp', x: 56, y: 16, dx: 20 },
    { prop: 'dumpster', x: 64, y: 16 },
    { prop: 'alley_arch', x: 69, y: 16 },
  ],
  enclosure: { fgFoliage: [], frames: [] },
  light: { tint: 0xe0e4f8 },
  backdrop: { set: 'rain_street', horizon: 16 },
  ambience: 'rain_street',
  music: { state: 'quiet', bpm: 96 },
  objective: 'arrive',
  titleCard: 'RAIN ON THE MARQUEE',
  entities: [
    { type: 'spawn', id: 'start', x: 2, y: 14 },
    { type: 'checkpoint', id: 'cp_marquee', label: 'THE MARQUEE', x: 5, y: 14 },
    // the horn in the window: Jo's first note (the trumpet verb, [Q])
    { type: 'resonant', id: 'horn', x: 20, y: 13, r: 3, set: 'horn_rang', beat: 'horn_answers' },
    { type: 'npc', id: 'bouncer', cast: 'foe-bouncer', x: 29, y: 15, facing: -1, talk: [{ conv: 'bouncer_again', if: 'met_bouncer' }, { conv: 'bouncer' }] },
    // coins (busker coins, worth 1): a breadcrumb on the kerb, then the high
    // road: the shelter roof, the car roof, the awning, a run along the top
    { type: 'coin', id: 'c_kerb', x: 16, y: 14 },
    { type: 'coins', id: 'c_shelter', x: 42, y: 11, n: 5 },
    { type: 'coins', id: 'c_car', x: 48, y: 12, n: 5 },
    { type: 'coins', id: 'c_hop', x: 54, y: 10, n: 2 },
    { type: 'coins', id: 'c_awning', x: 57, y: 10, n: 7 },
    { type: 'coins', id: 'c_bin', x: 63, y: 12, n: 3 },
    { type: 'portal', id: 'street>alley', kind: 'seam', x: 71, y: 15, to: { room: 'alley', portal: 'alley<street' }, seam: { prop: 'alley_arch', width: 260 } },
  ],
};
