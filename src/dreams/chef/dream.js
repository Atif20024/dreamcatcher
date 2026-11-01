// FIVE-STAR DREAM: the chef's dream (platform 1), on the phase-3 framework,
// around the one verb of the ticket rail. docs/dream_chef.md is the design.
// One night at Le Rêve, the restaurant of the Hôtel Vauclerc, Saint-Orvain,
// October 1957. Marguerite's dream; Jo is the stage.
//   THE SERVICE YARD then THE PIT   clear Bastien's rail, earn an apron
//   THE COLD STORE                  saffron, top shelf; the hands won't hold long
//   THE PREP KITCHEN                stock the line before the doors (choose)
//   THE LINE                        three sittings on the rail, then Table One
//   THE PASS                        his side of the window. "Stage. Hands."
//   THE DINING ROOM                 carry it out. Nobody. The orb over the plate.
// The rules: src/engines/tickets.js (pure, unit-tested with bots in
// tests/tickets.test.js); the data: services.js; the staging: verbs/rail.js,
// verbs/kitchen.js, railHud.js.
// Dev: ?warp=chef:start | :pit | :cold | :prep | :line | :pass | :dining
import yard from './rooms/yard.js';
import pit from './rooms/pit.js';
import cold from './rooms/cold.js';
import prep from './rooms/prep.js';
import line from './rooms/line.js';
import pass from './rooms/pass.js';
import dining from './rooms/dining.js';
import beats from './beats.js';
import { CAST, CONVERSATIONS, BARKS, handsConversation } from './dialogue.js';
import rail from './verbs/rail.js';
import kitchen from './verbs/kitchen.js';
import props, { paintHands, paintEnding } from './props.js';
import materials from './materials.js';
import { MUSIC_KEYS } from './music.js';
import { readHands, nightLine } from '../../engines/tickets.js';

const NIGHT_SKY = { top: 0x0a0c20, mid: 0x161a34, bottom: 0x2e2c48, stars: 0, clouds: 7, cloud: 0x262646, cloudLit: 0x4a4460, seed: 31 };
const ORVAIN = { sky: 0x20223e, hill: 0x1a1c32, house: 0x262438, roof: 0x1a1826, window: 0xffc870, light: 0xf2c890, rim: 0x8aa8c0, deep: 0x0e0c16, leaf: 0x1e2a2a, trunk: 0x1a1620, mist: 0x3a4060, mistA: 0.3, haze: 0.2 };

const calls = {
  // only a fresh arrival in the yard gets the line (not a Continue or a warp)
  opening(scene) {
    if (scene.roomId === 'yard' && !scene.F.met_m) scene.caption.say('jo', 'Rain. The back of a grand hotel. Every window on this wall is running with steam.', { ms: 3600 });
  },
  saffronGot(scene) {
    if (scene.railApi) scene.railApi.complete('saffron');
    scene.F.rail_cold = true;
    scene.saveRun();
  },
  // Aurelio reads Jo's hands: painted from the run, spoken from the run
  async hands(scene) {
    const F = scene.F;
    const { marks, lines, keys } = readHands(F);
    scene.def.conversations.hands_read = handsConversation(lines, F.finish || 'menu', keys);
    const W = 400;
    const H = 150;
    const key = 'fs-hands';
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const ct = scene.textures.createCanvas(key, W, H);
    paintHands(ct.getContext(), W, H, marks);
    ct.refresh();
    const cam = scene.cameras.main;
    const frame = scene.add.graphics().setScrollFactor(0).setDepth(130);
    frame.fillStyle(0x14122a, 1).fillRect(cam.width / 2 - W / 2 - 8, 92, W + 16, H + 16);
    frame.lineStyle(2, 0xc8a050, 1).strokeRect(cam.width / 2 - W / 2 - 6, 94, W + 12, H + 12);
    const img = scene.add.image(cam.width / 2, 100 + H / 2, key).setScrollFactor(0).setDepth(131).setAlpha(0);
    scene.tweens.add({ targets: img, alpha: 1, duration: 500 });
    // the ring on the mark he is reading (painted-hands coordinates, see paintHands)
    const ring = scene.add.graphics().setScrollFactor(0).setDepth(132);
    scene.handMark = (mark) => {
      ring.clear();
      const spots = { burn: [[166, 66, 34, 26]], frost: [[120, 133, 84, 40], [280, 133, 84, 40]], flour: [[120, 34, 84, 44], [280, 34, 84, 44]], onion: [[272, 33, 72, 26]] }[mark];
      if (!spots) return;
      ring.lineStyle(2, 0xf2d580, 1);
      for (const [x, y, w, h] of spots) ring.strokeEllipse(cam.width / 2 - W / 2 + x, 100 + y, w, h);
      ring.setAlpha(0);
      scene.tweens.add({ targets: ring, alpha: 1, duration: 260 });
    };
    const a = scene.npcs.get('aurelio');
    const shot = scene.camDir.push({ zoom: 1.45, focus: a ? { x: (a.x + scene.player.x) / 2, y: a.y - 50 } : null, ms: 700 });
    await scene.runConversation('hands_read', null);
    scene.camDir.pop(shot, 600);
    img.destroy();
    frame.destroy();
    ring.destroy();
    if (a) a.facing = 1; // he turns away
  },
  handMark(scene, { mark }) {
    scene.handMark(mark);
  },
  // the kitchen's noise rushes back as he turns away
  kitchenBack(scene) {
    const r = scene.graph.room('pass');
    if (r) r.data.ambience = 'fs_line';
    if (scene.placeAudio) scene.placeAudio.setBed('kitchen');
  },
  kitchenAway(scene) {
    const r = scene.graph.room('pass');
    if (r) r.data.ambience = 'fs_pass';
  },
};

export default {
  id: 'chef',
  title: 'FIVE-STAR DREAM',
  hudName: 'FIVE-STAR DREAM',
  enabled: true,
  hubListed: true,
  profile: { failure: 'default', hud: 'default', camera: { zoom: 1 } },
  rooms: [yard, pit, cold, prep, line, pass, dining],
  start: { room: 'yard', spawn: 'start' },
  tool: null,
  verbs: [rail, kitchen],
  beats,
  calls,
  onStart: 'start',
  cast: CAST,
  conversations: CONVERSATIONS,
  barks: BARKS,
  encounters: {},
  items: {
    saffron: {
      name: 'SAFFRON',
      card: 'SAFFRON: the whole order dies without it. Into the pocket.',
      w: 24,
      h: 24,
      paint(c, w, h) {
        c.fillStyle = '#7a5a24';
        c.fillRect(3, 5, w - 6, h - 7);
        c.fillStyle = '#c8a050';
        c.fillRect(3, 5, w - 6, 3);
        c.fillStyle = '#d8541e';
        c.fillRect(7, 11, w - 14, 7);
        c.fillStyle = '#f2d580';
        c.fillRect(9, 13, 2, 3);
      },
    },
  },
  markMet: true,
  objectives: {
    door: 'the woman at the back door: talk',
    to_pit: 'go in: the back door',
    pit: 'clear the rail: earn an apron',
    to_cold: 'the cold store, the door at the far end',
    saffron: 'saffron, on the top shelf',
    out_cold: 'through to prep, the door at the foot of the racks',
    mise: 'stock the line before the doors',
    to_line: 'through to the line',
    rush: 'plate what the rail says',
    to_pass: "round to Chef's side, the door past the window",
    finish: 'finish Table One',
    hands: 'hold out the plate to Chef',
    carry: 'carry it out: the far door',
    walk: 'Table One, at the far end. Walk.',
    catch: 'the light over the plate',
  },
  materials: {
    ...materials,
    yard_wall: { id: 'yard_wall', kind: 'plaster', surface: 'stone', palette: { body: 0x2a2632, brick: 0x34303e, mortar: 0x1a1822, wood: 0x3a3442, lit: 0x6a6478, deep: 0x0e0c16 }, decor: [] },
  },
  decorRules: {},
  props,
  palette: { shadow: 0x1a1420, deep: 0x1a1420 },
  shadow: { tint: 0x1a1420, alpha: 0.32 },
  backdrops: {
    orvain_night: {
      sky: NIGHT_SKY,
      palette: ORVAIN,
      layers: [{ kind: 'rain_city', f: 0.12, dy: -4, seed: 8 }],
      motes: 'rain',
      moteCount: 40,
    },
  },
  music: { bpm: 112, root: 65.41, motif: [7, 9, 12, null, 9, 7, 4, null], mode: 'ionian', voices: { base: 'upright', lead: 'muted_trumpet', pulse: 'brush', danger: 'throb' }, keys: MUSIC_KEYS },
  ambientLoop: 'fs_yard',
  ending: {
    orb: true,
    title: 'TABLE ONE',
    vista: 1,
    imageH: 240,
    variant: (F) => F.finish || 'menu',
    lines(F) {
      const out = [];
      if (F.finish === 'own') out.push('One forkful gone. She wiped her mouth at the swing door.', 'Neither of them ever mentioned it.');
      else if (F.finish === 'plain') out.push('A clean plate. A clean rim. No gold.', 'It was correct.');
      else out.push('The gold on it, dead centre. The fork has not moved.', 'It was correct.');
      out.push(nightLine(F));
      return out;
    },
    paint(c, w, h, F) {
      paintEnding(c, w, h, (F && F.finish) || 'menu');
    },
  },
};
