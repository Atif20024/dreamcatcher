// THE STOPPED HOUR — the clockmaker's dream (platform 9). Jo has always
// wanted to be the one who keeps a town's time: the work nobody sees until
// the evening it stops. At six every lamp in the town went out with the
// clock; the lamplighter Nell needs steady hands to seat its three gears.
// The dreamer is Ansel Dunmarrow, the keeper, who took them off himself: if it
// never strikes seven, he is not late (docs/dream_clockmaker_dreamer.md).
// This is the dream a first-time player is pointed to: the gentlest. A place
// per aim, inside opens outside:
//   THE LANE         a window, a man with a watch, his house; the arch to the green
//   THE GREEN        Nell, a woman with a cold pie; the door under the clock
//   THE CLOCK HOUSE  Ansel at his bench, the wheels taught; gear 1, the dial
//   THE WEIGHT SHAFT wheels carried up past loose pendulums (danger, softly); gear 2
//   THE BELL CHAMBER his going train; why; the choice; gear 3 on the beat: the tick starts
//   THE BELL YARD    out on the hill: strike seven, the lamps come up, the gate opens
//   THE GREEN again  everyone answers; Nell lights the last lamp; he walks on
//   THE LANE again   his door, and the dream on the step
// Built on the phase-3 framework (it began as the framework's proof dream).
// Boarded from the hub (platform 9); dev: ?warp=clockmaker:start (alias
// ?warp=proof:start).
import lane from './rooms/lane.js';
import green from './rooms/green.js';
import clockhouse from './rooms/clockhouse.js';
import shaft from './rooms/shaft.js';
import belfry from './rooms/belfry.js';
import yard from './rooms/yard.js';
import { MUSIC_KEYS } from './music.js';
import beats from './beats.js';
import { CAST, CONVERSATIONS, BARKS } from './dialogue.js';
import clockworkEnc, { escapement, strike } from './encounters/clockwork.js';
import whistle from './verbs/whistle.js';
import works from './verbs/works.js';
import wheels from './verbs/wheels.js';
import props from './props.js';
import { hud } from '../../ui/hud.js';
import { paintSky, paintBackdropLayer } from '../../art/backdrops/painted.js';
import { escapementWorld } from './presenter.js';
import { hillFloor } from './logic.js';

const DUSK = { sky: 0xd88a78, hill: 0x4a3a5a, house: 0x3a3048, roof: 0x4a2e3e, window: 0xffc870, light: 0xf2c890, rim: 0xf2a878, deep: 0x1a1420, leaf: 0x3a5040, trunk: 0x2a2028, mist: 0xe8a088, mistA: 0.28 };
const DUSK_SKY = { top: 0x2a2a58, mid: 0x8a5a7a, bottom: 0xf2a676, sun: { x: 360, y: 470, r: 16, color: 0xffc070 }, clouds: 8, stars: 24, cloud: 0x6a4a6a, cloudLit: 0xf2a070, seed: 4 };
const NIGHT = { ...DUSK, sky: 0x5a4a78, hill: 0x2a2a44, house: 0x2a2438, mist: 0x8a6a8a, mistA: 0.3, leaf: 0x2a3a3a };

const items = {
  gear2: {
    name: 'THE SECOND GEAR',
    card: 'THE SECOND GEAR: brass, palm-sized, one tooth bright where it slipped.',
    w: 26, h: 26,
    paint(ctx, w, h) {
      ctx.fillStyle = '#8a6a2c';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.fillRect(w / 2 + Math.cos(a) * 10 - 2, h / 2 + Math.sin(a) * 10 - 2, 4, 4);
      }
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2d580';
      ctx.beginPath();
      ctx.arc(w / 2 - 1, h / 2 - 1, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4a3a2a';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 2, 0, Math.PI * 2);
      ctx.fill();
    },
  },
};

const px = (scene, room, col) => (scene.graph.room(room).tx + col) * 32 + 16;

const calls = {
  // up off the chair and out by the little door, ahead of Jo
  keeperToHill(scene) {
    const n = scene.npcs.get('keeper_rise');
    return n ? n.walkTo(px(scene, 'belfry', 26), 70) : null;
  },
  // the seventh stroke: the gate swings, and he goes through it
  keeperThroughGate(scene) {
    const n = scene.npcs.get('keeper_hill');
    if (!n) return null;
    const r = scene.graph.room('yard');
    return n.walkTo(px(scene, 'yard', 0), 80, (x) => r.ty * 32 + hillFloor(x - r.tx * 32)).then(() => {
      scene.F.keeper_left = true;
    });
  },
  // across the green toward the lane, not waiting for anyone. Not awaited
  keeperOnHome(scene) {
    scene.F.keeper_left = true;
    const n = scene.npcs.get('keeper_green');
    if (n) n.walkTo(px(scene, 'green', 0), 80).then(() => (scene.F.keeper_passed = true));
  },
  // the last few steps to his door, and in
  keeperIn(scene) {
    const n = scene.npcs.get('keeper_door');
    if (!n) return null;
    return n.walkTo(px(scene, 'lane', 5) - 16, 50).then(
      () =>
        new Promise((res) => {
          scene.tweens.add({ targets: n.img, alpha: 0, duration: 500, onComplete: res });
        })
    );
  },
  // the lamplighter's last lamp (the green, column 21): the pole from her side, the
  // walk over (legs from the ground covered, like any stride), the hook up to the wick
  nellToLamp(scene) {
    const n = scene.npcs.get('nell');
    if (!n) return null;
    const lampX = (scene.graph.room('green').tx + 21) * 32 + 16;
    const key = 'dc-nell-pole';
    if (!scene.textures.exists(key)) {
      const ct = scene.textures.createCanvas(key, 6, 78);
      const c = ct.getContext();
      c.fillStyle = '#6a4a2c';
      c.fillRect(2, 4, 2, 74);
      c.fillStyle = '#c8a050';
      c.fillRect(0, 0, 6, 5);
      ct.refresh();
    }
    const pole = scene.add.image(n.x + n.facing * 10, n.y - 2, key).setOrigin(0.5, 1).setDepth(n.img.depth + 0.2);
    const stop = lampX - 26;
    n.facing = stop > n.x ? 1 : -1;
    n.turns = false;
    n.vx = 40 * n.facing;
    return new Promise((res) => {
      scene.tweens.add({
        targets: n,
        x: stop,
        duration: (Math.abs(stop - n.x) / 40) * 1000,
        onUpdate: () => pole.setX(n.x + n.facing * 10),
        onComplete: () => {
          n.vx = 0;
          n.turns = true;
          scene.tweens.add({ targets: pole, angle: 12 * n.facing, y: pole.y - 10, duration: 500, yoyo: true, hold: 500, onComplete: () => { pole.destroy(); res(); } });
        },
      });
    });
  },
  // the gear is out of the satchel and in the clock
  seated(scene) {
    scene.satchel = (scene.satchel || []).filter((n) => n !== items.gear2.name);
    hud.toolLine(1, 'accent').setText('').setVisible(false);
  },
};

export default {
  id: 'clockmaker',
  markMet: true, // the Evening's Nell
  persist: { home: 'met.ansel' }, // the Evening's Ansel: only if Jo saw him home
  title: 'THE STOPPED HOUR',
  enabled: true,
  profile: { failure: 'default', hud: 'default', camera: { zoom: 1 } },
  rooms: [lane, green, clockhouse, shaft, belfry, yard],
  start: { room: 'lane', spawn: 'start' },
  verbs: [whistle, works, wheels],
  beats,
  calls,
  onStart: 'start',
  cast: CAST,
  conversations: CONVERSATIONS,
  barks: BARKS,
  encounters: { clockwork: clockworkEnc, escapement, strike },
  // the third gear, the seven strikes
  presenters: { escapement: { world: escapementWorld } },
  items,
  objectives: {
    find_lamplighter: 'the lamps are out: find the lamplighter on the green',
    wind_clock: 'the clock house, up the steps: seat the first gear at the dial',
    meet_keeper: 'somebody is at the bench: talk to him',
    bench_train: 'hang the wheels: the ratchet must turn the way of its arrow',
    to_shaft: 'through the hatch: the second gear is up the weight shaft',
    climb_shaft: "up the weight shaft: bring the wheels to the gear's cage",
    take_gear: 'the cage is up: take the second gear',
    to_belfry: 'up to the bell chamber with the gear',
    belfry_wheels: 'his going train is down: four wheels, about the room',
    hear_keeper: 'up on the gallery: he wants a word',
    seat_third: 'the third gear, under the bell: seat it on the beat',
    strike_seven: 'out on the hill, by the old bell: strike seven',
    back_up: 'back up through the clock house: the door out on the hill',
    to_green: 'the gate is open: down the hill to the green',
    see_him_home: 'down the lane: see him home',
    catch_dream: 'the dream is on his step: catch it',
  },
  materials: {},
  decorRules: {},
  props,
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
    lines: (F) => [
      'The clock struck seven, an hour late.',
      F.keeper_stays ? 'Two men on the rope. He went in at his own door, and someone saw him do it.' : 'Ansel Dunmarrow went home ahead of the last stroke. Nobody saw him go in.',
      'By morning nobody on the green could say it had ever stopped.',
      'Nell knew. Nell lit the last lamp.',
    ],
    vista: 0.8,
    imageH: 190, // its lines must clear the foot of the screen and the [E] hint
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
