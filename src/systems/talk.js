import Phaser from 'phaser';
import { CONVERSATIONS, GROUP_SCENES, REACTIONS } from '../data/evening/talk.js';
import { sfx } from './audio.js';

// A3 — the town has to sound like people who like each other.
//
// 1. Overheard conversation: any two people within 4 tiles for 8 seconds
//    start talking — to each other, not to Jo. He can stand and listen; if he
//    does, one of them turns and includes him with a look. Sitting near a
//    conversation slows it down.
// 2. Roasting Jo: the people who met him in a dream have a few lines about
//    it. He answers with a grin, a shrug, an eye-roll, a laugh, or a two-note
//    toot that always gets a groan. Never a line.
// 3. Group scenes: longer talk at four places, slots filled by whoever's
//    there (the scene decides when; this runs them).
const T = 32;
const NEAR = 4 * T;

export default class Talk {
  constructor(scene, folk, { knows, joName = 'Jo' }) {
    this.scene = scene;
    this.folk = folk; // id -> Townsfolk
    this.knows = knows; // (castId) => bool: did this person meet Jo?
    this.joName = joName;
    this.pairClock = new Map();
    this.heard = new Set();
    this.cool = new Map(); // id -> time they can talk again
    this.roasted = new Set();
    this.roastCool = new Map();
    this.greeted = new Set();
    this.idleUsed = new Map();
    this.nextIdle = 0;
    this.nextCheck = 0;
    this.active = []; // running conversations
    this.listenT = 0;
  }

  free(f) {
    return f && f.visible && !f.busy && !f.talking && f.state !== 'walk' && !f.companion;
  }

  update(time, delta, ctx) {
    const p = ctx.player;
    // pair clocks, checked once a second
    if (time > this.nextCheck) {
      this.nextCheck = time + 1000;
      const list = Object.values(this.folk).filter((f) => this.free(f));
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i];
          const b = list[j];
          const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
          const close = Math.abs(a.x - b.x) < NEAR && Math.abs(a.y - b.y) < 2 * T;
          if (!close) {
            this.pairClock.delete(key);
            continue;
          }
          const t0 = this.pairClock.get(key) || time;
          this.pairClock.set(key, t0);
          // one conversation at a time in the whole town: two bubbles on one
          // screen is clutter, and the second is never heard anyway
          if (this.active.length) break;
          if (time - t0 > 8000 && time > (this.cool.get(a.id) || 0) && time > (this.cool.get(b.id) || 0)) {
            this.pairClock.set(key, time + 30000);
            this.converse(a, b, ctx);
          }
        }
      }
    }
    // listening: one of them turns and includes him with a look
    for (const c of this.active) {
      const near = c.members.some((f) => Math.abs(f.x - p.x) < 5 * T && Math.abs(f.y - (p.y + 24)) < 2 * T);
      c.listenT = near ? c.listenT + delta : 0;
      if (c.listenT > 3500 && !c.looked) {
        c.looked = true;
        c.members[Math.floor(Math.random() * c.members.length)].look(p.x);
      }
    }
    this.updateRoasts(time, ctx);
    this.updateIdle(time, ctx);
  }

  // a conversation: lines alternate, each starting before the last has quite
  // finished, so they overlap like people's do
  converse(a, b, ctx) {
    const avail = CONVERSATIONS.filter((c) => !this.heard.has(c.id) && (!c.after || this.heard.has(c.after)));
    const conv = avail.length ? avail[Math.floor(Math.random() * avail.length)] : CONVERSATIONS[Math.floor(Math.random() * CONVERSATIONS.length)];
    this.heard.add(conv.id);
    this.play(conv.lines.map(([who, text]) => [who === 'A' ? 1 : who === 'B' ? 2 : '*', text]), [a, b], ctx);
  }

  // run a script of [slot, text] lines over members (slot 1 = members[0])
  play(lines, members, ctx, { onDone = null, loop = false } = {}) {
    const s = this.scene;
    const c = { members, listenT: 0, looked: false, alive: true };
    this.active.push(c);
    members.forEach((m) => {
      m.talking = c;
      // face each other
      const other = members.find((o) => o !== m);
      if (other) m.look(other.x);
    });
    let i = 0;
    const next = () => {
      if (!c.alive) return;
      if (i >= lines.length) {
        if (loop) i = 0;
        else return this.end(c, onDone);
      }
      const [slot, text] = lines[i++];
      const slow = ctx && ctx.sittingNear && ctx.sittingNear(members) ? 1.6 : 1;
      let dur;
      if (slot === '*') {
        members.forEach((m, k) => s.time.delayedCall(k * 120, () => m.laugh(k === 0)));
        dur = 1100;
      } else {
        const who = members[(slot - 1) % members.length];
        dur = who.say(text, null, { slow });
      }
      s.time.delayedCall(Math.max(600, dur * 0.78 * slow), next);
    };
    s.time.delayedCall(400, next);
    return c;
  }

  end(c, onDone) {
    c.alive = false;
    c.members.forEach((m) => {
      if (m.talking === c) m.talking = null;
      this.cool.set(m.id, this.scene.time.now + 25000);
    });
    this.active = this.active.filter((x) => x !== c);
    if (onDone) onDone();
  }

  stopAll() {
    [...this.active].forEach((c) => this.end(c));
  }

  // group scenes (§A3.3): whoever is there fills the slots
  runGroup(name, members, ctx, opts = {}) {
    const g = GROUP_SCENES[name];
    if (!g || members.length < 2) return null;
    members.forEach((m) => {
      if (m.talking) this.end(m.talking);
    });
    return this.play(g.lines, members, ctx, { ...opts, loop: !!g.loop });
  }

  // ---- roasts -----------------------------------------------------------------
  updateRoasts(time, ctx) {
    const p = ctx.player;
    if (ctx.busy) return;
    for (const f of Object.values(this.folk)) {
      if (!this.free(f) || !f.def.roast || !this.knows(f.id)) continue;
      if (Math.abs(f.x - p.x) > 3.5 * T || Math.abs(f.y - (p.y + 24)) > 2 * T) continue;
      if (time < (this.roastCool.get(f.id) || 0) || time - (f.lastLineAt || 0) < 4000) continue;
      const lines = f.def.roast.filter((l) => !this.roasted.has(l));
      if (!lines.length) continue;
      const line = lines[0];
      this.roasted.add(line);
      this.roastCool.set(f.id, time + 70000);
      f.look(p.x);
      const dur = f.say(line);
      // Delphine's gets everyone. Jo too.
      const everyone = line.startsWith('He asked me if nine');
      this.scene.time.delayedCall(Math.min(dur, 1800), () => {
        const kind = everyone ? 'laugh' : REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
        this.scene.joReact(kind, f);
        for (const o of Object.values(this.folk)) {
          if (o === f || !o.visible || Math.abs(o.x - f.x) > 6 * T) continue;
          if (o.def.silent) o.say('(smiles)', 1600);
          else if (everyone || Math.random() < 0.5) this.scene.time.delayedCall(Phaser.Math.Between(100, 500), () => o.laugh(false));
        }
        if (everyone) f.laugh();
      });
      return; // one at a time
    }
  }

  // a toot in answer always gets a groan
  groanAt(f) {
    if (!f) return;
    sfx('groan');
    f.say(Math.random() < 0.5 ? 'ugh.' : 'every time.', 1400);
  }

  // ---- idle lines and greetings -------------------------------------------------
  updateIdle(time, ctx) {
    if (time < this.nextIdle || ctx.busy) return;
    const p = ctx.player;
    const near = Object.values(this.folk).filter((f) => this.free(f) && Math.abs(f.x - p.x) < 4 * T && Math.abs(f.y - (p.y + 24)) < 2 * T && time - (f.lastLineAt || 0) > 12000);
    if (!near.length) return;
    const f = near[Math.floor(Math.random() * near.length)];
    this.nextIdle = time + Phaser.Math.Between(5000, 9000);
    // greet by name — only those who'd know it
    if (!this.greeted.has(f.id) && this.greets(f)) {
      this.greeted.add(f.id);
      f.look(p.x);
      f.say(['Evening, Jo.', 'Jo.', "Look who it is. Jo.", 'Jo! Sit down a minute.'][Math.floor(Math.random() * 4)]);
      return;
    }
    const pool = f.def.idle || [];
    if (!pool.length) {
      if (f.def.silent) f.say('(smiles)', 1600);
      return;
    }
    const used = this.idleUsed.get(f.id) || new Set();
    let left = pool.filter((l) => !used.has(l));
    if (!left.length) {
      used.clear();
      left = pool;
    }
    const line = left[Math.floor(Math.random() * left.length)];
    used.add(line);
    this.idleUsed.set(f.id, used);
    if (Math.random() < 0.6) f.look(p.x);
    f.say(line);
  }

  greets(f) {
    const g = f.def.greets;
    if (!g) return false;
    if (g === true) return this.scene.helped && this.scene.helped.has(f.id) ? true : f.def.knows === 'always';
    return this.knows(f.id);
  }
}
