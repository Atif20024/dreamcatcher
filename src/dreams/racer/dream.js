// THE LONG STRAIGHT (working title): the racer's dream on platform 10, Ottavia
// Castellane's, the Calvessa Coast in spring 1958. docs/dream_racer.md is the
// design, but the driving is a scene of its own (src/scenes/RaceScene.js), not an
// encounter. Stage 2: the coast, the walk-in places and their story, in order:
//   THE PEREVAL GARAGE      TUNE at the bench; the Heron; what nuts buy. Home base
//   THE QUAY                the street, a door to every place, each says what opens it
//   THE CORRIDOR            his gloves on the chair (after the Harbour Night Cup)
//   THE CASTELLANE KITCHEN  SPLIT the tin
//   THE SPONSOR'S TABLE     READ the papers, strike a clause
//   THE NIGHT BEFORE        CHALK the Gull Bend on foot
//   THE PIT LANE            the crew drills the stop
// The six races wait for the owner's first drive: season.js HOOKS are their places
// in the story, every one a stand-in on the test road. No ending yet, so data/dreams.js
// marks it `unfinished` and the station does not count it.
// Dev: ?warp=racer:garage | :quay | :hospital | :kitchen | :sponsor | :nightbefore | :pitlane
import garage from './rooms/garage.js';
import quay from './rooms/quay.js';
import sponsor from './rooms/sponsor.js';
import hospital from './rooms/hospital.js';
import kitchen from './rooms/kitchen.js';
import nightbefore from './rooms/nightbefore.js';
import pitlane from './rooms/pitlane.js';
import garageVerb, { buy } from './verbs/garage.js';
import places from './verbs/places.js';
import { tuneWorld } from './verbs/tunePresenter.js';
import props from './props.js';
import materials from './materials.js';
import beats from './beats.js';
import { CAST, CONVERSATIONS, BARKS } from './dialogue.js';
import { MUSIC_KEYS } from './music.js';
import { COAST } from './race/themes.js';
import { tune } from '../../engines/tune.js';
import { escapement } from '../../engines/escapement.js';
import { escapementWorld } from '../clockmaker/presenter.js';

const NIGHT_SKY = { top: 0x0e1030, mid: 0x1e2248, bottom: 0x3e3e62, stars: 90, clouds: 3, cloud: 0x2a2a50, cloudLit: 0x4a4a70, seed: 41 };
const NIGHT_LAND = { ...COAST.land, sky: 0x2a2c50, hill: 0x2c2e4c, house: 0x2e2e48, roof: 0x24243a, window: 0xffc870, light: 0x8a8ab0, rim: 0x8a8ab0, deep: 0x0e0e1c, leaf: 0x1c2a30, trunk: 0x161422, sea: 0x20305a, mist: 0x3a3e68, mistA: 0.24 };

const CALLS = ['Wheel!', 'Wheel!', 'Fuel!', 'Flag!'];

export default {
  id: 'racer',
  title: 'THE LONG STRAIGHT',
  hudName: 'THE LONG STRAIGHT',
  enabled: true,
  hubListed: true,
  markMet: true,
  profile: { failure: 'default', hud: 'default', camera: { zoom: 1 } },
  rooms: [garage, quay, sponsor, hospital, kitchen, nightbefore, pitlane],
  start: { room: 'garage', spawn: 'start' },
  tool: null,
  verbs: [garageVerb, places],
  beats,
  calls: { buy: (scene, fx) => buy(scene, fx) },
  cast: CAST,
  conversations: CONVERSATIONS,
  barks: BARKS,
  encounters: {
    // TUNE: hold [E], the jet turns, let go when the beat stops (the fumes show it too)
    tune: {
      id: 'tune',
      title: 'THE JET',
      engine: tune,
      params: {},
      presenter: 'world',
      view: 'tune',
      keys: ['act1'],
      camera: { zoom: 1.3 },
      hint: 'hold [E] to turn the jet; let go when the fumes lie still',
      pose: 'interact',
      onWin: 'tuned',
      onFail: 'tune_left',
    },
    // the drill: the clockmaker's bob, Ottavia's call, three seconds a miss
    pitstop: {
      id: 'pitstop',
      title: 'THE STOP',
      engine: escapement,
      params: { beats: 4, period: 1500, window: 0.2 },
      presenter: 'world',
      view: 'escapement',
      camera: { zoom: 1.2 },
      hint: '[E] on her call: wheel, wheel, fuel, flag',
      pose: 'interact',
      onRender(scene, st) {
        if (st.count !== scene._pitCalled && st.count < 4) {
          scene._pitCalled = st.count;
          scene.caption.say('ottavia', CALLS[st.count], { ms: 900 });
        }
      },
      onFlags(result, F) {
        F.pit_misses = result.misses;
        F.pit_clean = result.misses <= 1;
      },
      // (the engine always finishes: the slate says if it was good enough)
      onWin: 'pit_done',
    },
  },
  presenters: { tune: { world: tuneWorld }, escapement: { world: escapementWorld } },
  items: {
    gloves: {
      name: 'HIS GLOVES',
      card: 'HIS GLOVES: brown, cracked across the backs, still in the shape of his hands.',
      w: 28,
      h: 20,
      paint(c, w, h) {
        c.fillStyle = '#7a5a38';
        c.fillRect(3, 4, w - 6, h - 6);
        c.fillStyle = '#a8805a';
        c.fillRect(3, 4, w - 6, 2);
        c.fillStyle = '#5a4228';
        for (let x = 6; x < w - 4; x += 4) c.fillRect(x, 4, 1, h - 8);
      },
    },
  },
  objectives: {
    tune: 'get her singing: tune the carburettor by ear, at the bench',
    drive: 'the Heron is at the shutter: take her out on the road',
    aldo: 'Aldo is at his car: he wants a word',
    take_gloves: 'his gloves are on the end of the bench: take them',
    to_hospital: 'bring Aldo his gloves: the hospital, up the quay',
    gloves_goal: 'up the iron stairs at the far end: the chair at his door',
    to_kitchen: 'the Castellanes, on the quay: the money is on the dresser',
    carry_tin: 'the tin is on the dresser: carry it to the table',
    split: 'twelve coins, three jars: put them where they must go',
    to_sable: 'Sable Oil wants to see the driver: over the cafe',
    sign: 'sign the sponsor: three papers on the desk, read them',
    ottavia_again: 'Ottavia is at the bench: she has a question',
    to_gull: 'the night before: walk the Gull road, and see the pit lane',
    chalk: 'walk the corner: the board, the turn-in, the apex',
    to_pit: 'the crew is in the pit lane, along the quay',
    pit_goal: 'in the box: stop, change, go, on her call',
    written: 'the Coppa is still being written: back to the station',
  },
  materials,
  decorRules: {},
  props,
  palette: {},
  shadow: { tint: 0x1a1420, alpha: 0.32 },
  backdrops: {
    coast_day: {
      sky: COAST.sky,
      palette: COAST.land,
      layers: COAST.layers.map((L) => ({ kind: L.kind, f: L.f, dy: L.dy || 0, seed: L.seed, palette: L.land })),
    },
    coast_night: {
      sky: NIGHT_SKY,
      palette: NIGHT_LAND,
      layers: COAST.layers.slice(0, 2).map((L) => ({ kind: L.kind, f: L.f, dy: L.dy || 0, seed: L.seed })),
      motes: 'fireflies',
      moteCount: 8,
    },
  },
  music: { bpm: 66, root: 110, motif: [7, null, 10, 12, null, 10, 7, null], mode: 'aeolian', voices: { base: null, lead: 'felt_piano', pulse: null, danger: null }, keys: MUSIC_KEYS },
  ambientLoop: 'pv_garage',
};
