import Phaser from 'phaser';
import { createPixelTexture } from '../utils/pixelart.js';
import { getDifficulty } from '../utils/save.js';
import DialogueBox from '../systems/DialogueBox.js';
import { sfx, music, musicDirector, sting, isMusicOff, toggleMusic } from '../systems/audio.js';
import RoomBuilder from '../builders/RoomBuilder.js';
import Parallax from '../builders/parallax.js';
import Foe from '../entities/Foe.js';
import { createFoeTextures } from '../entities/foeArt.js';
import { FOES } from '../data/kinds.js';
import { showTutorial } from '../systems/tutorial.js';
import { hitStop } from '../systems/effects.js';

const HEART = { rows: ['.hh.hh.', 'hhhhhhh', 'hhhhhhh', '.hhhhh.', '..hhh..', '...h...'], pal: { h: 0xe86a6a } };
const ORB = {
  rows: ['..oooo..', '.oOOOOo.', 'oOOWWOOo', 'oOWWWWOo', 'oOWWWWOo', 'oOOWWOOo', '.oOOOOo.', '..oooo..'],
  pal: { o: 0x7ec8a9, O: 0xa9e8c9, W: 0xf0fff8 },
};
const FLAG = {
  rows: ['P.......', 'Pffff...', 'Pffffff.', 'Pffff...', 'P.......', 'P.......', 'P.......', 'P.......'],
  pal: { P: 0x8a8aa8, f: 0x88b8d8 },
  lit: { P: 0x8a8aa8, f: 0xf2c078 },
};

// Shared level plumbing: lives/hearts (3 + dreams caught, max 5), hurt and
// respawn, cards, pause, objective HUD, dialogue host, darkness tint,
// camera polish. Subclasses build the world and call setupCommon().
export default class BaseLevel extends Phaser.Scene {
  setupCommon({ worldW, worldH, levelName, spawn }) {
    this.difficulty = getDifficulty();
    this.maxLives = Math.min(5, 3 + this.difficulty);
    this.lives = this.maxLives;
    this.cardActive = false;
    this.dialogActive = false;
    this.puzzleActive = false;
    this.worldH = worldH;
    this.checkpoint = spawn;
    this.invulnUntil = 0;
    this.dialog = new DialogueBox(this);
    this.flagsState = {};

    createPixelTexture(this, 'heart', HEART.rows, HEART.pal, 3);
    createPixelTexture(this, 'orb', ORB.rows, ORB.pal, 3);
    createPixelTexture(this, 'flag', FLAG.rows, FLAG.pal, 4);
    createPixelTexture(this, 'flag-lit', FLAG.rows, FLAG.lit, 4);

    this.physics.world.setBounds(0, 0, worldW, worldH + 200);
    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.startFollow(this.player, true, 0.1, 0.1);
    cam.setDeadzone(80, 60);
    cam.fadeIn(400);

    // darkness per dream caught (approximation of the palette shader):
    // overlay below HUD; orbs render above it and stay bright
    if (this.difficulty > 0) {
      this.add
        .rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x0a0a14, Math.min(0.45, this.difficulty * 0.09))
        .setScrollFactor(0)
        .setDepth(90);
    }

    this.hearts = Array.from({ length: this.maxLives }, (_, i) =>
      this.add.image(28 + i * 30, 30, 'heart').setScrollFactor(0).setDepth(150)
    );
    this.add
      .text(16, 52, levelName, { fontFamily: 'monospace', fontSize: '14px', color: '#e8dcc8' })
      .setScrollFactor(0)
      .setDepth(150);
    this.objectiveText = this.add
      .text(cam.width - 16, 52, '', { fontFamily: 'monospace', fontSize: '13px', color: '#f2d580', align: 'right' })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(150);
    this.add
      .text(cam.width - 16, 26, '[Esc] pause', { fontFamily: 'monospace', fontSize: '12px', color: '#8a8478' })
      .setOrigin(1, 0.5)
      .setScrollFactor(0)
      .setDepth(150);

    // D7 — the director drives the mix and the beat clock for this level
    musicDirector.attach(this);
    this.beatNum = 0;
    this.events.on('beat', (b) => {
      this.beatNum = b;
    });
    this.events.once('shutdown', () => {
      musicDirector.stop();
      this.events.off('beat');
    });

    // music on/off: a HUD button you can click, and [M]
    this.musicBtn = this.add
      .text(cam.width - 16, cam.height - 18, '', { fontFamily: 'monospace', fontSize: '12px', color: '#c8c0b0', backgroundColor: '#14101c', padding: { x: 6, y: 3 } })
      .setOrigin(1, 0.5)
      .setScrollFactor(0)
      .setDepth(150)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.setMusicLabel(toggleMusic()));
    this.setMusicLabel(isMusicOff());
    this.input.keyboard.on('keydown-M', () => this.setMusicLabel(toggleMusic()));

    this.keyEsc = this.input.keyboard.addKey('ESC');
    this.keyQ = this.input.keyboard.addKey('Q');
    this.input.keyboard.on('keydown-F', () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });
  }

  // ---- D6 confrontation ------------------------------------------------

  initFoes(dreamKey) {
    createFoeTextures(this);
    this.dreamKey = dreamKey;
    this.foes = [];
    this.hideSpots = [];
    this.playerHidden = false;
    this.foeGroup = this.physics.add.group();
  }

  addFoe(def) {
    const reg = (FOES[this.dreamKey] || {})[def.kind] || {};
    const merged = { ...reg, ...def };
    if (merged.minDifficulty !== undefined && this.difficulty < merged.minDifficulty) return null;
    const foe = new Foe(this, merged, merged.texture || 'foe-crawler');
    if (merged.tint) foe.setTint(merged.tint);
    if (merged.floats || merged.ranged) foe.body.setAllowGravity(false);
    this.foeGroup.add(foe);
    this.foes.push(foe);
    if (merged.human) showTutorial(this, 'shove');
    return foe;
  }

  spawnRoomFoes(objects, filter = () => true) {
    objects
      .filter((o) => o.type === 'foe' && filter(o))
      .forEach((o) => this.addFoe({ ...o, wx: o.wx, wy: o.wy }));
  }

  addHideSpots(objects) {
    objects
      .filter((o) => o.type === 'hide')
      .forEach((o) => {
        this.hideSpots.push({ x: o.wx, y: o.wy, id: o.id });
        this.add.rectangle(o.wx, o.wy + 6, 34, 34, 0x2a2a34, 0.55).setDepth(9).setStrokeStyle(1, 0x6a6478);
      });
  }

  // D6.1 — caught by a person: not death, ejection.
  throwOut(foe) {
    if (this.thrownOut || this.cardActive) return;
    this.thrownOut = true;
    sfx('fail');
    this.cameras.main.shake(200, 0.008);
    this.player.controlLockUntil = this.time.now + 1500;
    this.player.body.setVelocity(0, 0);
    if (this.dropCarry) this.dropCarry();

    const cam = this.cameras.main;
    const wipe = this.add
      .rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0)
      .setScrollFactor(0)
      .setDepth(230);
    const label = this.add
      .text(cam.width / 2, cam.height / 2, 'THROWN OUT', { fontFamily: 'monospace', fontSize: '26px', color: '#e8dcc8' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(231)
      .setAlpha(0);
    this.tweens.add({ targets: [wipe], alpha: 0.9, duration: 500 });
    this.tweens.add({ targets: [label], alpha: 1, duration: 500 });
    this.time.delayedCall(1000, () => {
      this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
      this.player.setVelocity(0, 0);
      this.tweens.add({
        targets: [wipe, label],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          wipe.destroy();
          label.destroy();
          this.thrownOut = false;
        },
      });
      this.loseHeart();
    });
  }

  loseHeart() {
    this.lives -= 1;
    this.updateHearts();
    if (this.lives <= 0) this.sectionRestart();
  }

  // D6.3 — hearts are lives per section: at zero the section restarts.
  sectionRestart() {
    music.stop();
    sting.death();
    this.showCard(
      [
        'You gave everything… and it slipped away.',
        '',
        'Do you really want to pursue this dream?',
        '',
        '[X] Try again      [Q] Choose another dream',
      ],
      () => this.scene.restart(),
      () => this.scene.start('Hub')
    );
  }

  updateFoes(time) {
    const p = this.player;
    // hide spots: crouch inside one and people lose you
    const spot = this.hideSpots.find((h) => Math.abs(h.x - p.x) < 24 && Math.abs(h.y - p.y) < 34);
    const crouching = p.cursors.down.isDown || p.keys.S.isDown;
    const wasHidden = this.playerHidden;
    this.playerHidden = !!(spot && crouching);
    if (spot && !wasHidden && !this.playerHidden) showTutorial(this, 'hide');
    if (this.playerHidden && !wasHidden) this.floatText(p.x, p.y - 46, 'hidden', '#88b8d8');

    for (const foe of this.foes) {
      if (!foe.active) continue;
      foe.update(time, p);
      // D6.2 trip: a person knocked onto a hazard tile removes themselves
      if (foe.human && foe.state === 'staggered' && this.surfaceGrid) {
        const tx = Math.floor(foe.x / 32);
        const ty = Math.floor((foe.y + 20) / 32);
        const s = this.surfaceGrid[ty] && this.surfaceGrid[ty][tx];
        if (s === 'liquid' || s === 'grease' || s === 'conveyor_l' || s === 'conveyor_r') foe.trip();
      }
    }
    this.foes = this.foes.filter((f) => f.active);
  }

  setMusicLabel(off) {
    if (this.musicBtn) this.musicBtn.setText(off ? '[M] ♪ music: off' : '[M] ♪ music: on');
  }

  setObjective(text) {
    this.objectiveText.setText(text);
    this.tweens.add({ targets: this.objectiveText, alpha: 0.2, duration: 120, yoyo: true, repeat: 2 });
  }

  updateHearts() {
    this.hearts.forEach((h, i) => h.setAlpha(i < this.lives ? 1 : 0.25));
  }

  floatText(x, y, msg, color = '#f2e0a0') {
    const t = this.add
      .text(x, y, msg, { fontFamily: 'monospace', fontSize: '14px', color, align: 'center' })
      .setOrigin(0.5)
      .setDepth(60);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 1800, onComplete: () => t.destroy() });
  }

  onHurtExtra() {}

  hurt() {
    if (this.cardActive || this.dialogActive || this.puzzleActive) return;
    if (this.time.now < this.invulnUntil) return;
    sfx('hurt');
    hitStop(this, 60); // D5
    this.cameras.main.shake(240, 0.008); // D1: shake doubled for 32px scale
    this.player.burst();
    this.player.knockHat();
    this.onHurtExtra();
    this.lives -= 1;
    this.updateHearts();
    if (this.lives <= 0) {
      music.stop();
      this.showCard(
        [
          'You gave everything… and it slipped away.',
          '',
          'Do you really want to pursue this dream?',
          '',
          '[X] Try again      [Q] Choose another dream',
        ],
        () => this.scene.restart(),
        () => this.scene.start('Hub')
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

  activateCheckpoint(flagSprite) {
    if (flagSprite.texture.key === 'flag') {
      flagSprite.setTexture('flag-lit');
      this.checkpoint = { x: flagSprite.x, y: flagSprite.y - 8 };
      sting.checkpoint();
    }
  }

  // D7 — room-driven music: bpm and state follow whichever room Jo is in,
  // escalating to `danger` whenever a person has noticed him.
  updateMusicRoom() {
    if (!this.built || !this.built.rooms) return;
    const room = RoomBuilder.roomAt(this.built.rooms, this.player.x);
    if (room !== this._room) {
      this._room = room;
      if (room.music) {
        musicDirector.setBpm(room.music.bpm);
        this._roomState = room.music.state || 'explore';
      }
      if (this.parallax) this.parallax.setRoom(room);
      if (room.vista) this.cameras.main.zoomTo(0.8, 800);
      else if (this.cameras.main.zoom !== 1) this.cameras.main.zoomTo(1, 600);
    }
    if (this.parallax) this.parallax.update();
    const hunted = (this.foes || []).some((f) => f.human && (f.state === 'alert' || f.state === 'windup'));
    musicDirector.setState(this.thrownOut ? 'caught' : hunted ? 'danger' : this._roomState || 'explore');
  }

  showCard(lines, onConfirm, onAlt = null) {
    this.cardActive = true;
    this.physics.pause();
    this.tweens.pauseAll();
    const cam = this.cameras.main;
    this.cardOverlay = this.add
      .rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.75)
      .setScrollFactor(0)
      .setDepth(250);
    this.cardText = this.add
      .text(cam.width / 2, cam.height / 2, lines.join('\n'), {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#e8dcc8',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(251);
    this.cardConfirm = onConfirm;
    this.cardAlt = onAlt;
  }

  closeCard() {
    this.cardActive = false;
    this.cardOverlay.destroy();
    this.cardText.destroy();
    if (!this.dialogActive && !this.puzzleActive) this.physics.resume();
    this.tweens.resumeAll();
  }

  // returns true when the frame should be swallowed (modal open / pause)
  handleModalUpdate() {
    if (this.dialogActive || this.puzzleActive) return true;
    if (this.cardActive) {
      if (Phaser.Input.Keyboard.JustDown(this.player.keys.X)) {
        const fn = this.cardConfirm;
        this.closeCard();
        if (fn) fn();
      } else if (this.cardAlt && Phaser.Input.Keyboard.JustDown(this.keyQ)) {
        const fn = this.cardAlt;
        this.closeCard();
        fn();
      }
      return true;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
      this.showCard(['Paused', '', '[X] Keep dreaming', '[Q] Back to Crossroads Station'], null, () => {
        music.stop();
        this.scene.start('Hub');
      });
      return true;
    }
    // camera look-ahead in facing direction
    this.cameras.main.followOffset.x = this.player.flipX ? 48 : -48;
    return false;
  }
}
