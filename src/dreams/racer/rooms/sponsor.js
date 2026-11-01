// THE SPONSOR'S TABLE: Sable Oil's office over the cafe. Green leather, brass, cigar
// haze. Three papers on the desk: read, strike one clause, or initial it whole. What
// is left standing pays on signature and binds later (season.js PAPERS).
import { grid } from '../../painter/rooms/grid.js';
import { SEASON_GOALS } from '../season.js';

const g = grid(28, 14);
g.fill(0, 0, 27, 1);
g.fill(0, 12, 27, 13);
g.fill(0, 2, 1, 11);
g.fill(26, 2, 27, 11);
// on the filing cabinets, for a nosy man
g.put(22, 8, '====');

export const PAPER_COLS = [11, 14, 17];

export default {
  id: 'sponsor',
  origin: { tx: 160, ty: 0 },
  grid: g.rows(),
  material: 'sable_floor',
  regions: [
    { rect: [0, 0, 27, 1], material: 'sable_wall' },
    { rect: [0, 2, 1, 11], material: 'sable_wall' },
    { rect: [26, 2, 27, 11], material: 'sable_wall' },
  ],
  decor: [],
  props: [
    { prop: 'door_wood', x: 3, y: 12, layer: 'back' },
    { prop: 'sable_poster', x: 8, y: 8, layer: 'back' },
    { prop: 'sable_chair', x: 19, y: 12, layer: 'back' },
    { prop: 'sable_desk', x: 14, y: 12, layer: 'back' },
    { prop: 'brass_lamp', x: 18, y: 10, dy: 2, layer: 'back' },
    { prop: 'filing_cabinet', x: 23, y: 12, layer: 'back' },
    { prop: 'filing_cabinet', x: 25, y: 12, layer: 'back' },
    ...PAPER_COLS.map((x, i) => ({ prop: 'contract', x, y: 10, dy: 4, unless: `paper_done_${i}`, live: true })),
  ],
  lights: [{ x: 18, y: 8, r: 150, color: 0xf2c078 }],
  enclosure: { backWall: 'panelled', wainscot: true, posts: 5, ceiling: true, pillars: false, frames: [], palette: { wall: 0x2e4a3a, wood: 0x4a3020, accent: 0xc8a050, deep: 0x121e18, lit: 0xf2c078 } },
  light: { tint: 0xe8d8b8 },
  backdrop: null,
  ambience: 'gm_office',
  acoustics: 'room',
  events: null,
  music: { state: 'quiet', key: 'sable' },
  objective: [{ text: 'sign' }, { text: 'drive', flag: 'signed' }],
  titleCard: "THE SPONSOR'S TABLE",
  goal: 'sign the sponsor: read the paper',
  entities: [
    { type: 'portal', id: 'sponsor>quay', kind: 'door', x: 3, y: 11, to: { room: 'quay', portal: 'quay>sponsor' }, door: { prompt: 'down to the quay', fade: 240 } },
    { type: 'checkpoint', id: 'cp_sponsor', label: "THE SPONSOR'S TABLE", x: 6, y: 11 },
    { type: 'npc', id: 'sable', cast: 'npc-pv-sable', x: 21, y: 11, facing: -1, pace: [20, 22], talk: [{ conv: 'sable_read', if: 'met_sable' }, { conv: 'sable_first' }] },
    { type: 'coins', id: 'c_s1', x: 22, y: 7, n: 4, dx: 1 },
  ],
};
