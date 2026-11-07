// Touch controls (phones, tablets; load with ?touch=1 to see them on a
// desktop). Real TouchEvents on the canvas, so the whole path is under test:
// the window capture listener → the layout's hit test → virtual keys →
// Player / the hub's [E] / the dialogue box.
//   touch-walk-jump-talk   in the hall: hold ▶ (Jo walks east), tap JUMP
//                          with ▶ still held (multitouch: he leaves the
//                          ground), let go (he stops); at Mr. Pemberton's
//                          desk tap E (the conversation opens, the play
//                          buttons step aside), then tap the screen until
//                          the box closes (the buttons come back)
// If the page was not loaded with ?touch=1 the scenario switches the
// controls on for itself and off again after.
import { enableTouch } from '../../ui/TouchControls.js';
import { touchState } from '../../input/touchState.js';
import { UI } from '../../ui/ui.js';

const live = new Map(); // identifier → Touch

function touch(type, id, gx, gy) {
  const canvas = window.game.canvas;
  // the controls' own reading of the canvas (1:1 when the page is hidden)
  const r = touchState.controls.rect();
  const clientX = r.left + (gx / 960) * r.width;
  const clientY = r.top + (gy / 540) * r.height;
  const t = new Touch({ identifier: id, target: canvas, clientX, clientY, radiusX: 8, radiusY: 8, force: 1 });
  if (type === 'touchend' || type === 'touchcancel') live.delete(id);
  else live.set(id, t);
  const all = [...live.values()];
  canvas.dispatchEvent(new TouchEvent(type, { touches: all, targetTouches: all, changedTouches: [t], bubbles: true, cancelable: true }));
}

const center = (L, id) => {
  const arm = L.pad.arms.find((a) => a.id === id);
  if (arm) return arm;
  return L.buttons.find((b) => b.id === id);
};

async function tapAt(dc, id, x, y) {
  touch('touchstart', id, x, y);
  await dc.run(3);
  touch('touchend', id, x, y);
  await dc.run(2);
}

const walkJumpTalk = {
  id: 'touch-walk-jump-talk',
  async run(dc) {
    const wasOn = !!(touchState.controls && touchState.controls.enabled);
    if (!wasOn) enableTouch(true);
    const lines = [];
    try {
      dc.warp('hub');
      await dc.run(30);
      // (straight after a cold load Boot may still start the title over it)
      if (!dc.scene() || dc.scene().sys.settings.key !== 'Hub') {
        dc.warp('hub');
        await dc.run(30);
      }
      const s = dc.scene();
      s.openingDone = true; // the first visit's vista is not under test here
      const C = touchState.controls;
      if (!C || !C.enabled) return { pass: false, detail: 'touch controls did not start' };
      await dc.run(2);
      const L = C.layout;
      const desk = s.interacts.find((it) => it.label === 'pemberton');
      const p = s.player;
      // stand him 220 px west of the desk, on the hall floor
      p.setPosition(desk.x - 220, desk.y - 6);
      p.body.reset(desk.x - 220, desk.y - 6);
      await dc.run(40);
      // the footer's key hints ([Esc] pause · [M] music) give way to the buttons
      const footer = UI.scene.hudGrid.texts.footer.visible;
      lines.push(`buttons ${L.b.toFixed(0)} game px, ${C.play ? 'shown' : 'HIDDEN'}, footer ${footer ? 'SHOWN' : 'hidden'}`);

      // 1. hold RIGHT
      const R = center(L, 'right');
      const x0 = p.x;
      touch('touchstart', 1, R.x, R.y);
      await dc.run(30);
      const walked = p.x - x0;
      const heldRight = C.held.has('ArrowRight');
      lines.push(`RIGHT held 30 frames: ${Math.round(walked)} px east, ArrowRight ${heldRight ? 'down' : 'UP'}`);

      // 2. tap JUMP with ▶ still held
      const J = center(L, 'jump');
      const yGround = p.y;
      let yMin = p.y;
      touch('touchstart', 2, J.x, J.y);
      for (let i = 0; i < 6; i++) {
        await dc.run(1);
        yMin = Math.min(yMin, p.y);
      }
      touch('touchend', 2, J.x, J.y);
      for (let i = 0; i < 30; i++) {
        await dc.run(1);
        yMin = Math.min(yMin, p.y);
      }
      const rose = yGround - yMin;
      const stillRight = C.held.has('ArrowRight') && !C.held.has('Space');
      lines.push(`JUMP tapped under RIGHT: rose ${Math.round(rose)} px, RIGHT still ${stillRight ? 'held' : 'NOT held'}`);

      // 3. let go of ▶
      touch('touchend', 1, R.x, R.y);
      await dc.run(40);
      const vx = Math.abs(p.body.velocity.x);
      const released = C.held.size === 0;
      lines.push(`let go: vx ${Math.round(vx)}, keys held ${C.held.size}`);

      // 4. at the desk: E
      p.setPosition(desk.x - 12, desk.y - 6);
      p.body.reset(desk.x - 12, desk.y - 6);
      await dc.run(20);
      const E = center(L, 'interact');
      await tapAt(dc, 3, E.x, E.y);
      let opened = false;
      for (let i = 0; i < 20 && !opened; i++) {
        await dc.run(1);
        opened = !!s.dialogActive;
      }
      await dc.run(2);
      const stepAside = opened && !C.play;
      lines.push(`E at the desk: conversation ${opened ? 'open' : 'NOT open'}, play buttons ${C.play ? 'SHOWN' : 'aside'}`);

      // 5. tap the box until it closes
      let taps = 0;
      for (; taps < 24 && s.dialogActive; taps++) {
        await tapAt(dc, 10 + taps, 480, 470);
        await dc.run(12);
      }
      await dc.run(4);
      const closed = !s.dialogActive;
      lines.push(`tapped the box ${taps}× → ${closed ? 'closed' : 'STILL OPEN'}, play buttons ${C.play ? 'back' : 'STILL ASIDE'}`);

      const pass = !footer && walked > 20 && heldRight && rose > 20 && stillRight && released && vx < 5 && opened && stepAside && closed && C.play;
      return { pass, detail: lines.join('; ') };
    } finally {
      live.clear();
      if (touchState.controls) touchState.controls.releaseAll();
      if (!wasOn) enableTouch(false);
    }
  },
};

export default [walkJumpTalk];
