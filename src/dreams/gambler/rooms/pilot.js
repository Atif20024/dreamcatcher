// THE PILOT HOUSE: glass on three sides and the river going grey and rose
// through it, the great wheel half down through the floor, the pilot
// reading the water. Judge Voe has a private table by the forward glass and
// slides the deck across: "One more, Jo. The Queen docks in an hour." Two
// cards face up each, the same two. The table is warm and bright. The only
// unlit word under it is STAND UP, and it is the only way out of the room.
// There is no orb here: the dream is caught on the gangway, or not at all.
import { grid } from './grid.js';

const g = grid(32, 14);
g.fill(0, 0, 31, 3);
g.fill(0, 12, 31, 13);
g.fill(0, 4, 1, 11);
g.fill(30, 4, 31, 11);

export const LAST_TABLE_X = 13;

export default {
  id: 'pilot',
  origin: { tx: 80, ty: 80 },
  grid: g.rows(),
  material: 'main_deck',
  regions: [
    { rect: [0, 0, 31, 3], material: 'ceiling_white' },
    { rect: [0, 4, 1, 11], material: 'hull_white' },
    { rect: [30, 4, 31, 11], material: 'hull_white' },
  ],
  decor: [],
  props: [
    { prop: 'dawn_windows', x: 2, y: 7, dx: -16, layer: 'back' },
    { prop: 'cabin_door_white', x: 3, y: 12, layer: 'back' },
    { prop: 'cabin_door_white', x: 28, y: 12, layer: 'back' },
    { prop: 'last_table', x: LAST_TABLE_X, y: 12 },
    { prop: 'saloon_chair', x: LAST_TABLE_X - 2, y: 12 },
    { prop: 'saloon_chair', x: LAST_TABLE_X + 2, y: 12, dx: 6, flip: true },
    { prop: 'pilot_wheel', x: 22, y: 12 },
  ],
  lights: [],
  enclosure: { backWall: 'plaster', wainscot: true, posts: 0, ceiling: true, pillars: false, frames: [{ x: 2, y: 9, w: 2, h: 3 }, { x: 27, y: 9, w: 2, h: 3 }], palette: { wall: 0xd8d0bc, wood: 0x6a4a2e, accent: 0xc8a050, deep: 0x2a2630, lit: 0xfff0d8 } },
  light: { tint: 0xf8ece4 },
  lit: true,
  backdrop: null,
  ambience: 'gm_pilot',
  acoustics: 'room',
  music: { state: 'quiet', key: 'pilot' },
  objective: [
    { text: 'last' },
    { text: 'landing', flag: 'stood_up' },
  ],
  titleCard: 'THE PILOT HOUSE',
  entities: [
    { type: 'portal', id: 'pilot>deck', kind: 'door', x: 3, y: 11, to: { room: 'deck', portal: 'deck>pilot' }, door: { prompt: 'out on the roof', fade: 220 } },
    { type: 'checkpoint', id: 'cp_pilot', label: 'THE PILOT HOUSE', x: 6, y: 11 },
    { type: 'npc', id: 'voe_last', cast: 'npc-lq-voe', x: LAST_TABLE_X + 2, y: 11, pose: 'sit', facing: -1, talk: [{ conv: 'voe_stood', if: 'stood_up' }, { conv: 'voe_last' }] },
    { type: 'npc', id: 'pilot', cast: 'npc-lq-pilot', x: 24, y: 11, facing: 1, turns: false, talk: [{ conv: 'pilot' }] },
    { type: 'npc', id: 'lou_pilot', cast: 'npc-lq-lou', x: 8, y: 11, facing: 1, follow: [5, 20], unless: 'stood_up', talk: [{ conv: 'lou_pilot' }] },
    { type: 'encounter', id: 'lasthand', x: LAST_TABLE_X - 2, y: 11, anchor: { x: LAST_TABLE_X + 1, y: 8 }, prompt: 'sit down with the Judge', unless: 'stood_up' },
    { type: 'portal', id: 'pilot>landing', kind: 'door', x: 28, y: 11, to: { room: 'landing', portal: 'landing<pilot' }, door: { prompt: 'down to the gangway', fade: 400, requires: ['stood_up'], locked: 'the Judge is dealing', lockedLine: 'Not with the cards still out on the table.' } },
  ],
};
