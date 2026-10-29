// Feedback 3 (the owner's third playtest):
//   restart-checkpoint-<dream>   pause → Restart from checkpoint: back at the lamp
//   restart-dream-<dream>        pause → Restart dream from the start → Yes:
//                                the run, its coins and its items are gone; other
//                                dreams caught stay caught (legacy and framework)
//   restart-death-card           the zero-hearts card offers the three ways on
//   restart-evening              the Evening's pause: [R], then [Y]
//   volume-sliders               Settings has Music and Ambience volumes, persisted
//   reading-panel                every document Jo reads opens large, level,
//                                high-contrast and paged (paper, notebook, list,
//                                contract, page three)
//   jo-light-rooms               a light in dark rooms, put away in lit ones
//   jo-locator                   the brief marker on a respawn; his silhouette
//                                through something in front of him
//   ladder-jump-<dream>          a jump from the middle of a ladder, with and
//                                without a direction; no re-grab inside 150 ms
import { getSave, updateSave, getRun } from '../../utils/save.js';
import { DREAM_WARP } from '../warp.js';
import { ReadingPanel, readDocument } from '../../ui/ReadingPanel.js';
import { READING } from '../../ui/readingLayout.js';
import { getVolume, setVolume } from '../../ui/settingsItems.js';
import { CONTRACT_DOC } from '../../dreams/painter/contract.js';
import { PAGE_THREE } from '../../data/writer/cast.js';
import { LADDER_REGRAB_MS } from '../../entities/Player.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function arrive(dc, dream, place) {
  const want = DREAM_WARP[dream].scene;
  const ready = () => {
    const sc = dc.scene();
    return sc && sc.player && sc.player.anim && sc.sys.settings.key === want && sc.sys.isActive();
  };
  for (let attempt = 0; attempt < 3 && (attempt === 0 || !ready()); attempt++) {
    dc.warp(dream, place);
    for (let i = 0; i < 150 && !ready(); i++) {
      await wait(20);
      dc.step(2);
    }
  }
  dc.step(40);
  const sc = dc.scene();
  if (sc.openingSkip) sc.openingSkip();
  for (let i = 0; i < 40; i++) {
    const s = dc.scene();
    if (!(s.dialogActive || s.tutorialActive || s.cardActive)) break;
    dc.press('action', 2);
    dc.step(20);
  }
  if (sc.modals) sc.modals.closeAll();
  dc.step(20);
  return dc.scene();
}

// a fresh scene after a restart (the same instance, a new create)
async function afterRestart(dc, old) {
  for (let i = 0; i < 120; i++) {
    await wait(20);
    dc.step(3);
    const sc = dc.scene();
    if (sc && sc.player && sc.player !== old && sc.sys.isActive()) {
      dc.step(20);
      return sc;
    }
  }
  return dc.scene();
}

// ---- restart from checkpoint ----------------------------------------------
function restartCheckpoint(dream, place) {
  return {
    id: `restart-checkpoint-${dream}`,
    async run(dc) {
      const sc = await arrive(dc, dream, place);
      const cp = sc.checkpoint;
      sc.player.setPosition(cp.x + 300, cp.y - 40);
      sc.player.body.reset(cp.x + 300, cp.y - 40);
      dc.step(4);
      sc.openPauseMenu();
      const items = sc.pauseMenu.state().items;
      const ok = items.includes('restart') && items.includes('restartDream') && items.includes('station');
      sc.pauseMenu.choose('restart');
      dc.step(10);
      const d = Math.hypot(sc.player.x - cp.x, sc.player.y - cp.y);
      return { pass: ok && d < 40 && !sc.pauseMenu.isOpen, detail: `items ${items.join(',')}; ${Math.round(d)} px from the lamp after restart` };
    },
  };
}

// ---- restart the dream from its start ------------------------------------
function restartDream(dream, place) {
  return {
    id: `restart-dream-${dream}`,
    async run(dc) {
      let sc = await arrive(dc, dream, place);
      const caughtBefore = JSON.stringify(getSave().dreams || {});
      const walletBefore = getSave().wallet.total;
      // this run: three coins, an item, a flag, a lit lamp, saved
      const { addCoins } = await import('../../systems/wallet.js');
      addCoins(sc.dreamId, 3);
      sc.levelCoins = (sc.levelCoins || 0) + 3;
      (sc.satchel ||= []).push('a test key');
      if (sc.F) sc.F.f3_restart_probe = true;
      sc.saveRun();
      const saved = !!getRun(sc.dreamId);
      const old = sc.player;
      sc.openPauseMenu();
      sc.pauseMenu.choose('restartDream');
      const confirm = sc.pauseMenu.state();
      const asked = confirm.items.includes('restartYes') && confirm.items.includes('restartNo');
      sc.pauseMenu.choose('restartYes');
      sc = await afterRestart(dc, old);
      const run = getRun(sc.dreamId);
      const wallet = getSave().wallet.total;
      const clean = !(sc.F && sc.F.f3_restart_probe) && !(sc.satchel || []).includes('a test key') && (sc.levelCoins || 0) === 0;
      const sameCaught = JSON.stringify(getSave().dreams || {}) === caughtBefore;
      const pass = saved && asked && clean && sameCaught && wallet === walletBefore && (!run || !(run.flags || {}).f3_restart_probe);
      return { pass, detail: `saved ${saved}, asked ${asked}, clean ${clean}, wallet ${walletBefore}→${wallet}, caught kept ${sameCaught}, run after ${run ? 'fresh' : 'cleared'}` };
    },
  };
}

const deathCard = {
  id: 'restart-death-card',
  async run(dc) {
    const sc = await arrive(dc, 'chef', null);
    sc.openDeathCard();
    const items = sc.pauseMenu.state().items;
    sc.pauseMenu.choose('retry');
    dc.step(10);
    const pass = ['retry', 'restartDream', 'station'].every((i) => items.includes(i));
    return { pass, detail: `death card: ${items.join(', ')}` };
  },
};

const eveningRestart = {
  id: 'restart-evening',
  async run(dc) {
    let sc = await arrive(dc, 'evening', 'square');
    const old = sc.player;
    sc.openPause();
    sc.paused.openedAt = -1e9; // (its guard reads the loop's clock, which the step clock does not move)
    dc.step(20);
    dc.press('KeyR', 2);
    const asked = !!(sc.paused && sc.paused.confirm);
    dc.press('KeyY', 2);
    sc = await afterRestart(dc, old);
    const pass = asked && sc.sys.settings.key === 'Evening' && sc.player !== old && !sc.paused;
    return { pass, detail: `asked ${asked}; restarted ${sc.player !== old}` };
  },
};

// ---- the volume sliders ------------------------------------------------------
const volumeSliders = {
  id: 'volume-sliders',
  async run(dc) {
    const sc = await arrive(dc, 'chef', null);
    const was = { music: getVolume('music'), ambience: getVolume('ambience') };
    sc.openPauseMenu();
    sc.pauseMenu.choose('settings');
    const items = sc.pauseMenu.state().items;
    sc.pauseMenu.adjust('vol:music', -1);
    sc.pauseMenu.adjust('vol:ambience', -1);
    sc.pauseMenu.adjust('vol:ambience', -1);
    const got = { music: getVolume('music'), ambience: getVolume('ambience') };
    // put them back as they were
    setVolume('music', was.music);
    setVolume('ambience', was.ambience);
    sc.pauseMenu.destroy();
    sc.freezeWorld(false);
    const pass = items.includes('vol:music') && items.includes('vol:ambience') && Math.abs(got.music - (was.music - 0.1)) < 0.01 && Math.abs(got.ambience - (was.ambience - 0.2)) < 0.01;
    return { pass, detail: `items ${items.join(',')}; music ${was.music}→${got.music}, ambience ${was.ambience}→${got.ambience} (restored)` };
  },
};

// ---- the reading panel ---------------------------------------------------------
function checkPanel(sc, label) {
  const st = ReadingPanel.last && ReadingPanel.last.scene === sc ? ReadingPanel.last.state() : null;
  if (!st || !st.open) return `${label}: not open`;
  const bad = [];
  if (st.cap < READING.minCap) bad.push(`cap ${st.cap}`);
  if (st.contrast < READING.minContrast) bad.push(`contrast ${st.contrast}`);
  if (st.angle) bad.push(`angle ${st.angle}`);
  if (!st.fits) bad.push('overflows');
  return bad.length ? `${label}: ${bad.join(' ')}` : null;
}

async function readThrough(dc, sc) {
  const st = ReadingPanel.last.state();
  for (let i = 0; i < st.pages + 1 && ReadingPanel.last.isOpen; i++) {
    dc.press('KeyE', 2);
    dc.step(16);
  }
  return st;
}

const readingPanel = {
  id: 'reading-panel',
  async run(dc) {
    const rows = [];
    const fails = [];
    // the station's newspaper (an interact)
    let sc = await arrive(dc, 'hub', null);
    let it = (sc.interacts || []).find((x) => /read the paper/.test(typeof x.label === 'function' ? x.label() : x.label));
    if (it) it.cb();
    else readDocument(sc, { title: 'The Evening Crossroads', text: 'missing interact', name: 'paper' });
    dc.step(20);
    let f = checkPanel(sc, 'paper');
    if (!it) f = 'paper: no [E] read the paper interact';
    if (f) fails.push(f);
    rows.push(`paper ${ReadingPanel.last.state().pages}p`);
    await readThrough(dc, sc);
    // Priya's notebook: five pages
    sc = await arrive(dc, 'astronaut', 'gym');
    readDocument(sc, { title: "Priya's notebook", pages: (await import('../../data/astronautData.js')).NOTEBOOK, name: 'notebook' });
    dc.step(20);
    f = checkPanel(sc, 'notebook');
    if (f) fails.push(f);
    const nb = ReadingPanel.last.state();
    if (nb.pages < 5) fails.push(`notebook: ${nb.pages} pages`);
    rows.push(`notebook ${nb.pages}p`);
    await readThrough(dc, sc);
    if (ReadingPanel.last.isOpen) fails.push('notebook: [E] did not page to the end');
    // the painter's contract (the beat's own verb)
    sc = await arrive(dc, 'painter', null);
    sc.beatHandlers().read(CONTRACT_DOC);
    dc.step(20);
    f = checkPanel(sc, 'contract');
    if (f) fails.push(f);
    rows.push(`contract ${ReadingPanel.last.state().pages}p`);
    await readThrough(dc, sc);
    // page three (the writer)
    sc = await arrive(dc, 'writer', 'attic');
    readDocument(sc, { title: 'Page three', text: PAGE_THREE.join(' '), name: 'page-three' });
    dc.step(20);
    f = checkPanel(sc, 'page three');
    if (f) fails.push(f);
    rows.push(`page three ${ReadingPanel.last.state().pages}p`);
    await readThrough(dc, sc);
    // the Evening's list, from its pause ([L])
    sc = await arrive(dc, 'evening', 'square');
    sc.openPause();
    sc.paused.openedAt = -1e9; // (its guard reads the loop's clock, which the step clock does not move)
    dc.step(20);
    dc.press('KeyL', 2);
    dc.step(20);
    f = checkPanel(sc, 'evening list');
    if (f) fails.push(f);
    rows.push(`evening list ${ReadingPanel.last && ReadingPanel.last.scene === sc ? ReadingPanel.last.state().pages : 0}p`);
    if (ReadingPanel.last && ReadingPanel.last.isOpen) ReadingPanel.last.close();
    dc.step(4);
    if (sc.paused) dc.press('Escape', 2);
    return { pass: fails.length === 0, detail: `${rows.join(', ')}${fails.length ? ` | ${fails.join('; ')}` : ''}` };
  },
};

// ---- Jo's light ---------------------------------------------------------------------
const joLightRooms = {
  id: 'jo-light-rooms',
  async run(dc) {
    // the chef: a candle on the night kerb, put away in the bright kitchen
    let sc = await arrive(dc, 'chef', null);
    dc.step(30);
    const kerb = sc.player.light.state();
    const kitchen = sc.built.rooms.find((r) => r.id === 'the_line' || r.id === 'the_pass');
    sc.player.light.isDark = () => false; // as in a lit room
    sc._room = kitchen;
    delete sc.player.light.isDark;
    dc.step(30);
    const lit = sc.player.light.state();
    // the painter: none in the bottega by day
    sc = await arrive(dc, 'painter', null);
    dc.step(30);
    const day = sc.player.light.state();
    const pass = kerb.dark && kerb.raised > 0.95 && kerb.kind === 'candle' && !lit.dark && lit.raised < 0.05 && !day.dark && day.raised < 0.05;
    return { pass, detail: `kerb ${kerb.kind} raised ${kerb.raised.toFixed(2)}; kitchen raised ${lit.raised.toFixed(2)}; bottega ${day.kind} raised ${day.raised.toFixed(2)}` };
  },
};

const joLocator = {
  id: 'jo-locator',
  async run(dc) {
    const sc = await arrive(dc, 'chef', null);
    const L = sc.player.locator;
    L.lastAt = -1e9;
    sc.respawnAtCheckpoint();
    dc.step(6);
    const pulsed = L.log.some((l) => l.reason === 'respawn') && L.state().live;
    dc.step(80);
    const gone = !L.state().live;
    // something big and opaque in front of him: his silhouette shows over it
    const f = sc.player.feet();
    if (!sc.textures.exists('f3-occluder')) {
      const t = sc.textures.createCanvas('f3-occluder', 64, 96);
      t.context.fillStyle = '#4a3a30';
      t.context.fillRect(0, 0, 64, 96);
      t.refresh();
    }
    const occ = sc.add.image(f.x, f.y - 40, 'f3-occluder').setDepth(20);
    dc.step(20);
    const seen = L.state().silhouette;
    occ.destroy();
    dc.step(20);
    const after = L.state().silhouette;
    return { pass: pulsed && gone && seen && !after, detail: `pulse ${pulsed}, gone after ~1 s ${gone}, silhouette behind cover ${seen}, then ${after}` };
  },
};

// ---- ladder jump ---------------------------------------------------------------------
function findLadder(sc) {
  const lg = sc.ladderGrid;
  if (!lg) return null;
  const rows = Object.keys(lg).map(Number).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  for (const ty of rows) {
    for (const tx of Object.keys(lg[ty] || {}).map(Number)) {
      if (!lg[ty][tx]) continue;
      if ([1, 2, 3].every((k) => lg[ty + k] && lg[ty + k][tx])) return { tx, ty: ty + 2 };
    }
  }
  return null;
}

async function onLadder(dc, sc, at) {
  const p = sc.player;
  const x = at.tx * 32 + 16;
  const y = at.ty * 32 + 16;
  p.setPosition(x, y);
  p.body.reset(x, y);
  dc.releaseAll();
  dc.hold('up');
  dc.step(3);
  dc.release('up');
  dc.step(2);
  return p.climbing;
}

function ladderJump(dream, places) {
  return {
    id: `ladder-jump-${dream}`,
    async run(dc) {
      let sc = null;
      let at = null;
      for (const pl of places) {
        sc = await arrive(dc, dream, pl);
        at = findLadder(sc);
        if (at) break;
      }
      if (!at) return { pass: false, detail: `no ladder found in ${dream} (${places.join(', ')})` };
      const p = sc.player;
      // 1. with a direction: off to the right at run speed, rising
      const on1 = await onLadder(dc, sc, at);
      const y0 = p.y;
      dc.hold('right');
      dc.press('jump', 1);
      const off1 = !p.climbing;
      const vx1 = p.body.velocity.x;
      dc.step(6);
      const rose = p.y < y0 - 10;
      dc.release('right');
      // 2. no direction: a hop; holding up inside 150 ms does not catch the ladder
      const on2 = await onLadder(dc, sc, at);
      const n0 = p.ladderJumps || 0;
      dc.press('jump', 1);
      const off2 = !p.climbing && (p.ladderJumps || 0) === n0 + 1;
      dc.hold('up');
      const frames = Math.floor(LADDER_REGRAB_MS / 16.67) - 3;
      let regrabbed = false;
      for (let i = 0; i < frames; i++) {
        dc.step(1);
        if (p.climbing) regrabbed = true;
      }
      dc.release('up');
      dc.step(30);
      const pass = on1 && off1 && vx1 > 100 && rose && on2 && off2 && !regrabbed;
      return { pass, detail: `ladder at ${at.tx},${at.ty}; on ${on1}/${on2}; jump off ${off1} vx ${Math.round(vx1)} rose ${rose}; hop ${off2}; re-grab inside ${LADDER_REGRAB_MS} ms ${regrabbed}` };
    },
  };
}

export default [
  restartCheckpoint('chef', null),
  restartCheckpoint('clockmaker', null),
  restartDream('chef', null),
  restartDream('writer', 'attic'),
  restartDream('clockmaker', null),
  restartDream('painter', null),
  deathCard,
  eveningRestart,
  volumeSliders,
  readingPanel,
  joLightRooms,
  joLocator,
  ladderJump('writer', ['attic', 'arrival']),
  ladderJump('painter', ['chapel', 'bottega', 'palazzo', 'guild']),
];
