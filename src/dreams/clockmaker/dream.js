// THE STOPPED HOUR — the clockmaker's dream (platform 9). Jo has always
// wanted to be the one who keeps a town's time: the work nobody sees until
// the evening it stops. At six every lamp in the town went out with the
// clock; the lamplighter Nell needs steady hands to seat its three gears.
// Wind it, step back out onto the lit green, and the gate to the bell yard
// opens on the dream.
// Built on the phase-3 framework (it began as the framework's proof dream):
// one seam (lane → green), one door (green ↔ clock house), an interior with
// enclosure, one NPC with a scene-box conversation and barks, one encounter
// (the clock), one gate with a sign, checkpoints, coins, an ending.
// Boarded from the hub (platform 9); dev: ?warp=clockmaker:start (alias
// ?warp=proof:start).
import lane from './rooms/lane.js';
import green from './rooms/green.js';
import clockhouse from './rooms/clockhouse.js';
import yard from './rooms/yard.js';
import { MUSIC_KEYS } from './music.js';
import beats from './beats.js';
import { CAST, CONVERSATIONS, BARKS } from './dialogue.js';
import clockworkEnc from './encounters/clockwork.js';
import whistle from './verbs/whistle.js';
import { paintSky, paintBackdropLayer } from '../../art/backdrops/painted.js';

const DUSK = { sky: 0xd88a78, hill: 0x4a3a5a, house: 0x3a3048, roof: 0x4a2e3e, window: 0xffc870, light: 0xf2c890, rim: 0xf2a878, deep: 0x1a1420, leaf: 0x3a5040, trunk: 0x2a2028, mist: 0xe8a088, mistA: 0.28 };
const DUSK_SKY = { top: 0x2a2a58, mid: 0x8a5a7a, bottom: 0xf2a676, sun: { x: 360, y: 470, r: 16, color: 0xffc070 }, clouds: 8, stars: 24, cloud: 0x6a4a6a, cloudLit: 0xf2a070, seed: 4 };
const NIGHT = { ...DUSK, sky: 0x5a4a78, hill: 0x2a2a44, house: 0x2a2438, mist: 0x8a6a8a, mistA: 0.3, leaf: 0x2a3a3a };

export default {
  id: 'clockmaker',
  title: 'THE STOPPED HOUR',
  enabled: true,
  profile: { failure: 'default', hud: 'default', camera: { zoom: 1 } },
  rooms: [lane, green, clockhouse, yard],
  start: { room: 'lane', spawn: 'start' },
  verbs: [whistle],
  beats,
  onStart: 'start',
  cast: CAST,
  conversations: CONVERSATIONS,
  barks: BARKS,
  encounters: { clockwork: clockworkEnc },
  objectives: {
    find_lamplighter: 'the lamps are out: find the lamplighter on the green',
    wind_clock: 'wind the clock in the clock house',
    back_out: 'the clock is going: back out to the green',
    to_bell: 'the gate is open: up to the bell',
    catch_dream: 'up the hill: catch the dream by the bell',
  },
  materials: {},
  decorRules: {},
  props: {},
  palette: {},
  backdrops: {
    dusk_town: {
      sky: DUSK_SKY,
      palette: DUSK,
      layers: [
        { kind: 'hills_town', f: 0.08, dy: -10, seed: 3 },
        { kind: 'town_row', f: 0.22, dy: 24, seed: 5, palette: { house: 0x342a40, mistA: 0.18 } },
        { kind: 'hedge_line', f: 0.45, dy: 30, seed: 7 },
      ],
      motes: 'fireflies',
      moteCount: 12,
    },
    dusk_green: {
      sky: DUSK_SKY,
      palette: DUSK,
      layers: [
        { kind: 'hills_town', f: 0.08, dy: -10, seed: 3 },
        { kind: 'tree_band', f: 0.24, dy: 30, seed: 9, palette: { haze: 0.35 } },
        { kind: 'hedge_line', f: 0.45, dy: 30, seed: 8 },
      ],
      motes: 'fireflies',
      moteCount: 18,
    },
    night_yard: {
      sky: { top: 0x141634, mid: 0x3a3266, bottom: 0x9a6a88, stars: 90, clouds: 4, cloud: 0x3a3060, cloudLit: 0xb87a8a, seed: 9 },
      palette: NIGHT,
      layers: [
        { kind: 'far_ridge', f: 0.06, dy: 0, seed: 11 },
        { kind: 'tree_band', f: 0.22, dy: 40, seed: 12, palette: { haze: 0.22, leaf: 0x263830, trunk: 0x1a1622 } },
      ],
      landmark: { kind: 'bell_tower', x: 30, f: 0.25, dy: 10 },
      motes: 'fireflies',
      moteCount: 22,
    },
  },
  // a folk waltz by place (src/dreams/clockmaker/music.js; the audio pass)
  music: { bpm: 78, root: 98, motif: [0, 4, 7, 9, 7, 4, 2, 4], mode: 'ionian', meter: 3, voices: { base: 'pizz', pulse: 'pizz', lead: 'music_box', danger: 'throb' }, keys: MUSIC_KEYS },
  ambientLoop: 'dusk_lane',
  ending: {
    orb: true,
    title: "SEVEN O'CLOCK",
    lines: ['The clock struck seven, an hour late.', 'Nobody on the green noticed it had stopped.', 'Somebody noticed it start.'],
    vista: 0.8,
    paint(ctx, w, h) {
      // the town from the bell yard, every lamp lit
      ctx.drawImage(paintSky({ ...DUSK_SKY, top: 0x1a1c40, mid: 0x5a3a6a, stars: 70, sun: null }), 0, 0, w, h);
      const far = paintBackdropLayer('hills_town', { ...NIGHT, window: 0xffd890 }, 3);
      ctx.drawImage(far, 0, 0, far.width, far.height, -40, h - far.height * 0.9, w + 80, far.height * 0.9);
      const row = paintBackdropLayer('town_row', { ...NIGHT, house: 0x2a2236, window: 0xffd070 }, 5);
      ctx.drawImage(row, 0, 0, row.width, row.height, -20, h - row.height * 0.7, w * 1.2, row.height * 0.7);
      // the bell yard's hill in front, dark against the lit town
      ctx.fillStyle = '#141220';
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h - 22);
      ctx.quadraticCurveTo(w * 0.35, h - 40, w * 0.7, h - 26);
      ctx.quadraticCurveTo(w * 0.9, h - 20, w, h - 34);
      ctx.lineTo(w, h);
      ctx.fill();
      for (let i = 0; i < 9; i++) {
        const x = 30 + i * 62;
        const y = h - 70 - (i % 3) * 8;
        const g = ctx.createRadialGradient(x, y, 1, x, y, 26);
        g.addColorStop(0, 'rgba(255,220,140,0.9)');
        g.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 26, y - 26, 52, 52);
      }
    },
  },
};
