import Phaser from 'phaser';
import { createPixelTexture } from '../utils/pixelart.js';
import { getDifficulty } from '../utils/save.js';
import DialogueBox from '../systems/DialogueBox.js';
import { sfx, music } from '../systems/audio.js';

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

    this.keyEsc = this.input.keyboard.addKey('ESC');
    this.keyQ = this.input.keyboard.addKey('Q');
    this.input.keyboard.on('keydown-F', () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });
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
    this.cameras.main.shake(120, 0.004);
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
        () => this.scene.start('Select')
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
      sfx('bell');
    }
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
      this.showCard(['Paused', '', '[X] Keep dreaming', '[Q] Choose another dream'], null, () => {
        music.stop();
        this.scene.start('Select');
      });
      return true;
    }
    // camera look-ahead in facing direction
    this.cameras.main.followOffset.x = this.player.flipX ? 48 : -48;
    return false;
  }
}
