import Phaser from 'phaser';
import Player from '../entities/Player.js';
import BaseLevel from './BaseLevel.js';
import { LEVELS } from '../data/levels.js';
import { THEMES } from '../themes/index.js';
import { completeDream } from '../utils/save.js';
import { music } from '../systems/audio.js';

const T = 32;
const overlaps = (a, b) => Phaser.Geom.Intersects.RectangleToRectangle(a, b);

// The Big Stage (musician dream). Chef runs in its own ChefScene.
export default class LevelScene extends BaseLevel {
  constructor() {
    super('Level');
  }

  init(data) {
    this.levelKey = (data && data.levelKey) || 'musician';
  }

  create() {
    this.level = LEVELS[this.levelKey];
    this.theme = THEMES[this.level.theme];

    const map = this.level.map;
    const worldW = Math.max(...map.map((r) => r.length)) * T;
    const worldH = map.length * T;

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

    let spawn = { x: 64, y: 64 };
    map.forEach((row, ty) => {
      [...row].forEach((ch, tx) => {
        const cx = tx * T + T / 2;
        const cy = ty * T + T / 2;
        if (ch === '#') this.solids.add(this.add.image(cx, cy, this.theme.tileKey));
        else if (ch === '^') {
          const s = this.spikes.create(cx, cy + 4, this.theme.spikeKey);
          s.body.setSize(24, 16).setOffset(4, 16);
        } else if (ch === 'O') this.spawnOrb(cx, cy);
        else if (ch === 'C') this.flags.create(cx, cy, 'flag');
        else if (ch === 'E') {
          const e = this.enemies.create(cx, cy, this.theme.enemyKey);
          e.setVelocityX(-this.enemySpeed());
          e.body.setSize(e.width - 6, e.height - 4).setOffset(3, 2);
        } else if (ch === 'S') spawn = { x: cx, y: cy - 16 };
        else if (ch === 'K') {
          const k = this.pianoKeys.create(cx, cy, 'mus-key');
          k.baseY = cy;
          k.sunk = false;
          k.lastStood = 0;
        } else if (ch === 'L') {
          this.add.image(cx, cy, 'mus-lamp');
          const beamH = worldH - cy - 40;
          const halo = this.add.rectangle(0, 0, 36, beamH, 0xf2d580, 0.18);
          const core = this.add.rectangle(0, 0, 12, beamH, 0xf2e0a0, 0.2);
          const beam = this.add.container(cx - 48, cy + 14 + beamH / 2, [halo, core]);
          this.beams.push(beam);
          this.tweens.add({
            targets: beam,
            x: cx + 48,
            duration: 2600,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inout',
            delay: this.beams.length * 1100,
          });
        } else if (ch === 'R') {
          this.critics.push({ sprite: this.add.image(cx, cy, 'mus-critic'), next: 0 });
        } else if (ch === 'B') {
          this.beats.push({ img: this.add.image(cx, cy + 8, 'mus-beat').setAlpha(0.15), phase: tx % 8 < 4 ? 0 : 800 });
        }
      });
    });

    this.player = new Player(this, spawn.x, spawn.y);
    this.setupCommon({ worldW, worldH, levelName: this.level.name, spawn });
    this.setObjective('♪ reach the microphone');

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
    this.physics.add.overlap(this.player, this.flags, (_p, flag) => this.activateCheckpoint(flag));
    this.physics.add.overlap(this.player, this.orbs, (_p, orb) => this.catchOrb(orb));

    music.bass();
    music.piano();
  }

  enemySpeed() {
    return this.theme.enemySpeed * (1 + 0.08 * this.difficulty);
  }

  spawnOrb(cx, cy) {
    const o = this.orbs.create(cx, cy, 'orb').setDepth(95);
    this.tweens.add({ targets: o, y: cy - 8, duration: 900, yoyo: true, repeat: -1, ease: 'sine.inout' });
    return o;
  }

  catchOrb(orb) {
    if (this.cardActive) return;
    completeDream(this.levelKey);
    music.stop();
    music.soloPiano();
    this.tweens.add({ targets: orb, scale: 2, alpha: 0, duration: 500 });
    this.showCard([...this.level.message.split('\n'), '', '[X] Back to the dreams'], () => {
      music.stop();
      this.scene.start('Select');
    });
  }

  update(time, delta) {
    if (this.handleModalUpdate()) return;
    const p = this.player;
    const pb = p.getBounds();
    p.update(time, delta);

    // ladle swing pops sour notes
    if (Phaser.Input.Keyboard.JustDown(p.keys.X)) {
      const hit = p.swingLadle();
      if (hit) {
        this.enemies.children.iterate((e) => {
          if (e && overlaps(hit, e.getBounds())) e.destroy();
        });
      }
    }

    this.pianoKeys.children.iterate((k) => {
      if (k && k.sunk && time - k.lastStood > 400) {
        k.sunk = false;
        this.tweens.add({ targets: k, y: k.baseY, duration: 350 });
      }
    });

    for (const beam of this.beams) {
      if (Math.abs(p.x - beam.x) < 14 && p.y > 120) {
        this.hurt();
        break;
      }
    }

    for (const c of this.critics) {
      const dx = p.x - c.sprite.x;
      const dy = Math.abs(p.y - c.sprite.y);
      if (time > c.next && dy < 140 && Math.abs(dx) < 440 && Math.abs(dx) > 30) {
        c.next = time + 2600;
        const proj = this.projectiles.create(c.sprite.x, c.sprite.y + 10, 'mus-shard');
        proj.setVelocityX(Math.sign(dx) * 150);
        proj.deathTime = time + 3600;
        c.sprite.setFlipX(dx < 0);
      }
    }
    this.projectiles.children.iterate((pr) => {
      if (pr && time > pr.deathTime) pr.destroy();
    });
    if (this.critics.length && !this.criticHint && Math.abs(p.x - 62 * T) < 48) {
      this.criticHint = true;
      this.floatText(p.x, p.y - 70, 'Duck [↓] under their words —\njump between the volleys!');
    }

    for (const b of this.beats) {
      const t = (time + b.phase) % 1600;
      const on = t >= 1100;
      b.img.setAlpha(t < 800 ? 0.15 : t < 1100 ? 0.5 : 1);
      if (on && overlaps(pb, b.img.getBounds())) {
        this.hurt();
        break;
      }
    }

    this.enemies.children.iterate((e) => {
      if (!e || !e.body) return;
      const dir = Math.sign(e.body.velocity.x) || -1;
      const speed = this.enemySpeed();
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
