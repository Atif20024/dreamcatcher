// VIA DEI PITTORI: the street of the workshops. Arched shop mouths with
// their shutters folded open, pentice roofs over them, linen on the lines,
// terracotta roofs, the campanile over the roofs and the hills beyond; a
// cypress where the street ends at the gate to the square. The Dori
// workshop's apprentices own the middle of the street. The pentices and
// balconies are the high road (it pays). The guild's chain across the gate
// drops for a master's assistant.
import { grid } from './grid.js';

const g = grid(70, 20);
g.fill(0, 16, 69, 19); // the street
g.put(2, 11, '=======');  // the bottega's pentice
g.put(9, 13, '==='); // barrels by its door, a step up
g.put(26, 11, '=======');  // the Dori workshop's pentice
g.put(23, 13, '==='); // their stacked barrels
g.put(40, 11, '=======');  // the colour-seller's pentice
g.put(37, 13, '==='); // more barrels by the colour-seller
g.put(19, 8, '====='); // a balcony over the street (the line-walker's reward)

export default {
  id: 'via',
  origin: { tx: 0, ty: 0 },
  grid: g.rows(),
  material: 'via_cobble',
  regions: [
    { rect: [0, 8, 69, 13], material: 'oak_floor' },
  ],
  decor: [],
  props: [
    { prop: 'bottega_front', x: 6, y: 16, layer: 'back' },
    { prop: 'via_house', x: 18, y: 16, layer: 'back', palette: { wall: 0xe8d4a8, shutter: 0x5a6a7a, seed: 22 } },
    { prop: 'dori_front', x: 30, y: 16, layer: 'back' },
    { prop: 'speziale_front', x: 44, y: 16, dx: -10, layer: 'back' },
    { prop: 'via_house', x: 56, y: 16, dx: -14, layer: 'back', palette: { wall: 0xc89a70, shutter: 0x4a6a4a, seed: 24 } },
    { prop: 'washing_line', x: 12, y: 5, layer: 'back' },
    { prop: 'washing_line', x: 50, y: 6, layer: 'back' },
    { prop: 'pentice', x: 2, y: 12, dx: -16, dy: 21 },
    { prop: 'pentice', x: 26, y: 12, dx: -16, dy: 21 },
    { prop: 'pentice', x: 40, y: 12, dx: -16, dy: 21 },
    { prop: 'pentice', x: 19, y: 9, dx: -16, dy: 6, scale: 0.72 },
    { prop: 'well', x: 52, y: 16 },
    { prop: 'handcart', x: 34, y: 16 },
    // barrels stacked two high: the steps up to the pentices
    { prop: 'barrel_stack', x: 9, y: 16, dx: -16 },
    { prop: 'barrel_stack', x: 23, y: 16, dx: -16 },
    { prop: 'barrel_stack', x: 37, y: 16, dx: -16 },
    { prop: 'cypress', x: 61, y: 16, layer: 'back' },
    { prop: 'city_arch', x: 67, y: 16 },
  ],
  enclosure: { fgFoliage: [], frames: [] },
  light: { tint: 0xfff6e8 },
  backdrop: { set: 'fioralba_via', horizon: 16 },
  ambience: 'rn_street',
  acoustics: 'open',
  music: { state: 'explore', bpm: 100, key: 'street' },
  objective: [
    { text: 'fetch_lapis' },
    { text: 'back_bottega', flag: 'lapis' },
    { text: 'to_guild', flag: 'assistant' },
    { text: 'to_palazzo', flag: 'guild_master' },
  ],
  titleCard: 'VIA DEI PITTORI',
  entities: [
    { type: 'portal', id: 'via>bottega', kind: 'door', x: 9, y: 15, to: { room: 'bottega', portal: 'bottega>via' }, door: { prompt: 'into the bottega', fade: 260 } },
    { type: 'checkpoint', id: 'cp_via', label: 'VIA DEI PITTORI', x: 13, y: 15 },
    { type: 'portal', id: 'via>speziale', kind: 'door', x: 47, y: 15, to: { room: 'speziale', portal: 'speziale>via' }, door: { prompt: 'into the colour-seller', fade: 260 } },
    { type: 'npc', id: 'woman_via', cast: 'npc-rn-woman', x: 54, y: 15, facing: -1, talk: [{ conv: 'woman' }] },
    // the Dori workshop's apprentices: green caps, they throw strangers out
    { type: 'foe', kind: 'rival', x: 24, y: 15, patrol: [19, 35] },
    { type: 'foe', kind: 'rival', x: 33, y: 10, patrol: [27, 32] },
    // the guild's chain across the gate to the square
    { type: 'gate', id: 'g_chain', x: 64, y: 10, h: 6, requires: ['assistant'], hint: "THE GUILD'S CHAIN: MASTERS' MEN ONLY" },
    { type: 'portal', id: 'via>piazza', kind: 'seam', x: 69, y: 15, to: { room: 'piazza', portal: 'piazza<via' }, seam: { prop: 'city_arch', width: 240 } },
    // giglio coins: a breadcrumb by the colour-seller; the high road over
    // the pentices, the balcony, and an arc over the rivals' barrels
    { type: 'coin', id: 'c_door', x: 45, y: 14 },
    { type: 'coins', id: 'c_pent1', x: 2, y: 9, n: 5 },
    { type: 'coins', id: 'c_balc', x: 19, y: 6, n: 4 },
    { type: 'coins', id: 'c_pent2', x: 26, y: 9, n: 6 },
    { type: 'coins', id: 'c_pent3', x: 40, y: 9, n: 5 },
    { type: 'coins', id: 'c_well', x: 51, y: 12, n: 3 },
  ],
};
