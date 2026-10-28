// EndingSequence (plan 2.1, critique F#11 / F5.5): one shared ending
// machine with per-dream content — not the "Was it enough?" card copied six
// times. Steps, all from data (dream.ending):
//   1. control locks, the camera pulls out to a vista on the orb
//   2. the orb catch: it rises, drifts to Jo, a flash, the stinger
//   3. the image beat: a painted picture (ending.paint) framed on screen,
//      with the dream's own lines typed under it (ending.lines)
//   4. completeDream (unless ending.record === false), then a quiet card
//      that returns to the station
//   ending = { beat?, orb: true, title, lines: [...], paint?(ctx, w, h), record?, returnTo?: 'Hub', vista?: 0.8 }
import ModalManager from '../ui/ModalManager.js';
import { uiText } from '../ui/text.js';
import { panel, dim } from '../ui/Panel.js';
import { events } from '../core/events.js';
import { completeDream } from '../utils/save.js';
import { boardTitle } from '../ui/BoardTitle.js';
import { dreamById } from '../data/dreams.js';

export class EndingSequence {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.step = null;
    this.done = false;
  }

  wait(ms) {
    return new Promise((r) => this.scene.time.delayedCall(ms, r));
  }

  async play(def, { orb = null } = {}) {
    if (this.active) return;
    const s = this.scene;
    const e = def.ending || {};
    this.active = true;
    this.step = 'vista';
    s.inputs.suspend(true);
    s.interaction.hide();
    if (s.music) s.music.setState('ending');
    if (e.beat && s.beats.has(e.beat)) await s.beats.play(e.beat);
    const focus = orb ? { x: orb.x, y: orb.y + 40 } : { x: s.player.x, y: s.player.y - 40 };
    const shot = s.camDir.push({ zoom: e.vista ?? 0.82, focus, ms: 1400 });
    await this.wait(1200);
    // the catch
    this.step = 'orb';
    if (orb) {
      s.tweens.add({ targets: orb, y: orb.y - 30, duration: 500, ease: 'sine.out' });
      await this.wait(500);
      await new Promise((res) => s.tweens.add({ targets: orb, x: s.player.x, y: s.player.y - 40, duration: 700, ease: 'sine.inOut', onComplete: res }));
      if (s.player.pose) s.player.pose('celebrate');
      s.tweens.add({ targets: orb, scale: 3, alpha: 0, duration: 500 });
      s.cameras.main.flash(400, 255, 246, 214);
    }
    events.emit('dream:complete', { id: def.id });
    if (e.record !== false) completeDream(def.id);
    this.caught = true;
    await this.wait(900);
    // the image beat
    this.step = 'image';
    await this.imageBeat(e);
    s.camDir.pop(shot, 600);
    this.step = 'card';
    this.done = true;
    await this.card(e);
  }

  imageBeat(e) {
    const s = this.scene;
    const cam = s.cameras.main;
    return new Promise((resolve) => {
      const h = ModalManager.for(s).open({ kind: 'card', name: 'ending:image', freeze: 'none' });
      h.add(dim(s, 0.82, 230));
      const W = 560;
      const H = 300;
      const top = 40;
      if (e.paint) {
        const key = `ending:${s.dreamId}`;
        if (!s.textures.exists(key)) {
          const ct = s.textures.createCanvas(key, W, H);
          e.paint(ct.getContext(), W, H);
          ct.refresh();
        }
        h.add(panel(s, cam.width / 2, top + H / 2, W + 16, H + 16, { depth: 231, accent: 0xe9b84a }));
        const img = h.add(s.add.image(cam.width / 2, top + H / 2, key).setScrollFactor(0).setDepth(232).setAlpha(0));
        s.tweens.add({ targets: img, alpha: 1, duration: 900 });
      }
      // round 2 WP6 (§9 "Moments"): the board flips to the ending's name and
      // CAUGHT, with the place's chime
      // CAUGHT, with the place's chime; the picture's own name is its plaque
      const d = dreamById(s.dreamId);
      h.add(boardTitle(s, `${d ? d.title : e.title || 'THE DREAM'}  CAUGHT`, { y: top + H + 30, persist: true, depth: 233, event: 'caught', name: 'caught-board' }));
      if (e.title && e.paint) h.add(uiText(s, cam.width / 2, top + H - 4, e.title, { size: 'small', color: 'accent', align: 'center', bg: 0x14122a }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(233));
      const body = h.add(uiText(s, cam.width / 2, top + H + 64, '', { size: 'body', color: 'ink', align: 'center', wrap: 640, lineSpacing: 6 }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(232));
      const full = (e.lines || []).join('\n');
      let n = 0;
      const timer = s.time.addEvent({
        delay: 30,
        loop: true,
        callback: () => {
          n += 1;
          body.setText(full.slice(0, n));
          if (n >= full.length) {
            timer.remove();
            s.time.delayedCall(e.hold ?? 1600, () => {
              this.imageHandle = h;
              resolve();
            });
          }
        },
      });
    });
  }

  card(e) {
    const s = this.scene;
    const cam = s.cameras.main;
    const hint = uiText(s, cam.width / 2, cam.height - 30, '[E] Return to Crossroads Station', { size: 'small', color: 'calm', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(233);
    if (this.imageHandle) this.imageHandle.add(hint);
    s.inputs.suspend(false);
    this.waitingForReturn = true;
    return new Promise((resolve) => {
      this.finish = () => {
        this.waitingForReturn = false;
        if (this.imageHandle) this.imageHandle.close();
        resolve();
        if (e.returnTo !== null) s.leaveDream(e.returnTo || 'Hub');
      };
    });
  }

  // from the scene's update while the card waits
  update() {
    if (this.waitingForReturn && this.scene.inputs.justDown('confirm')) this.finish();
  }
}

export default EndingSequence;
