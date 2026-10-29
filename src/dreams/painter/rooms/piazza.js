// THE PIAZZA: through the gate the city opens up. The guild hall with the
// arms of the arts, a market stall, the loggia (its tiled roof is the high
// road), the fountain and an antique torso dug from the old forum, Palazzo
// Bardelli, the marble front of the church of the new chapel, and over all
// of it the cathedral's dome, half built in its timber centering, with the
// campanile beside it. The guild's inspectors walk the square. Three doors:
// the guild hall (open), the palazzo (a guild seal), the chapel (the
// commission and the gold).
import { grid } from './grid.js';

const g = grid(96, 20);
g.fill(0, 16, 95, 19); // the square's paving
g.put(22, 12, '=====');  // the market stall's awning (x 22–26)
g.put(27, 9, '============');  // the loggia's roof (x 27–38)
g.put(42, 15, '====='); // the fountain's rim (x 42–46)
g.put(90, 14, '===');  // the handcart's load by the masons' stage
g.put(92, 10, '====');  // the masons' stage at the church's corner

export default {
  id: 'piazza',
  origin: { tx: 70, ty: 0 },
  grid: g.rows(),
  material: 'piazza_stone',
  regions: [{ rect: [0, 8, 95, 15], material: 'oak_floor' }],
  decor: [],
  props: [
    { prop: 'guild_front', x: 13, y: 16, layer: 'back' },
    { prop: 'market_stall', x: 24, y: 16, dy: -2 },
    { prop: 'loggia', x: 27, y: 16, dx: -16, dy: 9, layer: 'back' },
    { prop: 'torso_plinth', x: 40, y: 16 },
    { prop: 'fountain', x: 44, y: 16 },
    { prop: 'palazzo_front', x: 58, y: 16, layer: 'back' },
    { prop: 'church_front', x: 82, y: 16, layer: 'back' },
    { prop: 'pentice', x: 92, y: 11, dx: -16, dy: 0, scale: 0.6 },
    { prop: 'handcart', x: 91, y: 16 },
  ],
  enclosure: { fgFoliage: [], frames: [] },
  light: { tint: 0xfff6e8 },
  backdrop: { set: 'fioralba_piazza', horizon: 16 },
  ambience: 'rn_piazza',
  acoustics: 'open',
  music: { state: 'explore', bpm: 90, key: 'piazza' },
  objective: [
    { text: 'to_guild' },
    { text: 'to_palazzo', flag: 'guild_master' },
    { text: 'get_gold', flag: 'commission' },
    { text: 'to_chapel', flag: 'gold_leaf' },
  ],
  titleCard: 'THE PIAZZA',
  entities: [
    { type: 'portal', id: 'piazza<via', kind: 'seam', x: 0, y: 15, to: { room: 'via', portal: 'via>piazza' }, seam: { prop: 'city_arch', width: 240 } },
    { type: 'checkpoint', id: 'cp_piazza', label: 'THE PIAZZA', x: 4, y: 15 },
    { type: 'portal', id: 'piazza>guild', kind: 'door', x: 13, y: 15, to: { room: 'guild', portal: 'guild>piazza' }, door: { prompt: 'into the guild hall', fade: 260 } },
    { type: 'portal', id: 'piazza>palazzo', kind: 'door', x: 58, y: 15, to: { room: 'palazzo', portal: 'palazzo>piazza' }, door: { prompt: 'into Palazzo Bardelli', fade: 260, requires: ['seal'], locked: 'the palazzo receives masters', lockedLine: 'The doorkeeper looks at my hands. No seal, no door.' } },
    { type: 'portal', id: 'piazza>chapel', kind: 'door', x: 82, y: 15, to: { room: 'chapel', portal: 'chapel>piazza' }, door: { prompt: 'into the new chapel', fade: 300, requires: ['commission', 'gold_leaf'], locked: 'the chapel is shut', lockedLine: 'The new chapel. Not mine to enter: not yet.' } },
    { type: 'npc', id: 'woman_piazza', cast: 'npc-rn-woman', x: 50, y: 15, facing: -1, talk: [{ conv: 'woman_square' }] },
    { type: 'npc', id: 'friar', cast: 'npc-rn-friar', x: 69, y: 15, facing: 1, talk: [{ conv: 'friar' }] },
    { type: 'npc', id: 'beggar', cast: 'npc-rn-beggar', x: 76, y: 15, facing: 1, talk: [{ conv: 'beggar' }] },
    // the guild's inspectors: scarlet robes, hands behind their backs
    { type: 'foe', kind: 'inspector', x: 34, y: 15, patrol: [28, 39] },
    { type: 'foe', kind: 'inspector', x: 64, y: 15, patrol: [60, 72] },
    // three studies for [Q] (silverpoint): the torso, the beggar's hands, the dome's centering
    { type: 'resonant', id: 'study_torso', x: 40, y: 13, r: 90, set: 'study_torso', beat: 'study_torso' },
    { type: 'resonant', id: 'study_hands', x: 76, y: 14, r: 80, set: 'study_hands', beat: 'study_hands' },
    { type: 'resonant', id: 'study_dome', x: 94, y: 8, r: 90, set: 'study_dome', beat: 'study_dome' },
    // giglio coins: the awning and the loggia roof, an arc over the
    // fountain, the masons' stage
    { type: 'coin', id: 'c_gate', x: 6, y: 13 },
    { type: 'coins', id: 'c_awning', x: 22, y: 10, n: 3 },
    { type: 'coins', id: 'c_loggia', x: 28, y: 7, n: 8 },
    { type: 'coins', id: 'c_fountain', x: 42, y: 11, n: 5 },
    { type: 'coins', id: 'c_masons', x: 92, y: 8, n: 3 },
  ],
};
