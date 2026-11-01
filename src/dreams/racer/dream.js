// THE LONG STRAIGHT (working title): the racer's dream on platform 10, Ottavia
// Castellane's, the Calvessa Coast in spring 1958. docs/dream_racer.md is the
// design, but the driving is a scene of its own (src/scenes/RaceScene.js), not an
// encounter. Stage 1: one garage and one test road, no ending yet, so data/dreams.js
// marks it `unfinished` and the station does not count it.
// Dev: ?warp=racer:garage
import garage from './rooms/garage.js';
import garageVerb from './verbs/garage.js';
import props from './props.js';

export default {
  id: 'racer',
  title: 'THE LONG STRAIGHT',
  hudName: 'THE LONG STRAIGHT',
  enabled: true,
  hubListed: true,
  profile: { failure: 'default', hud: 'default', camera: { zoom: 1 } },
  rooms: [garage],
  start: { room: 'garage', spawn: 'start' },
  tool: null,
  verbs: [garageVerb],
  beats: {},
  calls: {},
  cast: { ottavia: { name: 'Ottavia', short: 'O', color: '#7ec8c8' } },
  conversations: {},
  barks: [],
  encounters: {},
  items: {},
  objectives: {
    drive: 'the Heron is at the shutter: take her out on the road',
    raced: 'she sang. The season is still being written: back to the station',
  },
  materials: {},
  decorRules: {},
  props,
  palette: {},
  backdrops: {},
  music: {},
  ambientLoop: 'gm_office',
};
