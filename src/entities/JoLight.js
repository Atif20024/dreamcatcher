// JoLight (feedback 3): the light Jo carries in dark rooms. A real thing in
// his front hand, of the place and its era (src/data/joLights.js), that
// swings or bobs with his walk and lights the floor and the wall near it.
// It is not a halo: the light comes from the lamp, sits under Jo (he is
// not lit from inside) and is a pool or a beam on the world around it.
// In a lit room he puts it away; at a dark room's seam he raises it.
import Phaser from 'phaser';
import { JO_LIGHTS, roomIsDark } from '../data/joLights.js';
import { placeOf } from '../ui/theme.js';

export const RAISE_MS = 300;
export const STOW_MS = 250;
const SCALE = 2; // the props are drawn at Jo's own pixel (his rig is 2×)

// the props, as string-art rows (1 row char = 1 art pixel). `hang`: the
// prop hangs from the hand by its top (it swings); otherwise it is held
// from below (it bobs). `at`: where the light comes from, in art pixels.
const PROPS = {
  oil_lantern: {
    hang: true,
    at: [3, 5],
    rows: ['..ooo..', '.o...o.', 'bbbbbbb', '.bgggb.', '.gyfyg.', '.gyfyg.', '.ggygg.', '.bgggb.', 'bbbbbbb', '.bBBBb.'],
    pal: { o: 0x3a3040, b: 0xb08a3a, B: 0x6b4a1f, g: 0xe8b060, y: 0xffd890, f: 0xfff4c0 },
  },
  candle: {
    at: [2, 1],
    rows: ['..f..', '.fFf.', '..k..', '.www.', '.www.', '.www.', 'eeeee', '.eee.'],
    pal: { f: 0xffc060, F: 0xfff4c0, k: 0x2a2230, w: 0xf2ead8, e: 0xc8d0e0 },
  },
  lighter: {
    at: [2, 1],
    rows: ['..f.', '.fFf', '..c.', 'ssss', 'sMMs', 'sMMs', 'ssss'],
    pal: { f: 0xffb040, F: 0xfff0b0, c: 0x8a7a50, s: 0xc8a24a, M: 0x8a6a28 },
  },
  wrist_torch: {
    at: [6, 1],
    beam: 0,
    rows: ['kkkkksy', 'kKKKKsy', 'kkkkksy'],
    pal: { k: 0x2a2a34, K: 0x4a4a58, s: 0xb0b0b8, y: 0xf0f6ff },
  },
  bulb: {
    hang: true,
    at: [2, 7],
    rows: ['..k..', '..k..', '..k..', '..k..', '.sss.', '.sss.', 'yyyyy', 'yffyy', 'yffyy', '.yyy.'],
    pal: { k: 0x2a2230, s: 0x9a9aa0, y: 0xffe6a0, f: 0xfffbe0 },
  },
  oil_lamp: {
    at: [6, 0],
    rows: ['......f.', '.....fFf', '.tttttk.', 'tTTTTTtt', '.tttttt.'],
    pal: { f: 0xffb850, F: 0xfff0b8, k: 0x2a2230, t: 0x9a5236, T: 0xc07048 },
  },
  phone: {
    at: [2, 2],
    beam: 30,
    rows: ['kkkk', 'kbbk', 'kbbk', 'kbbk', 'kbbk', 'kkkk'],
    pal: { k: 0x1e1e26, b: 0xc8dcff },
  },
  loupe_lamp: {
    at: [5, 1],
    beam: 12,
    rows: ['.bbb..', 'bBBByy', 'bBBByy', '.bbb..', '..k...', '..k...'],
    pal: { b: 0xc8a24a, B: 0x8a6a28, y: 0xfff0c0, k: 0x3a3040 },
  },
  firefly_jar: {
    hang: true,
    at: [3, 5],
    rows: ['.ooooo.', '.ccccc.', 'c.....c', 'c.d...c', 'c....dc', 'c..d..c', 'cd....c', 'c...d.c', '.ccccc.'],
    pal: { o: 0x6a5a3a, c: 0xa8c8b8, d: 0xe8ff80 },
  },
};

function paintRows(scene, key, rows, pal) {
  if (scene.textures.exists(key)) return;
  const w = Math.max(...rows.map((r) => r.length));
  const ct = scene.textures.createCanvas(key, w, rows.length);
  const ctx = ct.getContext();
  rows.forEach((r, y) =>
    [...r].forEach((ch, x) => {
      const c = pal[ch];
      if (c === undefined) return;
      ctx.fillStyle = `#${c.toString(16).padStart(6, '0')}`;
      ctx.fillRect(x, y, 1, 1);
    })
  );
  ct.refresh();
  ct.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

// the light itself: a soft round falloff, and a beam that opens from its
// left edge (both white, tinted per lamp)
function ensureLightTextures(scene) {
  if (!scene.textures.exists('jo-light-pool')) {
    const ct = scene.textures.createCanvas('jo-light-pool', 128, 128);
    const ctx = ct.getContext();
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.16)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    ct.refresh();
  }
  if (!scene.textures.exists('jo-light-cone')) {
    const W = 192;
    const H = 128;
    const ct = scene.textures.createCanvas('jo-light-cone', W, H);
    const ctx = ct.getContext();
    const g = ctx.createRadialGradient(0, H / 2, 0, 0, H / 2, W);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.4)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, H / 2 - 3);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H / 2 + 3);
    ctx.closePath();
    ctx.fill();
    ct.refresh();
  }
}

export function ensureLightProps(scene) {
  for (const [kind, p] of Object.entries(PROPS)) {
    paintRows(scene, `jo-light-${kind}`, p.rows, p.pal);
    // the fireflies blink: a second frame with the other half lit
    if (kind === 'firefly_jar') paintRows(scene, 'jo-light-firefly_jar-b', p.rows.map((r, y) => (y % 2 ? r : r.replace(/d/g, '.'))), p.pal);
  }
  ensureLightTextures(scene);
}

export default class JoLight {
  constructor(scene, player) {
    this.scene = scene;
    this.p = player;
    this.place = placeOf(scene);
    this.def = JO_LIGHTS[this.place] || null;
    this.k = 0; // 0 stowed … 1 raised
    this.want = false;
    this.swing = 0;
    this.swingV = 0;
    this.log = [];
    if (!this.def) return;
    ensureLightProps(scene);
    this.prop = PROPS[this.def.kind];
    this.img = scene.add.image(player.x, player.y, `jo-light-${this.def.kind}`).setScale(SCALE).setAlpha(0);
    this.img.setOrigin(this.prop.hang ? 0.5 : 0.5, this.prop.hang ? 0 : 1);
    this.img.dcJoLight = true;
    const cone = this.def.light === 'cone';
    this.glow = scene.add.image(player.x, player.y, cone ? 'jo-light-cone' : 'jo-light-pool').setBlendMode(Phaser.BlendModes.ADD).setTint(this.def.color).setAlpha(0).setDepth(11.02);
    if (cone) this.glow.setOrigin(0, 0.5);
    // a beam also spills: a little light all round the lens or screen
    this.spill = cone ? scene.add.image(player.x, player.y, 'jo-light-pool').setBlendMode(Phaser.BlendModes.ADD).setTint(this.def.color).setAlpha(0).setDepth(11.015) : null;
    if (this.spill) this.spill.dcJoLight = true;
    // a pool on the floor under the lamp (cone lamps too: the spill)
    this.floor = scene.add.image(player.x, player.y, 'jo-light-pool').setBlendMode(Phaser.BlendModes.ADD).setTint(this.def.color).setAlpha(0).setDepth(11.01);
    [this.glow, this.floor].forEach((o) => (o.dcJoLight = true));
  }

  // is the room he is in dark?
  isDark() {
    const s = this.scene;
    if (!this.def) return false;
    if (this.def.dark === 'night') {
      const L = s.lightCache;
      return !!L && L.night > 0.3;
    }
    let id = null;
    let lit;
    if (s.roomId !== undefined && s.graph) {
      id = s.roomId;
      const r = s.graph.room && s.graph.room(id);
      lit = r && r.data ? r.data.lit : undefined;
    } else if (s._room) {
      id = s._room.id;
      lit = s._room.lit;
    }
    return roomIsDark(this.place, id, lit);
  }

  state() {
    return { place: this.place, kind: this.def ? this.def.kind : null, light: this.def ? this.def.light : null, dark: this.isDark(), raised: this.k, want: this.want, log: this.log.slice() };
  }

  // per frame, after the player's drawing is placed
  sync() {
    if (!this.def || !this.img.scene) return;
    const s = this.scene;
    const p = this.p;
    const a = p.art;
    const dt = Math.min(0.05, (s.game.loop.delta || 16.7) / 1000);
    const want = this.isDark() && p.shown && !p.dead && !p.floating;
    if (want !== this.want) {
      this.want = want;
      this.log.push({ at: s.time.now, raise: want });
      if (this.log.length > 12) this.log.shift();
    }
    const rate = dt * 1000;
    this.k = want ? Math.min(1, this.k + rate / RAISE_MS) : Math.max(0, this.k - rate / STOW_MS);
    const ease = this.k * this.k * (3 - 2 * this.k);
    const dir = p.flipX ? -1 : 1;
    // the front hand (the rig's attach point); the far one while a tool is in use
    const f = p.feet();
    const using = /^(swing|pen|brush|brush_hold|play_trumpet|interact|type)$/.test(p.anim.name);
    const d = p.anim.data && p.anim.data();
    const hand = d && d.attach && (using ? d.attach.hand_b : d.attach.hand_f);
    const sx = a.scaleX;
    const sy = a.scaleY;
    let hx = hand ? f.x + dir * hand[0] * sx : f.x + dir * 12;
    let hy = hand ? f.y + hand[1] * sy : f.y - 36;
    // raising: it comes up from the hip
    hy += (1 - ease) * 14;
    // the walk: a hanging lamp swings behind his motion, a held one bobs
    const vx = p.body ? p.body.velocity.x : 0;
    const moving = Math.abs(vx) > 20;
    if (this.prop.hang) {
      const target = Phaser.Math.Clamp(-vx / 280, -1, 1) * 16 + (moving ? Math.sin(s.time.now / 140) * 7 : 0);
      this.swingV += ((target - this.swing) * 40 - this.swingV * 6) * dt;
      this.swing += this.swingV * dt;
    } else {
      this.swing = 0;
      hy += moving ? Math.sin(s.time.now / 110) * 1.2 : 0;
    }
    if (this.def.kind === 'firefly_jar') this.img.setTexture(Math.floor(s.time.now / 380) % 2 ? 'jo-light-firefly_jar' : 'jo-light-firefly_jar-b');
    this.img
      .setPosition(Math.round(hx), Math.round(hy))
      .setFlipX(p.flipX)
      .setAngle(this.swing)
      .setDepth(a.depth + (using ? -0.2 : 0.5))
      .setAlpha(ease * p.alpha)
      .setVisible(ease > 0.01 && a.visible);
    // where the light comes from (the flame, the bulb, the lens)
    const at = this.prop.at;
    const ox = (at[0] - this.img.width * this.img.originX) * SCALE * dir;
    const oy = (at[1] - this.img.height * this.img.originY) * SCALE;
    const rad = Phaser.Math.DegToRad(this.swing);
    const lx = hx + ox * Math.cos(rad) - oy * Math.sin(rad);
    const ly = hy + ox * Math.sin(rad) + oy * Math.cos(rad);
    this.lightAt = { x: lx, y: ly };
    // a flame breathes; a bulb, a screen and a torch hold steady
    const flame = /lantern|candle|lighter|oil_lamp|firefly/.test(this.def.kind);
    const flick = flame ? 0.9 + 0.1 * Math.sin(s.time.now / 90) * Math.sin(s.time.now / 37) : 1;
    const str = this.def.strength * ease * flick;
    const R = this.def.radius;
    if (this.def.light === 'cone') {
      const tilt = this.prop.beam || 0;
      this.glow
        .setPosition(lx, ly)
        .setFlipX(dir < 0)
        .setOrigin(dir < 0 ? 1 : 0, 0.5)
        .setAngle(dir * tilt)
        .setScale(R / 192, (R * 0.7) / 128)
        .setAlpha(str);
    } else {
      this.glow.setPosition(lx, ly).setScale((R * 2) / 128).setAlpha(str);
    }
    // the pool on the floor: wide and flat, under the lamp
    this.floor
      .setPosition(lx + (this.def.light === 'cone' ? dir * R * 0.35 : 0), f.y - 2)
      .setScale((R * 1.6) / 128, (R * 0.32) / 128)
      .setAlpha(str * 0.8);
    if (this.spill) this.spill.setPosition(lx, ly).setScale((R * 1.1) / 128).setAlpha(str * 0.75).setVisible(str > 0.004);
    this.glow.setVisible(str > 0.004);
    this.floor.setVisible(str > 0.004);
  }
}
