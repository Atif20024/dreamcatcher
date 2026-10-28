// DialogueRunner (plan 2.6, 4.8): walks a conversation node graph. Pure:
// the SceneBox presents it, the tests drive it directly.
//
// conversation = { id, channel:'scene', camera?:'talk', replayable?, cast:[...], nodes: {
//   start: { who, expr?, text, next?, choices?:[{ text, next, set?, if? }], end?, set?, effects?, if? } } }
//
//   const r = new DialogueRunner(conv, { flags: () => scene.F, onSet, onEffect });
//   r.node            // the current node (null when finished)
//   r.choices()       // the choices whose `if` holds
//   r.next(i?)        // advance (choice index when the node has choices)
//   r.done
// A node's `set` ({flag: value}) and `effects` ([{objective}|{beat}|{give}...])
// fire when the node is shown. A node whose `if` fails is skipped to `next`.

export class DialogueRunner {
  constructor(conv, { flags = () => ({}), onSet = null, onEffect = null, maxSteps = 200 } = {}) {
    if (!conv || !conv.nodes) throw new Error('DialogueRunner: a conversation needs nodes');
    this.conv = conv;
    this.flags = flags;
    this.onSet = onSet;
    this.onEffect = onEffect;
    this.maxSteps = maxSteps;
    this.steps = 0;
    this.trail = [];
    this.chosen = null;
    this.node = null;
    this.go(conv.start || 'start');
  }

  test(cond) {
    if (!cond) return true;
    const F = this.flags() || {};
    if (typeof cond === 'string') return cond.startsWith('!') ? !F[cond.slice(1)] : !!F[cond];
    if (cond.flag) return cond.not ? !F[cond.flag] : !!F[cond.flag];
    return true;
  }

  apply(n) {
    if (n.set && this.onSet) for (const [k, v] of Object.entries(n.set)) this.onSet(k, v);
    for (const e of n.effects || []) if (this.onEffect) this.onEffect(e);
  }

  go(id) {
    let cur = id;
    while (cur) {
      if (++this.steps > this.maxSteps) throw new Error(`DialogueRunner: ${this.conv.id} loops`);
      const n = this.conv.nodes[cur];
      if (!n) throw new Error(`DialogueRunner: ${this.conv.id} has no node "${cur}"`);
      if (!this.test(n.if)) {
        cur = n.end ? null : n.next || null;
        continue;
      }
      this.node = { id: cur, ...n };
      this.trail.push(cur);
      this.apply(n);
      return this.node;
    }
    this.node = null;
    return null;
  }

  choices() {
    const n = this.node;
    if (!n || !n.choices) return [];
    return n.choices.filter((c) => this.test(c.if));
  }

  next(i = 0) {
    const n = this.node;
    if (!n) return null;
    const ch = this.choices();
    if (ch.length) {
      const c = ch[Math.max(0, Math.min(ch.length - 1, i))];
      this.chosen = c.value !== undefined ? c.value : c.text;
      if (c.set && this.onSet) for (const [k, v] of Object.entries(c.set)) this.onSet(k, v);
      for (const e of c.effects || []) if (this.onEffect) this.onEffect(e);
      return c.end || !c.next ? this.finish() : this.go(c.next);
    }
    if (n.end || !n.next) return this.finish();
    return this.go(n.next);
  }

  finish() {
    this.node = null;
    return null;
  }

  get done() {
    return this.node === null;
  }
}

// static checks for the lint: every `next` resolves, every node is reachable
export function conversationIssues(conv) {
  const out = [];
  const nodes = conv.nodes || {};
  const start = conv.start || 'start';
  if (!nodes[start]) out.push(`${conv.id}: no start node "${start}"`);
  const seen = new Set();
  const q = [start];
  while (q.length) {
    const id = q.shift();
    if (seen.has(id) || !nodes[id]) continue;
    seen.add(id);
    const n = nodes[id];
    if (!n.who) out.push(`${conv.id}/${id}: no speaker`);
    if (!n.text) out.push(`${conv.id}/${id}: no text`);
    const targets = [n.next, ...(n.choices || []).map((c) => c.next)].filter(Boolean);
    for (const t of targets) {
      if (!nodes[t]) out.push(`${conv.id}/${id}: next "${t}" does not exist`);
      else q.push(t);
    }
  }
  for (const id of Object.keys(nodes)) if (!seen.has(id)) out.push(`${conv.id}/${id}: unreachable node`);
  return out;
}

export default DialogueRunner;
