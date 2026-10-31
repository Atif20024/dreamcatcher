// THE LANDING: the gangway at Port Merrow at dawn, the first real daylight
// of the night. The wheel slows and stops; water, birds, nothing else; no
// music. Lou is at the rail. He says the line he never said. Further along
// the quay, the night's cash, one small gold coin, is the orb.
import { grid } from './grid.js';

const g = grid(40, 20);
g.fill(0, 16, 39, 19);

export default {
  id: 'landing',
  origin: { tx: 160, ty: 0 },
  grid: g.rows(),
  material: 'quay_granite',
  regions: [],
  decor: [],
  props: [
    { prop: 'lq_boat', x: 0, y: 16, dx: -820, layer: 'back' },
    { prop: 'cabin_door_white', x: 3, y: 16, layer: 'back' },
    { prop: 'gangway', x: 6, y: 16 },
    { prop: 'wharf_office', x: 32, y: 16, layer: 'back' },
    { prop: 'bollard', x: 12, y: 16 },
    { prop: 'bales', x: 24, y: 16, layer: 'back' },
  ],
  enclosure: { fgFoliage: [], frames: [] },
  light: { tint: 0xfff4ec },
  lit: true,
  backdrop: { set: 'merrow_dawn', horizon: 16 },
  ambience: 'gm_dawn',
  acoustics: 'open',
  music: { state: 'silent', key: 'landing' },
  objective: [
    { text: 'gangway' },
    { text: 'cash', flag: 'heard_lou' },
  ],
  titleCard: 'THE LANDING',
  entities: [
    { type: 'portal', id: 'landing<pilot', kind: 'door', x: 3, y: 15, to: { room: 'pilot', portal: 'pilot>landing' }, door: { prompt: 'back aboard', fade: 300 } },
    { type: 'checkpoint', id: 'cp_landing', label: 'THE LANDING', x: 9, y: 15 },
    { type: 'sign', text: 'PORT MERROW WHARF', x: 32, y: 11, board: 0x2a2420 },
    { type: 'npc', id: 'lou_end', cast: 'npc-lq-lou', x: 17, y: 15, facing: -1, talk: [{ conv: 'lou_end_after', if: 'heard_lou' }, { conv: 'lou_end' }] },
    // the night's cash: one small gold coin, not gold-plated glory
    { type: 'orb', id: 'orb', x: 28, y: 13, tint: 0xf2c060, when: 'heard_lou' },
  ],
};
