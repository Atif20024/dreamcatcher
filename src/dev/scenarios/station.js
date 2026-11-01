// The station as a place worth coming back to, and the Evening's way out.
//   station-return-staged  back from a dream: dip to the hall under the
//                          dreamcatcher, locked while the strand is woven,
//                          then control, the round woven, Ro's cue
//   station-counts-all     caught short of every running dream: the shop is
//                          open and priced, the chains on; all of them: the
//                          shelf is free, the doors open, the sleeper's bench
//                          empty, and nothing throws
//   station-prompts        each prompt names a verb
//   station-roof-rewards   the coins and the shard are paid once, the far bench
//                          pays when sat on, the clock tower is reached by a jump
//   evening-bench-gate     sitting at the station bench ends nothing at minute
//                          one; six places later it does, with one chime
//   evening-postbox        two presses post the wallet; it goes to zero
import { getSave, updateSave } from '../../utils/save.js';
import { chimeLog } from '../../systems/audio.js';
import { DREAMS } from '../../data/dreams.js';

const T = 32;
const FLOOR = 832;
const ROOF = 256;
const px = (c) => c * T + 16;
const keyOf = (dc) => dc.scene() && dc.scene().sys.settings.key;

// a save for the job, restored afterwards: scenarios write to the real one
async function withSave(fn, patch) {
  const was = JSON.stringify(getSave());
  try {
    updateSave(patch);
    return await fn();
  } finally {
    const back = JSON.parse(was);
    updateSave((s) => Object.assign(s, back));
  }
}

function start(dc, key, data) {
  const g = window.game;
  g.scene.scenes.forEach((s) => {
    const k = s.sys.settings.key;
    if (k !== 'UI' && k !== 'Boot' && s.sys.settings.status >= 1 && s.sys.settings.status <= 7) g.scene.stop(k);
  });
  g.scene.start(key, data);
  dc.step(2);
}

async function hub(dc, data) {
  start(dc, 'Hub', data);
  await dc.run(20);
  return dc.scene();
}

const put = (s, x, y) => {
  s.player.setPosition(x, y);
  s.player.body.reset(x, y);
};

const completeDreamFlat = (s, id) => {
  s.dreams[id] = true;
  s.dreamsCaught += 1;
};

const fresh = (s) => {
  s.dreams = {};
  s.dreamsCaught = 0;
};

const returnStaged = {
  id: 'station-return-staged',
  run: (dc) =>
    withSave(
      async () => {
        const s = await hub(dc, { returnedFrom: 'clockmaker' });
        const rounds0 = s.webRounds.length;
        let f = 0;
        const lockedAtBay = s.player.controlLockUntil > s.time.now;
        while (s.player.x > px(90) && f++ < 900) await dc.run(1);
        const underIt = Math.abs(s.player.x - px(71.5)) < 40;
        const lockedInHall = s.player.controlLockUntil > s.time.now;
        f = 0;
        while (s.player.controlLockUntil > s.time.now && f++ < 500) await dc.run(1);
        const free = s.player.controlLockUntil <= s.time.now;
        const woven = s.webRounds.length === rounds0 + 1;
        const obj = s.objectiveText.text;
        await dc.run(20);
        const room = s._room && s._room.id;
        const pass = lockedAtBay && underIt && lockedInHall && free && woven && room === 'hall' && /last stop/.test(obj);
        return { pass, detail: { lockedAtBay, underIt, lockedInHall, free, woven, room, obj } };
      },
      (s) => {
        fresh(s);
        completeDreamFlat(s, 'clockmaker');
      }
    ),
};

const countsAll = {
  id: 'station-counts-all',
  run: (dc) =>
    withSave(
      async () => {
        const lines = [];
        let pass = true;
        const check = (name, ok) => {
          lines.push(`${name}:${ok ? 'ok' : 'FAIL'}`);
          if (!ok) pass = false;
        };
        const running = DREAMS.filter((d) => d.scene);
        // one short of the board: nothing closed yet
        updateSave((s) => running.slice(1).forEach((d) => completeDreamFlat(s, d.id)));
        let sc = await hub(dc);
        check('n', sc.N === running.length - 1);
        check('open-shy', !sc.allCaught && sc.chains.length > 0);
        check('board-row', /BOARDING/.test(sc.board.rows[DREAMS.indexOf(running[0])].status));
        // the last one
        updateSave((s) => completeDreamFlat(s, running[0].id));
        sc = await hub(dc);
        check('all', sc.allCaught && sc.state.fountain === 'dry');
        check('objective', /the last stop/.test(sc.objectiveText.text));
        check('bench-empty', !sc.npcs.sleeper.visible);
        check('warm-doors', sc.interacts.filter((i) => i.label === 'warm-door').length === 2);
        // Jo reaches the front: the chains fall, once
        put(sc, px(24), FLOOR - 24);
        await dc.run(40);
        check('chains-fell', sc.chains.length === 0 && getSave().flags.hub.chainsFell === true);
        // the stall is open and gives
        const show = sc.dialog.show.bind(sc.dialog);
        const asked = [];
        sc.dialog.show = async (pages) => {
          asked.push(pages[0].text);
          return 'done';
        };
        await sc.shop();
        sc.dialog.show = show;
        check('shelf-free', /never found a price/.test(asked[0]));
        // the tags pay once
        const w0 = getSave().wallet.total;
        await Promise.race([sc.readTags(), new Promise((r) => setTimeout(r, 30))]);
        const w1 = getSave().wallet.total;
        const expect = running.reduce((n, d) => n + d.coin.worth * 5, 0);
        check('tags-paid', w1 - w0 === expect);
        return { pass, detail: lines.join(' ') };
      },
      (s) => {
        fresh(s);
        s.flags.hub.chainsFell = false;
        s.flags.hub.tags = {};
      }
    ),
};

const prompts = {
  id: 'station-prompts',
  run: (dc) =>
    withSave(
      async () => {
        const s = await hub(dc);
        const seen = {};
        const at = async (label, y = FLOOR - 24) => {
          const it = s.interacts.find((i) => i.label === label);
          put(s, it.x, y);
          await dc.run(12);
          seen[label] = s.promptText.visible ? s.promptText.text : null;
        };
        await at('ro');
        await at('pemberton');
        await at('train');
        await at('gate', FLOOR - 56);
        await at('flower');
        await at('lostfound');
        const pass = Object.values(seen).every((t) => /^\[E\] [a-z]/.test(t || ''));
        return { pass, detail: seen };
      },
      fresh
    ),
};

const roofRewards = {
  id: 'station-roof-rewards',
  run: (dc) =>
    withSave(
      async () => {
        let s = await hub(dc);
        const lines = [];
        const leads0 = s.leadCoins.length;
        // the far bench
        put(s, px(151), ROOF - 24);
        await dc.run(30);
        put(s, px(155), ROOF - 24);
        await dc.run(10);
        dc.hold('down');
        await dc.run(280);
        dc.release('down');
        const bench = !!getSave().flags.hub.roofBench && s.farWindow.visible;
        const banked = Object.keys(getSave().flags.hub.leads || {}).length;
        // up the bridge's end onto the clock tower, with what the player knows
        put(s, px(21), ROOF - 24);
        await dc.run(15);
        dc.hold('left');
        let jumped = false;
        let tower = false;
        for (let i = 0; i < 240; i++) {
          await dc.run(1);
          if (s.player.y < 130 && s.player.body.blocked.down) tower = true;
          if (!jumped && s.player.x < px(19) && s.player.body.blocked.down) {
            jumped = true;
            dc.press('jump', 16);
          }
        }
        dc.releaseAll();
        await dc.run(20);
        const shard = !!getSave().flags.hub.towerShard;
        // a new visit: what was paid stays paid
        s = await hub(dc);
        const left = s.leadCoins.length;
        lines.push(`coins ${leads0}->${left}, banked ${banked}`);
        const pass = bench && banked > 0 && tower && shard && left < leads0 && !s.towerShard;
        return { pass, detail: { bench, tower, shard, lines } };
      },
      (s) => {
        fresh(s);
        s.flags.hub.roofBench = false;
        s.flags.hub.towerBench = false;
        s.flags.hub.towerShard = false;
        s.flags.hub.leads = {};
      }
    ),
};

async function evening(dc) {
  start(dc, 'Evening', { fromDoor: true });
  for (let i = 0; i < 400; i++) {
    await dc.run(1);
    if (i % 30 === 0) await new Promise((r) => setTimeout(r, 10));
    const sc = dc.scene();
    if (keyOf(dc) === 'Evening' && sc.world && sc.player) break;
  }
  await dc.run(120);
  return dc.scene();
}

const benchGate = {
  id: 'evening-bench-gate',
  run: (dc) =>
    withSave(
      async () => {
        const s = await evening(dc);
        const b = s.world.benches.find((x) => x.id === 'station_bench');
        const at = () => {
          const y = s.groundY(b.x, 0) - 24;
          put(s, b.x, y);
        };
        at();
        await dc.run(30);
        const notReady = !s.stationReady;
        // a sit past the old 20 s ends nothing yet
        s.joSit({});
        await dc.run(10);
        const sat = s.joSitting && s.sitBench === b;
        s.sitT = 21000;
        await dc.run(10);
        const noEnding = !s.stationEnded;
        s.joStand();
        // an evening had: six places, the chime from the far side of town
        const log0 = chimeLog.length;
        put(s, b.x - 60 * T, s.player.y);
        ['arch', 'orchard', 'laundry', 'square', 'canal', 'steep'].forEach((id) => s.visitedPlaces.add(id));
        await dc.run(40);
        const ready = s.stationReady && chimeLog.slice(log0).some((c) => c.event === 'board');
        s.stationEnded = true; // (the ending itself has its own scenarios)
        const pass = notReady && sat && noEnding && ready;
        return { pass, detail: { notReady, sat, noEnding, ready } };
      },
      (s) => {
        fresh(s);
        s.evening.map = {};
      }
    ),
};

const postbox = {
  id: 'evening-postbox',
  run: (dc) =>
    withSave(
      async () => {
        const s = await evening(dc);
        const w0 = getSave().wallet.total;
        s.postbox();
        await dc.run(5);
        const held = getSave().wallet.total === w0;
        s.postbox();
        await dc.run(5);
        const gone = getSave().wallet.total === 0 && getSave().evening.posted >= w0 && s.postedNow === w0;
        return { pass: held && gone && w0 > 0, detail: { w0, held, gone } };
      },
      (s) => {
        fresh(s);
        s.wallet.total = 77;
        s.evening.posted = 0;
      }
    ),
};

export default [returnStaged, countsAll, prompts, roofRewards, benchGate, postbox];
