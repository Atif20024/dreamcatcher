import { sfx } from '../systems/audio.js';
import { D } from '../builders/depths.js';

// A train idling at its platform. States: idle / departing_with_jo /
// returning / dead. `dead` leaves an oil stain and a RESERVED sign: that
// dream has been caught and this train is never coming back.
export default class Train {
  constructor(scene, platform, x, groundY, opts = {}) {
    this.scene = scene;
    this.platform = platform;
    this.x = x;
    this.groundY = groundY;
    this.state = 'idle';
    this.outOfService = !!opts.outOfService;
    this.sprite = scene.add.image(x, groundY - 18, 'hub', opts.texture || 'hub-train').setScale(4).setDepth(D.INTERACT - 2);
    this.lamps = [-52, -20, 20, 52].map((dx) =>
      scene.add.circle(x + dx, groundY - 42, 3, 0xf2d580, this.outOfService ? 0.08 : 0.9).setDepth(D.INTERACT - 1)
    );
    if (!this.outOfService) this.steamTimer = scene.time.addEvent({ delay: 900, loop: true, callback: () => this.puff() });
    this.doorX = x;
    if (opts.dead) this.kill(true);
  }

  puff() {
    if (this.state === 'dead' || !this.sprite.active) return;
    const s = this.scene.add
      .circle(this.x - 60, this.groundY - 44, 5, 0xf2e6cc, 0.35)
      .setDepth(D.INTERACT - 1);
    this.scene.tweens.add({
      targets: s,
      y: s.y - 40,
      x: s.x - 10,
      scale: 2.6,
      alpha: 0,
      duration: 1600,
      onComplete: () => s.destroy(),
    });
  }

  // Jo boards: doors, whistle, steam, then the caller wipes to the dream.
  depart(onGone) {
    this.state = 'departing_with_jo';
    sfx('whistle');
    for (let i = 0; i < 6; i++) this.scene.time.delayedCall(i * 120, () => this.puff());
    this.scene.tweens.add({
      targets: [this.sprite, ...this.lamps],
      x: '+=900',
      duration: 1800,
      ease: 'quad.in',
      delay: 600,
      onComplete: onGone,
    });
  }

  // The only returning train the player ever sees. Lamps go out one by one,
  // the doors close, and it reverses out of the shed and does not come back.
  returnAndDie(onDone) {
    this.state = 'returning';
    this.lamps.forEach((l, i) =>
      this.scene.time.delayedCall(500 + i * 350, () => {
        l.setAlpha(0.15);
        sfx('click');
      })
    );
    this.scene.time.delayedCall(2100, () => sfx('snap')); // doors
    this.scene.tweens.add({
      targets: [this.sprite, ...this.lamps],
      x: '+=900',
      duration: 4200,
      delay: 2400,
      ease: 'sine.in',
      onComplete: () => {
        this.kill();
        if (onDone) onDone();
      },
    });
  }

  kill(instant = false) {
    this.state = 'dead';
    if (this.steamTimer) this.steamTimer.remove();
    this.sprite.destroy();
    this.lamps.forEach((l) => l.destroy());
    const s = this.scene;
    this.stain = s.add.ellipse(this.x, this.groundY - 2, 90, 10, 0x1a1a20, 0.5).setDepth(D.INTERACT - 2);
    this.sign = s.add
      .text(this.x + 60, this.groundY - 26, 'RESERVED', { fontFamily: 'monospace', fontSize: '10px', color: '#8a8478', backgroundColor: '#2a2a30' })
      .setOrigin(0.5)
      .setDepth(D.INTERACT - 1);
    if (!instant) {
      this.stain.setAlpha(0);
      this.sign.setAlpha(0);
      s.tweens.add({ targets: [this.stain, this.sign], alpha: 1, duration: 800 });
    }
  }
}
