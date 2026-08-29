import Phaser from 'phaser';
import Player from '../entities/Player.js';
import { createPixelTexture } from '../utils/pixelart.js';
import { LEVELS } from '../data/levels.js';
import { THEMES } from '../themes/index.js';

const T = 32;

const ORB = {
  rows: ['..oooo..', '.oOOOOo.', 'oOOWWOOo', 'oOWWWWOo', 'oOWWWWOo', 'oOOWWOOo', '.oOOOOo.', '..oooo..'],
  pal: { o: 0x7ec8a9, O: 0xa9e8c9, W: 0xf0fff8 },
};
const FLAG = {
  rows: ['P.......', 'Pffff...', 'Pffffff.', 'Pffff...', 'P.......', 'P.......', 'P.......', 'P.......'],
  pal: { P: 0x8a8aa8, f: 0x88b8d8 },
  lit: { P: 0x8a8aa8, f: 0xf2c078 },
};
const HEART = { rows: ['.hh.hh.', 'hhhhhhh', 'hhhhhhh', '.hhhhh.', '..hhh..', '...h...'], pal: { h: 0xe86a6a } };

const overlaps = (a, b) => Phaser.Geom.Intersects.RectangleToRectangle(a, b);

export default class LevelScene extends Phaser.Scene {
  constructor() {
    super('Level');
  }

  init(data) {
    this.levelKey = (data && data.levelKey) || 'musician';
  }

  create() {
    this.level = LEVELS[this.levelKey];
    this.theme = THEMES[this.level.theme];
    this.lives = 3;
    this.cardActive = false;

    const map = this.level.map;
    const worldW = Math.max(...map.map((r) => r.length)) * T;
    const worldH = map.length * T;
    this.worldH = worldH;

    createPixelTexture(this, 'orb', ORB.rows, ORB.pal, 3);
    createPixelTexture(this, 'flag', FLAG.rows, FLAG.pal, 4);
    createPixelTexture(this, 'flag-lit', FLAG.rows, FLAG.lit, 4);
    createPixelTexture(this, 'heart', HEART.rows, HEART.pal, 3);
    this.theme.createTextures(this);
    this.theme.drawBackdrop(this, worldW, worldH);

    this.solids = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.orbs = this.physics.add.staticGroup();
    this.flags = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.pianoKeys = this.physics.add.group({ allowGravity: false, immovable: true });
    this.projectiles = this.physics.add.group({ allowGravity: false });

    this.beams = [];
    this.critics = [];
    this.beats = [];
    this.flames = [];
    this.conveyorGrid = {};
    this.oilGrid = {};
    this.dishStand = null;
    this.platingTable = null;
    this.hasDish = false;
    this.delivered = false;
    this.carrySprite = null;
    this.hintNext = 0;

    let spawn = { x: 64, y: 64 };
    map.forEach((row, ty) => {
      [...row].forEach((ch, tx) => {
        const cx = tx * T + T / 2;
        const cy = ty * T + T / 2;
        if (ch === '#') {
          this.solids.add(this.add.image(cx, cy, this.theme.tileKey));
        } else if (ch === '^') {
          const s = this.spikes.create(cx, cy + 4, this.theme.spikeKey);
          s.body.setSize(24, 16).setOffset(4, 16);
        } else if (ch === 'O') {
          this.spawnOrb(cx, cy);
        } else if (ch === 'C') {
          this.flags.create(cx, cy, 'flag');
        } else if (ch === 'E') {
          const e = this.enemies.create(cx, cy, this.theme.enemyKey);
          e.setVelocityX(-this.theme.enemySpeed);
          e.body.setSize(e.width - 6, e.height - 4).setOffset(3, 2);
        } else if (ch === 'S') {
          spawn = { x: cx, y: cy - 16 };
        } else if (ch === 'K') {
          const k = this.pianoKeys.create(cx, cy, 'mus-key');
          k.baseY = cy;
          k.sunk = false;
          k.lastStood = 0;
        } else if (ch === 'L') {
          this.add.image(cx, cy, 'mus-lamp');
          const beamH = worldH - cy - 40;
          const beam = this.add.rectangle(cx, cy + 14 + beamH / 2, 36, beamH, 0xf2d580, 0.18);
          this.add.rectangle(cx, cy + 14 + beamH / 2, 12, beamH, 0xf2e0a0, 0.14);
          this.beams.push(beam);
          this.tweens.add({
            targets: beam,
            x: cx + 96,
            duration: 1700,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inout',
            delay: this.beams.length * 550,
          });
          beam.x = cx - 96;
        } else if (ch === 'R') {
          const c = this.add.image(cx, cy, 'mus-critic');
          this.critics.push({ sprite: c, next: 0 });
        } else if (ch === 'B') {
          const b = this.add.image(cx, cy + 8, 'mus-beat').setAlpha(0.15);
          this.beats.push({ img: b, phase: tx % 8 < 4 ? 0 : 800 });
        } else if (ch === '<' || ch === '>') {
          const belt = this.add.image(cx, cy, 'chef-belt').setFlipX(ch === '<');
          this.solids.add(belt);
          (this.conveyorGrid[ty] ||= {})[tx] = ch === '<' ? -1 : 1;
        } else if (ch === 'I') {
          const oil = this.add.image(cx, cy, 'chef-oil');
          this.solids.add(oil);
          (this.oilGrid[ty] ||= {})[tx] = true;
        } else if (ch === 'F') {
          const f = this.add.image(cx, cy + T / 2 - 20, 'chef-flame').setAlpha(0);
          this.flames.push({ img: f, x: cx, baseY: cy + T / 2, phase: (tx % 3) * 500, active: false });
        } else if (ch === 'D') {
          const d = this.add.image(cx, cy + 2, 'chef-cloche');
          this.dishStand = { sprite: d, x: cx, y: cy };
        } else if (ch === 'T') {
          this.add.image(cx, cy - 8, 'chef-table');
          this.platingTable = { x: cx, y: cy };
        }
      });
    });

    this.spawnPoint = spawn;
    this.checkpoint = spawn;

    this.physics.world.setBounds(0, 0, worldW, worldH + 200);
    this.player = new Player(this, spawn.x, spawn.y);

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.collider(this.player, this.pianoKeys, (_p, key) => {
      if (this.player.body.touching.down) {
        key.lastStood = this.time.now;
        if (!key.sunk) {
          key.sunk = true;
          this.tweens.add({ targets: key, y: key.baseY + 12, duration: 250 });
        }
      }
    });
    this.physics.add.collider(this.projectiles, this.solids, (proj) => proj.destroy());
    this.physics.add.overlap(this.player, this.spikes, () => this.hurt());
    this.physics.add.overlap(this.player, this.enemies, () => this.hurt());
    this.physics.add.overlap(this.player, this.projectiles, (_p, proj) => {
      proj.destroy();
      this.hurt();
    });
    this.physics.add.overlap(this.player, this.flags, (_p, flag) => {
      if (flag.texture.key === 'flag') {
        flag.setTexture('flag-lit');
        this.checkpoint = { x: flag.x, y: flag.y - 8 };
      }
    });
    this.physics.add.overlap(this.player, this.orbs, (_p, orb) => this.catchOrb(orb));

    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(400);

    this.invulnUntil = 0;
    this.hearts = [0, 1, 2].map((i) => this.add.image(28 + i * 30, 30, 'heart').setScrollFactor(0).setDepth(50));
    this.add
      .text(16, 52, this.level.name, { fontFamily: 'monospace', fontSize: '14px', color: '#e8dcc8' })
      .setScrollFactor(0)
      .setDepth(50);
  }

  spawnOrb(cx, cy) {
    const o = this.orbs.create(cx, cy, 'orb');
    this.tweens.add({ targets: o, y: cy - 8, duration: 900, yoyo: true, repeat: -1, ease: 'sine.inout' });
    return o;
  }

  floatText(x, y, msg) {
    const t = this.add
      .text(x, y, msg, { fontFamily: 'monospace', fontSize: '14px', color: '#f2e0a0', align: 'center' })
      .setOrigin(0.5)
      .setDepth(60);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 1800, onComplete: () => t.destroy() });
  }

  hurt() {
    if (this.cardActive || this.time.now < this.invulnUntil) return;
    if (this.hasDish) {
      this.hasDish = false;
      if (this.carrySprite) this.carrySprite.destroy();
      this.carrySprite = null;
      this.dishStand.sprite.setVisible(true);
      this.floatText(this.player.x, this.player.y - 50, 'The dish!');
    }
    this.lives -= 1;
    this.hearts.forEach((h, i) => h.setAlpha(i < this.lives ? 1 : 0.25));
    if (this.lives <= 0) {
      this.showCard(
        ['You gave everything… and it slipped away.', '', 'Do you really want to pursue this dream?', '', '[X] Try again'],
        () => this.scene.restart({ levelKey: this.levelKey })
      );
      return;
    }
    this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
    this.player.setVelocity(0, 0);
    this.invulnUntil = this.time.now + 2000;
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 150,
      yoyo: true,
      repeat: 6,
      onComplete: () => this.player.setAlpha(1),
    });
  }

  catchOrb(orb) {
    if (this.cardActive) return;
    this.tweens.add({ targets: orb, scale: 2, alpha: 0, duration: 500 });
    this.showCard([...this.level.message.split('\n'), '', '[X] Back to the dreams'], () =>
      this.scene.start('Select')
    );
  }

  showCard(lines, onConfirm) {
    this.cardActive = true;
    this.physics.pause();
    this.tweens.pauseAll();
    const cam = this.cameras.main;
    this.add
      .rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.75)
      .setScrollFactor(0)
      .setDepth(100);
    this.add
      .text(cam.width / 2, cam.height / 2, lines.join('\n'), {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#e8dcc8',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101);
    this.cardConfirm = onConfirm;
  }

  update(time, delta) {
    if (this.cardActive) {
      if (Phaser.Input.Keyboard.JustDown(this.player.keys.X)) {
        this.tweens.resumeAll();
        this.cardConfirm();
      }
      return;
    }

    const p = this.player;
    const pb = p.getBounds();
    const footTx = Math.floor(p.x / T);
    const footTy = Math.floor((p.y + p.body.height / 2 + 6) / T);

    // oil + conveyor checks feed into player movement
    p.slippery = !!this.oilGrid[footTy]?.[footTx];
    p.update(time, delta);
    if (p.body.blocked.down) {
      const dir = this.conveyorGrid[footTy]?.[footTx];
      if (dir) p.body.velocity.x += dir * 90;
    }

    // piano keys rise again after Jo moves on
    this.pianoKeys.children.iterate((k) => {
      if (k && k.sunk && time - k.lastStood > 400) {
        k.sunk = false;
        this.tweens.add({ targets: k, y: k.baseY, duration: 350 });
      }
    });

    // sweeping spotlights: caught in the beam = thrown out
    for (const beam of this.beams) {
      if (Math.abs(p.x - beam.x) < 26 && p.y > 120) {
        this.hurt();
        break;
      }
    }

    // critics fire word-shards when Jo is near their row
    for (const c of this.critics) {
      const dx = p.x - c.sprite.x;
      const dy = Math.abs(p.y - c.sprite.y);
      if (time > c.next && dy < 140 && Math.abs(dx) < 440 && Math.abs(dx) > 30) {
        c.next = time + 1900;
        const proj = this.projectiles.create(c.sprite.x, c.sprite.y, 'mus-shard');
        proj.setVelocityX(Math.sign(dx) * 190);
        proj.deathTime = time + 3200;
        c.sprite.setFlipX(dx < 0);
      }
    }
    this.projectiles.children.iterate((pr) => {
      if (pr && time > pr.deathTime) pr.destroy();
    });

    // beat lights pulse: dim -> warn -> deadly
    for (const b of this.beats) {
      const t = (time + b.phase) % 1600;
      const on = t >= 1100;
      b.img.setAlpha(t < 800 ? 0.15 : t < 1100 ? 0.5 : 1);
      if (on && overlaps(pb, b.img.getBounds())) {
        this.hurt();
        break;
      }
    }

    // flame bursts: hidden -> flicker warning -> burst
    for (const f of this.flames) {
      const t = (time + f.phase) % 2000;
      if (t < 1000) {
        f.img.setAlpha(0);
        f.active = false;
      } else if (t < 1400) {
        f.img.setAlpha(0.5).setScale(1, 0.4);
        f.img.y = f.baseY - 8;
        f.active = false;
      } else {
        f.img.setAlpha(1).setScale(1, 1);
        f.img.y = f.baseY - 20;
        f.active = true;
      }
      if (f.active && overlaps(pb, new Phaser.Geom.Rectangle(f.x - 14, f.baseY - 40, 28, 40))) {
        this.hurt();
        break;
      }
    }

    // dish pickup / carry / delivery
    if (this.dishStand && !this.hasDish && !this.delivered && this.dishStand.sprite.visible) {
      if (Phaser.Math.Distance.Between(p.x, p.y, this.dishStand.x, this.dishStand.y) < 40) {
        this.hasDish = true;
        this.dishStand.sprite.setVisible(false);
        this.carrySprite = this.add.image(p.x, p.y - 40, 'chef-cloche').setScale(0.8).setDepth(20);
        this.floatText(p.x, p.y - 60, 'Careful with the dish…');
      }
    }
    if (this.carrySprite) this.carrySprite.setPosition(p.x, p.y - 40);
    if (this.platingTable && !this.delivered) {
      const near = Phaser.Math.Distance.Between(p.x, p.y, this.platingTable.x, this.platingTable.y) < 50;
      if (near && this.hasDish) {
        this.delivered = true;
        this.hasDish = false;
        this.carrySprite.destroy();
        this.carrySprite = null;
        this.floatText(this.platingTable.x, this.platingTable.y - 70, 'Service!');
        this.spawnOrb(this.platingTable.x, this.platingTable.y - 100);
      } else if (near && !this.hasDish && time > this.hintNext) {
        this.hintNext = time + 3000;
        this.floatText(this.platingTable.x, this.platingTable.y - 70, 'The plate needs its dish…\nfind the silver cloche.');
      }
    }

    // patrollers turn at walls and platform edges
    this.enemies.children.iterate((e) => {
      if (!e || !e.body) return;
      const dir = Math.sign(e.body.velocity.x) || -1;
      const speed = this.theme.enemySpeed;
      if (e.body.blocked.left) e.setVelocityX(speed);
      else if (e.body.blocked.right) e.setVelocityX(-speed);
      else if (e.body.onFloor()) {
        const aheadX = e.x + dir * (e.width / 2 + 4);
        const footY = e.y + e.height / 2 + 8;
        const hasGround = this.solids
          .getChildren()
          .some((s) => Math.abs(s.x - aheadX) <= T / 2 && Math.abs(s.y - footY) <= T / 2);
        if (!hasGround) e.setVelocityX(-dir * speed);
      }
    });

    if (p.y > this.worldH + 60) {
      p.setPosition(this.checkpoint.x, this.checkpoint.y);
      p.setVelocity(0, 0);
      this.hurt();
    }
  }
}
