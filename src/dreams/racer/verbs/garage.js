// The garage's verb: the Heron at the shutter is the door into the race, the bench is
// TUNE and then the chalk, the rack is the tyres, and the prize tin pays what a race
// earned. The race itself is RaceScene (its own JS chunk): the run is saved first, so a
// Continue wakes here whatever happens out on the road, and what the race left in the
// run is paid here, once. The door counts for the season's next stand-in (season.js).
import { loadSceneChunk } from '../../../core/boarding.js';
import { addCoins, deductWorth, coinWorth } from '../../../systems/wallet.js';
import { sfx } from '../../../systems/audio.js';
import { LAYER_DEPTH } from '../../../world/RoomStreamer.js';
import { CAR_SIZE } from '../../../art/carKit.js';
import { prizeOwed, flagOf } from '../race/result.js';
import { paintSteps, freeTheme } from '../race/RaceRoad.js';
import { TRACKS } from '../race/tracks.js';
import { atTheDoor, STAND_IN } from '../season.js';
import { rackConversation, benchConversation } from '../dialogue.js';

const T = 32;
const CAR_COL = 26; // the Heron's middle, room tiles (just inside the shutter at 28)
const ALDO_COL = 19; // his car, beside her, until the Cup
const RACK_COL = 6; // (the props' middles, room tiles)
const BENCH_COL = 12;
const NIGHT = [0x14, 0x12, 0x2a];
const ROAD_STEPS = paintSteps(TRACKS[STAND_IN].theme);

function goRace(scene, ctx) {
  if (ctx.state.going) return;
  ctx.state.going = true;
  const door = atTheDoor(scene.F);
  scene.F.season_pending = door.pending; // (applyResult opens what comes next, at the line)
  scene.saveRun();
  sfx('snap');
  scene.player.controlLockUntil = scene.time.now + 99999;
  scene.player.body.setVelocityX(0);
  // the chunk starts loading at the door; the dip holds at full dark until it is here
  const ready = loadSceneChunk(scene.game, 'Race');
  ready.catch(() => {});
  const cam = scene.cameras.main;
  cam.once('camerafadeoutcomplete', () => {
    ready.then(
      () => scene.scene.start('Race', { track: door.track }),
      () => {
        // the page could not fetch it: tell Jo why, and leave him in the garage
        ctx.state.going = false;
        scene.player.controlLockUntil = 0;
        cam.fadeIn(300, ...NIGHT);
        scene.caption.say('ottavia', 'She will not turn over. Check the line, reload the page, and try again.', { ms: 4200 });
      }
    );
  });
  cam.fadeOut(340, ...NIGHT);
}

function payPrize(scene) {
  const F = scene.F;
  const owed = prizeOwed(F, STAND_IN);
  if (owed <= 0) return;
  // a fifth to Sable Oil, if that clause was left standing: it comes out of what reaches the wallet
  const paid = F.sable_cut ? owed - Math.ceil(owed / 5) : owed;
  addCoins(scene.dreamId, paid);
  scene.levelCoins += paid;
  F[flagOf(STAND_IN, 'paid')] = (F[flagOf(STAND_IN, 'paid')] || 0) + owed;
  scene.updateCoinHud();
  // (the flag, the coin count and the wallet's figure are saved together: a save
  // from before this has neither, and BaseLevel takes the coins back on a Continue)
  scene.saveRun();
  sfx('buy');
  scene.caption.say('ottavia', `The prize tin: ${paid} brass nuts${F.sable_cut ? ', after Sable' : ''}. Put them somewhere your mother will not find them.`, { ms: 3600 });
}

// spend nuts in the garage: out of this dream's count, saved at once with the flag that
// says what they bought, so a Continue can neither refund it nor charge it twice
export function buy(scene, { item, price }) {
  const worth = price * coinWorth(scene.dreamId);
  scene.levelCoins -= price;
  scene.coinsSinceCP = 0; // (what is spent is spent: a fall does not scatter it again)
  deductWorth(scene.dreamId, worth);
  scene.F[item === 'soft' ? 'tyre_soft' : 'buy_chalk'] = true;
  scene.updateCoinHud();
  scene.saveRun();
  sfx('buy');
}

// a conversation built from the run (what is on the shelf, what Jo can pay)
function shop(scene, make) {
  const c = make(scene.F, scene.levelCoins || 0);
  scene.def.conversations[c.id] = c;
  return scene.runConversation(c.id, null);
}

export default {
  id: 'garage',
  keys: [],
  create(ctx) {
    const { scene } = ctx;
    const r = scene.graph.room('garage');
    const x = (r.tx + CAR_COL) * T + T / 2;
    const floor = (r.ty + 12) * T;
    const depth = LAYER_DEPTH.mid - 0.25;
    const car = (cx, livery) => {
      const parts = [scene.add.image(cx, floor + 2, 'cars', `car-${livery}`).setOrigin(0.5, 1).setDepth(depth)];
      for (const wx of CAR_SIZE.wheelX) parts.push(scene.add.image(cx + wx - CAR_SIZE.frameW / 2, floor - 14 + 2, 'cars', 'wheel-0').setDepth(depth + 0.01));
      return parts;
    };
    car(x, 'heron');
    // Aldo's car: gone the morning after the Cup (a sheeted shape stands there then, room props)
    ctx.state.aldoCar = car((r.tx + ALDO_COL) * T + T / 2, 'dante');
    ctx.state.going = false;
    ctx.state.door = scene.interaction.register({ id: 'race:test', x, y: floor - 20, radius: 110, prompt: 'drive', enabled: () => !ctx.state.going, onUse: () => goRace(scene, ctx) });
    // the rack and the bench do something: nuts buy tyres and chalk, never speed
    const at = (col) => (r.tx + col) * T + T / 2;
    ctx.state.rack = scene.interaction.register({ id: 'race:rack', x: at(RACK_COL), y: floor - 20, radius: 56, prompt: 'the tyres', onUse: () => shop(scene, rackConversation) });
    ctx.state.bench = scene.interaction.register({
      id: 'race:bench',
      x: at(BENCH_COL),
      y: floor - 20,
      radius: 56,
      prompt: 'tune by ear',
      enabled: () => !scene.encounters.busy,
      onUse: () => (scene.F.tuned ? shop(scene, benchConversation) : scene.startEncounter('tune', { x: at(BENCH_COL), y: floor - 90 })),
    });
    if (!scene.resuming) scene.caption.say('ottavia', "You're the one who plays by ear. Come to the bench. She's flat.", { ms: 4200 });
    // leaving the dream without driving: the road's textures go too (the race frees them otherwise)
    scene.events.once('shutdown', () => {
      if (!ctx.state.going) freeTheme(scene, TRACKS[STAND_IN].theme);
    });
  },
  update(ctx) {
    const { scene } = ctx;
    const F = scene.F;
    ctx.state.bench.item.prompt = F.tuned ? (F.buy_chalk ? 'the bench' : "Ottavia's chalk") : 'tune by ear';
    for (const p of ctx.state.aldoCar) p.setVisible(!F.done_race2);
    if (scene.roomId !== 'garage') return;
    // the road's textures, one a frame while the place fades up: the door has none to paint
    if ((ctx.state.painted ||= 0) < ROAD_STEPS.length) ROAD_STEPS[ctx.state.painted++](scene);
    if (!ctx.state.checked) {
      ctx.state.checked = true; // (the first live frame: a resumed run's flags are in by now)
      payPrize(scene);
    }
    // the morning after the Cup, once. (The Cup is a stand-in: see season.js)
    if (F.done_race2 && !F.cup_told && !scene.beats.busy && !scene.sceneBox.active && !scene.transitions.busy) {
      F.cup_told = true;
      scene.runConversation('cup_morning', null).then(() => scene.saveRun());
    }
  },
};
