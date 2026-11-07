// THE BIG STAGE: the stage door opens on light. A festival stage on a roof
// over the city: PA wings, a lighting truss throwing colour down onto the
// deck, eight thousand heads below its lip. Nia is on bass if Jo kept her;
// Marcus on drums if he stayed. The set is played here, in the room. When
// it ends the lights cut to work lights, the crowd is gone, the crew starts
// striking, and the gate to the far wing opens on a folding chair with Jo's
// case on it, and the dream over it.
import { grid } from './grid.js';

const g = grid(70, 21);
g.fill(0, 16, 69, 20); // the deck (and the structure under it)
g.fill(0, 0, 0, 15); // the stage-left wing wall
g.fill(69, 0, 69, 15); // the far wing wall

export default {
  id: 'stage',
  origin: { tx: 200, ty: 0 },
  grid: g.rows(),
  material: 'stage_deck',
  decor: [],
  props: [
    { prop: 'banner', x: 30, y: 2, layer: 'back' },
    { prop: 'speaker_stack', x: 9, y: 16, layer: 'back' },
    { prop: 'speaker_stack', x: 50, y: 16, layer: 'back' },
    { prop: 'truss_tower', x: 12, y: 16, layer: 'back' },
    { prop: 'truss_tower', x: 47, y: 16, layer: 'back' },
    { prop: 'drum_riser', x: 36, y: 16, dx: -16 },
    { prop: 'drum_kit', x: 37, y: 16 },
    { prop: 'amp', x: 22, y: 16 },
    { prop: 'amp', x: 40, y: 16 },
    { prop: 'monitor_wedge', x: 27, y: 16 },
    { prop: 'monitor_wedge', x: 31, y: 16 },
    { prop: 'mic_stand', x: 29, y: 16 },
    { prop: 'stage_lights_on', x: 12, y: 3, unless: 'set_done', live: true },
    { prop: 'work_lights', x: 12, y: 3, when: 'set_done', live: true },
    { prop: 'light_truss', x: 12, y: 2, layer: 'fg' },
    { prop: 'crowd_front', x: 4, y: 19, layer: 'fg', unless: 'set_done', live: true },
    { prop: 'crowd_front', x: 34, y: 19, layer: 'fg', unless: 'set_done', live: true },
    { prop: 'road_case', x: 57, y: 16 },
    { prop: 'road_case', x: 58, y: 16, dx: 24 },
    { prop: 'folding_chair', x: 63, y: 16 },
  ],
  lights: [{ x: 29, y: 10, r: 160, color: 0xf2d0ff }],
  enclosure: { fgFoliage: [] },
  light: { tint: 0xf0e8ff },
  backdrop: { set: 'festival', horizon: 16 },
  ambience: 'festival',
  acoustics: 'hall',
  events: 'arena',
  music: { state: 'setpiece', bpm: 120, key: 'stage' },
  objective: [
    { text: 'play_set' },
    { text: 'after', flag: 'set_done' },
  ],
  titleCard: 'THE BIG STAGE',
  entities: [
    { type: 'portal', id: 'stage<escape', kind: 'door', x: 3, y: 15, to: { room: 'escape', portal: 'escape>stage' }, door: { prompt: 'back down the stairs', fade: 400 } },
    { type: 'checkpoint', id: 'cp_wing', label: 'THE WING', x: 6, y: 15 },
    { type: 'npc', id: 'nia_set', cast: 'npc-nia', x: 24, y: 15, facing: 1, when: 'choice_nia', unless: 'set_done', talk: [{ conv: 'nia_wing' }] },
    { type: 'npc', id: 'session', cast: 'npc-scalper', x: 24, y: 15, facing: 1, turns: false, when: 'choice_tally', unless: 'set_done', talk: [{ conv: 'session_bass' }] },
    { type: 'npc', id: 'marcus_set', cast: 'npc-marcus', x: 35, y: 15, facing: -1, turns: false, when: 'marcus_stays', unless: 'set_done', talk: [{ conv: 'marcus_drums' }] },
    { type: 'npc', id: 'session_drums', cast: 'npc-roadie', x: 35, y: 15, facing: -1, turns: false, unless: 'marcus_stays', talk: [{ conv: 'session_drums' }] },
    { type: 'encounter', id: 'big_set', x: 29, y: 15, anchor: { x: 29, y: 8 }, prompt: 'play the set', unless: 'set_played' },
    { type: 'gate', id: 'g_after', x: 53, y: 10, h: 6, requires: ['set_done'], hint: 'AFTER THE SET' },
    // after: the crew, the chair, the dream
    { type: 'npc', id: 'stagehand', cast: 'npc-roadie', x: 45, y: 15, facing: -1, when: 'set_done', talk: [{ conv: 'stagehand' }] },
    { type: 'npc', id: 'stagehand2', cast: 'foe-roadie', x: 56, y: 15, facing: 1, when: 'set_done', talk: [{ conv: 'stagehand2' }] },
    { type: 'npc', id: 'nia_after', cast: 'npc-nia', x: 61, y: 15, facing: 1, when: 'nia_after', talk: [{ conv: 'nia_coffee' }] },
    { type: 'orb', id: 'orb', x: 63, y: 13, when: 'set_done' },
    // coins: the truss is the only high thing; the speaker tops pay for it
    { type: 'coins', id: 'c_wing', x: 7, y: 13, n: 3 },
    { type: 'coins', id: 'c_riser', x: 34, y: 12, n: 4 },
    { type: 'coins', id: 'c_far', x: 56, y: 13, n: 6 },
  ],
};
