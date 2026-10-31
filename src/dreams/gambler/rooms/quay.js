// THE QUAY, PORT MERROW: dusk and river fog on the granite, gas lamps coming
// on, cotton bales and crates for the morning, the wharf office with its
// window lit. Alongside lies the Lantern Queen, white and lamplit, her
// chimneys black against the last of the sky; the band can be heard through
// her walls. At the head of the gangway the purser's clerk keeps a chalk
// slate: before the first card Jo chalks his line on it (buy-in, stop-loss,
// goal). Then the saloon door on the main deck opens to him.
// A bust anywhere aboard brings Jo back here, Lou's bar reset.
import { grid } from './grid.js';

const g = grid(78, 20);
g.fill(0, 16, 77, 19); // the quay, then the main deck
g.put(9, 14, '=====');  // the cotton bales, two high
g.put(14, 14, '===');  // the crates beside them
g.put(42, 14, '====='); // bales stowed on the main deck

export default {
  id: 'quay',
  origin: { tx: 0, ty: 0 },
  grid: g.rows(),
  material: 'quay_granite',
  regions: [
    { rect: [35, 16, 77, 16], material: 'main_deck' },
    { rect: [35, 17, 77, 19], material: 'hull_white' },
    { rect: [9, 14, 16, 14], material: 'main_deck' },
    { rect: [42, 14, 46, 14], material: 'main_deck' },
  ],
  decor: [],
  props: [
    { prop: 'lq_boat', x: 34, y: 16, layer: 'back' },
    { prop: 'wharf_office', x: 23, y: 16, layer: 'back' },
    { prop: 'gas_lamp', x: 4, y: 16, layer: 'back' },
    { prop: 'gas_lamp', x: 18, y: 16, layer: 'back' },
    { prop: 'gas_lamp', x: 31, y: 16, layer: 'back' },
    { prop: 'bollard', x: 7, y: 16 },
    { prop: 'bollard', x: 32, y: 16, dx: 14 },
    { prop: 'bales', x: 11, y: 16 },
    { prop: 'crates', x: 15, y: 16 },
    { prop: 'bales', x: 44, y: 16 },
    { prop: 'slate_easel', x: 29, y: 16 },
    { prop: 'gangway', x: 35, y: 16 },
    { prop: 'cabin_door_white', x: 70, y: 16 },
    { prop: 'rope_coil', x: 52, y: 16 },
  ],
  lights: [{ x: 29, y: 13, r: 90, color: 0xffd890 }],
  enclosure: { fgFoliage: [], frames: [] },
  light: { tint: 0xf0e4e8 },
  backdrop: { set: 'merrow_dusk', horizon: 16 },
  ambience: 'gm_quay',
  acoustics: 'open',
  // the band aboard, heard through the boat's walls
  music: { state: 'quiet', key: 'quay', wall: 900 },
  objective: [
    { text: 'meet_lou' },
    { text: 'slate', flag: 'met_lou' },
    { text: 'board', flag: 'slate_set' },
  ],
  titleCard: 'PORT MERROW',
  entities: [
    { type: 'spawn', id: 'start', x: 3, y: 15 },
    { type: 'checkpoint', id: 'cp_quay', label: 'PORT MERROW', x: 6, y: 15 },
    { type: 'sign', text: 'PORT MERROW WHARF', x: 23, y: 11, board: 0x2a2420 },
    { type: 'sign', text: 'LANTERN QUEEN', x: 63, y: 4, board: 0x5a1e26, ink: 0xf2d580, scale: 2 },
    { type: 'sign', text: 'SALOON', x: 70, y: 11, board: 0x3a2418, scale: 1 },
    { type: 'sign', text: 'THE SLATE', x: 29, y: 10, board: 0x2a3030, ink: 0xe8e8e0, scale: 1 },
    { type: 'npc', id: 'porter', cast: 'npc-lq-porter', x: 20, y: 15, facing: 1, pace: [17, 27], talk: [{ conv: 'porter' }] },
    { type: 'npc', id: 'lou_quay', cast: 'npc-lq-lou', x: 26, y: 15, facing: 1, talk: [{ conv: 'lou_after_slate', if: 'slate_set' }, { conv: 'lou_quay_wait', if: 'met_lou' }, { conv: 'lou_quay' }] },
    { type: 'npc', id: 'clerk', cast: 'npc-lq-clerk', x: 31, y: 15, facing: -1, talk: [{ conv: 'clerk' }] },
    { type: 'npc', id: 'lady', cast: 'npc-lq-lady', x: 38, y: 15, facing: 1, talk: [{ conv: 'lady' }] },
    { type: 'npc', id: 'dev', cast: 'npc-lq-dev', x: 50, y: 15, facing: -1, pace: [48, 62], talk: [{ conv: 'dev_quay' }] },
    { type: 'encounter', id: 'slate', x: 29, y: 15, anchor: { x: 29, y: 12 }, prompt: 'chalk the slate', when: 'met_lou', unless: 'slate_set' },
    { type: 'portal', id: 'quay>saloon', kind: 'door', x: 70, y: 15, to: { room: 'saloon', portal: 'saloon>quay' }, door: { prompt: 'into the saloon', fade: 260, requires: ['slate_set'], locked: 'the slate first', lockedLine: 'Lou said to chalk my line on the slate before I go aboard.' } },
    // half dimes: up the bales and the crates (and back down the deck's)
    { type: 'coins', id: 'c_bales', x: 9, y: 12, n: 5 },
    { type: 'coins', id: 'c_crates', x: 14, y: 12, n: 3 },
    { type: 'coins', id: 'c_deck', x: 42, y: 12, n: 4 },
    { type: 'coin', id: 'c_door', x: 68, y: 14 },
  ],
};
