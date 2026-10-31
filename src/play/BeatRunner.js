// BeatRunner (plan 2.1): scripted story beats as data. A beat is an array
// of steps; each step is one object whose single known key names a handler:
//
//   { say: { who: 'wren', text: 'Evening.' } }      a caption bar line (non-blocking unless wait:true)
//   { talk: 'wren_first' }                          a scene-box conversation (awaited)
//   { camera: { push: 1.3, to: 'npc:wren', ms: 600 } } / { camera: 'pop' } / { camera: { vista: 0.8 } }
//   { wait: 400 }                                   ms
//   { set: 'flag' } / { set: { flag: value } }      flags (this.F)
//   { objective: 'wind_the_clock' }                 an objective id or text
//   { spawn: {...entity} } / { despawn: 'id' }      live entities
//   { encounter: 'clockwork' }                      awaited; result in ctx.last
//   { hud: 'hide' | 'show' }  { lock: true | false } { anim: { who, name } }
//   { music: 'state:quiet' }  { sting: 'gate' }  { sfx: 'click' }
//   { fade: 'out' | 'in', ms }  { ending: true }
//   { if: 'flag' | { flag, not }, then: [...], else: [...] }
//   { beat: 'other' }                               run another beat inline
//
// Handlers are injected (DreamScene supplies them), so the runner is pure and
// unit-tests with fakes. Every handler may return a Promise; the runner awaits
// it. `wait` uses the injected `delay(ms)` so tests drive time by hand.

export class BeatRunner {
  constructor({ beats = {}, handlers = {}, delay = null, flags = () => ({}), log = null } = {}) {
    this.beats = beats;
    this.handlers = { ...handlers };
    this.delay = delay || ((ms) => new Promise((r) => setTimeout(r, ms)));
    this.flags = flags;
    this.log = log;
    this.running = new Set();
    this.history = [];
    this.gen = 0;
  }

  on(name, fn) {
    this.handlers[name] = fn;
    return this;
  }

  has(id) {
    return !!this.beats[id];
  }

  // the step's verb: the one key that has a handler (or a built-in)
  static verbOf(step) {
    const BUILTIN = ['wait', 'if', 'beat'];
    const keys = Object.keys(step).filter((k) => !['then', 'else', 'note'].includes(k));
    return keys.find((k) => BUILTIN.includes(k)) || keys[0];
  }

  test(cond) {
    const F = this.flags() || {};
    if (typeof cond === 'string') return !!F[cond];
    if (cond && cond.flag) return cond.not ? !F[cond.flag] : cond.eq !== undefined ? F[cond.flag] === cond.eq : !!F[cond.flag];
    if (cond && cond.all) return cond.all.every((c) => this.test(c));
    if (cond && cond.any) return cond.any.some((c) => this.test(c));
    return !!cond;
  }

  // play a beat by id or an inline step list; resolves when every step is done
  async play(beat, ctx = {}) {
    const steps = typeof beat === 'string' ? this.beats[beat] : beat;
    const id = typeof beat === 'string' ? beat : '(inline)';
    if (!steps) throw new Error(`BeatRunner: no beat "${beat}"`);
    const gen = this.gen;
    this.running.add(id);
    this.history.push(id);
    if (this.handlers['beat:start']) this.handlers['beat:start'](id);
    try {
      await this.runSteps(steps, ctx, gen);
    } finally {
      this.running.delete(id);
      if (this.handlers['beat:end']) this.handlers['beat:end'](id);
    }
    return ctx;
  }

  async runSteps(steps, ctx, gen) {
    for (const step of steps) {
      if (gen !== this.gen) return; // cancelled (scene shut down, respawn)
      const verb = BeatRunner.verbOf(step);
      if (this.log) this.log(verb, step);
      if (verb === 'wait') {
        await this.delay(step.wait);
      } else if (verb === 'if') {
        const branch = this.test(step.if) ? step.then : step.else;
        if (branch) await this.runSteps(branch, ctx, gen);
      } else if (verb === 'beat') {
        await this.runSteps(this.beats[step.beat] || [], ctx, gen);
      } else {
        const fn = this.handlers[verb];
        if (!fn) throw new Error(`BeatRunner: no handler for step "${verb}"`);
        const r = await fn(step[verb], step, ctx);
        if (r !== undefined) ctx.last = r;
      }
    }
  }

  // stop every running beat at its next step
  cancelAll() {
    this.gen += 1;
    this.running.clear();
  }

  get busy() {
    return this.running.size > 0;
  }
}

export default BeatRunner;
