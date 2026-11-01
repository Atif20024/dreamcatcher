// THE SERVICE YARD: behind the Hôtel Vauclerc, a wet October night. The wall
// of the kitchen goes up out of frame, its windows lit and streaming; bins,
// the day's crates, a bulb over the back door. Marguerite smokes under it,
// which is why she is here: it is the only two minutes she will get tonight.
import { grid } from '../../gambler/rooms/grid.js';

const g = grid(32, 20);
g.fill(0, 16, 31, 19);
g.fill(0, 0, 1, 15);
g.fill(30, 0, 31, 15);

export default {
  id: 'yard',
  origin: { tx: 0, ty: 0 },
  grid: g.rows(),
  material: 'wet_setts',
  regions: [
    { rect: [0, 0, 1, 15], material: 'yard_wall' },
    { rect: [30, 0, 31, 15], material: 'yard_wall' },
  ],
  decor: [],
  props: [
    { prop: 'hotel_wall', x: 16, y: 16, layer: 'back' },
    { prop: 'yard_crates', x: 7, y: 16, layer: 'back' },
    { prop: 'milk_churn', x: 11, y: 16 },
    { prop: 'yard_bins', x: 16, y: 16, layer: 'back' },
    { prop: 'yard_crates', x: 28, y: 16, flip: true, layer: 'back' },
    { prop: 'back_door', x: 24, y: 16, layer: 'back' },
  ],
  lights: [{ x: 24, y: 11, r: 110, color: 0xffd080 }],
  backdrop: { set: 'orvain_night', horizon: 16 },
  light: { tint: 0xd8d8ec },
  ambience: 'fs_yard',
  acoustics: 'open',
  events: 'chef_street',
  music: { state: 'quiet', key: 'yard', wall: 900 },
  objective: [{ text: 'door' }, { text: 'to_pit', flag: 'met_m' }],
  titleCard: 'THE SERVICE YARD',
  entities: [
    { type: 'spawn', id: 'start', x: 4, y: 15 },
    { type: 'checkpoint', id: 'cp_yard', label: 'THE SERVICE YARD', x: 5, y: 15 },
    { type: 'sign', text: 'LE RÊVE', x: 24, y: 6, board: 0x2a1c16, ink: 0xf2d580, scale: 2 },
    { type: 'sign', text: 'DELIVERIES', x: 24, y: 9, board: 0x1e1c26, ink: 0xe8e4d8, scale: 2 },
    { type: 'npc', id: 'marguerite', cast: 'npc-rv-marguerite', x: 21, y: 15, facing: -1, talk: [{ conv: 'door' }] },
    { type: 'portal', id: 'yard>pit', kind: 'door', x: 24, y: 15, to: { room: 'pit', portal: 'pit>yard' }, door: { prompt: 'go in', fade: 260, requires: ['met_m'], locked: 'talk to her first', lockedLine: 'A woman is standing in the way, finishing a cigarette.' } },
    { type: 'coin', id: 'c_y1', x: 14, y: 12 },
    { type: 'coin', id: 'c_y2', x: 28, y: 12 },
  ],
};
