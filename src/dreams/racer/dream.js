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
// Four races (season.js HOOKS), each with its own objective from where Jo is in his
// life: earn the seat, follow Aldo, get on the sheet, win. Back from the Coppa the crew
// says what it cost, and the orb over the Heron is the note: docs/redesign/RACER_REBUILD_PLAN.md
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
import { endingLines } from './season.js';
import { MUSIC_KEYS } from './music.js';
import { COAST } from './race/themes.js';
import { tune } from '../../engines/tune.js';
import { escapement } from '../../engines/escapement.js';
import { escapementWorld } from '../clockmaker/presenter.js';

const NIGHT_SKY = { top: 0x1a1c44, mid: 0x34386a, bottom: 0x5e5e88, stars: 90, clouds: 3, cloud: 0x2a2a50, cloudLit: 0x4a4a70, seed: 41 };
const NIGHT_LAND = { ...COAST.land, sky: 0x3e4068, hill: 0x4a4c70, house: 0x4e4e6c, roof: 0x24243a, window: 0xffc870, light: 0x9a9ac0, rim: 0x9a9ac0, deep: 0x1e1e30, leaf: 0x1c2a30, trunk: 0x161422, sea: 0x20305a, mist: 0x3a3e68, mistA: 0.24 };

const CALLS = ['Wheel!', 'Wheel!', 'Fuel!', 'Flag!'];

// first light on the quay's end, the Heron stopped under the flag
function paintDawn(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#34386a');
  sky.addColorStop(0.6, '#c88a7a');
  sky.addColorStop(1, '#f2c078');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#20305a';
  ctx.fillRect(0, h - 34, w, 14); // the sea
  ctx.fillStyle = '#1a1420';
  ctx.fillRect(0, h - 20, w, 20); // the road
  ctx.fillRect(w * 0.84, h - 74, 4, 54); // the flag's pole
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = (i + (i > 5 ? 1 : 0)) % 2 ? '#f2e6cc' : '#1a1420';
    ctx.fillRect(w * 0.84 + 4 + (i % 6) * 6, h - 74 + (i > 5 ? 6 : 0), 6, 6);
  }
  ctx.fillStyle = '#e8dcc0'; // her, side on
  ctx.fillRect(w * 0.1, h - 32, 92, 12);
  ctx.fillRect(w * 0.1 + 26, h - 40, 30, 8);
  ctx.fillStyle = '#1f7a78';
  ctx.beginPath();
  ctx.arc(w * 0.1 + 70, h - 26, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#14121e';
  for (const x of [14, 76]) {
    ctx.beginPath();
    ctx.arc(w * 0.1 + x, h - 20, 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

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
      leaveKeys: ['back', 'act2'], // (Q: touch has no back key, and its pause button only pauses)
      camera: { zoom: 1.3 },
      hint: 'hold [E] to turn the jet; let go when the fumes lie still; [Q] to step away',
      pose: 'interact',
      onWin: 'tuned',
      onFail: 'tune_left',
    },
    // the drill: the clockmaker's bob, Ottavia's call
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
        F.pit_ok = result.misses <= 1;
        F.pit_clean = result.misses === 0; // (the stop on the night: 2 s, not 3)
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
    drive_pinewood: 'Pinewood: the second car is at the shutter. Beat Aldo\'s time',
    aldo: 'the seat is yours: Aldo is at his car',
    aldo_wall: 'Aldo said the sea wall: out on the quay, by the pine',
    drive_harbour: 'the Harbour Cup: the Heron is at the shutter. Stay in his air',
    take_gloves: 'his gloves are on the end of the bench: take them',
    to_hospital: 'bring Aldo his gloves: the hospital, up the quay',
    gloves_goal: 'up the iron stairs at the far end: Ottavia is at his door',
    gloves_chair: 'the chair at his door: leave them there',
    to_kitchen: 'the Castellanes, on the quay: the money is on the dresser',
    carry_tin: 'the tin is on the dresser: carry it to the table',
    split: 'twelve coins, three jars: put them where they must go',
    close_tin: 'the tin is empty: close it by the chair, or take one back',
    to_sable: 'the tin is short, and Sable Oil left a card: over the cafe',
    sign: 'sign the sponsor: three papers on the desk, read them',
    drive_salt: 'the Salt Road: the top three get paid. She is at the shutter',
    ottavia_again: 'Ottavia is at the bench: she has a question',
    to_gull: 'nine days to the Coppa: walk the Gull road, past the pit lane',
    chalk: 'walk the corner: the board, the turn-in, the apex',
    to_pit: 'the crew is in the pit lane, along the quay',
    pit_goal: 'in the box: stop, change, go, on her call',
    coppa: 'the Coppa: the Heron is at the shutter. Win',
    coppa_again: 'the Coppa is not second: the Heron is at the shutter',
    the_note: 'she is still ringing: go and stand by her',
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
  ending: {
    orb: true,
    title: 'THE COPPA CALVESSA: WON',
    // (a run's Cassian line is from the road, RaceScene's save of the script's flags)
    lines: endingLines,
    vista: 0.85,
    imageH: 96, // its lines must clear the foot of the screen and the [E] hint
    paint: paintDawn,
  },
};
