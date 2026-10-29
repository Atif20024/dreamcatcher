// THE MASTER'S LADDER — the painter's dream (platform 5), rebuilt on the
// phase-3 framework (it replaces THE YELLOW HOUSE, which stays behind
// ?legacy=1 / ?warp=painter_legacy). The design: docs/dream_painter_renaissance.md.
//
// Bice's dream. An old woman with gold leaf under her nails rides the train:
// in waking life she restored church walls for fifty years and never signed
// one. In her dream it is Fioralba, the spring the new chapel went to a
// contest, and she is sixteen, the master's daughter, who draws better than
// anyone in the shop and whom the guild will not take. Jo is the new errand
// boy: the hands she was never allowed. He climbs the whole ladder of the
// trade in a day, and at the top of the scaffold he paints her drawing.
//
// Places you walk into, each a change of world, each with one objective:
//   THE BOTTEGA        bottega (interior)  grind the colours (errand boy → apprentice)
//   VIA DEI PITTORI    via (exterior)      the colour-seller's door; Dori's boys
//   THE COLOUR-SELLER  speziale (interior) climb the shelves for the lapis
//   THE BOTTEGA again                      paint the drapery (→ assistant)
//   THE PIAZZA         piazza (exterior)   the guild hall, the palazzo, the chapel
//   THE GUILD HALL     guild (interior)    the test piece before the consuls (→ master)
//   PALAZZO BARDELLI   palazzo (interior)  the commission and the gold
//   THE NEW CHAPEL     chapel (vertical)   the cartoon, the giornata, the bell
// The craft engine is src/engines/craft.js; [Q] is the silverpoint (studies).
// Dev: ?warp=painter:start | :bottega | :via | :speziale | :piazza | :guild | :palazzo | :chapel
import bottega from './rooms/bottega.js';
import via from './rooms/via.js';
import speziale from './rooms/speziale.js';
import piazza from './rooms/piazza.js';
import guild from './rooms/guild.js';
import palazzo from './rooms/palazzo.js';
import chapel from './rooms/chapel.js';
import beats from './beats.js';
import { CAST, CONVERSATIONS, BARKS } from './dialogue.js';
import { grind, drapery, masterpiece, giornata } from './encounters/jobs.js';
import sketch from './verbs/sketch.js';
import props from './props.js';
import materials from './materials.js';
import { paintVault } from './works.js';
import { paintSky, paintBackdropLayer, paintLandmark } from '../../art/backdrops/painted.js';
import { MUSIC_KEYS } from './music.js';

const LAPIS = 0x22408a;
const GOLD = 0xd8a840;
// Fioralba in the late afternoon: warm stone, terracotta, sage hills, a high
// clear sky going gold at the horizon (the light painters waited for)
const DAY = { sky: 0xc0d0e0, hill: 0x7a8a5a, house: 0xd8b888, roof: 0xb85a34, window: 0x3a3040, light: 0xfff0c8, rim: 0xfff0c8, deep: 0x2a2026, leaf: 0x3e5a3a, trunk: 0x4a3424, mist: 0xf0dcb0, mistA: 0.32, haze: 0.14 };
const SKY = { top: 0x4a6aa8, mid: 0x9ab8d8, bottom: 0xf2dcae, sun: { x: 110, y: 340, r: 20, color: 0xfff0c0 }, clouds: 6, cloud: 0xe8e0d8, cloudLit: 0xfff0d8, seed: 8 };
export const FIORALBA = { DAY, SKY };

const items = {
  lapis: {
    name: 'LAPIS',
    card: 'LAPIS LAZULI: from over the sea. Ground, it is ultramarine, and it costs more than gold.',
    w: 26, h: 22,
    paint(ctx, w, h) {
      ctx.fillStyle = '#22408a';
      ctx.beginPath();
      ctx.moveTo(4, h - 3);
      ctx.lineTo(2, 9);
      ctx.lineTo(10, 2);
      ctx.lineTo(21, 4);
      ctx.lineTo(w - 2, 13);
      ctx.lineTo(19, h - 2);
      ctx.fill();
      ctx.fillStyle = '#4a6ac8';
      ctx.fillRect(8, 6, 6, 4);
      ctx.fillStyle = '#f2d580';
      [[12, 12], [17, 9], [9, 15], [19, 15]].forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));
    },
  },
  seal: {
    name: 'GUILD SEAL',
    card: 'GUILD SEAL: your name is in the book. You may open a shop, sign a contract and take an apprentice.',
    w: 24, h: 30,
    paint(ctx, w) {
      ctx.fillStyle = '#6a4a2e';
      ctx.fillRect(w / 2 - 3, 0, 6, 14);
      ctx.fillStyle = '#d8a840';
      ctx.beginPath();
      ctx.arc(w / 2, 20, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a02a2a';
      ctx.beginPath();
      ctx.arc(w / 2, 20, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2d580';
      ctx.fillRect(w / 2 - 1, 16, 2, 8);
    },
  },
  gold_leaf: {
    name: 'GOLD LEAF',
    card: 'GOLD LEAF: ten books of it, beaten thin as breath. For the stars, and nothing else.',
    w: 26, h: 20,
    paint(ctx, w, h) {
      ctx.fillStyle = '#8a2a2a';
      ctx.fillRect(2, 4, w - 4, h - 6);
      ctx.fillStyle = '#f2d580';
      for (let i = 0; i < 4; i++) ctx.fillRect(4 + i, 2 + i, w - 10, 2);
      ctx.fillStyle = '#d8a840';
      ctx.fillRect(4, 10, w - 10, h - 13);
    },
  },
  cartoon: {
    name: 'THE CARTOON',
    card: "THE CARTOON: the vault drawn full size, every line pricked through for pouncing. Bice's hand.",
    w: 30, h: 22,
    paint(ctx, w, h) {
      ctx.fillStyle = '#e8dcc0';
      ctx.fillRect(2, 4, w - 4, h - 8);
      ctx.fillStyle = '#c8b890';
      ctx.beginPath();
      ctx.arc(w - 4, h / 2, (h - 8) / 2, -Math.PI / 2, Math.PI / 2);
      ctx.fill();
      ctx.fillStyle = '#3a2a22';
      for (let x = 6; x < w - 8; x += 3) ctx.fillRect(x, 9 + Math.round(Math.sin(x / 3) * 2), 1, 1);
    },
  },
};

export default {
  id: 'painter',
  title: "THE MASTER'S LADDER",
  hudName: "THE MASTER'S LADDER", // the HUD's level slot ("DREAM — …" would crowd the objective)
  enabled: true,
  hubListed: true,
  profile: { failure: 'default', hud: 'default', camera: { zoom: 1 } },
  rooms: [bottega, via, speziale, piazza, guild, palazzo, chapel],
  start: { room: 'bottega', spawn: 'start' },
  tool: null,
  verbs: [sketch],
  beats,
  onStart: 'start',
  cast: CAST,
  conversations: CONVERSATIONS,
  barks: BARKS,
  encounters: { grind, drapery, masterpiece, giornata },
  items,
  markMet: true,
  objectives: {
    meet_master: 'Maestro Gualtiero runs the bottega: report to him',
    grind: 'grind the colours on the slab by the window',
    fetch_lapis: 'fetch lapis: the colour-seller, sign of the mortar',
    climb_lapis: 'the lapis is on the top shelf: climb for it',
    back_bottega: 'take the lapis home to the bottega',
    drapery: 'gild and paint the drapery of the altarpiece',
    to_guild: 'the guild hall, across the square: show your hand',
    meet_consul: 'the consuls sit on the dais: speak to Consul Folco',
    trial: 'paint your test piece before the consuls',
    take_seal: 'take your guild seal from the dais',
    to_palazzo: 'Palazzo Bardelli wants a painter: see Messer Corso',
    see_corso: 'Messer Corso is up the stairs, along the gallery',
    get_gold: "fetch the gold leaf from Messer Corso's study",
    to_chapel: 'the new chapel: the plaster will not wait',
    find_cartoon: 'Bruno hid the cartoon on the scaffold: find it',
    climb_vault: 'climb to the vault and paint the giornata',
    after: 'the bell has rung. The dream waits on the deck',
  },
  materials,
  decorRules: {},
  props,
  palette: { shadow: 0x2a2026, deep: 0x2a2026 },
  shadow: { tint: 0x3a2a24, alpha: 0.3 },
  backdrops: {
    fioralba_via: {
      sky: SKY,
      palette: DAY,
      layers: [
        { kind: 'rn_hills', f: 0.05, dy: -60, seed: 3 },
        { kind: 'rn_skyline', f: 0.12, dy: -6, seed: 5 },
        { kind: 'rn_row', f: 0.3, dy: 24, seed: 7, palette: { haze: 0.1 } },
      ],
      landmark: { kind: 'campanile', x: 40, f: 0.12, dy: -14, depth: -25 }, // behind the roofs
      motes: 'dust',
      moteCount: 12,
    },
    fioralba_piazza: {
      sky: SKY,
      palette: DAY,
      layers: [
        { kind: 'rn_hills', f: 0.05, dy: -60, seed: 4 },
        { kind: 'rn_skyline', f: 0.12, dy: -6, seed: 9 },
        { kind: 'rn_row', f: 0.3, dy: 30, seed: 11, palette: { haze: 0.2 } },
      ],
      landmark: { kind: 'dome_works', x: 66, f: 0.12, dy: -6, depth: -25 }, // behind the roofs
      motes: 'dust',
      moteCount: 14,
    },
  },
  // the music of the city (src/dreams/painter/music.js): modal and secular,
  // a voice set per place; MUSIC_KEYS[room.music.key] overrides per room
  music: { bpm: 90, root: 147, motif: [0, 2, 3, 5, 7, 5, 3, 2], mode: 'dorian', voices: { base: 'lute', lead: 'recorder', pulse: 'frame_drum', danger: 'drone' }, keys: MUSIC_KEYS },
  ambientLoop: 'rn_street',
  ending: {
    orb: true,
    title: 'THE GIORNATA',
    lines: (F) => [
      'One day of wet plaster, and then it is the wall.',
      F.choice_bice ? 'They said her name in the chapel. Out loud. Once was enough.' : 'Nobody asked whose drawing it was. She knew which stars were hers.',
      ...(F.study_torso && F.study_hands && F.study_dome ? ['Three studies in silverpoint, kept in a book for sixty years.'] : []),
    ],
    vista: 0.8,
    paint(ctx, w, h) {
      // looking up into the vault at vespers: our bay, its stars, the candles
      ctx.drawImage(paintSky({ top: 0x1e1a30, mid: 0x4a3a52, bottom: 0xd8986a, stars: 10, clouds: 3, cloud: 0x5a4a5a, cloudLit: 0xf2a070, seed: 5 }), 0, 0, w, h);
      const dome = paintLandmark('dome_works', { ...DAY, sky: 0x8a6a6a, rim: 0xf2a070 });
      ctx.drawImage(dome, w * 0.66, h - 16 - dome.height * 0.5, dome.width * 0.5, dome.height * 0.5);
      const row = paintBackdropLayer('rn_skyline', { ...DAY, sky: 0x8a6a6a, house: 0x6a5048, roof: 0x5a3028, haze: 0.3 }, 5);
      ctx.drawImage(row, 0, 0, row.width, row.height, -10, h - row.height * 0.9, w + 20, row.height * 0.9);
      // the vault, framed as a lunette hung over the city
      const vw = 300;
      const vh = 106;
      const v = document.createElement('canvas');
      v.width = vw;
      v.height = vh;
      paintVault(v.getContext('2d'), vw, vh, 8, 8, {});
      ctx.fillStyle = '#14122a';
      ctx.fillRect(w / 2 - vw / 2 - 8, 28, vw + 16, vh + 16);
      ctx.drawImage(v, w / 2 - vw / 2, 36);
      const g = ctx.createRadialGradient(w / 2, 90, 10, w / 2, 90, 260);
      g.addColorStop(0, 'rgba(255,220,160,0.22)');
      g.addColorStop(1, 'rgba(255,220,160,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      void LAPIS;
      void GOLD;
    },
  },
};
