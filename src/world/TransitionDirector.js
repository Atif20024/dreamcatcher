// TransitionDirector (plan 2.2): a door is an honest cut. A short fade to
// black (250 ms by default), the destination room streamed in, Jo placed at
// the paired portal facing into the room, the camera snapped, then a fade
// back in. Control is locked for the length of it. Seams need nothing here:
// they are crossed continuously and blended by the RoomGraph's t.
import { events } from '../core/events.js';

const T = 32;

export class TransitionDirector {
  constructor(scene, { graph, streamer, input, camera, player, onArrive = null } = {}) {
    Object.assign(this, { scene, graph, streamer, input, camera, player, onArrive });
    this.busy = false;
    this.count = 0;
  }

  // where Jo stands at a portal: on the floor of the portal's tile
  standAt(p) {
    const r = this.graph.room(p.room);
    return { x: p.wx, y: (r.ty + p.y) * T + T - 22 };
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
