// The garage's verb: the Heron at the shutter is the door into the race, the bench is
// TUNE and then the chalk, the rack is the tyres, and the prize tin pays what a race
// earned. The race itself is RaceScene (its own JS chunk): the run is saved first, so a
// Continue wakes here whatever happens out on the road, and what the race left in the
// run is paid here, once. The door opens for the race that is due and says why not when
// none is (season.js). Three things happen to Jo in this room between races: the morning
// after the Cup, the letter after the Salt Road, and the Coppa coming home.
import { loadSceneChunk } from '../../../core/boarding.js';
import { addCoins, deductWorth, coinWorth } from '../../../systems/wallet.js';
import { sfx } from '../../../systems/audio.js';
import { LAYER_DEPTH } from '../../../world/RoomStreamer.js';
import { CAR_SIZE } from '../../../art/carKit.js';
import { prizeOwed, flagOf } from '../race/result.js';
import { atTheDoor, notYet, nextHook, slateRows, JARS, PRIZE_TRACKS } from '../season.js';
import { uiText } from '../../../ui/text.js';
import { BOX_COL } from '../rooms/pitlane.js';
import { rackConversation, benchConversation } from '../dialogue.js';

const T = 32;
const CAR_COL = 26; // the Heron's middle, room tiles (just inside the shutter at 28)
const ALDO_COL = 19; // his car, beside her, until the Cup
const RACK_COL = 6; // (the props' middles, room tiles)
const BENCH_COL = 12;
const NIGHT = [0x14, 0x12, 0x2a];
const at0 = (r, col) => (r.tx + col) * T + T / 2;

// back from a race short of its gate: somebody says so, once a try (the story waits, it does not end)
const AGAIN = {
  pinewood: ['aldo', 'Again. It was not a good day for me either, the day I did thirty-four.'],
  salt: ['ottavia', 'Off the sheet. The sheet does not pay for trying. Go again.'],
  coppa: ['ottavia', 'The Coppa is not second. Again, and you have it.'],
};
function sayAgain(scene) {
  const F = scene.F;
  const h = nextHook(F);
  if (!h || !AGAIN[h.track]) return;
  const key = flagOf(h.track, 'tries');
  if (!F[key] || F[key] === F._saidTries) return;
  F._saidTries = F[key];
  scene.caption.say(AGAIN[h.track][0], AGAIN[h.track][1], { ms: 3200 });
}

// the shutter: a word first, the first time for that race, then the road
async function atShutter(scene, ctx) {
  if (ctx.state.going) return;
  const F = scene.F;
  const hook = nextHook(F);
  if (!hook) {
    sfx('knock');
    scene.caption.say('jo', notYet(F), { ms: 2800 });
    return;
  }
  ctx.state.going = true;
  const said = `_eve:${hook.id}`;
  if (hook.eve && !F[said]) {
    F[said] = true;
    await scene.runConversation(hook.eve, null);
  }
  goRace(scene, ctx);
}

function goRace(scene, ctx) {
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
  for (const id of PRIZE_TRACKS) payFor(scene, id);
}

function payFor(scene, trackId) {
  const F = scene.F;
  const owed = prizeOwed(F, trackId);
  if (owed <= 0) return;
  // a fifth to Sable Oil, if that clause was left standing or the orders were broken: out of what reaches the wallet
  const cut = F.sable_cut || F.broke_orders;
  const paid = cut ? owed - Math.ceil(owed / 5) : owed;
  // the Salt Road answers the rent: what the tin left short goes up the quay before Jo sees it
  const rentJar = JARS.find((j) => j.id === 'rent');
  const rent = trackId === 'salt' && F.rent_short && !F.rent_paid ? Math.min(paid, rentJar.wants - (F.jar_rent || 0)) : 0;
  if (rent) F.rent_paid = true;
  const kept = paid - rent;
  addCoins(scene.dreamId, kept);
  scene.levelCoins += kept;
  F[flagOf(trackId, 'paid')] = (F[flagOf(trackId, 'paid')] || 0) + owed;
  scene.updateCoinHud();
  // (the flag, the coin count and the wallet's figure are saved together: a save
  // from before this has neither, and BaseLevel takes the coins back on a Continue)
  scene.saveRun();
  sfx('buy');
  const after = cut ? ', after Sable' : '';
  scene.caption.say('ottavia', rent ? `The prize tin: ${paid} brass nuts${after}. Nino has run ${rent} up the quay for the rent. ${kept} for you. Do not thank me.` : `The prize tin: ${paid} brass nuts${after}. Put them somewhere my mother will not find them.`, { ms: 4200 });
  return true;
}

// spend nuts in the garage: out of this dream's count, saved at once with the flag that
// says what they bought, so a Continue can neither refund it nor charge it twice
export function buy(scene, { item, price }) {
  const worth = price * coinWorth(scene.dreamId);
  scene.levelCoins -= price;
  scene.coinsSinceCP = 0; // (what is spent is spent: a fall does not scatter it again)
  deductWorth(scene.dreamId, worth);
  scene.F[item === 'soft' ? 'tyre_soft' : 'buy_chalk'] = true;
  if (item === 'soft') scene.F.tyres_short = false; // (a new set is a new set, whatever the jar could not pay)
  scene.updateCoinHud();
  scene.saveRun();
  sfx('buy');
}

// a conversation built from the run (what is on the shelf, what Jo can pay)
function shop(scene, make) {
  // (from the Cup until she is back from the corridor, there is nobody here to sell anything)
  if (scene.F.done_race2 && !scene.F.jars_done) {
    scene.caption.say('jo', 'Nobody at the bench. Nobody is going to be, today.', { ms: 2400 });
    return null;
  }
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
    const car = (cx, livery, foot = floor) => {
      const parts = [scene.add.image(cx, foot + 2, 'cars', `car-${livery}`).setOrigin(0.5, 1).setDepth(depth)];
      for (const wx of CAR_SIZE.wheelX) parts.push(scene.add.image(cx + wx - CAR_SIZE.frameW / 2, foot - 14 + 2, 'cars', 'wheel-0').setDepth(depth + 0.01));
      return parts;
    };
    ctx.state.shutterCar = car(x, 'heron')[0];
    // the slate: how far he has come, in chalk, on the wall behind the sheeted car
    ctx.state.slate = uiText(scene, at0(r, 23), (r.ty + 10) * T - 44, '', { size: 'body', scale: 1, color: '#f2e6cc', backing: 0x1e2a28, align: 'left', lineSpacing: 2 }).setOrigin(0.5).setDepth(-8.4);
    // Aldo's car: gone the morning after the Cup (a sheeted shape stands there then, room props)
    ctx.state.aldoCar = car((r.tx + ALDO_COL) * T + T / 2, 'dante');
    // and the Heron in her box in the pit lane, for the drill
    const pit = scene.graph.room('pitlane');
    car((pit.tx + BOX_COL) * T + T / 2, 'heron', (pit.ty + 12) * T);
    ctx.state.going = false;
    ctx.state.door = scene.interaction.register({ id: 'race:test', x, y: floor - 20, radius: 110, prompt: 'drive', enabled: () => !ctx.state.going, onUse: () => atShutter(scene, ctx) });
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
    if (!scene.resuming && scene.roomId === 'garage') scene.caption.say('ottavia', "You're the one who plays by ear. Come to the bench. She's flat.", { ms: 4200 });
  },
  update(ctx) {
    const { scene } = ctx;
    const F = scene.F;
    ctx.state.bench.item.prompt = F.tuned ? (F.buy_chalk ? 'the bench' : "Ottavia's chalk") : 'tune by ear';
    for (const p of ctx.state.aldoCar) p.setVisible(!F.done_race2);
    // race 1 is the second car, borrowed; the seat comes with the Heron
    const her = F.done_race1 ? 'car-heron' : 'car-dante';
    if (ctx.state.shutterCar.frame.name !== her) ctx.state.shutterCar.setFrame(her);
    const rows = slateRows(F);
    if (rows !== ctx.state.slateRows) ctx.state.slate.setText((ctx.state.slateRows = rows));
    F.whose_due = !!(F.done_race3 && F.signed); // (Ottavia's question waits for an old run to sign)
    if (scene.roomId !== 'garage') return;
    if (!ctx.state.checked) {
      ctx.state.checked = true; // (the first live frame: a resumed run's flags are in by now)
      scene._objKey = null; // (the race moved the story on since the door's save: ask again, not the saved goal)
      ctx.state.calmAt = scene.time.now + (payPrize(scene) ? 3000 : 0);
      sayAgain(scene);
    }
    if (scene.beats.busy || scene.sceneBox.active || scene.transitions.busy || scene.time.now < ctx.state.calmAt) return;
    // what happens to Jo in this room, once each, in the order the story asks
    const due = F.done_race2 && !F.cup_told ? 'cup_morning' : F.done_race3 && !F.letter_read && !F.garage_again ? 'roche_letter' : F.done_coppa && !F.coppa_home ? 'coppa_home' : null;
    if (due && !ctx.state.talking) {
      ctx.state.talking = true;
      if (due === 'cup_morning') F.cup_told = true;
      scene.runConversation(due, null).then(() => {
        ctx.state.talking = false;
        scene.saveRun();
        if (due === 'coppa_home') scene.beats.play('coppa_note').catch((e) => console.warn('[dream] beat', e));
      });
    }
  },
};
