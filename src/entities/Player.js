import Phaser from 'phaser';
import { atlasFrames, atlasMeta } from '../systems/atlases.js';
import { sfx } from '../systems/audio.js';
import { resolveSlope } from './slopes.js';
import { JO_DUST } from '../art/jo.js';
import { dreamDust } from '../systems/effects.js';

// D1: px figures from the other docs are doubled for the 32px scale
// (run 140 -> 280, jump 300 -> 600, look-ahead 48 -> 96).
const T = 32;
const SPEED = 280;
const JUMP = 600;
const COYOTE_MS = 100;
const BUFFER_MS = 120;

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'jo', 'idle_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(24, 44).setOffset(4, 2);
    this.setCollideWorldBounds(true);

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
    this.squashScale = { x: 1, y: 1 };
    this.hatKnock = { y: 0, angle: 0 };
    // D11 — the drawing comes from the `jo` atlas (rig frames at 1x, drawn
    // at 2x), anchored at the feet so the contact row sits on the floor.
    this.setDepth(12);
    this.walkFrames = atlasFrames(scene, 'jo', 'walk');
    this.idleFrames = atlasFrames(scene, 'jo', 'idle');
    const meta = atlasMeta(scene, 'jo');
    this.stride = (meta.stride && meta.stride.walk) || 10; // S, 1x px
    this.contacts = (meta.contacts && meta.contacts.walk) || [];
    this.art = scene.add.image(x, y, 'jo', this.walkFrames[0]).setOrigin(0.5, 1).setScale(2).setDepth(12);
    this.walkPhase = 0; // 1x px of ground travelled this cycle
    this.frameIndex = 0;
    this.idleTime = 0;

    // D5 — hat and tool are separate sprites that trail the body by one
    // frame, so Jo bobbles instead of moving like a decal.
    this.hat = scene.add.image(x, y, 'jo', 'hat').setOrigin(0.5, 1).setScale(2).setDepth(13);
    this.tool = scene.add
      .image(x, y, 'jo', scene.scene.key === 'Musician' ? 'tool_trumpet' : 'tool_ladle')
      .setScale(3)
      .setDepth(13)
      .setAlpha(0.95);
    this.lastPos = { x, y, feet: y + 22 };

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
    return { x: this.squashScale.x, y: this.squashScale.y * (this.crouching ? 0.7 : 1) };
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

  syncAttachments() {
    const { x: sx, y: sy } = this.visualScale();
    // the art is feet-anchored (origin 0.5,1) on the body's bottom edge, so
    // any squish scales about the ground and the feet never leave it
    const feetNow = this.body.bottom;
    this.art
      .setPosition(this.x + (this.artShift || 0), feetNow)
      .setScale(2 * sx, 2 * sy)
      .setFlipX(this.flipX)
      .setVisible(this.shown)
      .setAlpha(this.alpha);

    // one-frame lag for the hat and the tool
    const lx = this.lastPos.x;
    const feet = this.lastPos.feet;
    const hatY = feet - 74 * sy; // the rig's hat row (y=5 of 40) at 2x
    this.hat
      .setPosition(lx, hatY + this.hatKnock.y)
      .setScale(2 * sx, 2 * sy)
      .setAngle(this.hatKnock.angle)
      .setFlipX(this.flipX);
    this.hat.setVisible(this.shown).setAlpha(this.alpha);
    const dir = this.flipX ? -1 : 1;
    this.tool.setPosition(lx + dir * 18 * sx, feet - 34 * sy).setFlipX(this.flipX);
    this.tool.setVisible(this.shown).setAlpha(this.alpha * 0.95);
    this.lastPos = { x: this.x, y: this.y, feet: feetNow };
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
    const dir = this.flipX ? -1 : 1;
    const arc = this.scene.add
      .rectangle(this.x + dir * 26, this.y - 4, 36, 30, 0xd8d8e0, 0.35)
      .setDepth(30);
    this.scene.tweens.add({ targets: arc, alpha: 0, angle: dir * 60, duration: 180, onComplete: () => arc.destroy() });
    return new Phaser.Geom.Rectangle(dir < 0 ? this.x - 48 : this.x + 8, this.y - 20, 40, 40);
  }

  update(time, delta) {
    const body = this.body;
    const rev = time < this.reversedUntil;
    let left = this.cursors.left.isDown || this.keys.A.isDown;
    let right = this.cursors.right.isDown || this.keys.D.isDown;
    if (rev) [left, right] = [right, left];
    const jumpDown = this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown;
    const jumpJust =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.W) ||
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE);
    const crouch = this.cursors.down.isDown || this.keys.S.isDown;
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
    const wantsClimb = this.cursors.up.isDown || this.keys.W.isDown || crouch;
    // (+40 = the tile under the one Jo stands on: pressing DOWN on a floor
    // tile that has a ladder beneath it climbs down through the floor)
    if (!this.climbing && wantsClimb && !locked && (onLadderTile(0) || onLadderTile(20) || (crouch && (onLadderTile(40) || onLadderTile(56))))) {
      this.climbing = true;
      body.setAllowGravity(false);
      body.setVelocity(0, 0);
    }
    if (this.climbing) {
      const stillOn = onLadderTile(0) || onLadderTile(20) || onLadderTile(-20) || onLadderTile(40) || onLadderTile(56);
      const up = this.cursors.up.isDown || this.keys.W.isDown;
      if (!stillOn || (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) && !up)) {
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
        this.art && this.art.setFrame(this.walkFrames[2 % this.walkFrames.length]);
        return;
      }
    }
    const grounded = body.onFloor() || this.onSlope;

    if (grounded) {
      this.lastGrounded = time;
      if (this.wasAirborne) {
        this.dust(4);
        this.landSquash();
        this.wasAirborne = false;
      }
    } else {
      this.wasAirborne = true;
    }
    if (jumpJust) this.lastJumpPressed = time;

    // horizontal
    if (!locked) {
      const target = left ? -SPEED : right ? SPEED : 0;
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
    const pressingWall =
      (left && body.blocked.left && climbableSide(-18)) || (right && body.blocked.right && climbableSide(18));
    const sliding = !grounded && pressingWall && body.velocity.y > 0;
    if (sliding) {
      body.setVelocityY(Math.min(body.velocity.y, 70));
      if (jumpJust) {
        const away = body.blocked.left ? 1 : -1;
        body.setVelocityY(-JUMP * 0.92);
        body.setVelocityX(away * 280);
        this.setFlipX(away < 0);
        this.controlLockUntil = time + 160;
        this.dust(3);
        sfx('jump');
      }
    }

    // jump with coyote time + buffer
    const canJump = grounded || time - this.lastGrounded < COYOTE_MS;
    if (canJump && time - this.lastJumpPressed < BUFFER_MS) {
      body.setVelocityY(-JUMP);
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

    // Ground-speed lock (motion skill §2): the walk frame is a function of
    // distance travelled, never of time. With N frames over a full cycle of
    // 2S px, one frame per 2S/N px of ground — identical to
    // fps = v * N / (2S), set from the body's real velocity every frame.
    // Below the 8 fps equivalent the cycle blends to idle. Units are 1x px:
    // the world runs at 2x, so v1x = |vx| / 2.
    const moving = left || right;
    const v1x = Math.abs(body.velocity.x) / 2;
    const N = this.walkFrames.length;
    const pxPerFrame = (2 * this.stride) / N;
    this.artShift = 0;
    if (grounded && v1x >= 8 * pxPerFrame && N > 1) {
      this.walkPhase = (this.walkPhase + (v1x * delta) / 1000) % (2 * this.stride);
      const idx = Math.floor(this.walkPhase / pxPerFrame) % N;
      if (idx !== this.frameIndex) {
        if (idx === 0 || idx === N / 2) this.dust(1); // footsteps on the contact frames
        this.frameIndex = idx;
      }
      this.art.setFrame(this.walkFrames[idx]);
      // draw at the frame's phase boundary so the planted foot holds its
      // pixel until the frame steps (see RigTestScene for the measurement)
      const dir = this.flipX ? -1 : 1;
      this.artShift = -dir * (this.walkPhase - idx * pxPerFrame) * 2;
    } else if (!grounded) {
      this.walkPhase = 0;
      this.art.setFrame(this.walkFrames[3 % N]); // legs reaching: the high pose
    } else {
      this.walkPhase = 0;
      this.frameIndex = 0;
      this.idleTime += delta;
      const iN = this.idleFrames.length;
      this.art.setFrame(this.idleFrames[Math.floor(this.idleTime / 140) % iN]);
    }
    this.art.setTint(rev ? 0xd8f0a0 : 0xffffff);

    // Crouch hitbox. Both bodies keep their bottom at y+22, so ducking never
    // moves Jo's feet — only the drawing shrinks (see syncAttachments).
    const wantCrouch = crouch && grounded;
    if (wantCrouch !== this.crouching) {
      this.crouching = wantCrouch;
      if (wantCrouch) body.setSize(24, 32, false).setOffset(4, 14);
      else body.setSize(24, 44, false).setOffset(4, 2);
    }
  }
}
