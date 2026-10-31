import Phaser from 'phaser';
import { sfx } from '../systems/audio.js';
import { D } from '../builders/depths.js';
import { hubTex } from '../art/hubArt.js';
import { uiText } from '../ui/text.js';
import { characterManifest } from '../art/baked.js';
import { TRAIN } from '../art/trainKit.js';
import {
  BAY,
  SIDE,
  carriageEndTex,
  gangwayDoorTex,
  carriageSideTex,
  wheelTex,
  bogieTex,
  bayVistaTex,
  bayTrainTex,
  stationTex,
  gateLeafTex,
  doorwayTex,
} from '../art/trainArt.js';
import { px as mpx } from '../data/scale.js';

// The train kit at full scale (round 2 WP3, critique §7.3; 1 m = 44 px).
//
// Train: a hub bay at Crossroads, a terminus seen end-on. The buffer end of
// the last carriage (123 × 172, its lower 40 px down in the track pit) stands
// at the buffer stop; the rest of the train runs away from the camera beside
// the platform, painted in one-point perspective, and pulls away with it.
// A platform gate and a 3.5 m platform lamp stand at the mouth of the bay.
// Jo boards by walking up the platform into a lit side door.
//
// States: idle / departing_with_jo / returning / dead. `dead` empties the
// bay: an oil stain on the track bed, the lamp out, a plate on the gate.
//
// arrivalTrain(): the side-on carriage a dream opens with (880 × 172, door
// 50 × 88): Jo steps down from the door, it pulls away.

// short destination words for the blind (display ×1, cap 14)
const BLIND = { chef: 'REVE', musician: 'STAGE', athlete: 'TRACK', writer: 'DRAFT', painter: 'ARLES', astronaut: 'ORBIT', gambler: 'MERROW', doctor: 'WARD 8' };
const GATE_X = 176; // bay-local: the gate's centre on the platform mouth
const LAMP_X = 211;
const VY = BAY.h - BAY.eye; // the vanishing point's bay-local y
const END_TOP = BAY.h + TRAIN.pit - TRAIN.height; // the carriage end's top, bay-local

export default class Train {
  constructor(scene, platform, x0, floorY, opts = {}) {
    this.scene = scene;
    this.platform = platform;
    this.x0 = x0;
    this.groundY = floorY;
    this.id = opts.id;
    this.livery = opts.livery || { body: 0x7a3a3a, trim: 0xf2e6cc, window: 0xf2c078, emblem: 'stripe' };
    this.state = 'idle';
    this.outOfService = !!opts.outOfService;
    const s = scene;
    const lit = !this.outOfService;
    // the bay beyond: shed, track, platform, receding lamps
    this.vista = s.add.image(x0, floorY, bayVistaTex(s, { lamps: lit, seed: platform })).setOrigin(0, 1).setDepth(D.SUPPORT - 2);
    // the train: one container whose origin is the vanishing point, so
    // scaling it is the train running away down the track
    this.vp = { x: x0 + BAY.vx, y: floorY - BAY.eye };
    this.box = s.add.container(this.vp.x, this.vp.y).setDepth(D.SUPPORT - 1);
    const at = (img, lx, ly) => img.setOrigin(0, 0).setPosition(lx - BAY.vx, ly - VY);
    this.side = at(s.add.image(0, 0, bayTrainTex(s, this.livery, { dead: !lit, seed: platform })), 0, 0);
    this.end = at(s.add.image(0, 0, carriageEndTex(s, this.livery, { dead: !lit, num: platform })), BAY.endX[0], END_TOP);
    // the gangway door slides left into its pocket
    const dw = mpx(0.8);
    this.doorHome = { x: BAY.endX[0] + Math.round(TRAIN.width / 2 - dw / 2) - BAY.vx, y: END_TOP + TRAIN.height - TRAIN.floor - mpx(1.95) - VY, w: dw };
    this.door = s.add.image(this.doorHome.x, this.doorHome.y, gangwayDoorTex(s, this.livery, { dead: !lit })).setOrigin(0, 0);
    this.doorOpen = 0;
    // tail-lamp glows and the vestibule's light on the concourse
    this.glows = [9, TRAIN.width - 9].map((lx) =>
      s.add
        .image(BAY.endX[0] + lx - BAY.vx, END_TOP + TRAIN.height - TRAIN.floor - 1 - VY, hubTex(s, 'glow', 32, 32))
        .setTint(0xff6a50)
        .setAlpha(lit ? 0.55 : 0)
        .setBlendMode(Phaser.BlendModes.ADD)
    );
    // the destination blind (the end is painted with an empty blind box)
    const blindX = BAY.endX[0] + TRAIN.width / 2 - BAY.vx;
    const blindY = END_TOP + 15.5 - VY;
    this.blind = uiText(s, blindX, blindY, lit ? BLIND[this.id] || 'EXPRESS' : 'NOT IN SERVICE', lit ? { size: 'display', color: '#f2c078', backing: 0x2a241c } : { size: 'body', color: '#c8c0b0', backing: 0x1a1a20 }).setOrigin(0.5);
    this.box.add([this.side, this.end, this.door, ...this.glows, this.blind]);
    // the buffer stop in front, mostly in the pit
    this.stop = s.add.image(x0 + (BAY.endX[0] + BAY.endX[1]) / 2, floorY + TRAIN.pit, stationTex(s, 'hub-buffer-stop')).setOrigin(0.5, 1).setDepth(D.SUPPORT - 0.5);
    // the platform gate: two leaves hung on posts
    this.gateX = x0 + GATE_X;
    this.gate = s.add.image(this.gateX, floorY, stationTex(s, 'hub-platform-gate')).setOrigin(0.5, 1).setDepth(D.INTERACT - 2);
    const gw = this.gate.width;
    const leaf = gateLeafTex(s);
    this.leaves = [
      s.add.image(this.gateX - gw / 2 + 7, floorY - 2, leaf).setOrigin(0, 1).setDepth(D.INTERACT - 2.5),
      s.add.image(this.gateX + gw / 2 - 7, floorY - 2, leaf).setOrigin(0, 1).setFlipX(true).setDepth(D.INTERACT - 2.5),
    ];
    this.leaves[1].setOrigin(1, 1);
    // the platform lamp with the bay's number
    this.lampX = x0 + LAMP_X;
    this.lamp = s.add.image(this.lampX, floorY, stationTex(s, 'hub-platform-lamp', { num: platform, on: lit })).setOrigin(0.5, 1).setDepth(D.INTERACT - 3);
    this.lampGlow = s.add
      .image(this.lampX, floorY - mpx(3.5) + 8, hubTex(s, 'glow', 64, 64))
      .setDisplaySize(130, 130)
      .setTint(0xf2d580)
      .setAlpha(lit ? 0.3 : 0)
      .setDepth(D.INTERACT - 3);
    if (lit) this.steamTimer = s.time.addEvent({ delay: 1100, loop: true, callback: () => this.puff() });
    this.doorX = this.gateX;
    if (opts.dead) this.kill(true);
  }

  // the engine's steam, far down the shed
  puff() {
    if (this.state === 'dead' || !this.box.active) return;
    const s = this.scene;
    const k = this.box.scaleX;
    const p = s.add
      .image(this.vp.x - 14 + Math.random() * 10, this.vp.y - 18 * k, hubTex(s, 'puff', 24, 24))
      .setTint(0xe8e0e8)
      .setAlpha(0.35)
      .setScale(0.35)
      .setDepth(D.SUPPORT - 1.5);
    s.tweens.add({ targets: p, y: p.y - 46, x: p.x - 8 + Math.random() * 16, scale: 1.8, alpha: 0, duration: 2200, onComplete: () => p.destroy() });
  }

  setLamp(on) {
    this.lamp.setTexture(stationTex(this.scene, 'hub-platform-lamp', { num: this.platform, on }));
    this.lampGlow.setAlpha(on ? 0.3 : 0);
  }

  // the gangway door: 0 shut … 1 open (it slides into the left pocket)
  slideDoor(open, duration = 450) {
    const o = { p: this.doorOpen };
    return new Promise((res) =>
      this.scene.tweens.add({
        targets: o,
        p: open ? 1 : 0,
        duration,
        ease: 'sine.inout',
        onUpdate: () => this.setDoor(o.p),
        onComplete: () => res(),
      })
    );
  }
  setDoor(p) {
    this.doorOpen = p;
    const w = this.doorHome.w;
    this.door.setPosition(this.doorHome.x - p * w, this.doorHome.y).setCrop(p * w, 0, w - p * w, this.door.height);
  }

  swingGate(open) {
    this.scene.tweens.add({ targets: this.leaves, scaleX: open ? 0.18 : 1, duration: 260, ease: 'sine.out' });
    sfx('click');
  }

  // where a point at depth d (m) on the platform at bay-local x lands
  platformPoint(lx, d) {
    const k = 1 / (1 + d / BAY.D);
    return { x: this.vp.x + (this.x0 + lx - this.vp.x) * k, y: this.vp.y + BAY.eye * k, k };
  }

  // Jo boards: through the gate, up the platform beside the carriage (he
  // gets smaller and a little darker as he goes), into the lit side door
  walkIn(player, onInside) {
    const s = this.scene;
    this.state = 'boarding';
    const jo = standIn(s, player);
    this.swingGate(true);
    const start = { x: jo.x, y: jo.y };
    const mid = this.platformPoint(GATE_X - 4, 1.7);
    const door = this.platformPoint(BAY.platformX + 6, 1.4);
    // the side door's light falls across the platform as Jo reaches it
    const spill = s.add
      .image(door.x + 10, door.y - 2, hubTex(s, 'glow', 64, 64))
      .setDisplaySize(70, 26)
      .setTint(0xf2c078)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(D.INTERACT - 1);
    s.tweens.add({ targets: spill, alpha: 0.75, duration: 500 });
    jo.walk(start, mid, 1, mid.k, 800, false, () => {
      jo.walk(mid, door, mid.k, door.k, 420, true, () => {
        s.tweens.add({ targets: [jo.art, jo.hat], alpha: 0, duration: 160 });
        s.tweens.add({ targets: spill, alpha: 0, duration: 500, delay: 200, onComplete: () => spill.destroy() });
        s.time.delayedCall(170, () => {
          jo.destroy();
          if (onInside) onInside();
        });
      });
    });
    return jo;
  }

  // back from a dream: Jo steps down from the same door and walks out
  walkOut(player, onOut) {
    const s = this.scene;
    const door = this.platformPoint(BAY.platformX + 6, 1.4);
    const mid = this.platformPoint(GATE_X - 4, 1.7);
    const end = { x: this.gateX, y: this.groundY };
    player.shown = false;
    const jo = standIn(s, player);
    jo.place(door.x, door.y, door.k);
    jo.art.setAlpha(0);
    jo.hat.setAlpha(0);
    this.leaves.forEach((l) => l.setScale(0.18, 1));
    s.tweens.add({ targets: [jo.art, jo.hat], alpha: 1, duration: 200 });
    jo.walk(door, mid, door.k, mid.k, 380, false, () => {
      jo.walk(mid, end, mid.k, 1, 700, false, () => {
        jo.destroy();
        player.setPosition(end.x, this.groundY - 24);
        player.flipX = false;
        player.shown = true;
        this.swingGate(false);
        if (onOut) onOut();
      });
    });
  }

  // Jo is aboard: the door slides shut, a whistle, steam, and the whole
  // train runs away from the buffers into the shed
  depart(onGone) {
    this.state = 'departing_with_jo';
    sfx('whistle');
    for (let i = 0; i < 5; i++) this.scene.time.delayedCall(i * 140, () => this.puff());
    this.scene.tweens.add({
      targets: this.box,
      scale: 0.16,
      duration: 1500,
      ease: 'quad.in',
      delay: 150,
      onComplete: onGone,
    });
    this.scene.tweens.add({ targets: this.box, alpha: 0, duration: 400, delay: 1250 });
  }

  // The only returning train the player ever sees. The windows go out a
  // carriage at a time, the blind rolls to NOT IN SERVICE, the doors shut,
  // and it runs back into the dark and does not come back.
  returnAndDie(onDone) {
    this.state = 'returning';
    const s = this.scene;
    const darkSide = s.add.image(this.side.x, this.side.y, bayTrainTex(s, this.livery, { dead: true, seed: this.platform })).setOrigin(0, 0).setAlpha(0);
    const darkEnd = s.add.image(this.end.x, this.end.y, carriageEndTex(s, this.livery, { dead: true, num: this.platform })).setOrigin(0, 0).setAlpha(0);
    this.box.addAt(darkSide, 1);
    this.box.addAt(darkEnd, 3);
    this.box.bringToTop(this.door);
    this.box.bringToTop(this.blind);
    s.tweens.add({ targets: darkSide, alpha: 1, duration: 1400, delay: 400 });
    s.tweens.add({ targets: darkEnd, alpha: 1, duration: 700, delay: 1200 });
    [0, 1].forEach((i) =>
      s.time.delayedCall(900 + i * 400, () => {
        this.glows[i].setAlpha(0);
        sfx('click');
      })
    );
    s.time.delayedCall(1700, () => {
      this.blind.setText('NOT IN SERVICE');
      sfx('click');
    });
    s.time.delayedCall(2100, () => sfx('snap')); // doors
    s.tweens.add({
      targets: this.box,
      scale: 0.16,
      duration: 3600,
      delay: 2600,
      ease: 'sine.in',
      onComplete: () => {
        this.kill();
        if (onDone) onDone();
      },
    });
    s.tweens.add({ targets: this.box, alpha: 0, duration: 700, delay: 5500 });
  }

  kill(instant = false) {
    this.state = 'dead';
    if (this.steamTimer) this.steamTimer.remove();
    this.box.destroy();
    const s = this.scene;
    // the empty bay: rails to the buffers, an oil stain where it stood
    this.vista.setTexture(bayVistaTex(s, { lamps: false, empty: true, seed: this.platform }));
    this.setLamp(false);
    this.stop.setTexture(stationTex(s, 'hub-buffer-stop')).setTint(0x8a8a90);
    this.sign = uiText(s, this.x0 + (BAY.endX[0] + BAY.endX[1]) / 2, this.groundY - 44, 'NOT IN SERVICE', { size: 'body', color: '#c8c0b0', backing: 0x2a2a30 }).setOrigin(0.5).setDepth(D.INTERACT - 1);
    // keep the old handle: some callers fade `stain` in with the sign
    this.stain = this.vista;
    if (!instant) {
      this.sign.setAlpha(0);
      s.tweens.add({ targets: this.sign, alpha: 1, duration: 800 });
    }
  }
}

// ---- a stand-in Jo for the walk-in / walk-out ------------------------------------
// The player's own drawing (same atlas frames, his hat and its tint), moved
// by tweens with the walk stepped by the distance covered.
function standIn(scene, player) {
  const atlas = scene.textures.exists('jo');
  const anim = player.anim;
  const base = anim ? `${anim.id}/${anim.outfit}/${anim.view}` : 'jo/street/side';
  const frame = (name, i) => `${base}/${name}/${String(i).padStart(2, '0')}`;
  const f0 = player.feet ? player.feet() : { x: player.x, y: player.y + 22 };
  const art = atlas ? scene.add.image(f0.x, f0.y, 'jo', frame('idle', 0)) : scene.add.image(f0.x, f0.y - 24, 'jo-stand');
  const hatTex = player.hat && player.hat.texture ? player.hat.texture.key : null;
  const hat = scene.add.image(f0.x, f0.y, hatTex || '__DEFAULT');
  if (player.hat && player.hat.tintTopLeft !== 0xffffff) hat.setTint(player.hat.tintTopLeft);
  if (!hatTex) hat.setVisible(false);
  art.setDepth(D.INTERACT - 1.5);
  hat.setDepth(D.INTERACT - 1.4);
  art.setFlipX(!!player.flipX);
  hat.setFlipX(!!player.flipX);
  player.shown = false;
  const j = { art, hat, x: f0.x, y: f0.y, dist: 0 };
  const setFrame = (name, i) => {
    if (!atlas) return;
    const fn = frame(name, i);
    if (scene.textures.get('jo').has(fn)) art.setFrame(fn);
    if (hatTex === 'jo' && scene.textures.get('jo').has(`${fn}/hat`)) hat.setFrame(`${fn}/hat`);
  };
  setFrame('idle', 0);
  j.place = (x, y, k, tint = 1) => {
    j.x = x;
    j.y = y;
    art.setPosition(x, y).setScale(k);
    hat.setPosition(x, y).setScale(k);
    const c = Phaser.Display.Color.GetColor(Math.round(255 * tint), Math.round(255 * tint), Math.round(255 * (tint * 0.96 + 0.04)));
    art.setTint(c);
    if (!player.hat || player.hat.tintTopLeft === 0xffffff) hat.setTint(c);
  };
  // walk a straight line from a to b, scale ka → kb; the feet step 6 px of
  // ground per frame at full size (the rig's stride), less as he recedes
  j.walk = (a, b, ka, kb, duration, faceLeft, done) => {
    const o = { t: 0 };
    const flip = faceLeft === true ? true : b.x < a.x - 2;
    art.setFlipX(flip);
    hat.setFlipX(flip);
    let last = { x: a.x, y: a.y };
    scene.tweens.add({
      targets: o,
      t: 1,
      duration,
      ease: 'linear',
      onUpdate: () => {
        const k = ka + (kb - ka) * o.t;
        const x = a.x + (b.x - a.x) * o.t;
        const y = a.y + (b.y - a.y) * o.t;
        // depth moves count as ground covered too (walking away from us)
        j.dist += Math.hypot(x - last.x, (y - last.y) * 5) / Math.max(0.5, k);
        last = { x, y };
        // one frame per step of Jo's walk (manifest step × scale: 8 px), no slide
        const jm = characterManifest('jo');
        const stepPx = jm ? jm.animations.walk.step * (jm.scale || 2) : 8;
        setFrame('walk', Math.floor(j.dist / stepPx) % 8);
        j.place(x, y, k, 1 - (1 - k) * 0.9);
      },
      onComplete: () => {
        setFrame('idle', 0);
        if (done) done();
      },
    });
  };
  j.destroy = () => {
    art.destroy();
    hat.destroy();
  };
  return j;
}

// =====================================================================================
// the dream arrival: a full-scale side-on train standing at a platform, Jo
// steps down from its door, it pulls away (2.5 s, the wheels turning, the
// lit windows strobing across the platform), and the platform lamp comes on
// =====================================================================================
// arrivalTrain(scene, x, railY, livery, opts) builds two coupled coaches with
// the door of the first centred on `x`. railY is the rail; the coach floor
// (the door sill) is 51 px above it. Returns { container, doorX, sillY,
// depart(onGone), parts }.
export function arrivalTrain(scene, x, railY, livery, opts = {}) {
  const { depth = D.SUPPORT - 1, coaches = 2, dir = -1, light = true } = opts;
  const s = scene;
  const box = s.add.container(0, 0).setDepth(depth);
  const len = TRAIN.len + 8; // coach plus the gangway between
  // the door Jo uses is the trailing vestibule of coach 0 (the one nearest
  // the way the train leaves is its head end)
  const doorLocal = dir < 0 ? SIDE.doorX[1] : SIDE.doorX[0];
  const x0 = x - doorLocal;
  const wheels = [];
  for (let i = 0; i < coaches; i++) {
    const cx = x0 - dir * i * len;
    const tail = i === coaches - 1;
    const tex = carriageSideTex(s, livery, { tail: dir < 0 ? tail : false, head: dir > 0 ? tail : false, seed: 3 + i * 4 });
    for (const bx of SIDE.bogieX) {
      for (const ax of [-SIDE.axle, SIDE.axle]) {
        const w = s.add.image(cx + bx + ax, railY - TRAIN.wheel / 2, wheelTex(s));
        wheels.push(w);
        box.add(w);
      }
      box.add(s.add.image(cx + bx, railY - TRAIN.wheel / 2 + 2, bogieTex(s)));
    }
    box.add(s.add.image(cx, railY, tex).setOrigin(0, 1));
  }
  // the window light thrown on the platform: a row of warm patches on the
  // stone that travel (and strobe) with the train as it goes
  const strobe = [];
  const platformY = opts.platformY !== undefined ? opts.platformY : railY - 24;
  if (light) {
    for (let i = 0; i < coaches; i++) {
      const cx = x0 - dir * i * len;
      for (let k = 0; k < 8; k++) {
        const g = s.add
          .image(cx + 150 + k * 82, platformY + 6, hubTex(s, 'glow', 64, 64))
          .setDisplaySize(70, 10)
          .setTint(0xf2c078)
          .setAlpha(0.3)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(opts.lightDepth !== undefined ? opts.lightDepth : depth + 1.5);
        g.baseX = g.x;
        strobe.push(g);
      }
    }
  }
  // the door Jo comes out of stands open on the lit vestibule
  const doorway = s.add.image(x, railY - TRAIN.floor, doorwayTex(s)).setOrigin(0.5, 1).setDepth(depth + 0.2);
  const api = {
    container: box,
    doorX: x,
    sillY: railY - TRAIN.floor,
    wheels,
    strobe,
    railY,
    state: 'standing',
    // the doors' light falling out onto the platform
    doorLight: light
      ? s.add
          .image(x, railY - TRAIN.floor - TRAIN.doorH / 2, hubTex(s, 'glow', 64, 64))
          .setDisplaySize(TRAIN.doorW + 30, TRAIN.doorH + 20)
          .setTint(0xf2d090)
          .setAlpha(0.45)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(depth + 0.5)
      : null,
    doorway,
    // the doors slide shut (the lit gap closes to the middle), a whistle,
    // and it goes: 2.5 s from standing to gone, accelerating
    depart(onGone, duration = 2500) {
      api.state = 'departing';
      s.tweens.add({ targets: doorway, scaleX: 0, duration: 320, ease: 'sine.in', onComplete: () => doorway.setVisible(false) });
      sfx('snap');
      if (api.doorLight) s.tweens.add({ targets: api.doorLight, alpha: 0, duration: 300 });
      const dist = (coaches * len + 1100) * dir;
      const o = { t: 0 };
      let lastX = 0;
      s.time.delayedCall(380, () => sfx('whistle'));
      s.tweens.add({
        targets: o,
        t: 1,
        duration,
        delay: 380,
        ease: 'cubic.in',
        onUpdate: () => {
          const nx = dist * o.t;
          const dx = nx - lastX;
          lastX = nx;
          box.x = nx;
          // the wheels roll: angle = distance / radius
          for (const w of wheels) w.rotation += dx / (TRAIN.wheel / 2);
          // the window light slides along the stone and strobes as it
          // gathers speed (the piers between windows cut it)
          const v = Math.abs(dx);
          for (const g of strobe) {
            g.x = g.baseX + nx;
            g.setAlpha(0.18 + 0.2 * Math.abs(Math.sin(g.x * 0.05 + o.t * 60)) * Math.min(1, v / 5));
          }
        },
        onComplete: () => {
          api.state = 'gone';
          box.setVisible(false);
          strobe.forEach((g) => g.setVisible(false));
          if (onGone) onGone();
        },
      });
    },
    destroy() {
      box.destroy();
      doorway.destroy();
      strobe.forEach((g) => g.destroy());
      if (api.doorLight) api.doorLight.destroy();
    },
  };
  return api;
}
