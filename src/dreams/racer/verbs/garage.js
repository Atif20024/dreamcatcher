// The garage's verb: the Heron at the shutter is the door into the race, and the
// prize tin pays what a race earned. The race itself is RaceScene (its own JS
// chunk): the run is saved first, so a Continue wakes here whatever happens out
// on the road, and what the race left in the run is paid here, once.
import { loadSceneChunk } from '../../../core/boarding.js';
import { addCoins } from '../../../systems/wallet.js';
import { sfx } from '../../../systems/audio.js';
import { LAYER_DEPTH } from '../../../world/RoomStreamer.js';
import { CAR_SIZE } from '../../../art/carKit.js';
import { prizeOwed, flagOf } from '../race/result.js';

const T = 32;
const TRACK = 'test';
const CAR_COL = 26; // the Heron's middle, room tiles (just inside the shutter at 28)
const NIGHT = [0x14, 0x12, 0x2a];

function goRace(scene, ctx) {
  if (ctx.state.going) return;
  ctx.state.going = true;
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
      () => scene.scene.start('Race', { track: TRACK }),
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
  const owed = prizeOwed(F, TRACK);
  if (owed <= 0) return;
  addCoins(scene.dreamId, owed);
  scene.levelCoins += owed;
  F[flagOf(TRACK, 'paid')] = (F[flagOf(TRACK, 'paid')] || 0) + owed;
  scene.updateCoinHud();
  // (the flag, the coin count and the wallet's figure are saved together: a save
  // from before this has neither, and BaseLevel takes the coins back on a Continue)
  scene.saveRun();
  sfx('buy');
  scene.caption.say('ottavia', `The prize tin: ${owed} brass nuts. Put them somewhere your mother will not find them.`, { ms: 3600 });
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
    const frame = (f, dx = 0, dy = 0) => scene.add.image(x + dx, floor + dy, 'cars', f).setOrigin(0.5, 1).setDepth(depth);
    frame('car-heron', 0, 2);
    for (const wx of CAR_SIZE.wheelX) scene.add.image(x + wx - CAR_SIZE.frameW / 2, floor - 14 + 2, 'cars', 'wheel-0').setDepth(depth + 0.01);
    ctx.state.going = false;
    ctx.state.door = scene.interaction.register({ id: 'race:test', x, y: floor - 20, radius: 110, prompt: 'drive', enabled: () => !ctx.state.going, onUse: () => goRace(scene, ctx) });
    if (!scene.resuming) scene.caption.say('ottavia', "You're the one who plays by ear. Good. She is at the door. Don't lift.", { ms: 4200 });
  },
  update(ctx) {
    if (ctx.state.checked) return;
    ctx.state.checked = true; // (the first live frame: a resumed run's flags are in by now)
    payPrize(ctx.scene);
  },
};
