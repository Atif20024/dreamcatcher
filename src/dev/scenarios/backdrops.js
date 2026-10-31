// Round 2 WP4 (critique §7.1.2, §5.9): backdrops at the depth rule, trees at
// their real height, and the Evening inside its object budget.
//   backdrop-scale        visits outdoor places in five dreams and the
//                         Evening; every building row painted (the building
//                         kit's ROW_LOG) has storey = 132·s ± 10 % for the s
//                         its BACKDROP_ROWS entry declares, and every
//                         play-plane tree on screen is ≥ 260 px drawn
//   evening-object-budget the Evening's display list stays ≤ 6,000 objects in
//                         every place sampled (it was ~14,000), and the mean
//                         stepped frame cost is logged
import { BACKDROP_ROWS, TREE_TABLE, treePx } from '../../data/scale.js';
import { ROW_LOG } from '../../art/buildingKit.js';

async function arrive(dc, dream, place, frames = 90) {
  dc.warp(dream, place);
  for (let i = 0; i < 300; i++) {
    const sc = dc.scene();
    if (sc && sc.player && sc.sys.settings.key !== 'Title' && sc.cameras && sc.cameras.main) break;
    await new Promise((r) => setTimeout(r, 20));
    dc.step(2);
  }
  dc.step(frames);
  return dc.scene();
}

const backdropScale = {
  id: 'backdrop-scale',
  expect: 'pass',
  async run(dc) {
    const bad = [];
    const trees = [];
    const visits = [['chef', null], ['musician', null], ['writer', 'arrival'], ['painter_legacy', 'arrival'], ['painter_legacy', 'square'], ['painter_legacy', 'fields'], ['gambler_legacy', 'arrival'], ['evening', 'orchard'], ['evening', 'square'], ['evening', 'hill'], ['evening', 'pines']];
    for (const [d, p] of visits) {
      const sc = await arrive(dc, d, p);
      for (const o of sc.children.list) {
        const k = o.texture && o.texture.key;
        if (!k || !TREE_TABLE[k.replace(/-(snow|b)/g, '')]) continue;
        const h = Math.round(o.height * o.scaleY);
        trees.push({ place: `${d}:${p}`, key: k, h });
        if (h < 260) bad.push({ place: `${d}:${p}`, tree: k, h, want: '>= 260' });
      }
    }
    const rows = {};
    for (const [id, r] of Object.entries(ROW_LOG)) {
      const decl = BACKDROP_ROWS[id];
      const want = 132 * (decl ? decl.s : r.s);
      const worst = r.storeys.reduce((m, v) => Math.max(m, Math.abs(v - want) / want), 0);
      rows[id] = { s: r.s, storey: Math.round(r.storeys[0] * 10) / 10, want: Math.round(want * 10) / 10 };
      if (!decl) bad.push({ row: id, why: 'not declared in BACKDROP_ROWS' });
      else if (Math.abs(decl.s - r.s) > 1e-6) bad.push({ row: id, why: `painted at s ${r.s}, declared ${decl.s}` });
      if (worst > 0.1) bad.push({ row: id, why: `storey off by ${Math.round(worst * 100)} %` });
    }
    if (!Object.keys(rows).length) bad.push({ why: 'no building rows were painted' });
    return { pass: bad.length === 0 && trees.length > 0, detail: { rows, trees: trees.slice(0, 30), bad, plane: treePx('plane').h } };
  },
};

const eveningBudget = {
  id: 'evening-object-budget',
  expect: 'pass',
  async run(dc) {
    const out = [];
    for (const p of ['arch', 'square', 'roofs', 'station', 'lake', 'pines', 'ridge']) {
      const sc = await arrive(dc, 'evening', p, 60);
      const t0 = performance.now();
      dc.step(60);
      const ms = (performance.now() - t0) / 60;
      out.push({ place: p, objects: sc.children.list.length, msPerFrame: Math.round(ms * 100) / 100 });
    }
    return { pass: out.every((r) => r.objects <= 6000), detail: { budget: 6000, places: out } };
  },
};

export default [backdropScale, eveningBudget];
