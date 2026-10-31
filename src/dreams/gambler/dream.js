// THE LAST HAND — the gambler's dream (platform 7), rebuilt on the phase-3
// framework from docs/redesign/advice/gambler_champion_critique.md (the old
// neon casino, GamblerScene, stays behind ?legacy=1 / ?warp=gambler_legacy).
//
// Lou Verrick's dream. Seventy-eight on the train, a retired river gambler
// who was never ruined by one terrible night but ground down by a thousand
// "one more hands". In the dream it is autumn 1884, the steamer Lantern
// Queen on the river Verrane, and he is thirty: the one night he nearly did
// it right. His hands shake; he cannot sit. Jo sits in Lou's chair with
// Lou's last hundred dollars, and Lou stands at his shoulder.
//
// Places you walk into, each with one goal shown on arrival:
//   PORT MERROW          quay (exterior, dusk)   chalk your line on the gangway slate
//   THE MAIN SALOON      saloon (interior)       double $40 at the faro bank
//   THE CARD ROOM        cards (interior)        win a pot at each of three tables (SHOWDOWN)
//   THE PURSER'S OFFICE  office (interior)       through the corridor (the marker narrows it)
//   THE HURRICANE DECK   deck (exterior, dawn)   reach the pilot house with a clear head
//   THE PILOT HOUSE      pilot (interior)        stand up from a table you are winning
//   THE LANDING          landing (exterior)      the gangway at dawn: the orb is the cash
// Only STAND UP catches the dream. Taking the last hand never does: win and
// the Judge deals another; lose and Jo is back on the quay with the slate.
// The money: src/engines/purse.js (F.purse); the rules: src/engines/
// showdown.js, faro.js, slate.js (pure, unit-tested in tests/showdown.test.js).
// Dev: ?warp=gambler:start | :quay | :saloon | :cards | :office | :deck | :pilot | :landing
import quay from './rooms/quay.js';
import saloon from './rooms/saloon.js';
import cards from './rooms/cards.js';
import office from './rooms/office.js';
import deck from './rooms/deck.js';
import pilot from './rooms/pilot.js';
import landing from './rooms/landing.js';
import beats from './beats.js';
import { CAST, CONVERSATIONS, BARKS } from './dialogue.js';
import { slateEnc, faroEnc, t1, t2, t3, lasthand } from './encounters/tables.js';
import purseVerb from './verbs/purse.js';
import boat from './verbs/boat.js';
import props from './props.js';
import materials from './materials.js';
import { MUSIC_KEYS } from './music.js';
import { newPurse, tilt, signMarker, bust, ledgerLines } from '../../engines/purse.js';
import { paintSky, paintBackdropLayer } from '../../art/backdrops/painted.js';

// Port Merrow at dusk: river fog, warehouse roofs, a slate-blue sky with the
// last of the light low in the west; the far bank of the Verrane
const DUSK = { sky: 0x6a6a8a, hill: 0x3a3e52, house: 0x4a4250, roof: 0x2e2a36, window: 0xf2c070, light: 0xf2c890, rim: 0xd8a890, deep: 0x14121a, leaf: 0x2a3a38, trunk: 0x2a2228, mist: 0xb8b0c0, mistA: 0.42, haze: 0.25 };
const DUSK_SKY = { top: 0x1e2240, mid: 0x5a5478, bottom: 0xd89a7a, sun: { x: 80, y: 470, r: 14, color: 0xf2a070 }, clouds: 5, cloud: 0x4a4460, cloudLit: 0xe8907a, stars: 8, seed: 21 };
// the river at first light: grey going rose, the far bank in mist
const DAWN = { sky: 0xb8b0c0, hill: 0x6a6a78, house: 0x8a8088, roof: 0x5a5260, window: 0x4a4250, light: 0xfff0d8, rim: 0xf2c8b0, deep: 0x2a2630, leaf: 0x4a5a50, trunk: 0x3a3438, mist: 0xe8dcd8, mistA: 0.5, haze: 0.3 };
const DAWN_SKY = { top: 0x5a6a8a, mid: 0xb8a8b8, bottom: 0xf2c8a0, sun: { x: 420, y: 500, r: 18, color: 0xffd8a0 }, clouds: 6, cloud: 0x9a8aa0, cloudLit: 0xffd0a8, seed: 22 };
export const VERRANE = { DUSK, DUSK_SKY, DAWN, DAWN_SKY };

// the quay checkpoint: where a bust or the lost last hand puts Jo
function toQuay(scene, lines) {
  const r = scene.graph.room('quay');
  const x = (r.tx + 6) * 32 + 16;
  const y = (r.ty + 15) * 32 + 32 - 22;
  const cam = scene.cameras.main;
  scene.inputs.suspend(true);
  // the split-flap board says it; the caption says the rest
  scene.titleCard(lines[0]);
  scene.caption.say('jo', lines[1], { ms: 3000 });
  cam.fadeOut(500, 0x14, 0x12, 0x2a);
  return new Promise((res) =>
    scene.time.delayedCall(1900, () => {
      scene.player.setPosition(x, y);
      scene.player.body.reset(x, y);
      scene.player.setVelocity(0, 0);
      scene.checkpoint = { ...(scene.checkpoint || {}), x, y, id: 'cp_quay', label: 'PORT MERROW' };
      cam.fadeIn(600, 0x14, 0x12, 0x2a);
      scene.inputs.suspend(false);
      res();
    })
  );
}

// the purse's code, run from beats ({ call })
const calls = {
  purse(scene) {
    if (!scene.F.purse) scene.F.purse = newPurse();
  },
  compDrink(scene) {
    const p = scene.F.purse;
    p.comps += 1;
    tilt(p, 'comp');
  },
  compStake(scene) {
    scene.F.purse.comps += 1;
  },
  marker(scene) {
    const p = scene.F.purse;
    if (p.markers >= 3) return;
    signMarker(p, 50);
    scene.F[`marker${p.markers}`] = true;
    scene.caption.say('jo', `Fifty on my word. The book says $${p.debt} now.`, { ms: 2600 });
  },
  tables(scene) {
    const F = scene.F;
    if (F.t1_won && F.t2_won && !F.table3_open) {
      F.table3_open = true;
      scene.caption.say('lou', 'They are moving to the third table. All three of them. That is the real one.', { ms: 3200 });
    } else if (F.t3_won) {
      F.tables_done = true;
      scene.caption.say('lou', "That's the room. Every table. Now the purser's. He'll offer you paper. You don't need it.", { ms: 3600 });
    } else scene.caption.say('lou', 'A pot off them. Stand up while it is yours. Next table.', { ms: 2600 });
  },
  bust(scene) {
    const p = scene.F.purse;
    bust(p);
    scene.F.busts = (scene.F.busts || 0) + 1;
    return toQuay(scene, ['BUSTED', 'Back on the quay. Lou\'s bar is reset. The night is not.']).then(() => scene.caption.say('lou', "It happens. It happened to me most nights. The slate's still chalked.", { ms: 3200 }));
  },
  stoodUp(scene) {
    const F = scene.F;
    F.stood_up = true;
    F.night_min = Math.max(1, (scene.time.now - (F._t0 || 0)) / 60000);
  },
  lostNight(scene) {
    const F = scene.F;
    F.lost_nights = (F.lost_nights || 0) + 1;
    return toQuay(scene, ['THE NIGHT, ACROSS THE TABLE', "Back on the quay with the slate. The Judge is dealing another."]).then(() => scene.caption.say('lou', "That's the one I always took. Every time.", { ms: 3000 }));
  },
};

export default {
  id: 'gambler',
  title: 'THE LAST HAND',
  hudName: 'THE LAST HAND',
  enabled: true,
  hubListed: true,
  profile: { failure: 'default', hud: 'default', camera: { zoom: 1 } },
  rooms: [quay, saloon, cards, office, deck, pilot, landing],
  start: { room: 'quay', spawn: 'start' },
  tool: null,
  verbs: [purseVerb, boat],
  beats,
  calls,
  onStart: 'start',
  cast: CAST,
  conversations: CONVERSATIONS,
  barks: BARKS,
  encounters: { slate: slateEnc, faro: faroEnc, t1, t2, t3, lasthand },
  items: {},
  markMet: true,
  objectives: {
    meet_lou: 'the man in the claret coat by the gangway is Lou: talk to him',
    slate: 'chalk your line on the gangway slate',
    board: 'go aboard: the saloon door on the main deck',
    faro: 'double $40 at the faro bank: get it to $80',
    to_cards: 'the card room, through the door aft',
    tables: 'win a pot at each table: the Judge, then Sorrel and Nico',
    table3: 'the third table: all three of them. Win a pot there',
    to_office: "through the door past the guard: the purser's office",
    corridor: 'through the corridor to the hurricane deck stairs',
    deck: 'reach the pilot house with a clear head',
    last: 'stand up from a table you are winning',
    landing: 'down the outside stair to the gangway',
    gangway: 'Lou is at the rail on the quay',
    cash: 'count the night on the quay: the coin by the bales',
  },
  materials,
  decorRules: {},
  props,
  palette: { shadow: 0x14121a, deep: 0x14121a },
  shadow: { tint: 0x14121a, alpha: 0.35 },
  backdrops: {
    merrow_dusk: {
      sky: DUSK_SKY,
      palette: DUSK,
      layers: [
        { kind: 'far_ridge', f: 0.05, dy: -40, seed: 5 },
        { kind: 'hills_town', f: 0.1, dy: -10, seed: 7, palette: { haze: 0.35 } },
        { kind: 'town_row', f: 0.22, dy: 20, seed: 9 },
      ],
      motes: 'dust',
      moteCount: 10,
    },
    verrane_dawn: {
      sky: DAWN_SKY,
      palette: DAWN,
      layers: [
        { kind: 'far_ridge', f: 0.04, dy: 60, seed: 11 },
        { kind: 'tree_band', f: 0.1, dy: 120, seed: 13, palette: { haze: 0.45 } },
      ],
      motes: 'dust',
      moteCount: 6,
    },
    merrow_dawn: {
      sky: DAWN_SKY,
      palette: DAWN,
      layers: [
        { kind: 'far_ridge', f: 0.05, dy: -40, seed: 5 },
        { kind: 'hills_town', f: 0.1, dy: -10, seed: 7, palette: { haze: 0.3 } },
        { kind: 'town_row', f: 0.22, dy: 20, seed: 9 },
      ],
      motes: 'dust',
      moteCount: 6,
    },
  },
  // the band per place (src/dreams/gambler/music.js): a saloon four-piece,
  // a low pad in the card room, silence where it belongs
  music: { bpm: 108, root: 98, motif: [4, 7, 9, 7, 4, 2, 0, 2], mode: 'ionian', voices: { base: 'upright', lead: 'clarinet', pulse: 'banjo', danger: null }, keys: MUSIC_KEYS },
  ambientLoop: 'gm_quay',
  ending: {
    orb: true,
    title: 'THE LAST HAND',
    // the honest ledger: hours, rake, comps, the folds that saved money
    lines: (F) => ['"I\'d have stayed." Lou, at the rail.', ...ledgerLines(F.purse || newPurse(), F.night_min || 9)],
    vista: 0.85,
    paint(ctx, w, h) {
      // the landing at dawn: the river, the far bank in mist, one small coin
      ctx.drawImage(paintSky(DAWN_SKY), 0, 0, w, h);
      const ridge = paintBackdropLayer('far_ridge', DAWN, 5);
      ctx.drawImage(ridge, 0, 0, ridge.width, ridge.height, -10, h * 0.62 - ridge.height * 0.5, w + 20, ridge.height * 0.5);
      const town = paintBackdropLayer('hills_town', { ...DAWN, haze: 0.4 }, 7);
      ctx.drawImage(town, 0, 0, town.width, town.height, -10, h * 0.66 - town.height * 0.5, w + 20, town.height * 0.5);
      const g = ctx.createLinearGradient(0, h * 0.66, 0, h);
      g.addColorStop(0, '#9a98a8');
      g.addColorStop(1, '#3a3e4e');
      ctx.fillStyle = g;
      ctx.fillRect(0, h * 0.66, w, h * 0.34);
      ctx.fillStyle = 'rgba(255,230,200,0.35)';
      for (let i = 0; i < 14; i++) ctx.fillRect(w * 0.55 + ((i * 37) % 60) - 30, h * 0.7 + i * 5, 26 + ((i * 11) % 20), 1);
      // the quay's edge and one gold coin on the granite
      ctx.fillStyle = '#4a4a52';
      ctx.fillRect(0, h * 0.86, w, h * 0.14);
      ctx.fillStyle = '#7a7880';
      ctx.fillRect(0, h * 0.86, w, 2);
      const cx = w / 2;
      const cy = h * 0.84;
      const rg = ctx.createRadialGradient(cx, cy, 2, cx, cy, 40);
      rg.addColorStop(0, 'rgba(255,230,160,0.6)');
      rg.addColorStop(1, 'rgba(255,230,160,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(cx - 40, cy - 40, 80, 80);
      ctx.fillStyle = '#d8a840';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 9, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f6d98a';
      ctx.fillRect(cx - 4, cy - 2, 5, 1);
    },
  },
};
