// Barks (plan 2.6): one-liners on the caption channel, from data. A bark
// never opens the scene box and never takes control.
//   { id, channel: 'caption', who, text, when: { near: 'npc:wren', r: 220 } | { room: 'green' } | { flag: 'x' }, once: true, cooldown?: ms }
// Fired barks are remembered in the run's flags (`_bark:<id>`), so a retry
// from a flag never replays one.
export class Barks {
  constructor({ list = [], caption, flags, setFlag, where } = {}) {
    this.list = list.filter((b) => b.channel === 'caption' && b.when);
    this.caption = caption;
    this.flags = flags;
    this.setFlag = setFlag;
    this.where = where; // () => ({ room, x, y, near(id) → px | null })
    this.last = new Map();
  }

  update(now) {
    const F = this.flags() || {};
    const w = this.where();
    for (const b of this.list) {
      const key = `_bark:${b.id}`;
      if (b.once !== false && F[key]) continue;
      if (b.cooldown && now - (this.last.get(b.id) || -1e9) < b.cooldown) continue;
      const c = b.when;
      let ok = true;
      if (c.room && c.room !== w.room) ok = false;
      if (c.flag && !F[c.flag]) ok = false;
      if (c.unless && F[c.unless]) ok = false;
      if (c.near) {
        const d = w.near(c.near);
        if (d === null || d > (c.r || 200)) ok = false;
      }
      if (!ok) continue;
      this.last.set(b.id, now);
      if (b.once !== false) this.setFlag(key, true);
      this.caption.say(b.who, b.text);
    }
  }
}

export default Barks;
