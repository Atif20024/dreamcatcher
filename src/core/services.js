// Services registry (plan §2.20): named singletons any system can look up
// without reaching into a scene. Register at boot, get anywhere.

export class Services {
  constructor() {
    this.map = new Map();
  }

  register(name, svc, { replace = false } = {}) {
    if (this.map.has(name) && !replace) throw new Error(`service "${name}" already registered`);
    this.map.set(name, svc);
    return svc;
  }

  has(name) {
    return this.map.has(name);
  }

  get(name) {
    if (!this.map.has(name)) throw new Error(`service "${name}" is not registered`);
    return this.map.get(name);
  }

  // optional lookup for half-built services (see flags.js)
  maybe(name) {
    return this.map.get(name) || null;
  }

  unregister(name) {
    return this.map.delete(name);
  }

  names() {
    return [...this.map.keys()];
  }

  clear() {
    this.map.clear();
  }
}

export const services = new Services();
