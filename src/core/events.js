// EventBus: systems talk through events, not scene fields (plan §2.20).
// Plain JS, no Phaser dependency, so it unit-tests in Node.

export const EVENTS = Object.freeze([
  'room:enter', 'room:leave', 'portal:cross', 'checkpoint:lit', 'gate:open',
  'item:get', 'verb:use', 'verb:first_use', 'health:changed', 'health:zero',
  'objective:changed', 'encounter:start', 'encounter:end', 'beat:start', 'beat:end',
  'conv:start', 'conv:end', 'dream:complete',
]);

export class EventBus {
  constructor({ strict = false } = {}) {
    this.strict = strict; // strict: unknown event names throw (typo guard)
    this.map = new Map();
  }

  _check(name) {
    if (this.strict && !EVENTS.includes(name)) throw new Error(`EventBus: unknown event "${name}"`);
  }

  on(name, fn, ctx) {
    this._check(name);
    if (!this.map.has(name)) this.map.set(name, []);
    this.map.get(name).push({ fn, ctx, once: false });
    return () => this.off(name, fn, ctx);
  }

  once(name, fn, ctx) {
    this._check(name);
    if (!this.map.has(name)) this.map.set(name, []);
    this.map.get(name).push({ fn, ctx, once: true });
    return () => this.off(name, fn, ctx);
  }

  off(name, fn, ctx) {
    const list = this.map.get(name);
    if (!list) return this;
    this.map.set(name, list.filter((l) => !(l.fn === fn && (ctx === undefined || l.ctx === ctx))));
    return this;
  }

  emit(name, payload) {
    this._check(name);
    const list = this.map.get(name);
    if (!list || !list.length) return 0;
    // iterate a copy: listeners may subscribe/unsubscribe while handling
    for (const l of [...list]) {
      if (l.once) this.off(name, l.fn, l.ctx);
      l.fn.call(l.ctx, payload, name);
    }
    return list.length;
  }

  removeAll(name) {
    if (name) this.map.delete(name);
    else this.map.clear();
    return this;
  }

  listenerCount(name) {
    return (this.map.get(name) || []).length;
  }
}

export const events = new EventBus();
