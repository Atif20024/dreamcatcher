// THE BIG STAGE — the Musician's dream (platform 2), rebuilt on the phase-3
// framework (plan phase 3b: the reference dream). Jo's own dream: he gets
// exactly what he wanted, eleven minutes on the festival's big stage, and the
// best of it turns out to have been everything before.
//
// Places you walk into, each a change of world, each with one objective
// shown before you commit to it:
//   RAIN ON THE MARQUEE  street (exterior)   the Cellar's door: round the back
//   THE ALLEY            alley (exterior)    play the dead neon: the stage door lights
//   THE BLUE CELLAR      cellar (interior)   sign up, play the open mic (in the room)
//      … Ray walks out; in the alley he tells Jo to play the room: the gate opens
//   SATURDAY. BACKSTAGE  backstage (interior) the laminate (catwalk, roadies) + Tally's offer
//   THE FIRE STAIRS      escape (vertical)   nine storeys of iron in the rain
//   THE BIG STAGE        stage (exterior)    the set (rests, by ear, the blank, a held note)
//      … then work lights, the crew, the chair, the dream.
// The rhythm engine is src/engines/rhythm.js; the trumpet is the verb ([Q]).
// Dev: ?warp=musician:start | :alley | :cellar | :backstage | :escape | :stage
//      (?legacy=1 plays the old MusicianScene for comparison).
import street from './rooms/street.js';
import alley from './rooms/alley.js';
import cellar from './rooms/cellar.js';
import backstage from './rooms/backstage.js';
import escape from './rooms/escape.js';
import stage from './rooms/stage.js';
import beats from './beats.js';
import { CAST, CONVERSATIONS, BARKS } from './dialogue.js';
import { neon, cellarGig, bigSet } from './encounters/sets.js';
import trumpet from './verbs/trumpet.js';
import props from './props.js';
import materials from './materials.js';
import { paintSky, paintBackdropLayer } from '../../art/backdrops/painted.js';

const TEAL = 0x2e7d9a;
// the city at night: indigo shadow, warm windows, the teal accent (WP6 §9)
const CITY = { sky: 0x262a4c, hill: 0x1e2038, house: 0x2c2a44, roof: 0x1e1a2c, window: 0xffc870, light: 0xf2c890, rim: 0x9ac8e0, deep: 0x0e0c16, leaf: 0x1e2a2a, trunk: 0x1a1620, mist: 0x4a5070, mistA: 0.3, haze: 0.18, accent: TEAL };
const RAIN_SKY = { top: 0x0a0c20, mid: 0x1a1e3c, bottom: 0x3a3a5c, stars: 0, clouds: 7, cloud: 0x2a2a4a, cloudLit: 0x6a5a7a, seed: 2 };
const FEST_SKY = { top: 0x0c0c24, mid: 0x2e1840, bottom: 0x9a3a7a, stars: 30, clouds: 4, cloud: 0x3a1e4a, cloudLit: 0xd060a0, seed: 6 };

const items = {
  laminate: {
    name: 'LAMINATE',
    card: 'LAMINATE: ACCESS ALL AREAS. No laminate, no stage.',
    w: 26,
    h: 36,
    paint(ctx, w, h) {
      ctx.fillStyle = '#c8a24a';
      ctx.fillRect(w / 2 - 1, 0, 2, 8);
      ctx.fillStyle = '#f2e6cc';
      ctx.fillRect(2, 8, w - 4, h - 10);
      ctx.fillStyle = '#2e7d9a';
      ctx.fillRect(2, 8, w - 4, 9);
      ctx.fillStyle = '#14122a';
      ctx.fillRect(5, 21, w - 10, 2);
      ctx.fillRect(5, 26, w - 14, 2);
      ctx.fillStyle = '#d06050';
      ctx.fillRect(5, h - 7, w - 10, 3);
    },
  },
};

export default {
  id: 'musician',
  title: 'THE BIG STAGE',
  enabled: true,
  profile: { failure: 'default', hud: 'default', camera: { zoom: 1 } },
  rooms: [street, alley, cellar, backstage, escape, stage],
  start: { room: 'street', spawn: 'start' },
  tool: 'trumpet',
  verbs: [trumpet],
  beats,
  onStart: 'start',
  cast: CAST,
  conversations: CONVERSATIONS,
  barks: BARKS,
  encounters: { neon, cellar_gig: cellarGig, big_set: bigSet },
  items,
  markMet: true,
  // the Evening reads where Marcus went (save.cast.marcus_left)
  persist: { marcus_left: 'cast.marcus_left' },
  objectives: {
    arrive: "the Blue Cellar's open mic: musicians go round the back",
    alley_neon: 'the stage door is dark: play the dead neon back to life',
    alley_in: 'the stage door is lit: go in and sign up',
    cellar_signup: 'Delphine runs the open mic: put your name down',
    cellar_play: 'take the stage: two songs for nine chairs',
    follow_ray: "Ray walked out mid-song. He's out in the alley",
    to_dock: "the gate's open: the loading door, and Saturday",
    backstage: "the stage door wants your laminate and Tally's answer",
    get_laminate: 'your laminate is up on the catwalk, past the roadies',
    hear_tally: 'Mr. Tally is waiting by the stage door with his offer',
    up_stairs: 'through the fire door: up the stairs to the stage',
    climb: 'climb the fire stairs to the stage door at the top',
    play_set: 'eleven minutes, eight thousand people: play the set',
    after: "it's over. the crew is striking. your case is in the wing",
  },
  materials,
  decorRules: {
    wet_puddles: { id: 'wet_puddles', when: 'hollow', place: 'puddle_*', variants: 2, chance: 0.9, layer: 'mid', materials: ['wet_setts'] },
    club_dust: { id: 'club_dust', when: 'wallBase', place: 'dust_*', variants: 2, chance: 0.9, layer: 'mid', materials: ['club_boards'] },
  },
  props,
  palette: { shadow: 0x0e0c1a, iron: 0x26222e, ironLit: 0x5a5a6a, deep: 0x0e0c16 },
  backdrops: {
    rain_street: {
      sky: RAIN_SKY,
      palette: CITY,
      layers: [
        { kind: 'rain_city', f: 0.12, dy: -4, seed: 3 },
        { kind: 'theatre', f: 0.3, dy: 26, seed: 5, palette: { house: 0x2a2640, haze: 0.12 } },
      ],
      motes: 'rain',
      moteCount: 46,
    },
    alley_night: {
      sky: RAIN_SKY,
      palette: CITY,
      layers: [
        { kind: 'city', f: 0.12, dy: -10, seed: 8 },
        { kind: 'fire_escape', f: 0.5, dy: 22, seed: 9, palette: { house: 0x2a2232, haze: 0.08 } },
      ],
      motes: 'rain',
      moteCount: 40,
    },
    roofs_night: {
      sky: { ...RAIN_SKY, stars: 20, bottom: 0x4a3a62 },
      palette: CITY,
      layers: [{ kind: 'city', f: 0.12, dy: 0, seed: 12 }, { kind: 'rain_city', f: 0.12, dy: 60, seed: 13, palette: { house: 0x22203a } }],
      motes: 'rain',
      moteCount: 44,
    },
    festival: {
      sky: FEST_SKY,
      palette: { ...CITY, sky: 0x4a2050, mist: 0x8a3a7a, mistA: 0.35 },
      layers: [{ kind: 'city', f: 0.12, dy: 10, seed: 15 }],
      motes: 'dust',
      moteCount: 26,
    },
  },
  music: { bpm: 96, root: 110, motif: [0, 3, 5, 7, 10, 7, 5, 3] },
  ambientLoop: 'rain_street',
  ending: {
    orb: true,
    title: 'ELEVEN MINUTES',
    lines: (F) => [
      'Eleven minutes, and then the next act.',
      F.choice_tally ? "You didn't rush the third bar. Nobody was listening for it." : 'Somebody was listening for the third bar.',
      ...(F.marcus_stays ? ['Marcus drove home Sunday. He kept the napkin.'] : []),
    ],
    vista: 0.8,
    paint(ctx, w, h) {
      // the stage at dawn, struck: a folding chair, a case, one work light
      ctx.drawImage(paintSky({ top: 0x2a2a48, mid: 0x6a5a6a, bottom: 0xe0b890, stars: 4, clouds: 5, cloud: 0x8a7a8a, cloudLit: 0xf2c890, seed: 21 }), 0, 0, w, h);
      const row = paintBackdropLayer('city', { ...CITY, sky: 0x8a7a8a, house: 0x3a3448, window: 0xffd890, haze: 0.3 }, 15);
      ctx.drawImage(row, 0, 0, row.width, row.height, -10, h - 110 - row.height * 0.8, w + 20, row.height * 0.8);
      ctx.fillStyle = '#16141e';
      ctx.fillRect(0, h - 110, w, 110);
      ctx.fillStyle = '#2a2632';
      ctx.fillRect(0, h - 110, w, 4);
      // the truss, half down
      ctx.fillStyle = '#5a5a68';
      ctx.fillRect(60, 40, 6, h - 150);
      ctx.fillRect(w - 66, 40, 6, h - 150);
      ctx.fillRect(60, 40, w - 120, 5);
      // the chair and the case
      const cx = w * 0.62;
      const fy = h - 110;
      ctx.strokeStyle = '#8a8a98';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 14, fy);
      ctx.lineTo(cx + 12, fy - 26);
      ctx.moveTo(cx + 12, fy);
      ctx.lineTo(cx - 14, fy - 26);
      ctx.moveTo(cx + 10, fy - 26);
      ctx.lineTo(cx + 8, fy - 62);
      ctx.stroke();
      ctx.fillStyle = '#5a4632';
      ctx.fillRect(cx - 20, fy - 44, 40, 18);
      ctx.fillStyle = '#3a3222';
      ctx.fillRect(cx - 5, fy - 48, 10, 4);
      const g = ctx.createRadialGradient(cx - 60, 60, 2, cx - 60, 60, 220);
      g.addColorStop(0, 'rgba(255,240,200,0.35)');
      g.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
  },
};
