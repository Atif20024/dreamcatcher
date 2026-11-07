// Round 2, WP3 (trains and the hub presentation, critique §7.3):
//   train-scale    every hub bay's carriage end is >= 2.1 × Jo's drawn height
//                  on screen, the side door >= 1.15 × Jo's body
//   board-train    [E] at a bay gate → Jo walks in → the dream's intro starts,
//                  with at most 3 s of locked control after the choice
//   arrival-train  the dream intro: the train's door sill sits two steps over
//                  the platform, Jo steps down onto it, the train leaves and
//                  the platform lamp is lit
import { TRAIN } from '../../art/trainKit.js';
import { JO } from '../../data/scale.js';

async function arrive(dc, dream, place) {
  dc.warp(dream, place);
  for (let i = 0; i < 300; i++) {
    const sc = dc.scene();
    if (sc && sc.player && sc.player.anim && sc.sys.settings.key !== 'Title') break;
    await new Promise((r) => setTimeout(r, 20));
    dc.step(2);
  }
  dc.step(60);
  const sc = dc.scene();
  if (sc.openingSkip) sc.openingSkip();
  return sc;
}

const trainScale = {
  id: 'train-scale',
  async run(dc) {
    const sc = await arrive(dc, 'hub', null);
    const jo = JO.withHat; // Jo's drawn height with his hat (the rig bake guarantees it)
    const rows = Object.entries(sc.trains).map(([id, t]) => {
      const h = t.end ? t.end.displayHeight * (t.box && t.box.active ? t.box.scaleY : 1) : 0;
      return { id, end: t.box && t.box.active ? Math.round(h) : null, ratio: t.box && t.box.active ? +(h / jo).toFixed(2) : null };
    });
    const live = rows.filter((r) => r.end !== null);
    const doorRatio = +(TRAIN.doorH / JO.body).toFixed(2);
    const pass = live.length > 0 && live.every((r) => r.ratio >= 2.1) && doorRatio >= 1.15;
    return { pass, detail: { jo, doorRatio, rows } };
  },
};

const boardTrain = {
  id: 'board-train',
  async run(dc) {
    const sc = await arrive(dc, 'hub', null);
    const d = (await import('../../data/dreams.js')).DREAMS.find((x) => x.scene && !sc.save.dreams[x.id]);
    if (!d) return { pass: true, detail: { skipped: 'every running dream caught' } };
    const t = sc.trains[d.id];
    sc.player.setPosition(t.gateX - 10, sc.player.y);
    dc.step(20);
    // the conductor's question is answered "board" at once
    const show = sc.dialog.show.bind(sc.dialog);
    sc.dialog.show = async () => 'board';
    const it = sc.interacts.find((i) => i.label === 'train' && Math.abs(i.x - t.gateX) < 4);
    const prompted = !!it && it.when();
    it.cb();
    await Promise.resolve();
    await dc.run(1);
    const t0 = sc.time.now;
    let walked = false;
    let minScale = 1;
    let frames = 0;
    while (dc.scene() === sc && frames < 400) {
      await dc.run(1);
      frames++;
      if (t.state === 'boarding') walked = true;
      const img = sc.children.list.find((c) => c.texture && c.texture.key === 'jo' && c !== sc.player.art && c.visible && c.alpha > 0);
      if (img) minScale = Math.min(minScale, img.scaleX);
    }
    sc.dialog.show = show;
    const lockMs = frames * 16.67;
    const next = dc.scene() && dc.scene().sys.settings.key;
    void t0;
    return { pass: prompted && walked && minScale < 0.9 && next === 'Intro' && lockMs <= 3100, detail: { prompted, walked, minScale: +minScale.toFixed(2), lockMs: Math.round(lockMs), next } };
  },
};

const arrivalTrainScenario = {
  id: 'arrival-train',
  async run(dc) {
    const results = {};
    for (const id of ['chef', 'gambler']) {
      const hub = await arrive(dc, 'hub', null);
      hub.scene.start('Intro', { levelKey: id });
      for (let i = 0; i < 40 && dc.scene().sys.settings.key !== 'Intro'; i++) dc.step(1);
      const sc = dc.scene();
      dc.step(2);
      const tr = sc.train;
      const sill = tr.sillY;
      const step = +(sc.groundY - sill).toFixed(1);
      dc.step(Math.ceil(1400 / 16.67));
      const joOnPlatform = Math.abs(sc.jo.y - sc.groundY) < 1;
      let departed = false;
      for (let i = 0; i < 260; i++) {
        dc.step(1);
        if (tr.state === 'gone') {
          departed = true;
          break;
        }
      }
      dc.step(30);
      const lampOn = /-on-/.test(sc.lamp.texture.key);
      results[id] = { step, joOnPlatform, departed, lampOn, train: TRAIN.height };
      sc.enter();
      dc.step(40);
    }
    const pass = Object.values(results).every((r) => r.step > 0 && r.step <= 30 && r.joOnPlatform && r.departed && r.lampOn);
    return { pass, detail: results };
  },
};

export default [trainScale, boardTrain, arrivalTrainScenario];
