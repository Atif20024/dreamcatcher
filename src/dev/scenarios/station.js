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
import { runningDreams } from '../../systems/hubState.js';

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
        // Jo was away for a long dream: the Hub's clock did not run meanwhile
        start(dc, 'Hub');
        window.game.scene.stop('Hub');
        dc.step(1, 120000);
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
        const running = runningDreams();
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
        put(s, px(162), ROOF - 24);
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
        const n0 = chimeLog.length ? chimeLog[chimeLog.length - 1].seq : 0;
        put(s, b.x - 60 * T, s.player.y);
        ['arch', 'orchard', 'laundry', 'square', 'canal', 'steep'].forEach((id) => s.visitedPlaces.add(id));
        await dc.run(40);
        const ready = s.stationReady && chimeLog.filter((c) => c.seq > n0).some((c) => c.event === 'board');
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

// the stall: a shard costs what it says and joins the tally; with the row at its
// longest Bilal says so and keeps his shard (and Jo's money)
const bilalBuy = {
  id: 'bilal-buy',
  run: (dc) =>
    withSave(
      async () => {
        const s = await hub(dc);
        const show = s.dialog.show.bind(s.dialog);
        const said = [];
        let answers = ['shard', 'done'];
        s.dialog.show = async (pages) => {
          said.push(pages[0].text);
          return pages[0].choices ? answers.shift() : undefined;
        };
        s.allCaught = false;
        s.difficulty = 0;
        await s.shop();
        const paid = getSave().wallet.total === 440 && getSave().shards === 1 && getSave().shop.shardsBought === 1;
        // five catches and nine shards: eight hearts already
        updateSave((x) => (x.shards = 9));
        s.difficulty = 5;
        said.length = 0;
        answers = ['shard', 'done'];
        await s.shop();
        const full = said.some((t) => /full/.test(t)) && getSave().wallet.total === 440 && getSave().shards === 9 && getSave().shop.shardsBought === 1;
        s.dialog.show = show;
        return { pass: paid && full, detail: { paid, full, said } };
      },
      (x) => {
        x.wallet.total = 500;
        x.shards = 0;
        x.shop.shardsBought = 0;
      }
    ),
};

// a shard or a coin is paid once, whatever a reload does; the postcard's mark goes
// with the thing it marks; a whole heart of shards counts at once, past the old six
const continueOnce = {
  id: 'continue-pays-once',
  run: (dc) =>
    withSave(
      async () => {
        const { addCoins } = await import('../../systems/wallet.js');
        const { clearRun, getRun, setRun } = await import('../../utils/save.js');
        const lines = [];
        let pass = true;
        const check = (name, ok, extra = '') => {
          lines.push(`${ok ? 'ok' : 'FAIL'} ${name}${extra === '' ? '' : ` (${extra})`}`);
          pass = pass && ok;
        };
        clearRun('chef');
        dc.warp('chef', 'cold');
        await dc.run(60);
        for (let k = 0; k < 3 && !dc.scene().player; k++) await dc.run(40);
        let s = dc.scene();
        s.difficulty = 5;
        s.maxLives = 6;
        s.lives = 6;
        const shard = s.shardItems[0];
        check('the postcard marks the shard', !!(shard.mark && shard.mark.active));
        s.player.setPosition(shard.x, shard.y);
        s.player.body.reset(shard.x, shard.y);
        await dc.run(2);
        check('the sixth shard: a seventh heart, at once', s.maxLives === 7 && s.lives === 7 && getSave().shards === 6, `${s.lives}/${s.maxLives}`);
        check('saved at the pickup', (getRun('chef').extra.shardsTaken || []).includes(shard.pickKey));

        // coins taken since that save, then the page goes away
        const was = getSave().wallet.byDream.chef || 0;
        const total = getSave().wallet.total;
        addCoins('chef', 10);
        s.scene.restart({ dreamId: 'chef', resume: true });
        await dc.run(30);
        s = dc.scene();
        check('the shard stays gone', !s.shardItems[0].active && getSave().shards === 6);
        check('its mark stays gone', !s.shardItems[0].mark.active);
        check('coins since the save come back out', getSave().wallet.total === total && (getSave().wallet.byDream.chef || 0) === was, `${total} -> ${getSave().wallet.total}`);

        // a save from before: no figure, nothing touched
        const r = getRun('chef');
        delete r.extra.walletAtSave;
        setRun('chef', r);
        addCoins('chef', 10);
        const kept = getSave().wallet.total;
        s.scene.restart({ dreamId: 'chef', resume: true });
        await dc.run(30);
        check('an old save loads, wallet untouched', getSave().wallet.total === kept && !!dc.scene().player);
        clearRun('chef');

        // the old scenes' moments
        clearRun('writer');
        dc.warp('writer', 'library');
        await dc.run(60);
        for (let k = 0; k < 3 && !dc.scene().player; k++) await dc.run(40);
        s = dc.scene();
        const m = s.momentMarks[0];
        check('the postcard marks a moment', !!(m && m.mark.active));
        if (m) {
          s.tutorialActive = false;
          s.F[m.id] = true;
          s.updatePickups(s.time.now, 16);
          check('its mark goes when taken', !m.mark.active);
        }
        clearRun('writer');
        return { pass, detail: lines.join('; ') };
      },
      (x) => {
        x.shards = 5;
        x.shop.postcards.chef = true;
        x.shop.postcards.writer = true;
      }
    ),
};

export default [returnStaged, countsAll, prompts, roofRewards, benchGate, postbox, bilalBuy, continueOnce];
