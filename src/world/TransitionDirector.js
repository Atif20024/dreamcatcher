// TransitionDirector (plan 2.2): a door is an honest cut. A short fade to
// black (250 ms by default), the destination room streamed in, Jo placed at
// the paired portal facing into the room, the camera snapped, then a fade
// back in. Control is locked for the length of it.
// A seam is walked through (walk): Jo keeps walking, the screen dips through
// dark inside the seam's drawn frame, the rooms swap at full dark (the
// caller's onHold), and it comes back up. Nothing is locked; two rooms are
// never on screen at once (src/world/thresholds.js has the timings).
import { events } from '../core/events.js';

const T = 32;

// down to dark, onHold() at full dark, hold, back up. The timers are a floor
// under the fade's own callbacks: a fade cut short by another (a respawn)
// never strands the dip. onUp() runs on the frame the screen is back up (in
// step, not a microtask later); the promise resolves then too.
export function dipThroughDark(scene, { down, hold, up }, onHold, onUp = null) {
  const cam = scene.cameras.main;
  return new Promise((resolve) => {
    let held = false;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (onUp) onUp();
      resolve(true);
    };
    const atHold = () => {
      if (held) return;
      held = true;
      onHold();
      scene.time.delayedCall(hold, () => {
        cam.fadeFrom(up, 0, 0, 0, true, (c, k) => k >= 1 && finish());
        scene.time.delayedCall(up + 100, finish);
      });
    };
    cam.fade(down, 0, 0, 0, true, (c, k) => k >= 1 && atHold());
    scene.time.delayedCall(down + 100, atHold);
  });
}

export class TransitionDirector {
  constructor(scene, { graph, streamer, input, camera, player, onArrive = null } = {}) {
    Object.assign(this, { scene, graph, streamer, input, camera, player, onArrive });
    this.busy = false;
    this.count = 0;
    this.dips = 0;
  }

  // where Jo stands at a portal: on the floor of the portal's tile
  standAt(p) {
    const r = this.graph.room(p.room);
    return { x: p.wx, y: (r.ty + p.y) * T + T - 22 };
  }

  // a seam frame Jo walked into (RoomGraph.crossing): the dip, the swap at
  // full dark through onHold (the caller commits the room, which streams it
  // in and snaps the camera). No input lock, Jo's velocity untouched.
  walk(cross, onHold) {
    if (this.busy) return Promise.resolve(false);
    this.busy = true;
    this.walking = cross;
    return dipThroughDark(
      this.scene,
      cross.dip,
      () => {
        this.dips += 1;
        events.emit('portal:cross', { from: cross.from, to: cross.to, kind: 'seam', portal: cross.portal });
        onHold(cross);
      },
      () => {
        this.busy = false;
        this.walking = null;
      }
    );
  }

  go(portalId) {
    if (this.busy) return Promise.resolve(false);
    const from = this.graph.portal(portalId);
    const to = this.graph.partner(portalId);
    if (!from || !to) return Promise.resolve(false);
    const ms = (from.door && from.door.fade) || 250;
    this.busy = true;
    this.input.suspend(true);
    const cam = this.scene.cameras.main;
    return new Promise((resolve) => {
      cam.fadeOut(ms, 0, 0, 0);
      cam.once('camerafadeoutcomplete', () => {
        this.streamer.focus(to.room);
        const pos = this.standAt(to);
        const p = this.player;
        p.setPosition(pos.x, pos.y);
        p.body.reset(pos.x, pos.y);
        p.body.setVelocity(0, 0);
        // face into the room
        const r = this.graph.room(to.room);
        p.setFlipX(pos.x > (r.x0 + r.x1) / 2);
        this.camera.snap();
        this.count += 1;
        events.emit('portal:cross', { from: from.id, to: to.id, kind: 'door' });
        if (this.onArrive) this.onArrive(to, from);
        cam.fadeIn(ms, 0, 0, 0);
        cam.once('camerafadeincomplete', () => {
          this.busy = false;
          this.input.suspend(false);
          resolve(true);
        });
      });
    });
  }
}

export default TransitionDirector;
