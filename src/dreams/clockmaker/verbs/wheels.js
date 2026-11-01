// Hang a wheel (THE STOPPED HOUR's new verb; no keys of its own, [E] through
// Interaction): rooms hold trains (src/engines/geartrain.js). Jo takes a wheel on
// his back, carries it wherever he can go, and hangs it on a peg. Wheels that touch
// turn. A knock from a pendulum drops what he carries to the floor under him.
//
// A train's state is a JSON string in the run's flags (F.train_<id>): RunState
// keeps only primitives, and a saved run must come back with its wheels on the wall.
import { newTrain, take, hang, lift, lay, goHome, trainState, teeth, WHEEL_R } from '../../../engines/geartrain.js';
import { floorUnder } from '../logic.js';
import { sfx } from '../../../systems/audio.js';

const T = 32;
const SPEED = 0.9; // the drive, radians a second

// a wheel at real scale (a big one is 1.45 m across: a tower clock's wheel)
function wheelTexture(scene, r, kind) {
  const key = `dc-wheel-${kind}-${r}`;
  if (scene.textures.exists(key)) return key;
  const R = r + 4; // the teeth stand 4 px past the pitch circle
  const ct = scene.textures.createCanvas(key, R * 2 + 2, R * 2 + 2);
  const c = ct.getContext();
  const cx = R + 1;
  const [rim, lit, deep] = kind === 'drive' ? ['#5a5660', '#8a8690', '#2a2830'] : ['#a07a30', '#f2d580', '#4a3414'];
  c.translate(cx, cx);
  const n = teeth(r);
  c.fillStyle = rim;
  for (let i = 0; i < n; i++) {
    c.save();
    c.rotate((i / n) * Math.PI * 2);
    c.fillRect(r - 3, -3, 7, 6);
    c.restore();
  }
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = deep;
  c.lineWidth = 1;
  c.stroke();
  // the lit rim, four spokes, the windows between them, the boss
  c.strokeStyle = lit;
  c.lineWidth = 2;
  c.beginPath();
  c.arc(0, 0, r - 3, Math.PI * 1.05, Math.PI * 1.6);
  c.stroke();
  c.fillStyle = deep;
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    c.moveTo(0, 0);
    c.arc(0, 0, r - 6, (i / 4) * Math.PI * 2 + 0.28, ((i + 1) / 4) * Math.PI * 2 - 0.28);
    c.closePath();
    c.fill();
  }
  c.fillStyle = rim;
  c.beginPath();
  c.arc(0, 0, 6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = lit;
  c.beginPath();
  c.arc(-1, -1, 3, 0, Math.PI * 2);
  c.fill();
  ct.refresh();
  return key;
}

const load = (F, t) => {
  const raw = F[`train_${t.def.id}`];
  return raw ? JSON.parse(raw) : newTrain(t.def);
};

export default {
  id: 'wheels',
  keys: [],
  create(ctx) {
    const s = ctx.scene;
    const trains = (ctx.state.trains = []);
    ctx.state.angle = 0;
    ctx.state.hits = ctx.flags.pendulum_hits || 0;
    ctx.state.ring = s.add.graphics().setDepth(-4);
    for (const r of s.graph.rooms.values()) {
      for (const def of r.data.trains || []) {
        const ox = r.tx * T;
        const oy = r.ty * T;
        const t = { def, r, ox, oy, raw: null, st: null, imgs: {}, flag: def.flag, g: s.add.graphics().setDepth(-5.5) };
        const add = (id, rad, kind) => (t.imgs[id] = { img: s.add.image(0, 0, wheelTexture(s, rad, kind)).setDepth(-5), dx: 0, dy: 0 });
        add('drive', def.drive.r, 'drive');
        add('output', def.output.r, 'brass');
        for (const w of def.wheels) add(w.id, WHEEL_R[w.size], 'brass');
        t.imgs.drive.img.setPosition(ox + def.drive.x, oy + def.drive.y);
        t.imgs.output.img.setPosition(ox + def.output.x, oy + def.output.y);
        trains.push(t);
        this.sync(ctx, t);
        // a saved run is not holding anything: a carried wheel went home at the save
        if (goHome(def, t.st)) this.save(ctx, t);
        const here = () => s.roomId === r.id && !ctx.flags[def.flag] && !s.encounterActive && (!def.needs || ctx.flags[def.needs]);
        // Jo's hand reaches a peg from below or level with it, never down through a floor
        const below = (y) => s.player.y + 22 >= oy + y - 8;
        for (const a of def.arbors) {
          const reg = s.interaction.register({
            id: `peg:${def.id}:${a.id}`,
            x: ox + a.x,
            y: oy + a.y,
            radius: 40,
            dy: 104,
            promptDy: 44,
            prompt: 'hang the wheel',
            enabled: () => {
              if (!here() || !below(a.y)) return false;
              const st = t.st;
              reg.item.prompt = st.hung[a.id] ? 'lift the wheel' : 'hang the wheel';
              return st.hung[a.id] ? !ctx.state.carrying : ctx.state.carrying === t;
            },
            onUse: () => this.usePeg(ctx, t, a),
          });
        }
        for (const w of def.wheels) {
          s.interaction.register({
            id: `wheel:${w.id}`,
            at: () => {
              const l = t.st.lying[w.id] || w;
              return { x: ox + l.x, y: oy + l.y };
            },
            radius: 44,
            dy: 56,
            promptDy: 56,
            prompt: 'take the wheel',
            enabled: () => here() && !ctx.state.carrying && !!t.st.lying[w.id],
            onUse: () => {
              const from = t.st.lying[w.id];
              take(def, t.st, w.id);
              ctx.state.carrying = t;
              this.save(ctx, t);
              this.moved(t, w.id, ox + from.x, oy + from.y, s.player.x, s.player.y - 6);
              sfx('click');
            },
          });
        }
      }
    }
    // with nothing else in reach, [E] sets the wheel down (shortcut: the 57 px is
    // only so that anything really in reach wins Interaction's nearest; the prompt
    // shows to Jo's side. Upgrade if Interaction ever gets priorities)
    s.interaction.register({
      id: 'wheel:down',
      at: () => ({ x: s.player.x + 57, y: s.player.y + 22 }),
      radius: 58,
      dy: 10,
      promptDy: 70,
      prompt: 'set it down',
      enabled: () => !!ctx.state.carrying && !s.player.climbing,
      onUse: () => this.drop(ctx),
    });
  },
  // read the flags (they are the truth: a restart may have rolled them back)
  sync(ctx, t) {
    const raw = ctx.flags[`train_${t.def.id}`] || null;
    if (t.st && raw === t.raw) return;
    t.raw = raw;
    t.st = load(ctx.flags, t);
    if (!t.st.carried && ctx.state.carrying === t) ctx.state.carrying = null;
  },
  save(ctx, t) {
    t.raw = JSON.stringify(t.st);
    ctx.flags[`train_${t.def.id}`] = t.raw;
  },
  // the eased arrival: the drawn wheel starts from where it was and settles
  moved(t, id, fromX, fromY, toX, toY, { ease = 'Back.easeOut', ms = 180 } = {}) {
    const w = t.imgs[id];
    w.dx = fromX - toX;
    w.dy = fromY - toY;
    w.img.scene.tweens.add({ targets: w, dx: 0, dy: 0, duration: ms, ease });
  },
  usePeg(ctx, t, a) {
    const s = ctx.scene;
    const { def, st, ox, oy } = t;
    if (st.hung[a.id]) {
      const id = st.hung[a.id];
      lift(def, st, a.id);
      ctx.state.carrying = t;
      this.save(ctx, t);
      this.moved(t, id, ox + a.x, oy + a.y, s.player.x, s.player.y - 6);
      sfx('click');
      return;
    }
    const id = st.carried;
    const r = hang(def, st, a.id);
    if (r === 'fouls') {
      sfx('knock');
      if (def.fouls) s.caption.say(def.who, def.fouls, { ms: 2600 });
      return;
    }
    ctx.state.carrying = null;
    this.save(ctx, t);
    this.moved(t, id, s.player.x, s.player.y - 6, ox + a.x, oy + a.y);
    t.imgs[id].img.setScale(0.8);
    s.tweens.add({ targets: t.imgs[id].img, scale: 1, duration: 200, ease: 'Back.easeOut' });
    sfx('click');
    s.cameras.main.shake(60, 0.0012);
    this.afterHang(ctx, t);
  },
  afterHang(ctx, t) {
    const s = ctx.scene;
    const { def, st } = t;
    const ts = trainState(def, st);
    const F = ctx.flags;
    if (ts.running) {
      F[def.flag] = true;
      // the motion runs down the train, a tick a wheel, then the big one
      Object.keys(ts.turning).forEach((_, i) => s.time.delayedCall(i * 120, () => sfx('tick')));
      s.cameras.main.shake(140, 0.003);
      const o = t.imgs.output.img;
      const glow = s.add.image(o.x, o.y, 'dc-glow').setBlendMode('ADD').setTint(0xffe6a0).setScale(0.4).setAlpha(0.8).setDepth(-4);
      s.tweens.add({ targets: glow, scale: 1.4, alpha: 0, duration: 700, ease: 'Sine.easeOut', onComplete: () => glow.destroy() });
      if (def.onRun && s.beats.has(def.onRun)) s.beats.play(def.onRun).catch((e) => console.warn('[dream] beat', e));
      return;
    }
    if (!ts.held) return;
    // it strains: the pawl clacks, the wheels shake back a hair
    t.judder = 500;
    sfx('knock');
    const line = ts.bound ? def.bound || def.wrongWay : def.wrongWay;
    const seen = `train_said_${def.id}_${ts.bound ? 'b' : 'w'}`;
    if (line && !F[seen]) {
      F[seen] = true;
      s.caption.say(def.who, line, { ms: 3400 });
    }
  },
  // down at his feet, or off his back when something knocks him (the same fall)
  drop(ctx) {
    const s = ctx.scene;
    const t = ctx.state.carrying;
    if (!t) return;
    const { def, st, ox, oy } = t;
    const r = WHEEL_R[def.wheels.find((w) => w.id === st.carried).size];
    const lx = s.player.x - ox;
    const floor = floorUnder(t.r.data.grid, lx, s.player.y + 10 - oy);
    const id = st.carried;
    if (floor == null) goHome(def, st);
    else lay(st, lx, floor - r);
    ctx.state.carrying = null;
    this.save(ctx, t);
    const l = st.lying[id];
    this.moved(t, id, s.player.x, s.player.y - 6, ox + l.x, oy + l.y, { ease: 'Bounce.easeOut', ms: 420 });
    sfx('knock');
  },
  update(ctx, dt) {
    const s = ctx.scene;
    const F = ctx.flags;
    const p = s.player;
    const carrying = ctx.state.carrying;
    // knocked: it goes to the floor under him
    if ((F.pendulum_hits || 0) !== ctx.state.hits) {
      ctx.state.hits = F.pendulum_hits || 0;
      if (carrying) this.drop(ctx);
    }
    // through a door it does not go: it is the room's wheel, and it goes home
    if (carrying && carrying.r.id !== s.roomId) {
      goHome(carrying.def, carrying.st);
      this.save(ctx, carrying);
      ctx.state.carrying = null;
    }
    ctx.state.angle += (SPEED * dt) / 1000;
    const ring = ctx.state.ring.clear();
    for (const t of ctx.state.trains) {
      this.sync(ctx, t);
      const on = t.r.id === s.roomId;
      for (const w of Object.values(t.imgs)) w.img.setVisible(on);
      t.g.clear();
      if (!on) continue;
      this.draw(ctx, t, dt, ring);
    }
  },
  draw(ctx, t, dt, ring) {
    const s = ctx.scene;
    const { def, st, ox, oy, imgs, g } = t;
    const p = s.player;
    const ts = trainState(def, st);
    // held, the train does not move, and in its first moments it shakes
    if (!ts.held) t.angle = ctx.state.angle;
    t.judder = Math.max(0, (t.judder || 0) - dt);
    const shake = t.judder ? Math.sin(t.judder / 28) * 0.05 : 0;
    const base = t.angle ?? ctx.state.angle;
    const rot = (id) => {
      const q = ts.turning[id];
      return q ? q.ratio * base + q.phase + shake * Math.sign(q.ratio) : null;
    };
    // the pegs, brighter while a wheel is on his back; the iron rod to what it runs
    const hot = ctx.state.carrying === t;
    for (const a of def.arbors) {
      if (st.hung[a.id]) continue;
      g.fillStyle(0x1e1410, 1).fillCircle(ox + a.x, oy + a.y, 5);
      g.fillStyle(hot ? 0xf2d580 : 0x8a6a2c, 1).fillCircle(ox + a.x, oy + a.y, 3);
      if (hot) g.lineStyle(1, 0xf2d580, 0.35).strokeCircle(ox + a.x, oy + a.y, WHEEL_R[def.wheels.find((w) => w.id === st.carried).size]);
    }
    if (def.rod) {
      g.lineStyle(4, 0x2a2428, 1).beginPath();
      def.rod.forEach(([x, y], i) => (i ? g.lineTo(ox + x, oy + y) : g.moveTo(ox + x, oy + y)));
      g.strokePath();
    }
    // the ratchet's arrow, the way it wants to go; its pawl, thrown when it is held
    const o = def.output;
    const R = o.r + 11;
    const a0 = -Math.PI * 0.75;
    const a1 = a0 + def.output.turns * 1.1;
    const col = ts.running ? 0xf2d580 : ts.wrongWay ? 0xd5443c : 0xe8e0c8;
    g.lineStyle(3, 0x1e1410, 1).beginPath().arc(ox + o.x, oy + o.y, R, a0, a1, def.output.turns < 0).strokePath();
    g.lineStyle(2, col, 1).beginPath().arc(ox + o.x, oy + o.y, R, a0, a1, def.output.turns < 0).strokePath();
    const hx = ox + o.x + Math.cos(a1) * R;
    const hy = oy + o.y + Math.sin(a1) * R;
    const dir = a1 + (def.output.turns * Math.PI) / 2;
    g.fillStyle(col, 1).fillTriangle(hx + Math.cos(dir) * 7, hy + Math.sin(dir) * 7, hx + Math.cos(dir + 2.4) * 6, hy + Math.sin(dir + 2.4) * 6, hx + Math.cos(dir - 2.4) * 6, hy + Math.sin(dir - 2.4) * 6);
    // the wheels
    imgs.drive.img.setRotation(rot('drive') ?? 0);
    imgs.output.img.setRotation(rot('output') ?? 0.2);
    for (const w of def.wheels) {
      const e = imgs[w.id];
      const arbor = def.arbors.find((a) => st.hung[a.id] === w.id);
      if (st.carried === w.id) {
        // on his back, bobbing against his stride
        const f = p.flipX ? 1 : -1;
        e.img.setPosition(p.x + f * 8 + e.dx, p.y - 8 + Math.sin(s.time.now / 90) * (Math.abs(p.body.velocity.x) > 20 ? 1.5 : 0) + e.dy).setRotation(0.4).setDepth(p.depth - 0.1);
      } else if (arbor) {
        e.img.setPosition(ox + arbor.x + e.dx, oy + arbor.y + e.dy).setRotation(rot(w.id) ?? 0).setDepth(-5);
      } else {
        const l = st.lying[w.id] || w;
        e.img.setPosition(ox + l.x + e.dx, oy + l.y + e.dy).setRotation(0.4).setDepth(-5);
      }
    }
    // the peg or wheel [E] is on
    const cur = s.interaction.current;
    if (cur && cur.id.startsWith(`peg:${def.id}:`)) ring.lineStyle(2, 0xf6d98a, 0.9).strokeCircle(cur.x, cur.y, 10);
  },
};
