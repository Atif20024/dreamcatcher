import Phaser from 'phaser';
import { createJoTextures } from './jo.js';
import { AnimationController } from '../art/AnimationController.js';
import { characterManifest, bakeFromAtlas } from '../art/baked.js';
import { sfx } from '../systems/audio.js';
import { resolveSlope } from './slopes.js';
import { showTutorial } from '../play/Teach.js';
import { JO_DUST } from './jo.js';
import { dreamDust } from '../systems/effects.js';
import { getSave } from '../utils/save.js';
import { hatById } from '../data/hats.js';

// D1: px figures from the other docs are doubled for the 32px scale
// (run 140 -> 280, jump 300 -> 600, look-ahead 48 -> 96).
const T = 32;
const SPEED = 280;
const JUMP = 600;
const COYOTE_MS = 100;
// Phase 2: Jo is drawn about 82 px tall (a 2× rig, see src/data/rigs/jo.js)
// but keeps the legacy 24×44 body, so every dream built for the old ~44 px
// Jo stays completable. Under a ceiling lower than the drawing he ducks
// (crouch art) instead of clipping into it. See PHASE2_REPORT.md.
export const JO_ART_HEIGHT = 82;
const LEGACY_BODY = [24, 44];
// Body profiles: [w, h, offsetX, offsetY] standing and crouched. Both keep
// the soles at y + 22, so feet(), ladders and slopes read the same. 'legacy'
// is the phase-2 body every old dream was built for; 'dream' matches the
// 82 px drawing (DreamScene rooms have 3 tiles of headroom).
export const BODY_PROFILES = Object.freeze({
  legacy: { stand: [24, 44, 4, 2], crouch: [24, 32, 4, 14] },
  dream: { stand: [28, 72, 2, -26], crouch: [28, 48, 2, -2] },
});
const BUFFER_MS = 120;

// no atlas at all: one idle frame, so the controller still runs
const FALLBACK_MANIFEST = { id: 'jo', scale: 2, animations: { idle: { fps: 1, loop: true, frames: 1 } } };

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    // the hitbox's carrier: a blank 32×48 (the old frame) — Jo is drawn by `art`
    if (!scene.textures.exists('jo-body')) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      g.generateTexture('jo-body', 32, 48);
      g.destroy();
    }
    // his tools come from the atlas; the string-art set is only the fallback
    if (!bakeFromAtlas(scene, 'tool-ladle') || !bakeFromAtlas(scene, 'tool-trumpet')) createJoTextures(scene);
    super(scene, x, y, 'jo-body');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(LEGACY_BODY[0], LEGACY_BODY[1]).setOffset(4, 2);
    this.setCollideWorldBounds(true);
    this.bodyProfile = BODY_PROFILES.legacy;
    // an InputMap (src/input/InputMap.js) when the scene uses actions;
    // without one Jo reads the keyboard directly (legacy scenes)
    this.inputMap = null;

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys('W,A,S,D,SPACE,X,E');
    this.runFrameTimer = 0;
    this.slippery = false; // scene sets: 0 = normal, else lerp factor
    this.slipFactor = 0.06;
    this.reversedUntil = 0; // pepper clouds
    this.lastGrounded = 0;
    this.lastJumpPressed = -9999;
    this.wasAirborne = false;
    this.controlLockUntil = 0;
    this.ladleCooldown = 0;

    // Jo is drawn by `art`, never by this sprite: Arcade resizes a body along
    // with its Game Object's scale, so squashing the physics sprite left the
    // hitbox short and Jo rendered sunk into the floor. The physics sprite now
    // stays at scale 1 forever and every squish is cosmetic.
    this.setVisible(false);
    this.shown = true; // scenes toggle this, not `visible`
    this.crouching = false;
    this.bodyTint = 0xffffff; // what Jo wears; scenes set it (e.g. the flight suit)
    this.speed = SPEED; // the evening walks slower
    this.upJumps = true; // the evening gives [↑] to looking up; W/Space still jump
    this.poseDy = 0; // a sitting pose drops the head: hat and tool follow it
    this.artDy = 0; // the whole drawing up or down (sitting on a bench seat)
    this.squashScale = { x: 1, y: 1 };
    this.hatKnock = { y: 0, angle: 0 };
    // the walk: phase in frames, advanced by ground covered (§2 of the
    // motion rules: fps = v·N / 2S, here a frame every STRIDE/4 px)
    this.stepEvent = 0; // counts contacts; scenes listen for footsteps
    this.quietSteps = false; // a scene that does its own footstep sounds
    // above the terrain (depth 4) and the backdrop, below the HUD
    this.setDepth(12);
    // the AnimationController (plan §2.5): physics + input → animation,
    // stride-locked walk/run, fallbacks, footstep events
    const manifest = characterManifest('jo');
    this.hasAtlas = !!manifest && scene.textures.exists('jo');
    if (!this.hasAtlas) createJoTextures(scene);
    this.anim = new AnimationController(manifest || FALLBACK_MANIFEST, { outfit: 'street' });
    this.anim.onEvent = (ev) => this.onAnimEvent(ev);
    this.floating = false; // zero-g (the astronaut sets it)
    this.carrying = false; // a carried thing (scenes set it)
    this.pockets = false; // empty hands (the gambler, horn pawned)
    this.walkOnly = false; // a stroll: never break into a run
    this.dead = false;
    this.toolPose = 'swing'; // what a swing looks like in this dream
    this.art = this.hasAtlas
      ? scene.add.image(x, y, 'jo', this.anim.frameName()).setDepth(12)
      : scene.add.image(x, y, 'jo-stand').setDepth(12);

    // D5 — hat and tool are separate sprites that trail the body by one
    // frame, so Jo bobbles instead of moving like a decal. The hat wears
    // whatever Bilal sold last (data/hats.js).
    this.hat = this.hasAtlas ? scene.add.image(x, y, 'jo', this.anim.hatFrame()).setDepth(13) : scene.add.image(x, y, 'jo-hat').setDepth(13);
    try {
      const worn = hatById(getSave().shop.hat);
      if (worn) this.hat.setTint(worn.tint);
    } catch {
      /* no save */
    }
    this.tool = scene.add
      .image(x, y, scene.scene.key === 'Musician' ? 'tool-trumpet' : 'tool-ladle')
      .setDepth(13)
      .setAlpha(0.95);
    this.lastPos = { x, y };
    this.lastHat = null; // the hat frame shown one frame late
    this.lastFeet = { x, y: y + 22 };

    // Physics writes the sprite's position after scene update, so the drawing
    // is synced on post-update or it would trail the hitbox by a frame.
    this._sync = () => this.syncAttachments();
    scene.events.on('postupdate', this._sync);
    scene.events.once('shutdown', () => scene.events.off('postupdate', this._sync));
  }

  // D5 — Jo bursting into dream-dust, not vanishing
  burst() {
    dreamDust(this.scene, this, { colors: JO_DUST, count: 22, spread: 20 });
  }

  // the cosmetic squish: crouch and land-squash multiplied together
  visualScale() {
    return { x: this.squashScale.x, y: this.squashScale.y * (this.crouching && !this.hasAtlas ? 0.7 : 1) };
  }

  // D5 — land squash, on the drawing only. Feet stay planted (see below).
  landSquash() {
    if (this._squashTween) this._squashTween.remove();
    this.squashScale.x = 1.2;
    this.squashScale.y = 0.8;
    this._squashTween = this.scene.tweens.add({
      targets: this.squashScale,
      x: 1,
      y: 1,
      duration: 140,
      ease: 'quad.out',
    });
  }

  // where his soles are: the body's bottom (unchanged by a crouch)
  feet() {
    return { x: this.x, y: this.y + 22 + this.artDy };
  }

  syncAttachments() {
    const { x: sx, y: sy } = this.visualScale();
    const f = this.feet();
    if (!this.hasAtlas) return this.syncLegacy(sx, sy);
    const dir = this.flipX ? -1 : 1;
    // the frame's pivot is the foot anchor, so squash keeps the feet planted
    const frame = this.anim.frameName();
    if (this.art.frame.name !== frame && this.art.texture.key === 'jo') this.art.setFrame(frame);
    this.art.setPosition(f.x, f.y).setScale(sx, sy).setFlipX(this.flipX).setVisible(this.shown).setAlpha(this.alpha);
    // the hat: this frame's hat at this frame's feet, so it always sits on
    // the head (the old one-frame lag left it trailing behind at 80 px)
    const hatName = this.anim.hatFrame();
    const hatOn = this.scene.textures.get('jo').has(hatName);
    if (hatOn) {
      this.hat.setFrame(hatName).setPosition(f.x, f.y + this.hatKnock.y).setScale(sx, sy).setAngle(this.hatKnock.angle).setFlipX(this.flipX);
    }
    this.hat.setDepth(this.art.depth + 1).setVisible(this.shown && !!hatOn).setAlpha(this.alpha);
    // the tool rides a hand (attach points from the rig), a frame late: the
    // far hand, behind him, while carried; the near hand while he uses it
    const using = /^(swing|pen|brush|brush_hold|play_trumpet|interact|type)$/.test(this.anim.name);
    const d = this.anim.data();
    const hand = d && d.attach && (using ? d.attach.hand_f : d.attach.hand_b);
    const lf = this.lastFeet;
    if (hand) this.tool.setPosition(lf.x + dir * hand[0] * sx, lf.y + hand[1] * sy);
    else this.tool.setPosition(lf.x + dir * 14 * sx, lf.y - 30 * sy);
    this.tool.setFlipX(this.flipX).setAngle(this.anim.name === 'float' ? this.art.angle : 0).setDepth(using ? 13 : this.art.depth - 0.1);
    this.tool.setVisible(this.shown && !this.noTool && !this.anim.name.startsWith('sit') && this.anim.name !== 'sleep' && this.anim.name !== 'death' && this.anim.name !== 'pockets').setAlpha(this.alpha * 0.95);
    this.lastFeet = { x: f.x, y: f.y };
    this.lastPos = { x: this.x, y: this.y };
  }

  // no atlas (a broken build): the old string-art Jo, 48 px, centred
  syncLegacy(sx, sy) {
    this.art.setPosition(this.x, this.y + 24 * (1 - sy) + this.artDy).setScale(sx, sy).setFlipX(this.flipX).setVisible(this.shown).setAlpha(this.alpha);
    const lx = this.lastPos.x;
    const feet = this.lastPos.y + 24 + this.artDy;
    this.hat.setPosition(lx, feet - 42 * sy + this.hatKnock.y + this.poseDy).setScale(sx, sy).setAngle(this.hatKnock.angle).setFlipX(this.flipX).setVisible(this.shown).setAlpha(this.alpha);
    const dir = this.flipX ? -1 : 1;
    this.tool.setPosition(lx + dir * 14 * sx, feet - 18 * sy + this.poseDy * 0.5).setFlipX(this.flipX).setVisible(this.shown).setAlpha(this.alpha * 0.95);
    this.lastPos = { x: this.x, y: this.y };
  }

  // the front hand in world px (the rig's attach point), for held things
  handPos() {
    const f = this.feet();
    const d = this.anim.data();
    const h = d && d.attach && d.attach.hand_f;
    const dir = this.flipX ? -1 : 1;
    return h ? { x: f.x + dir * h[0], y: f.y + h[1] } : { x: f.x + dir * 12, y: f.y - 40 };
  }

  // a scene that drives Jo's physics itself (zero-g, swimming, a current)
  // names the animation each frame; the controller still advances it
  showAnim(name, delta = 16.7) {
    const a = this.anim;
    if (a.oneShot && a.oneShot.forced && a.name !== name) {
      a.advance(delta, 0, 0, null);
      return;
    }
    a.oneShot = null;
    a.held = null;
    a.set(name);
    const dx = a.lastX == null ? 0 : this.x - a.lastX;
    const dy = a.lastY == null ? 0 : this.y - a.lastY;
    a.lastX = this.x;
    a.lastY = this.y;
    a.advance(delta, dx, dy, null);
  }

  // a verb pose (swing, trumpet, interact…): plays once over the controller
  pose(name, opts = {}) {
    const pr = this.anim.playOnce(name, opts);
    // a looping pose given a length ends itself
    if (opts.ms) {
      const o = this.anim.oneShot;
      this.scene.time.delayedCall(opts.ms, () => this.anim.oneShot === o && this.anim.endOneShot(true));
    }
    return pr;
  }

  onAnimEvent(ev) {
    if (ev === 'footstep') {
      this.stepEvent += 1;
      if (!this.quietSteps) sfx('step');
      if (Math.abs(this.body.velocity.x) > 200) this.dust(1);
    } else if (ev === 'skid') this.dust(3);
  }

  knockHat() {
    this.scene.tweens.add({
      targets: this.hatKnock,
      y: -16,
      angle: this.flipX ? 30 : -30,
      duration: 180,
      yoyo: true,
      onComplete: () => {
        this.hatKnock.y = 0;
        this.hatKnock.angle = 0;
      },
    });
  }

  dust(n = 3) {
    for (let i = 0; i < n; i++) {
      const c = this.scene.add.circle(
        this.x + Phaser.Math.Between(-10, 10),
        this.y + 22,
        Phaser.Math.Between(2, 4),
        0xc8c0b0,
        0.6
      );
      this.scene.tweens.add({
        targets: c,
        y: c.y - Phaser.Math.Between(6, 14),
        alpha: 0,
        duration: 350,
        onComplete: () => c.destroy(),
      });
    }
  }

  swingLadle() {
    const now = this.scene.time.now;
    if (now < this.ladleCooldown) return null;
    this.ladleCooldown = now + 400;
    sfx('swing');
    this.pose(this.toolPose || 'swing');
    const dir = this.flipX ? -1 : 1;
    const arc = this.scene.add
      .rectangle(this.x + dir * 26, this.y - 4, 36, 30, 0xd8d8e0, 0.35)
      .setDepth(30);
    this.scene.tweens.add({ targets: arc, alpha: 0, angle: dir * 60, duration: 180, onComplete: () => arc.destroy() });
    return new Phaser.Geom.Rectangle(dir < 0 ? this.x - 48 : this.x + 8, this.y - 20, 40, 40);
  }

  // the drawing is taller than the legacy body: under a ceiling lower than
  // the drawing he ducks instead of poking his head through it
  lowCeiling() {
    const solidAt = this.scene.built && this.scene.built.solidAt;
    if (!solidAt) return false;
    const fy = this.y + 22;
    const top = Math.floor((fy - JO_ART_HEIGHT + 6) / T);
    const row = Math.floor((fy - 1) / T);
    for (const dx of [-8, 8]) {
      const tx = Math.floor((this.x + dx) / T);
      for (let ty = top; ty < row; ty++) if (solidAt(tx, ty)) return true;
    }
    return false;
  }

  driveAnim(time, delta, o) {
    const body = this.body;
    const duck = o.grounded && !o.climbing && this.lowCeiling();
    this.anim.update(delta, {
      x: this.x,
      y: this.y,
      facing: this.flipX ? -1 : 1,
      grounded: !!o.grounded,
      vx: body.velocity.x,
      vy: body.velocity.y,
      inputX: o.inputX || 0,
      crouch: !!o.crouch || duck,
      climbing: !!o.climbing,
      wallSlide: !!o.wallSlide,
      pushing: !!o.pushing,
      carrying: !!this.carrying,
      floating: !!this.floating,
      pockets: !!this.pockets,
      walkOnly: !!this.walkOnly,
      tool: this.paintingStroke ? 'brush' : null,
      dead: !!this.dead,
      ev: o.ev || {},
    });
    if (!this.hasAtlas) this.art.setTexture(o.grounded || o.climbing ? 'jo-stand' : body.velocity.y < -40 ? 'jo-jump' : 'jo-fall');
  }

  // the 82 px body (framework rooms) or the legacy one
  setBodyProfile(name) {
    this.bodyProfile = BODY_PROFILES[name] || BODY_PROFILES.legacy;
    const [w, h, ox, oy] = this.bodyProfile.stand;
    this.body.setSize(w, h, false).setOffset(ox, oy);
    this.crouching = false;
    return this;
  }

  // input reads: the InputMap's actions, or the raw keys (legacy)
  inLeft() {
    return this.inputMap ? this.inputMap.isDown('left') : this.cursors.left.isDown || this.keys.A.isDown;
  }
  inRight() {
    return this.inputMap ? this.inputMap.isDown('right') : this.cursors.right.isDown || this.keys.D.isDown;
  }
  inUp() {
    return this.inputMap ? this.inputMap.isDown('up') : this.cursors.up.isDown || this.keys.W.isDown;
  }
  inDown() {
    return this.inputMap ? this.inputMap.isDown('down') : this.cursors.down.isDown || this.keys.S.isDown;
  }

  update(time, delta) {
    const body = this.body;
    const rev = time < this.reversedUntil;
    const I = this.inputMap;
    let left = this.inLeft();
    let right = this.inRight();
    if (rev) [left, right] = [right, left];
    const upJ = this.upJumps;
    const jumpDown = I ? I.isDown('jump') || (upJ && I.isDown('up')) : (upJ && this.cursors.up.isDown) || this.keys.W.isDown || this.keys.SPACE.isDown;
    const jumpJust = I
      ? I.justDown('jump') || (upJ && I.justDown('up'))
      : (upJ && Phaser.Input.Keyboard.JustDown(this.cursors.up)) || Phaser.Input.Keyboard.JustDown(this.keys.W) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE);
    const crouch = this.inDown();
    const locked = time < this.controlLockUntil;

    // D3 — slopes: Arcade has none, so resolve the surface by hand and treat
    // the result as ground for every other check this frame.
    this.onSlope = resolveSlope(this.scene, this, body);
    // Ladders ('H'): hold up/down inside one to climb; gravity is off while
    // on it, and a jump or stepping off the column lets go.
    const lg = this.scene.ladderGrid;
    const onLadderTile = (dy) => {
      if (!lg) return false;
      const tx = Math.floor(this.x / T);
      const ty = Math.floor((this.y + dy) / T);
      return !!(lg[ty] && lg[ty][tx]);
    };
    const wantsClimb = this.inUp() || crouch;
    // (+40 = the tile under the one Jo stands on: pressing DOWN on a floor
    // tile that has a ladder beneath it climbs down through the floor)
    if (!this.climbing && wantsClimb && !locked && (onLadderTile(0) || onLadderTile(20) || (crouch && (onLadderTile(40) || onLadderTile(56))))) {
      this.climbing = true;
      body.setAllowGravity(false);
      body.setVelocity(0, 0);
    }
    if (this.climbing) {
      const stillOn = onLadderTile(0) || onLadderTile(20) || onLadderTile(-20) || onLadderTile(40) || onLadderTile(56);
      const up = this.inUp();
      const jumpOff = I ? I.justDown('jump') && !I.isDown('up') : Phaser.Input.Keyboard.JustDown(this.keys.SPACE);
      if (!stillOn || (jumpOff && !up)) {
        this.climbing = false;
        body.setAllowGravity(true);
      } else {
        body.setVelocityY(up ? -150 : crouch ? 150 : 0);
        body.setVelocityX(0);
        // snap to the rung column so Jo doesn't drift off the rib
        const cx = Math.floor(this.x / T) * T + T / 2;
        this.x += (cx - this.x) * 0.3;
        // reaching the ladder's foot lets go -- unless the "floor" is a lid
        // with more ladder under it
        if (body.onFloor() && crouch && !onLadderTile(56)) {
          this.climbing = false;
          body.setAllowGravity(true);
        }
        // climbing DOWN onto solid ground that is not a rung: stand on it.
        // (The solids collider is off while climbing, so without this the
        // descent would carry on through the floor.)
        const solidAt = this.scene.built && this.scene.built.solidAt;
        const footRow = Math.floor((this.y + 26) / T);
        const tx = Math.floor(this.x / T);
        if (crouch && solidAt && !onLadderTile(56) && solidAt(tx, footRow) && !(lg[footRow] && lg[footRow][tx])) {
          this.y = footRow * T - 24;
          body.reset(this.x, this.y);
          this.climbing = false;
          body.setAllowGravity(true);
        }
        this.driveAnim(time, delta, { climbing: true });
        return;
      }
    }
    const grounded = body.onFloor() || this.onSlope;

    const ev = {};
    if (grounded) {
      this.lastGrounded = time;
      if (this.wasAirborne) {
        // a long drop (more than five tiles; a full jump is about 4.7) lands hard: knees, hands, hat
        const drop = this.y - (this.airTopY ?? this.y);
        ev.landed = { hard: drop > 5 * T || this.fallSpeed > 900 };
        this.dust(ev.landed.hard ? 7 : 4);
        this.landSquash();
        this.wasAirborne = false;
      }
      this.airTopY = null;
    } else {
      this.wasAirborne = true;
      this.airTopY = Math.min(this.airTopY ?? this.y, this.y);
      this.fallSpeed = body.velocity.y;
    }
    if (jumpJust && !locked) this.lastJumpPressed = time;

    // horizontal
    if (!locked) {
      const target = left ? -this.speed : right ? this.speed : 0;
      if (this.slippery && grounded) {
        body.setVelocityX(Phaser.Math.Linear(body.velocity.x, target, this.slipFactor));
      } else {
        const airFactor = grounded ? 1 : 0.7;
        body.setVelocityX(Phaser.Math.Linear(body.velocity.x, target, 0.5 * airFactor));
      }
    }
    if (left && !locked) this.setFlipX(true);
    if (right && !locked) this.setFlipX(false);

    // wall slide + wall jump — D7: ONLY on a climbable '|' tile, so a plain
    // wall can never be scaled to skip a gate.
    const cg = this.scene.climbGrid;
    const climbableSide = (dx) => {
      if (!cg) return false;
      const tx = Math.floor((this.x + dx) / T);
      const ty0 = Math.floor((this.y - 10) / T);
      const ty1 = Math.floor((this.y + 10) / T);
      return !!(cg[ty0]?.[tx] || cg[ty1]?.[tx]);
    };
    // B1: a ribbed wall within reach counts as touching (Arcade only reports
    // `blocked` on the frame of contact, and pushing into a column of tile
    // bodies while rising snags on their seams, killing the jump). In the air
    // Jo leans on it instead of pushing into it.
    const wallL = left && climbableSide(-18);
    const wallR = right && climbableSide(18);
    const pressingWall = wallL || wallR;
    if (pressingWall && !grounded && !locked) body.setVelocityX(0);
    const sliding = !grounded && pressingWall && body.velocity.y > 0;
    // teach (data: src/data/teach.js): the first ribbed wall, the first slope
    if (!grounded && pressingWall && !this._wallTaught) {
      this._wallTaught = true;
      showTutorial(this.scene, 'wall_jump');
    }
    if (this.onSlope && !this._slopeTaught) {
      this._slopeTaught = true;
      showTutorial(this.scene, 'slope');
    }
    if (sliding) {
      body.setVelocityY(Math.min(body.velocity.y, 70));
      if (jumpJust) {
        const away = wallL ? 1 : -1;
        body.setVelocityY(-JUMP * 0.92);
        body.setVelocityX(away * 280);
        this.setFlipX(away < 0);
        this.controlLockUntil = time + 160;
        this.dust(3);
        sfx('jump');
        ev.wallJumped = true;
      }
    }

    // jump with coyote time + buffer
    const canJump = grounded || time - this.lastGrounded < COYOTE_MS;
    if (canJump && time - this.lastJumpPressed < BUFFER_MS) {
      body.setVelocityY(-JUMP);
      ev.jumped = true;
      this.lastJumpPressed = -9999;
      this.lastGrounded = -9999;
      sfx('jump');
    }
    // variable height: release early → cut the rise
    if (!jumpDown && body.velocity.y < -160) {
      body.setVelocityY(body.velocity.y * 0.82);
    }
    // fast-fall
    if (crouch && !grounded && body.velocity.y > -50) {
      body.setVelocityY(Math.max(body.velocity.y, 420));
    }

    // E reaches for whatever is there (edge-detected by hand: JustDown here
    // would eat the press the scene's own interaction reads)
    const eDown = I ? I.isDown('act1') : this.keys.E.isDown;
    if (eDown && !this._eWas && grounded && !locked && Math.abs(body.velocity.x) < 40) this.pose('interact');
    this._eWas = eDown;
    // animation: the controller reads physics + input (never the clock alone)
    const pushing = grounded && !locked && ((left && body.blocked.left) || (right && body.blocked.right)) && !pressingWall;
    this.driveAnim(time, delta, { grounded, inputX: locked ? 0 : (right ? 1 : 0) - (left ? 1 : 0), crouch: crouch && grounded, wallSlide: sliding, pushing, ev });
    // `bodyTint` is what Jo is wearing (the astronaut's flight suit, say);
    // the pepper-cloud green is a temporary override on top of it. Resetting
    // to white here unconditionally used to wipe the suit every frame.
    this.art.setTint(rev ? 0xd8f0a0 : this.bodyTint);
    this.reversed = rev;

    // Crouch hitbox. Both bodies keep their bottom at y+22, so ducking never
    // moves Jo's feet — only the drawing shrinks (see syncAttachments).
    const wantCrouch = crouch && grounded;
    if (wantCrouch !== this.crouching) {
      this.crouching = wantCrouch;
      const [w, h, ox, oy] = wantCrouch ? this.bodyProfile.crouch : this.bodyProfile.stand;
      body.setSize(w, h, false).setOffset(ox, oy);
    }
  }
}
