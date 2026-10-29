// Phase 1.1 (failure, checkpoints, save): one failure model in every dream.
// Each scenario runs across Chef, Writer, Gambler and Painter.
//   hit-knockback          a hit costs one heart, knocks back, never teleports
//   zero-hearts-checkpoint zero hearts → death card → back at the last flag,
//                          hearts refilled, same scene instance (no restart),
//                          no dialogue replayed
//   checkpoint-label       touching a flag shows its name; the pause menu names it
//   continue-run           a lit flag saves the run; the hub offers CONTINUE;
//                          continuing wakes Jo at that flag with flags restored
import { getRun, clearRun } from '../../utils/save.js';

const DREAMS = [
  { id: 'chef', place: null, scene: 'Chef' },
  { id: 'writer', place: 'cafe', scene: 'Writer' },
  { id: 'gambler', place: 'lou', scene: 'Gambler' },
  { id: 'painter_legacy', run: 'painter', place: 'fields', scene: 'Painter' }, // the Yellow House (THE MASTER'S LADDER is a framework dream),
];

const dist = (a, b) => Math.round(Math.hypot(a.x - b.x, a.y - b.y));

// warp in and get past any opening conversation / tutorial card
function enter(dc, d) {
  dc.warp(d.id, d.place);
  dc.step(80);
  settle(dc);
  return dc.scene();
}

function settle(dc) {
  for (let i = 0; i < 60; i++) {
    const sc = dc.scene();
    if (!(sc.dialogActive || sc.tutorialActive || sc.cardActive)) break;
    dc.press('action', 2);
    dc.step(30);
  }
  dc.step(5);
}

// the flag nearest Jo that is not lit yet
function nearestFlag(sc) {
  const p = sc.player;
  return sc.flags
    .getChildren()
    .filter((f) => f.texture.key === 'flag')
    .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
}

async function each(dc, fn) {
  const out = [];
  let pass = true;
  for (const d of DREAMS) {
    let r;
    try {
      r = fn(enter(dc, d), d);
    } catch (e) {
      r = { pass: false, detail: `threw ${e.message}` };
    }
    if (!r.pass) pass = false;
    out.push(`${d.id}: ${r.pass ? 'ok' : 'FAIL'} (${r.detail})`);
    dc.releaseAll();
  }
  return { pass, detail: out.join('; ') };
}

export const hitKnockback = {
  id: 'hit-knockback',
  async run(dc) {
    return each(dc, (sc) => {
      const p = sc.player;
      const before = { x: p.x, y: p.y };
      const cp = { ...sc.checkpoint };
      // move the flag point far away so a teleport would be unmistakable
      sc.checkpoint = { x: before.x + 2000, y: before.y };
      const h0 = sc.lives;
      sc.invulnUntil = 0;
      const landed = sc.hurt({ sourceX: p.x + 40 });
      dc.step(20);
      const lost = h0 - sc.lives;
      const moved = dist(before, p);
      const vxAway = p.x < before.x; // source was to the right
      sc.checkpoint = cp;
      // and i-frames: an immediate second hit is ignored
      const second = sc.hurt();
      const ok = landed && lost === 1 && moved < 200 && vxAway && !second;
      return { pass: ok, detail: `lost ${lost} heart, moved ${moved}px ${vxAway ? 'away' : 'toward'}, second hit ${second ? 'landed' : 'blocked'}` };
    });
  },
};

export const zeroHeartsCheckpoint = {
  id: 'zero-hearts-checkpoint',
  async run(dc) {
    return each(dc, (sc) => {
      const f = nearestFlag(sc);
      if (!f) return { pass: false, detail: 'no unlit flag' };
      sc.activateCheckpoint(f);
      const cp = { ...sc.checkpoint };
      sc.__sameRun = true;
      // walk him away from the flag, then the last heart goes
      sc.placePlayer({ x: cp.x + 300, y: cp.y - 40 });
      dc.step(10);
      sc.lives = 1;
      sc.invulnUntil = 0;
      sc.hurt();
      dc.step(40);
      const card = sc.pauseMenu.state();
      const items = card.items.join(',');
      dc.step(45); // past the card's anti-mash guard
      dc.press('action', 2);
      dc.step(10);
      const now = dc.scene();
      const same = now === sc && sc.__sameRun === true;
      const at = dist(sc.player, cp);
      const full = sc.lives === sc.maxLives;
      // feedback 3: the card offers the checkpoint first, then the dream from its start and the station
      const ok = card.open && items === 'retry,restartDream,station,pause' && same && at < 60 && full && !sc.dialogActive;
      return { pass: ok, detail: `card [${items}] ${card.open ? 'open' : 'closed'}; same scene ${same}; ${at}px from ${cp.label}; hearts ${sc.lives}/${sc.maxLives}; dialog ${!!sc.dialogActive}` };
    });
  },
};

export const checkpointLabel = {
  id: 'checkpoint-label',
  async run(dc) {
    return each(dc, (sc) => {
      const f = nearestFlag(sc);
      if (!f) return { pass: false, detail: 'no unlit flag' };
      sc.placePlayer({ x: f.x, y: f.y - 8 });
      dc.step(6); // the overlap lights it
      const lit = f.texture.key === 'flag-lit';
      // the banner is screen-space, so it lives on UIScene (phase 1.2)
      const ui = window.game.scene.getScene('UI');
      const banner = [...sc.children.list, ...(ui ? ui.children.list : [])].find((o) => o.name === 'checkpoint-label' && o.active);
      const shown = banner ? banner.rawText || banner.text : null;
      dc.press('esc', 2);
      dc.step(2);
      const menu = sc.pauseMenu.state();
      const names = (sc.pauseMenu.lines || []).join(' ') + ' ' + sc.pauseMenu.items.map((i) => i.label).join(' ');
      const inMenu = !!f.cpLabel && names.includes(f.cpLabel);
      dc.press('esc', 2);
      dc.step(4);
      const closed = !sc.pauseMenu.isOpen && !sc.paused;
      const ok = lit && !!f.cpLabel && shown === `— ${f.cpLabel} —` && menu.open && inMenu && closed;
      return { pass: ok, detail: `${f.cpId} lit=${lit}, banner "${shown}", pause menu names it ${inMenu}, Esc closes ${closed}` };
    });
  },
};

export const continueRun = {
  id: 'continue-run',
  async run(dc) {
    return each(dc, (sc, d) => {
      const f = nearestFlag(sc);
      if (!f) return { pass: false, detail: 'no unlit flag' };
      sc.F.__probe = true;
      sc.activateCheckpoint(f); // autosaves the run
      const run = getRun(d.run || d.id);
      if (!run || run.checkpointId !== f.cpId) return { pass: false, detail: `no saved run at ${f.cpId}` };
      // the station offers it
      dc.warp('hub');
      dc.step(10);
      const hub = dc.scene();
      const row = hub.boardRows().find((r) => r.status === 'CONTINUE');
      const offered = !!row;
      // what "Continue dream" does
      const g = window.game;
      g.scene.getScenes(true).forEach((s) => g.scene.stop(s.sys.settings.key));
      const url = new URL(window.location.href);
      ['at', 'wr', 'pt', 'gm', 'ev', 'warp'].forEach((k) => url.searchParams.delete(k));
      window.history.replaceState(null, '', url);
      g.scene.start(d.scene, { levelKey: d.run || d.id, resume: true });
      dc.step(80);
      settle(dc);
      const sc2 = dc.scene();
      const at = dist(sc2.player, run.pos);
      const flagsBack = sc2.F && sc2.F.__probe === true;
      const relit = sc2.checkpoints.spriteFor(f.cpId) && sc2.checkpoints.spriteFor(f.cpId).texture.key === 'flag-lit';
      const label = sc2.checkpoint.label === f.cpLabel;
      clearRun(d.run || d.id);
      const ok = offered && at < 80 && flagsBack && relit && label;
      return { pass: ok, detail: `hub CONTINUE ${offered}; woke ${at}px from ${f.cpLabel}; flags ${flagsBack}; flag relit ${!!relit}` };
    });
  },
};

export default [hitKnockback, zeroHeartsCheckpoint, checkpointLabel, continueRun];
