// HealthModel (plan §2.8): one failure model for every dream.
// A hit costs a heart plus knockback and brief invulnerability, never a
// teleport. At zero hearts the scene sends Jo back to the last checkpoint
// with hearts refilled (onZero: 'checkpoint'); the dream is never restarted.
// Plain JS, no Phaser: the scene supplies the clock (`now`, ms).

export const DEFAULT_HEALTH = Object.freeze({
  hitCost: 1,
  knockback: Object.freeze({ x: 180, y: -220 }),
  iframes: 1200,
  onZero: 'checkpoint', // or 'restartRoom' (decision 5, not used today)
  refill: 'full',
  flavour: 'hearts', // 'paintWells' for the Painter's skin
  noFail: false, // THE LONG EVENING profile: nothing can hurt
});

export class HealthModel {
  constructor({ max = 3, hearts, bus = null, ...cfg } = {}) {
    this.cfg = { ...DEFAULT_HEALTH, ...cfg };
    this.max = Math.max(1, max);
    this.hearts = hearts === undefined ? this.max : Math.max(0, hearts);
    this.bus = bus;
    this.invulnUntil = 0;
  }

  get noFail() {
    return !!this.cfg.noFail;
  }

  get isZero() {
    return this.hearts <= 0;
  }

  // can a hit land right now? (invulnerability window, no-fail profile)
  canHit(now) {
    return !this.noFail && now >= this.invulnUntil;
  }

  setInvulnerable(now, ms = this.cfg.iframes) {
    this.invulnUntil = Math.max(this.invulnUntil, now + ms);
  }

  // a hit from the world: respects i-frames, grants new ones
  // returns { applied, zero }
  hit(now, source = null) {
    if (!this.canHit(now)) return { applied: false, zero: false };
    this.setInvulnerable(now);
    return this.lose(this.cfg.hitCost, source);
  }

  // a scripted loss (a bet lost, thrown out): no i-frame check
  lose(n = 1, source = null) {
    if (this.noFail || n <= 0) return { applied: false, zero: this.isZero };
    const before = this.hearts;
    this.hearts = Math.max(0, this.hearts - n);
    this._changed(before, source);
    const zero = this.hearts <= 0;
    if (zero && before > 0) this._emit('health:zero', { source, max: this.max });
    return { applied: true, zero };
  }

  heal(n = 1) {
    const before = this.hearts;
    this.hearts = Math.min(this.max, this.hearts + Math.max(0, n));
    if (this.hearts !== before) this._changed(before, 'heal');
    return this.hearts - before;
  }

  // set hearts directly (legacy `scene.lives = n`); may exceed max (tea)
  set(n) {
    const before = this.hearts;
    this.hearts = Math.max(0, Math.round(n));
    if (this.hearts !== before) this._changed(before, 'set');
  }

  setMax(n) {
    this.max = Math.max(1, Math.round(n));
    this._changed(this.hearts, 'max');
  }

  refill() {
    const before = this.hearts;
    if (this.cfg.refill === 'full') this.hearts = Math.max(this.hearts, this.max);
    else this.hearts = Math.max(this.hearts, 1);
    this._changed(before, 'refill');
  }

  // knockback velocity away from a source x (or against facing)
  knockback(jx, sourceX = null, facingLeft = false) {
    const k = this.cfg.knockback;
    let dir;
    if (sourceX !== null && sourceX !== undefined && sourceX !== jx) dir = jx < sourceX ? -1 : 1;
    else dir = facingLeft ? 1 : -1;
    return { x: dir * k.x, y: k.y };
  }

  _changed(before, source) {
    this._emit('health:changed', { hearts: this.hearts, max: this.max, before, source });
  }

  _emit(name, payload) {
    if (this.bus) this.bus.emit(name, payload);
  }
}
