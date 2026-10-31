// Encounters (plan 2.10): in-world minigames. An encounter is
//   engine     pure logic (src/engines/*), no Phaser: update(dt), press(action), state(), done, result
//   presenter  the visuals: 'world' (staged in the room, the default) or 'modal'
// and a lifecycle: enter (camera to the anchor, HUD swap, input context
// 'encounter') → update → exit(result) → effects on the run.
//
//   const enc = new Encounters({ defs, host });
//   const result = await enc.start('clockwork', { anchor: { x, y } });
//   enc.update(dt, input)   // every frame from the scene
//
// def.params may be a function of the run's flags (ctx.flags), so a choice
// made earlier changes the set (the Musician's last gig). An engine with a
// release(action) hears the key come up (a held note). An engine with a
// move(dir) is a menu (THE LAST HAND's tables): the arrows go to it.
//
// The host supplies the Phaser side: makePresenter(def, engine, ctx),
// enter(def, ctx), exit(def, result, ctx). Tests pass a fake host, which is
// the point of the split: the logic runs without a renderer.

export class Encounters {
  constructor({ defs = {}, host = {}, bus = null } = {}) {
    this.defs = defs;
    this.host = host;
    this.bus = bus;
    this.active = null;
  }

  get busy() {
    return !!this.active;
  }

  start(id, ctx = {}) {
    const def = this.defs[id];
    if (!def) return Promise.reject(new Error(`Encounters: no encounter "${id}"`));
    if (this.active) return Promise.reject(new Error(`Encounters: "${this.active.id}" is already running`));
    // params may depend on the run (a choice made earlier): (flags) → params
    const params = typeof def.params === 'function' ? def.params(ctx.flags || {}) : def.params || {};
    const engine = def.engine(params);
    const presenter = this.host.makePresenter ? this.host.makePresenter(def, engine, ctx) : null;
    return new Promise((resolve) => {
      this.active = { id, def, engine, presenter, ctx, resolve, t: 0, ending: false };
      if (this.bus) this.bus.emit('encounter:start', { id });
      if (this.host.enter) this.host.enter(def, ctx);
      if (presenter && presenter.enter) presenter.enter(engine.state());
    });
  }

  // input: an object with justDown(action) (the InputMap) — the encounter
  // listens to its def.keys (default act1/confirm) and 'back' to step away
  update(dt, input) {
    const a = this.active;
    if (!a || a.ending) return;
    a.t += dt;
    a.engine.update(dt);
    const keys = a.def.keys || ['act1', 'confirm'];
    let outcome = null;
    if (input && a.t > 250 && keys.some((k) => input.justDown(k))) outcome = a.engine.press('act');
    // a menu: the arrows move its cursor
    if (input && a.engine.move && a.t > 250) for (const d of ['left', 'right', 'up', 'down']) if (input.justDown(d)) outcome = a.engine.move(d) || outcome;
    // a held note: the engine hears the key come up (optional)
    if (input && a.engine.release && input.justUp && keys.some((k) => input.justUp(k))) outcome = a.engine.release('act') || outcome;
    if (input && a.def.canLeave !== false && input.justDown('back')) return this.finish({ ok: false, left: true });
    if (a.presenter && a.presenter.render) a.presenter.render(a.engine.state(), outcome);
    if (a.engine.done) this.finish(a.engine.result);
  }

  finish(result, { immediate = false } = {}) {
    const a = this.active;
    if (!a || a.ending) return;
    a.ending = true;
    const done = () => {
      if (a.presenter && a.presenter.destroy) a.presenter.destroy();
      if (this.host.exit) this.host.exit(a.def, result, a.ctx);
      this.active = null;
      if (this.bus) this.bus.emit('encounter:end', { id: a.id, result });
      a.resolve(result);
    };
    // a scene shutting down cannot wait for an outro (its clock has stopped)
    const hold = !immediate && a.presenter && a.presenter.outro ? a.presenter.outro(result) : null;
    if (hold && hold.then) hold.then(done);
    else done();
  }

  // a scene shutting down mid-encounter
  abort() {
    if (this.active) this.finish({ ok: false, aborted: true }, { immediate: true });
  }
}

export default Encounters;
