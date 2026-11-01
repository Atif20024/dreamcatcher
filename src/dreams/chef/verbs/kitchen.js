// The kitchen's pressures and its people at work (FIVE-STAR DREAM; no keys).
// Room data, all read here:
//   flames  [{ x, off }]        stock burners in the aisle. On the band's beat:
//                               a blue click one beat, the flame the next.
//   vents   [{ x, y0, y1, every, off }]   steam, on the beat
//   ovens   [{ x, every, off }]  an oven door dropping: a wide blast at the knee
//   beef    [{ y, x0, x1, speed, wait }]  sides of beef on the overhead rail: a
//                               rattle first, then they slide. They knock, no heart
//   cold, warm [[x0,y0,x1,y1]]  the COLD meter; warm rooms and pipes fill it. At
//                               zero the hands let go (a heart, half a meter back)
//   wet     [c0, c1]            the floor by the sink is slippery
//   runners [{ npc, speed, bark, load }]  someone walking the aisle: calls out,
//                               then a plate in Jo's hands is on the floor
//   life    [{ npc, kind }]     hose, knife, spoon, taste: people doing their job
//   lamps, lastLamp             the dining room: they click off as Jo passes
// Difficulty (scene.difficulty) shortens the burners' cycle; each sitting too.
import { sfx } from '../../../systems/audio.js';
import { hud } from '../../../ui/hud.js';
import { paintBeef, paintTrolley } from '../props.js';

const T = 32;
const COLD_S = 52; // full to empty, seconds, at difficulty 0
const mod = (a, n) => ((a % n) + n) % n;

function canvasKey(scene, key, w, h, paint) {
  if (!scene.textures.exists(key)) {
    const ct = scene.textures.createCanvas(key, w, h);
    paint(ct.getContext(), w, h);
    ct.refresh();
  }
  return key;
}

function frostKey(scene) {
  return canvasKey(scene, 'fs-frost', 480, 270, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 90, w / 2, h / 2, 290);
    g.addColorStop(0, 'rgba(180,220,255,0)');
    g.addColorStop(0.7, 'rgba(180,220,255,0.25)');
    g.addColorStop(1, 'rgba(220,240,255,0.85)');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  });
}

export default {
  id: 'kitchen',
  keys: [],
  create(ctx) {
    const s = ctx.scene;
    const st = ctx.state;
    st.clock = 0;
    st.g = s.add.graphics().setDepth(12.5);
    st.life = s.add.graphics().setDepth(11);
    st.cold = hud.meter('cold', { label: 'COLD', color: '#88b8d8', order: 1, visible: false });
    st.coldV = 1;
    st.frost = s.add.image(0, 0, frostKey(s)).setScrollFactor(0).setDepth(90).setAlpha(0);
    st.frost.keepInWorld = true;
    st.frost.setScrollFactor(0);
    st.hitAt = 0;
    s.events.on('beat', (b) => {
      st.clock = b;
    });
    // world coordinates, room by room
    st.rooms = {};
    for (const r of s.graph.rooms.values()) {
      const d = r.data;
      const wx = (c) => (r.tx + c) * T + T / 2;
      const wy = (row) => (r.ty + row) * T;
      const floor = (r.ty + 12) * T;
      const R = {
        id: r.id,
        d,
        flames: (d.flames || []).map((f) => ({ ...f, x: wx(f.x), y: floor, on: false })),
        vents: (d.vents || []).map((v) => ({ ...v, x: wx(v.x), y0: wy(v.y0), y1: wy(v.y1 + 1) })),
        ovens: (d.ovens || []).map((o) => ({ ...o, x: wx(o.x), y: floor })),
        wet: d.wet ? [(r.tx + d.wet[0]) * T, (r.tx + d.wet[1] + 1) * T] : null,
        beef: (d.beef || []).map((b) => ({ x0: wx(b.x0), x1: wx(b.x1), y: wy(b.y + 1), speed: b.speed, wait: b.wait, x: wx(b.x0), dir: 1, t: 0, state: 'wait', img: null })),
        warm: (d.warm || []).map((z) => [(r.tx + z[0]) * T, wy(z[1]), (r.tx + z[2] + 1) * T, wy(z[3] + 1)]),
        lamps: (d.lamps || []).map((l) => ({ x: wx(l.x), y: wy(l.y) + T / 2, r: l.r, off: false, img: null })),
        last: d.lastLamp ? { x: wx(d.lastLamp.x), y: wy(d.lastLamp.y) + T / 2 } : null,
        x0: r.tx * T,
        y0: r.ty * T,
        w: r.w * T,
        h: r.h * T,
      };
      st.rooms[r.id] = R;
    }
    canvasKey(s, 'fs-beef', 44, 92, paintBeef);
    canvasKey(s, 'fs-trolley', 58, 54, paintTrolley);
  },

  update(ctx, dt) {
    const s = ctx.scene;
    const st = ctx.state;
    const p = ctx.player;
    const F = ctx.flags;
    const R = st.rooms[s.roomId];
    if (!R) return;
    const now = s.time.now;
    const bpm = (s.music && s.music.bpm) || 112;
    st.clock += (dt * bpm) / 60000;
    const clock = st.clock;
    const d = s.difficulty || 0;
    const g = st.g;
    g.clear();
    const body = p.body;
    const touches = (x0, y0, x1, y1) => body.right > x0 && body.left < x1 && body.bottom > y0 && body.top < y1;
    const burn = (x) => s.hurt({ sourceX: x, source: 'burn' });

    // the stock burners: every 4 beats at first, on the band's beat
    const every = Math.max(2, 4 - Math.min(2, d) - (F.sitting >= 3 ? 1 : 0));
    for (const f of R.flames) {
      const ph = mod(clock - f.off, every);
      const warn = ph < 1;
      const fire = ph >= 1 && ph < 2;
      if (warn && !f.warned) {
        f.warned = true;
        if (Math.abs(f.x - p.x) < 400) sfx('tick');
      }
      if (!warn) f.warned = false;
      if (warn) {
        g.fillStyle(0x4a8ae8, 0.75).fillEllipse(f.x, f.y - 20, 30, 6);
        g.fillStyle(0xbcd8ff, 0.8).fillEllipse(f.x, f.y - 21, 14, 3);
      } else if (fire) {
        const w = Math.sin(now / 45 + f.x) * 3;
        g.fillStyle(0xe8541e, 0.9).fillTriangle(f.x - 16, f.y - 20, f.x + 16, f.y - 20, f.x + w, f.y - 74);
        g.fillStyle(0xf2a02a, 0.95).fillTriangle(f.x - 10, f.y - 20, f.x + 10, f.y - 20, f.x - w, f.y - 56);
        g.fillStyle(0xfff0a0, 1).fillTriangle(f.x - 5, f.y - 20, f.x + 5, f.y - 20, f.x + w / 2, f.y - 36);
        if (touches(f.x - 14, f.y - 70, f.x + 14, f.y)) burn(f.x);
      }
    }
    // steam, on the beat
    for (const v of R.vents) {
      const ph = mod(clock - v.off, v.every);
      if (ph < 1) g.fillStyle(0xe8e8f0, 0.5).fillCircle(v.x, v.y1 - 8 - ph * 14, 5);
      else if (ph < 2) {
        if (!v.hissed) {
          v.hissed = true;
          if (Math.abs(v.x - p.x) < 300) sfx('steam');
        }
        for (let i = 0; i < 9; i++) {
          const yy = v.y1 - (i / 9) * (v.y1 - v.y0) - (ph - 1) * 12;
          g.fillStyle(0xf2f0f4, 0.55 - i * 0.04).fillCircle(v.x + Math.sin(now / 130 + i * 1.7) * 5, yy, 9 + i * 1.6);
        }
        if (touches(v.x - 16, v.y0, v.x + 16, v.y1)) burn(v.x);
      } else v.hissed = false;
    }
    // an oven door dropping: wide, at the knee, a long warning
    for (const o of R.ovens) {
      const ph = mod(clock - o.off, o.every);
      if (ph >= 2 && ph < 4) {
        const a = (ph - 2) / 2;
        g.fillStyle(0xe87a2a, 0.15 + a * 0.3).fillRect(o.x - 34, o.y - 92, 68, 92);
        if (ph < 2.05 && Math.abs(o.x - p.x) < 300) sfx('click');
      } else if (ph >= 4 && ph < 6) {
        const wob = Math.sin(now / 60) * 4;
        g.fillStyle(0xf28a2a, 0.8).fillEllipse(o.x, o.y - 28, 96 + wob, 56);
        g.fillStyle(0xfff0a0, 0.8).fillEllipse(o.x, o.y - 26, 54 + wob, 30);
        if (touches(o.x - 42, o.y - 56, o.x + 42, o.y)) burn(o.x);
      }
    }
    // the floor by the sink
    p.slippery = !!(R.wet && p.x > R.wet[0] && p.x < R.wet[1]);
    // the sides of beef
    for (const b of R.beef) {
      if (!b.img) b.img = s.add.image(b.x, b.y, 'fs-beef').setOrigin(0.5, 1).setDepth(11.5);
      b.t += dt;
      let shake = 0;
      if (b.state === 'wait' && b.t > b.wait) (b.state = 'rattle'), (b.t = 0);
      else if (b.state === 'rattle') {
        shake = Math.sin(now / 30) * 2;
        if (b.t < 40 && Math.abs(b.y - p.y) < 300) sfx('clack');
        if (b.t > 750) (b.state = 'slide'), (b.t = 0);
      } else if (b.state === 'slide') {
        b.x += (b.dir * b.speed * (1 + 0.15 * d) * dt) / 1000;
        if ((b.dir > 0 && b.x >= b.x1) || (b.dir < 0 && b.x <= b.x0)) {
          b.x = b.dir > 0 ? b.x1 : b.x0;
          b.dir = -b.dir;
          b.state = 'wait';
          b.t = 0;
        }
        shake = Math.sin(now / 120) * 3;
      }
      b.img.setPosition(b.x, b.y - 3).setAngle(shake);
      if (b.state === 'slide' && now - st.hitAt > 1000 && !(s.invulnUntil > now) && touches(b.x - 18, b.y - 90, b.x + 18, b.y - 6)) {
        st.hitAt = now;
        sfx('thump');
        s.knockback(b.x);
      }
    }
    // the cold
    if (R.d.cold) {
      const warm = R.warm.some((z) => p.x > z[0] && p.x < z[2] && p.y > z[1] && p.y < z[3]);
      st.coldV += warm ? (dt / 1000) * 0.45 : -((dt / 1000) / COLD_S) * (1 + 0.12 * Math.min(2, d));
      st.coldV = Math.min(1, st.coldV);
      if (st.coldV < 0.6) F.frost = true;
      st.cold.set(st.coldV).setVisible(true).setColor(warm ? '#f2a860' : st.coldV < 0.25 ? '#d5443c' : '#88b8d8');
      if (st.coldV <= 0) {
        st.coldV = 0.5;
        s.caption.say('jo', "My hands won't close.", { ms: 2200 });
        s.hurt({ sourceX: p.x });
      }
      const cam = s.cameras.main;
      const want = st.coldV < 0.5 ? (0.5 - st.coldV) * 1.6 : 0;
      st.frost.setAlpha(st.frost.alpha + (want - st.frost.alpha) * 0.05);
      st.frost.setPosition(cam.width / 2, cam.height / 2).setScale((2 * 1.06) / cam.zoom);
    } else {
      st.cold.setVisible(false);
      st.coldV = Math.min(1, st.coldV + dt / 8000);
      st.frost.setAlpha(0);
    }
    // anyone walking the aisle
    for (const run of R.d.runners || []) {
      const n = s.npcs.get(run.npc);
      if (!n) continue;
      if (n.pace) n.pace.speed = run.speed * (1 + 0.12 * Math.min(2, d));
      if (run.load) {
        if (!n.loadImg) {
          n.loadImg = s.add.image(n.x, n.y, 'fs-trolley').setOrigin(0.5, 1).setDepth(11.4);
          const destroy = n.destroy.bind(n);
          n.destroy = () => {
            n.loadImg.destroy();
            destroy();
          };
        }
        n.loadImg.setPosition(n.x + n.facing * 40, n.y).setFlipX(n.facing < 0);
      }
      const moving = n.stride && n.stride.moving;
      const front = run.load ? n.x + n.facing * 40 : n.x;
      const dist = Math.abs(front - p.x);
      const toward = Math.sign(p.x - front) === n.facing;
      if (moving && toward && dist < 220 && dist > 90 && now - (run._said || 0) > 3500) {
        run._said = now;
        s.floatText(n.x, n.y - 104, run.bark, '#f2e6cc');
      }
      if (moving && dist < (run.load ? 34 : 20) && body.bottom > n.y - 26 && now - st.hitAt > 1200 && !(s.invulnUntil > now)) {
        st.hitAt = now;
        sfx('thump');
        s.dropCarry();
        s.knockback(n.x);
      }
    }
    this.people(ctx, R, now, clock);
    this.lamps(ctx, R);
  },

  // people at work (a few lines over the rig: the hose, the knife, the spoon)
  people(ctx, R, now, clock) {
    const s = ctx.scene;
    const g = ctx.state.life;
    g.clear();
    for (const l of R.d.life || []) {
      const n = s.npcs.get(l.npc);
      if (!n) continue;
      const f = n.facing;
      const hx = n.x + f * 20;
      const hy = n.y - 40;
      if (l.kind === 'hose') {
        for (let i = 0; i < 10; i++) {
          const k = ((now / 500 + i / 10) % 1);
          g.fillStyle(0xd8ecff, 0.8 - k * 0.5).fillCircle(hx + f * k * 54, hy - 6 + k * k * 32 - k * 14, 2);
        }
        for (let i = 0; i < 7; i++) {
          const k = (now / 2400 + i / 7) % 1;
          g.lineStyle(1, 0xffffff, 0.75 - k * 0.7).strokeCircle(hx + f * 40 + Math.sin(i * 9 + now / 500) * 16, hy + 10 - k * 66, 3 + (i % 3));
        }
      } else if (l.kind === 'knife') {
        const down = mod(clock, 1) < 0.5;
        const ky = hy + (down ? 2 : -9);
        g.lineStyle(3, 0xd8dee4, 1).lineBetween(hx, ky, hx + f * 14, ky + (down ? 4 : -2));
        g.lineStyle(3, 0x3a2418, 1).lineBetween(hx - f * 5, ky - 1, hx, ky);
        // the tears, and the laugh
        if (Math.floor(now / 900) % 3 === 0) g.fillStyle(0xbcd8ff, 0.9).fillCircle(n.x + f * 6, n.y - 62 + (now % 900) / 40, 1.5);
      } else if (l.kind === 'spoon') {
        const a = now / 300 + n.x;
        g.lineStyle(2, 0xc8ccd4, 1).lineBetween(hx, hy, hx + f * 10 + Math.cos(a) * 6, hy + 10 + Math.sin(a) * 3);
      } else if (l.kind === 'taste' && now < (s.tasteUntil || 0)) {
        g.lineStyle(2, 0xc8ccd4, 1).lineBetween(hx, hy, n.x + f * 8, n.y - 64);
      }
    }
  },

  // the dining room: every lamp Jo passes clicks off behind him
  lamps(ctx, R) {
    if (!R.lamps.length) return;
    const s = ctx.scene;
    const st = ctx.state;
    const p = ctx.player;
    if (!st.dark) {
      st.dark = s.add.rectangle(R.x0 + R.w / 2, R.y0 + R.h / 2, R.w, R.h, 0x06040a, 0.12).setDepth(12.9);
      st.lastGlow = s.add.image(R.last.x, R.last.y, 'dc-glow').setBlendMode('ADD').setTint(0xffd890).setScale(2.1).setAlpha(0.55).setDepth(16);
      for (const l of R.lamps) l.img = s.add.image(l.x, l.y, 'dc-glow').setBlendMode('ADD').setTint(0xffc880).setScale(l.r).setAlpha(0.5).setDepth(16);
    }
    let off = 0;
    for (const l of R.lamps) {
      if (!l.off && (p.x > l.x + 96 || ctx.flags.lamps_all)) {
        l.off = true;
        sfx('click');
        s.tweens.add({ targets: l.img, alpha: 0, duration: 200 });
      }
      if (l.off) off += 1;
    }
    const want = 0.12 + (off / R.lamps.length) * (ctx.flags.lamps_all ? 0.72 : 0.45);
    st.dark.fillAlpha += (want - st.dark.fillAlpha) * 0.04;
    // a line of Jo's own at his first plate
    if (!ctx.flags.saw_plate && p.x > R.x0 + 8 * T) {
      ctx.flags.saw_plate = true;
      s.caption.say('jo', 'Nobody. Every table laid, and nobody.', { ms: 2800 });
    }
    if (!ctx.flags.saw_plate2 && p.x > R.x0 + 22 * T) {
      ctx.flags.saw_plate2 = true;
      s.caption.say('jo', ctx.flags.plates ? "That's my plate. That's all of them. Nobody has touched them." : 'Every plate that left the kitchen tonight. Untouched.', { ms: 3400 });
    }
  },
};
