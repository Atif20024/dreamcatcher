// Round 2, WP7 (flow fixes):
//   tool-before-dream   no tool on Jo in the hub; no wrench before the locker
//   opening-skippable   the hub opening ends on a key press, the camera follows Jo
//   dialog-key-label    the dialogue hint names a key that really advances it
//   musician-sign-once  the d0 festival sign exists once
import { getRun, clearRun } from '../../utils/save.js';

const DREAM_IDS = ['chef', 'musician', 'astronaut', 'writer', 'painter', 'gambler'];

async function arrive(dc, dream, place) {
  dc.warp(dream, place);
  for (let i = 0; i < 300; i++) {
    const sc = dc.scene();
    if (sc && sc.player && sc.player.anim && sc.sys.settings.key !== 'Title') break;
    await new Promise((r) => setTimeout(r, 20));
    dc.step(2);
  }
  dc.step(60);
  return dc.scene();
}
const toolShown = (p) => p.tool.visible && p.tool.alpha > 0;
const kd = (code) => window.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true }));

const toolBeforeDream = {
  id: 'tool-before-dream',
  async run(dc) {
    const hub = await arrive(dc, 'hub', null);
    dc.step(20);
    const hubTool = toolShown(hub.player);
    const as = await arrive(dc, 'astronaut', 'gym');
    dc.step(20);
    const before = toolShown(as.player);
    as.setFlag('wrench');
    dc.step(5);
    const after = toolShown(as.player);
    return { pass: !hubTool && !before && after, detail: { hubTool, before, after } };
  },
};

const openingSkippable = {
  id: 'opening-skippable',
  async run(dc) {
    const sc = await arrive(dc, 'hub', null);
    sc.openingDone = false;
    sc.opening();
    dc.step(30);
    const locked = sc.player.controlLockUntil > sc.time.now;
    dc.step(30);
    kd('KeyE');
    dc.step(6);
    const cam = sc.cameras.main;
    const unlocked = sc.player.controlLockUntil <= sc.time.now;
    const following = cam._follow === sc.player && cam.zoom === 1;
    const inFrame = Math.abs(cam.midPoint.x - sc.player.x) < 480 && Math.abs(cam.midPoint.y - sc.player.y) < 270;
    // the unskipped opening still ends by itself in under 3.5 s of game time
    sc.openingDone = false;
    sc.opening();
    dc.step(Math.ceil(3500 / 16.67));
    const selfEnded = !sc.openingActive && sc.player.controlLockUntil <= sc.time.now;
    return { pass: locked && unlocked && following && inFrame && selfEnded, detail: { locked, unlocked, following, inFrame, selfEnded } };
  },
};

const dialogKeyLabel = {
  id: 'dialog-key-label',
  async run(dc) {
    const sc = await arrive(dc, 'hub', null);
    sc.dialog.show([{ name: 'Test', text: 'One.' }, { name: 'Test', text: 'Two.' }]);
    dc.step(120);
    const label = sc.dialog.hint ? sc.dialog.hint.text : '';
    const m = /\[(\w+)\]/.exec(label);
    const code = m ? 'Key' + m[1].toUpperCase() : null;
    const idx0 = sc.dialog.idx;
    if (code) kd(code);
    dc.step(4);
    const advanced = sc.dialog.idx > idx0 || !sc.dialogActive;
    // close it whatever happens
    for (let i = 0; i < 6; i++) { kd('KeyE'); dc.step(3); }
    return { pass: label.includes('[E]') && advanced, detail: { label, code, advanced } };
  },
};

const musicianSignOnce = {
  id: 'musician-sign-once',
  async run(dc) {
    const sc = await arrive(dc, 'musician', null);
    dc.step(30);
    const hits = [];
    const walk = (list) => list.forEach((o) => {
      const t = typeof o.text === 'string' ? o.text : '';
      if (/BIG\s+STAGE/.test(t)) hits.push(t);
      if (o.list) walk(o.list);
    });
    walk(sc.children.list);
    return { pass: hits.length <= 1, detail: { count: hits.length } };
  },
};

const tidy = (sc) => ({
  ...sc,
  async run(dc) {
    const had = Object.fromEntries(DREAM_IDS.map((d) => [d, !!getRun(d)]));
    try {
      return await sc.run(dc);
    } finally {
      for (const d of DREAM_IDS) if (!had[d] && getRun(d)) clearRun(d);
    }
  },
});

export default [toolBeforeDream, openingSkippable, dialogKeyLabel, musicianSignOnce].map(tidy);
