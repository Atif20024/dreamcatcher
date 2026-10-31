// PerfBudget (plan 2.19): the runtime monitor half (the static half is the
// lint, scripts/lib/dream-checks.js). Counts live display objects (into
// containers) and estimates draw calls as batch breaks: consecutive visible
// objects that share a texture and blend mode batch together in Phaser's
// WebGL multi-texture pipeline; a Graphics, a texture or blend change, or a
// camera-filtered object costs a new batch. Pure over the object list, so it
// unit-tests with plain objects.

export const BUDGET = Object.freeze({
  objects: 2500,
  objectsWarn: 2000,
  roomDynamic: 800,
  drawCalls: 150,
  texture: 2048,
  backdropLayerW: 1920,
  particles: 300,
});

export function countObjects(list) {
  let n = 0;
  const walk = (arr) => {
    for (const o of arr) {
      n += 1;
      if (o && o.list && Array.isArray(o.list)) walk(o.list);
    }
  };
  walk(list || []);
  return n;
}

const texOf = (o) => (o.texture && o.texture.key) || o.type || 'none';

// visible objects in display order → estimated batches (draw calls)
export function estimateDrawCalls(list) {
  let calls = 0;
  let last = null;
  const walk = (arr) => {
    for (const o of arr) {
      if (!o || o.visible === false || o.alpha === 0) continue;
      if (o.list && Array.isArray(o.list)) {
        walk(o.list);
        continue;
      }
      const key = o.type === 'Graphics' ? `g${calls}` : `${texOf(o)}|${o.blendMode || 0}`;
      if (key !== last) {
        calls += 1;
        last = key;
      }
    }
  };
  walk(list || []);
  return calls;
}

export class PerfMonitor {
  constructor(scene, { every = 30, onWarn = null } = {}) {
    this.scene = scene;
    this.every = every;
    this.onWarn = onWarn;
    this.frame = 0;
    this.last = { objects: 0, drawCalls: 0, ui: 0, ok: true };
    this.peak = { objects: 0, drawCalls: 0 };
  }

  sample() {
    const s = this.scene;
    const list = s.sys.displayList ? s.sys.displayList.list : [];
    const ui = s.game.scene.getScene('UI');
    const uiList = ui && ui.sys.displayList ? ui.sys.displayList.list : [];
    const objects = countObjects(list);
    const drawCalls = estimateDrawCalls([...list].sort((a, b) => (a.depth || 0) - (b.depth || 0))) + estimateDrawCalls(uiList);
    const ok = objects + countObjects(uiList) <= BUDGET.objects && drawCalls <= BUDGET.drawCalls;
    this.last = { objects, ui: countObjects(uiList), drawCalls, ok };
    this.peak.objects = Math.max(this.peak.objects, objects);
    this.peak.drawCalls = Math.max(this.peak.drawCalls, drawCalls);
    if (!ok && this.onWarn) this.onWarn(this.last);
    return this.last;
  }

  update() {
    if (++this.frame % this.every === 0) this.sample();
  }
}
