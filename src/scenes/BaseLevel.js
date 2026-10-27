import Phaser from 'phaser';
import { createPixelTexture } from '../utils/pixelart.js';
import { getDifficulty, getSave, updateSave, getRun, setRun, clearRun, getSettings, updateSettings } from '../utils/save.js';
import DialogueBox from '../systems/DialogueBox.js';
import { sfx, music, musicDirector, sting, isMusicOff, toggleMusic } from '../systems/audio.js';
import RoomBuilder from '../builders/RoomBuilder.js';
import Parallax from '../builders/parallax.js';
import { setupLook } from '../art/look.js';
import Foe from '../entities/Foe.js';
import { createFoeTextures } from '../entities/foeArt.js';
import { FOES } from '../data/kinds.js';
import { showTutorial } from '../systems/tutorial.js';
import { hitStop } from '../systems/effects.js';
import CoinManager, { createCoinTextures, createShardTexture } from '../entities/Coin.js';
import { getWallet, coinWorth, deductWorth } from '../systems/wallet.js';
import { dreamById, DREAMS } from '../data/dreams.js';
import { D } from '../builders/depths.js';
import { events } from '../core/events.js';
import { HealthModel } from '../play/Health.js';
import CheckpointService from '../play/Checkpoints.js';
import { RunState } from '../play/RunState.js';
import PauseMenu from '../ui/PauseMenu.js';
import ModalManager from '../ui/ModalManager.js';
import { hud } from '../ui/hud.js';
import { uiText } from '../ui/text.js';
import { panel, dim } from '../ui/Panel.js';

const T = 32;
// scene key → dream id (Hub and the Evening have no in-dream run)
const DREAM_OF_SCENE = Object.fromEntries(DREAMS.filter((d) => d.scene).map((d) => [d.scene, d.id]));

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
  // ---- failure / checkpoint state lives in services (plan §2.8); these
  // accessors keep every scene's old field names working.
  get lives() {
    return this.health ? this.health.hearts : this._lives;
  }
  set lives(v) {
    if (this.health) this.health.set(v);
    else this._lives = v;
  }
  get maxLives() {
    return this.health ? this.health.max : this._maxLives;
  }
  set maxLives(v) {
    if (this.health) this.health.setMax(v);
    else this._maxLives = v;
  }
  get invulnUntil() {
    return this.health ? this.health.invulnUntil : this._invulnUntil || 0;
  }
  set invulnUntil(v) {
    if (this.health) this.health.invulnUntil = v;
    else this._invulnUntil = v;
  }
  get checkpoint() {
    return this.checkpoints ? this.checkpoints.respawn : this._checkpoint;
  }
  set checkpoint(v) {
    if (this.checkpoints) this.checkpoints.setRespawn(v);
    else this._checkpoint = v;
  }

  // the goal line lives on the HUD (UIScene); old readers see `.text`
  get objectiveText() {
    return { text: this._objective || '', scene: this };
  }

  setupCommon({ worldW, worldH, levelName, spawn }) {
    this.difficulty = getDifficulty();
    const save = getSave();
    const max = Math.min(6, 3 + this.difficulty + Math.floor((save.shards || 0) / 3));
    // one HealthModel for every dream (the Painter's wells are a skin on it)
    this.health = new HealthModel({ max, bus: events, flavour: this.healthFlavour || 'hearts', noFail: !!this.noFail });
    this.checkpoints = new CheckpointService(this, { spawn, bus: events, onLit: (cp) => this.onCheckpointLit(cp) });
    this.respawning = false;
    this.paused = false;
    this.safeGround = null;
    this.levelStartedAt = this.time.now;
    this.modals = ModalManager.for(this);
    this.hud = hud.bind(this, this.hudProfile || 'default');
    this._objective = '';
    this.pauseMenu = new PauseMenu(this);
    this.initRun();
    // Bilal's tea: a heart refill banked for the next dream's first section —
    // here it simply tops the section up over the max by one.
    if (save.shop && save.shop.tea && this.scene.key !== 'Hub') {
      this.lives += 1;
      updateSave((sv) => (sv.shop.tea = false));
    }
    this.cardActive = false;
    this.dialogActive = false;
    this.puzzleActive = false;
    this.tutorialActive = false; // a scene left with a card up must not wake frozen
    this.worldH = worldH;
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
    // the look: a painted vignette and a moving grain, as in the Evening
    this.look = setupLook(this, { vignette: 0.85, grain: 0.04 });

    // darkness per dream caught (approximation of the palette shader):
    // overlay below HUD; orbs render above it and stay bright
    if (this.difficulty > 0) {
      this.add
        .rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x0a0a14, Math.min(0.45, this.difficulty * 0.09))
        .setScrollFactor(0)
        .setDepth(90);
    }

    // the HUD is published to the HudGrid on UIScene (plan §2.11)
    this.hearts = [];
    this.updateHearts();
    this.hud.set('level', levelName);

    // Collectibles §8 — HUD: the dream's coin + count this level under the
    // objective, with the wallet's worth total; shard tally under hearts.
    this.levelCoins = 0;
    this.dream = dreamById(this.dreamCoinId || '');
    if (this.dream && this.dream.coin) {
      createCoinTextures(this, this.dream.id, this.dream.coin.pal);
      createShardTexture(this);
      this.coinMgr = new CoinManager(this, this.dream.id);
      this.coinIcon = `coin-${this.dream.id}-0`;
      this.coinHud = { setText: (t) => this.hud.set('coins', { text: t, icon: this.coinIcon }) };
      this.updateCoinHud();
    }
    this.shardHud = this.hud.line('shards');
    this.updateShardHud();
    this.satchel = [];
    this.satchelHud = this.hud.line('context');
    this.coinsSinceCP = 0;

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

    // music on/off: the HUD footer is a button you can click, and [M]
    this.musicBtn = true;
    this.setMusicLabel(isMusicOff());
    this.input.keyboard.on('keydown-M', () => this.setMusicLabel(toggleMusic()));

    this.keyEsc = this.input.keyboard.addKey('ESC');
    this.keyQ = this.input.keyboard.addKey('Q');
    // last safe footing (a pit or a river returns Jo here, not to the flag)
    this.events.on('update', this.trackSafeGround, this);
    // a resumed run is applied once the subclass's create() has finished
    this.events.once('create', () => this.applyResume());
    this.events.once('shutdown', () => {
      this.events.off('update', this.trackSafeGround, this);
      if (this.pauseMenu) this.pauseMenu.destroy();
    });
    // fullscreen lives on a key no dream uses for play ([F] is the tether /
    // the companion call): a stray toggle used to eject people to the pause card
    this.input.keyboard.on('keydown-B', () => {
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
        // a stack of crates with a dark gap Jo can crouch into. The crates
        // draw in front of him so ducking behind them reads as hiding.
        const tex = this.textures.exists('chef-crate') ? 'chef-crate' : this.textures.exists('hub-suitcase') ? 'hub-suitcase' : null;
        const floor = o.wy + 16;
        const gap = this.add.rectangle(o.wx, floor - 20, 36, 40, 0x0a0a12, 0.85).setDepth(9);
        const front = tex
          ? [this.add.image(o.wx - 12, floor - 14, tex).setDepth(D.FOE + 2), this.add.image(o.wx + 14, floor - 12, tex).setDepth(D.FOE + 2).setScale(0.8), this.add.image(o.wx - 4, floor - 40, tex).setDepth(D.FOE + 2).setScale(0.9)]
          : [this.add.rectangle(o.wx, floor - 20, 40, 40, 0x6a4a32).setDepth(D.FOE + 2)];
        const prompt = uiText(this, o.wx, floor - 76, '[\u2193] hide', { size: 'small', color: 'calm', bg: '#14101c' })
          .setOrigin(0.5)
          .setDepth(80)
          .setVisible(false);
        this.hideSpots.push({ x: o.wx, y: o.wy, id: o.id, gap, front, prompt });
      });
  }

  // D6.1 — caught by a person: not death, ejection.
  throwOut(foe) {
    if (this.thrownOut || this.cardActive) return;
    this.thrownOut = true;
    this.scatterCoins();
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
    const label = uiText(this, cam.width / 2, cam.height / 2, 'THROWN OUT', { size: 'display', color: 'danger' })
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

  // a scripted heart loss (thrown out, a bet lost): no knockback, no i-frame check
  loseHeart(source = null) {
    if (this.respawning) return;
    const r = this.health.lose(1, source);
    this.updateHearts();
    if (r.zero) this.onZeroHearts();
  }

  // Bilal's return ticket: one bad night, forgiven — instead of the restart
  // card, hearts refill and the ticket is punched.
  tryReturnTicket() {
    const sv = getSave();
    if (!sv.shop || !sv.shop.ticket) return false;
    updateSave((x) => (x.shop.ticket = false));
    this.health.refill();
    this.updateHearts();
    sfx('buy');
    this.floatText(this.player.x, this.player.y - 70, 'return ticket, punched.', '#f2d580');
    return true;
  }

  // kept for old callers: zero hearts never restarts the dream now
  sectionRestart() {
    this.onZeroHearts();
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
    for (const h of this.hideSpots) {
      if (!h.prompt) continue;
      const near = Math.abs(h.x - p.x) < 40 && Math.abs(h.y - p.y) < 40;
      h.prompt.setVisible(near && !this.playerHidden);
      h.front.forEach((f) => f.setAlpha(near ? 1 : 0.85));
      h.gap.setFillStyle(0x0a0a12, this.playerHidden && spot === h ? 0.95 : 0.85);
    }

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
    if (this.hud && this.hud.owner === this) this.hud.set('footer', `[Esc] pause   [M] ♪ ${off ? 'off' : 'on'}`);
  }

  toggleMusicFromHud() {
    this.setMusicLabel(toggleMusic());
  }

  // ---- collectibles ----------------------------------------------------

  updateCoinHud() {
    if (!this.coinHud) return;
    this.coinHud.setText(`${this.levelCoins}   $${getWallet().total}`);
  }

  updateShardHud() {
    const sv = getSave();
    this.shardHud.setText(sv.shards > 0 ? `\u2726 ${sv.shards % 3}/3` + (Math.floor(sv.shards / 3) ? `  (+${Math.floor(sv.shards / 3)} heart)` : '') : '');
  }

  updateSatchelHud() {
    this.satchelHud.setText(this.satchel.map((it) => `[${it}]`).join(' '));
  }

  // room objects: { type:'coin' } / { type:'coins', n, dx, dy } / { type:'shard' }
  spawnPickups(objects) {
    if (!this.coinMgr) return;
    const T = 32;
    // placed coins carry a position key so a continued run can leave the
    // ones already taken out of the world
    this.placedCoins = this.placedCoins || [];
    const place = (x, y) => {
      const c = this.coinMgr.spawn(x, y);
      c.key = `${Math.round(x)},${Math.round(y)}`;
      this.placedCoins.push(c);
    };
    for (const o of objects) {
      if (o.type === 'coin') place(o.wx, o.wy);
      else if (o.type === 'coins') {
        const n = o.n || 3;
        const dx = o.dx === undefined ? 1 : o.dx;
        const dy = o.dy || 0;
        for (let i = 0; i < n; i++) place(o.wx + i * dx * T, o.wy + i * dy * T);
      } else if (o.type === 'moment' && getSave().shop.postcards[this.dream && this.dream.id]) {
        // the postcard marks the small moments (§2)
        const mk = uiText(this, o.wx, o.wy - 54, '\u2318', { size: 'body', color: '#f2c078' })
          .setOrigin(0.5)
          .setDepth(21)
          .setAlpha(0.9);
        this.tweens.add({ targets: mk, y: mk.y - 5, duration: 1100, yoyo: true, repeat: -1, ease: 'sine.inout' });
      } else if (o.type === 'shard') {
        const img = this.add.image(o.wx, o.wy, 'heart-shard').setDepth(21);
        img.pickKey = `${Math.round(o.wx)},${Math.round(o.wy)}`;
        this.tweens.add({ targets: img, y: o.wy - 4, duration: 900, yoyo: true, repeat: -1, ease: 'sine.inout' });
        this.tweens.add({ targets: img, alpha: 0.6, duration: 1400, yoyo: true, repeat: -1 });
        (this.shardItems ||= []).push(img);
      }
    }
  }

  updatePickups(time, delta) {
    if (this.coinMgr) {
      this.coinMgr.update(time, delta / 1000, this.player, (n) => {
        this.levelCoins += n;
        this.coinsSinceCP += n;
        this.updateCoinHud();
      });
    }
    for (const img of this.shardItems || []) {
      if (!img.active) continue;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, img.x, img.y) < 22) {
        img.destroy();
        sfx('shard');
        const sv = updateSave((x) => (x.shards = (x.shards || 0) + 1));
        this.updateShardHud();
        this.floatText(this.player.x, this.player.y - 60, sv.shards % 3 === 0 ? 'a heart, whole.' : `heart shard — ${sv.shards % 3}/3`, '#7ec8d8');
        if (sv.shards % 3 === 0) {
          this.maxLives = Math.min(6, this.maxLives + 1);
          this.lives += 1;
          this.updateHearts();
        }
      }
    }
  }

  // §3.8 — death drops the coins taken since the last checkpoint
  scatterCoins() {
    if (!this.coinMgr || this.coinsSinceCP <= 0) return;
    deductWorth(this.dream.id, this.coinsSinceCP * coinWorth(this.dream.id));
    this.levelCoins = Math.max(0, this.levelCoins - this.coinsSinceCP);
    this.coinMgr.scatter(this.player.x, this.player.y, this.coinsSinceCP);
    this.coinsSinceCP = 0;
    this.updateCoinHud();
  }

  setObjective(text) {
    // a late async beat (a conversation that resolved after the scene was
    // stopped) must not write into a destroyed HUD
    if (!this.hud || this.hud.owner !== this) return;
    this._objective = text || '';
    this.hud.set('objective', this._objective);
    events.emit('objective:changed', { scene: this.scene.key, text: this._objective });
  }

  updateHearts() {
    if (!this.hearts || !this.health || !this.hud || this.hud.owner !== this) return;
    this.hud.set('hearts', { n: this.lives, max: this.maxLives, texture: this.heartTexture || 'heart' });
  }

  floatText(x, y, msg, color = '#f2e0a0') {
    const t = uiText(this, x, y, msg, { size: 'body', color, align: 'center' })
      .setOrigin(0.5)
      .setDepth(60);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 1800, onComplete: () => t.destroy() });
  }

  onHurtExtra() {}

  // A hit (plan §2.8): one heart, knockback away from the source, brief
  // invulnerability. Never a teleport. `toSafe` is for pits and rivers:
  // knockback cannot get him out, so he returns to his last safe footing.
  // Returns true when the hit landed.
  hurt(opts = {}) {
    if (this.cardActive || this.dialogActive || this.puzzleActive || this.paused || this.respawning) return false;
    if (!this.health || !this.health.canHit(this.time.now)) return false;
    const { sourceX = null, toSafe = false, source = null } = opts || {};
    sfx('hurt');
    this.scatterCoins();
    hitStop(this, 60); // D5
    this.cameras.main.shake(240, 0.008); // D1: shake doubled for 32px scale
    this.player.burst();
    this.player.knockHat();
    this.onHurtExtra(opts);
    const r = this.health.hit(this.time.now, source);
    this.updateHearts();
    if (toSafe) this.returnToSafe();
    else this.knockback(sourceX);
    this.flashInvulnerable();
    if (r.zero) this.onZeroHearts();
    return true;
  }

  knockback(sourceX = null) {
    const p = this.player;
    if (!p || !p.body) return;
    if (p.climbing) {
      p.climbing = false;
      p.body.setAllowGravity(true);
    }
    const v = this.health.knockback(p.x, sourceX, p.flipX);
    p.body.setVelocity(v.x, v.y);
    p.controlLockUntil = Math.max(p.controlLockUntil || 0, this.time.now + 240);
  }

  flashInvulnerable() {
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 150,
      yoyo: true,
      repeat: Math.max(1, Math.round(this.health.cfg.iframes / 300) - 1),
      onComplete: () => this.player.setAlpha(1),
    });
  }

  // fell out of the world: a heart, and back to the last safe footing
  fallOut() {
    if (this.respawning) return;
    if (!this.hurt({ toSafe: true, source: 'fall' })) this.returnToSafe();
  }

  // is this footing somewhere to come back to? (no liquid, no hazard)
  isSafeFooting(p) {
    const sg = this.built && this.built.surfaceGrid;
    if (sg) {
      const tx = Math.floor(p.x / T);
      const ty = Math.floor((p.y + 26) / T);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const v = sg[ty + dy] && sg[ty + dy][tx + dx];
          if (v === 'liquid' || v === 'conveyor_l' || v === 'conveyor_r') return false;
        }
      }
    }
    if (this.spikes && this.spikes.getLength && this.physics.overlap(p, this.spikes)) return false;
    return this.isSafeHere ? this.isSafeHere(p) : true;
  }

  trackSafeGround(time) {
    const p = this.player;
    if (!p || !p.body || this.paused || this.respawning || this.cardActive) return;
    const grounded = p.body.blocked.down || p.onSlope;
    if (!grounded || p.climbing || time < this.invulnUntil) {
      this._safeSince = 0;
      return;
    }
    if (!this._safeSince) this._safeSince = time;
    if (time - this._safeSince < 250) return;
    // every few frames is plenty (the overlap test is not free)
    if ((this._safeTick = (this._safeTick || 0) + 1) % 6) return;
    if (this.isSafeFooting(p)) this.safeGround = { x: p.x, y: p.y };
  }

  returnToSafe() {
    const now = this.time.now;
    // twice in a row from the same footing: that footing is a trap, use the flag
    const recent = now - (this._lastSafeReturn || -1e9) < 3000;
    const pt = !recent && this.safeGround ? this.safeGround : this.checkpoint;
    this._lastSafeReturn = now;
    this.placePlayer(pt);
    this.player.controlLockUntil = Math.max(this.player.controlLockUntil || 0, now + 200);
  }

  placePlayer(pt) {
    const p = this.player;
    if (p.climbing) {
      p.climbing = false;
      p.body.setAllowGravity(true);
    }
    p.setPosition(pt.x, pt.y);
    p.body.reset(pt.x, pt.y);
    p.body.setVelocity(0, 0);
  }

  // ---- zero hearts: the death card, then back to the flag ---------------------
  onZeroHearts() {
    if (this.respawning) return;
    if (this.tryReturnTicket()) return;
    this.respawning = true;
    sting.death();
    // let the hit land (hit-stop, shake) before the card
    this.time.delayedCall(450, () => this.openDeathCard());
  }

  openDeathCard() {
    const label = this.checkpoint.label;
    this.freezeWorld(true);
    this.pauseMenu.open({
      title: 'You gave everything… and it slipped away.',
      lines: [label ? `The last flag: ${label}` : 'Back to where this dream began.'],
      items: [
        { id: 'retry', label: label ? `Back to the flag — ${label}` : 'Try again from here', action: () => this.respawnAtCheckpoint() },
        { id: 'pause', label: 'Pause menu', action: () => this.openPauseMenu({ fromDeath: true }) },
      ],
      canClose: false,
      guardMs: 700,
    });
  }

  // zero hearts → the last checkpoint, hearts refilled; the world is NOT
  // restarted, so nothing already seen or done is replayed
  respawnAtCheckpoint() {
    this.pauseMenu.destroy();
    this.freezeWorld(false);
    this.respawning = false;
    if (this.dropCarry) this.dropCarry();
    this.onRespawn();
    this.placePlayer(this.checkpoint);
    this.player.setAlpha(1);
    this.player.controlLockUntil = 0;
    this.safeGround = null;
    this.health.refill();
    this.health.setInvulnerable(this.time.now, 1500);
    this.updateHearts();
    this.cameras.main.centerOn(this.player.x, this.player.y);
    this.cameras.main.fadeIn(350);
    this.flashInvulnerable();
  }

  // per-dream reset hook when Jo wakes at the flag (chases, timers)
  onRespawn() {}

  // ---- checkpoints -----------------------------------------------------------------
  // the room objects of type 'checkpoint' → labelled flags in this.flags
  placeCheckpoints(objects, filter) {
    this.checkpoints.place(this.flags, objects, filter);
  }

  activateCheckpoint(flagSprite) {
    return this.checkpoints.light(flagSprite);
  }

  onCheckpointLit(cp) {
    this.coinsSinceCP = 0; // banked: death can no longer scatter these
    if (cp.silent) return;
    sting.checkpoint();
    this.showCheckpointLabel(cp.label);
    this.saveRun();
  }

  // the flag's name, top centre ("THE PASS"); the first time ever, "Saved here"
  showCheckpointLabel(label, sub = null) {
    if (!label) return;
    const cam = this.cameras.main;
    let first = false;
    if (!sub && this.run) {
      try {
        first = !getSettings().savedHereShown;
        if (first) updateSettings((st) => (st.savedHereShown = true));
      } catch {
        first = false;
      }
    }
    const caption = sub || (first ? 'Saved here. Fall, and you wake at this flag.' : 'saved');
    if (this.cpBanner) this.cpBanner.forEach((o) => o.destroy());
    const t1 = uiText(this, cam.width / 2, 92, `— ${label} —`, { size: 'body', color: '#f2c078', align: 'center' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(152)
      .setAlpha(0);
    const t2 = uiText(this, cam.width / 2, 118, caption, { size: 'small', color: 'ink-dim', align: 'center' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(152)
      .setAlpha(0);
    t1.name = 'checkpoint-label';
    this.cpBanner = [t1, t2];
    this.tweens.add({ targets: this.cpBanner, alpha: 1, duration: 250, hold: first ? 3200 : 1800, yoyo: true, onComplete: () => [t1, t2].forEach((o) => o.destroy()) });
  }

  // ---- the run: save / resume (plan §2.8 RunState) --------------------------------
  initRun() {
    this.dreamId = DREAM_OF_SCENE[this.scene.key] || null;
    this.run = null;
    this.resuming = false;
    if (!this.dreamId || this.noFail) return;
    const data = this.sys.settings.data || {};
    const saved = data.resume ? getRun(this.dreamId) : null;
    if (saved) {
      this.run = RunState.from(saved);
      this.resuming = true;
    } else {
      this.run = new RunState({ dreamId: this.dreamId, sceneKey: this.scene.key });
      // boarding afresh: the old run (if any) is over
      if (!data.keepRun) clearRun(this.dreamId);
    }
  }

  // per-dream state beyond flags/satchel/coins (override in a scene)
  runExtra() {
    return {};
  }

  applyRunExtra() {}

  saveRun() {
    if (!this.run) return null;
    const cp = this.checkpoint;
    this.run.lightCheckpoint(cp.id, cp.label, cp);
    this.run.lit = [...this.checkpoints.lit].filter((x) => typeof x === 'string');
    this.run.capture({
      flags: this.F || {},
      inventory: this.satchel || [],
      hearts: this.lives,
      walletDelta: this.levelCoins || 0,
      extra: {
        ...this.runExtra(),
        objective: this.objectiveText ? this.objectiveText.text : '',
        coinsTaken: (this.placedCoins || []).filter((c) => !c.img.active).map((c) => c.key),
        shardsTaken: (this.shardItems || []).filter((i) => !i.active).map((i) => i.pickKey),
      },
      elapsed: (this.run.elapsed || 0) + Math.max(0, this.time.now - (this._runClock || this.levelStartedAt)),
    });
    this._runClock = this.time.now;
    this.run.savedAt = Date.now();
    return setRun(this.dreamId, this.run);
  }

  applyResume() {
    if (!this.resuming || !this.run) return;
    const r = this.run;
    if (this.F) {
      Object.assign(this.F, r.flags);
      if (this.refreshGates) this.refreshGates();
    }
    this.satchel = [...r.inventory];
    if (this.satchelHud) this.updateSatchelHud();
    if (this.coinHud) {
      this.levelCoins = r.walletDelta || 0;
      this.updateCoinHud();
    }
    this.checkpoints.restoreLit(r.lit);
    const pos = r.pos || this.checkpoints.pointFor(r.checkpointId) || this.checkpoint;
    this.checkpoints.setRespawn(pos, { id: r.checkpointId, label: r.checkpointLabel });
    const x = r.extra || {};
    const coinsTaken = new Set(x.coinsTaken || []);
    for (const c of this.placedCoins || []) if (coinsTaken.has(c.key) && c.img.active) c.img.destroy();
    const shardsTaken = new Set(x.shardsTaken || []);
    for (const i of this.shardItems || []) if (shardsTaken.has(i.pickKey) && i.active) i.destroy();
    this.placePlayer(pos);
    this.applyRunExtra(x, r);
    if (r.hearts) this.lives = Math.max(1, Math.min(this.maxLives, r.hearts));
    this.updateHearts();
    this.cameras.main.centerOn(pos.x, pos.y);
    if (r.extra && r.extra.objective) {
      this.setObjective(r.extra.objective);
      this._resumeObjective = r.extra.objective;
    }
    this.showCheckpointLabel(r.checkpointLabel || 'the dream', 'continued from the last flag');
  }

  // ---- pause menu (Esc) -------------------------------------------------------------
  // the pause / death modal freezes the world through the ModalManager
  // (freeze: 'world'); this only keeps the scene's `paused` flag in step
  freezeWorld(on) {
    this.paused = on;
    if (!on) {
      // swallow the key that closed the menu so it does not reopen it
      Phaser.Input.Keyboard.JustDown(this.keyEsc);
      if (this.player && this.player.keys) Phaser.Input.Keyboard.JustDown(this.player.keys.X);
    }
  }

  openPauseMenu({ fromDeath = false } = {}) {
    if (!fromDeath) this.freezeWorld(true);
    const label = this.checkpoint.label;
    const resume = () => {
      if (fromDeath) this.respawnAtCheckpoint();
      else {
        this.pauseMenu.destroy();
        this.freezeWorld(false);
      }
    };
    const main = () => [
      { id: 'resume', label: fromDeath ? 'Back to the flag' : 'Resume', action: resume },
      { id: 'restart', label: label ? `Restart from the flag — ${label}` : 'Restart from the flag', action: () => this.respawnAtCheckpoint() },
      { id: 'station', label: 'Return to station', action: () => this.returnToStation() },
      { id: 'settings', label: 'Settings', action: (m) => m.setItems(settings(), { title: 'Settings', lines: [] }) },
    ];
    const settings = () => [
      {
        id: 'music',
        label: `Music: ${isMusicOff() ? 'off' : 'on'}`,
        action: (m) => {
          this.setMusicLabel(toggleMusic());
          m.setItems(settings(), { keepIndex: true });
        },
      },
      { id: 'back', label: 'Back', action: (m) => m.setItems(main(), { title: 'Paused', lines: info() }) },
    ];
    const info = () => [label ? `Last flag: ${label}` : 'No flag yet: you would wake where the dream began.', this.run ? 'The dream is saved at its last flag.' : ''].filter(Boolean);
    this.pauseMenu.open({
      title: 'Paused',
      lines: info(),
      items: main(),
      canClose: true,
      onClose: (fromEsc) => {
        if (fromEsc) {
          if (fromDeath) this.respawnAtCheckpoint();
          else this.freezeWorld(false);
        }
      },
    });
  }

  // back to the hub; the run stays saved (Continue on the platform)
  returnToStation() {
    if (this.run) this.saveRun();
    this.pauseMenu.destroy();
    this.freezeWorld(false);
    music.stop();
    this.scene.start('Hub');
  }

  // D7 — room-driven music: bpm and state follow the room the CAMERA is in
  // (with hysteresis, so a boundary never flickers), escalating to `danger`
  // whenever a person has noticed him. The backdrop and the vista zoom are
  // not events: they blend every frame on the camera's distance across the
  // boundary (parallax.update / lerpRoom), so nothing snaps.
  updateMusicRoom() {
    if (!this.built || !this.built.rooms) return;
    const cam = this.cameras.main;
    const rooms = this.built.rooms;
    // a room from an earlier build (a warp, a restart) counts as no room
    if (this._room && !rooms.includes(this._room)) this._room = null;
    if (!this._room) this._blendZoom = undefined;
    const room = this._room ? RoomBuilder.roomAtCamera(rooms, cam.scrollX + cam.width / 2, this._room) : RoomBuilder.roomAt(rooms, this.player.x);
    if (room !== this._room) {
      this._room = room;
      if (room.music) {
        musicDirector.setBpm(room.music.bpm);
        this._roomState = room.music.state || 'explore';
      }
    }
    if (this.parallax) {
      this.parallax.update();
      // vista zoom on the same t; written only while it changes, so other
      // zooms (a punch-in, a cutscene) are left alone between rooms
      if (rooms.some((r) => r.vista)) {
        const z = this.parallax.lerpRoom((r) => (r.vista ? 0.8 : 1));
        if (z !== null && (this._blendZoom === undefined || Math.abs(z - this._blendZoom) > 1e-4)) {
          this._blendZoom = z;
          cam.setZoom(z);
        }
      }
    }
    if (this.look) this.look.update(this.time.now, 16, null);
    const hunted = (this.foes || []).some((f) => f.human && (f.state === 'alert' || f.state === 'windup'));
    musicDirector.setState(this.thrownOut ? 'caught' : hunted ? 'danger' : this._roomState || 'explore');
  }

  // a centred card (ModalManager kind 'card'): X confirms, Q is the alt
  showCard(lines, onConfirm, onAlt = null) {
    if (this.cardHandle) this.cardHandle.close('replaced');
    this.cardActive = true;
    this.cardShownAt = this.time.now;
    const cam = this.cameras.main;
    const h = this.modals.open({ kind: 'card', freeze: 'tweens', onClose: () => this.cardHandle === h && this._cardClosed() });
    this.cardHandle = h;
    h.add(dim(this, 0.75, 250));
    const text = uiText(this, cam.width / 2, cam.height / 2, lines.join('\n'), { size: 'body', color: 'ink', align: 'center', wrap: 760, lineSpacing: 6 })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(252);
    const w = Math.min(880, Math.max(360, text.width + 64));
    const ht = Math.min(500, text.height + 48);
    h.add(panel(this, cam.width / 2, cam.height / 2, w, ht, { depth: 251 }));
    this.cardText = h.add(text);
    this.cardConfirm = onConfirm;
    this.cardAlt = onAlt;
  }

  _cardClosed() {
    this.cardActive = false;
    this.cardHandle = null;
    this.cardText = null;
  }

  closeCard() {
    const h = this.cardHandle;
    if (h) h.close();
    else this._cardClosed();
  }

  // returns true when the frame should be swallowed (modal open / pause)
  handleModalUpdate() {
    if (this.paused || this.respawning) return true;
    if (this.dialogActive || this.puzzleActive || this.tutorialActive) return true;
    if (this.cardActive) {
      // a card waiting under another modal is not answered yet
      if (this.cardHandle && !this.modals.isTop(this.cardHandle)) return true;
      // a card that appears mid-mash must not be confirmed by the mash:
      // swallow X/Q for the first moments so the player reads it first
      if (this.time.now - (this.cardShownAt || 0) < 700) {
        Phaser.Input.Keyboard.JustDown(this.player.keys.X);
        Phaser.Input.Keyboard.JustDown(this.keyQ);
        return true;
      }
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
      this.openPauseMenu();
      return true;
    }
    // camera look-ahead in facing direction
    this.cameras.main.followOffset.x = this.player.flipX ? 48 : -48;
    return false;
  }
}
