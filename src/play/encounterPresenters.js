// Encounter presenters (plan 2.10): the visual half of an encounter. The
// engine is pure logic; a presenter only draws its state(). 'world' stages it
// in the room at the encounter's anchor (the camera closes in, the HUD tool
// slot carries the count); 'modal' draws the same thing in a centred panel
// through the ModalManager, for anything kept as a menu.
//
//   makePresenter(scene, def, engine, ctx) → { enter(state), render(state, outcome), outro(result) → Promise, destroy() }
import ModalManager from '../ui/ModalManager.js';
import { panel, dim } from '../ui/Panel.js';
import { uiText } from '../ui/text.js';
import { hud } from '../ui/hud.js';
import { playTone } from '../systems/audio.js';

const RAD = Math.PI / 180;

// the clock: a dial with the gear windows (brass) and the sweeping hand
function drawDial(g, cx, cy, R, st, flash) {
  g.clear();
  g.fillStyle(0x140e14, 0.35).fillCircle(cx, cy, R + 6);
  st.windows.forEach((w, i) => {
    const seated = i < st.seated;
    const cur = i === st.seated;
    const a0 = (w.center - w.half - 90) * RAD;
    const a1 = (w.center + w.half - 90) * RAD;
    const col = seated ? 0x7ec87e : cur ? (st.inWindow ? 0xf6d98a : 0xe9b84a) : 0x6b4a1f;
    g.lineStyle(cur ? 10 : 7, col, seated ? 0.9 : cur ? 0.95 : 0.6);
    g.beginPath();
    g.arc(cx, cy, R - 8, a0, a1, false);
    g.strokePath();
    // a symbol as well as a colour (accessibility): a tick for seated
    const am = (w.center - 90) * RAD;
    const px = cx + Math.cos(am) * (R + 10);
    const py = cy + Math.sin(am) * (R + 10);
    if (seated) g.fillStyle(0x7ec87e, 1).fillCircle(px, py, 4);
    else g.lineStyle(2, col, 0.9).strokeCircle(px, py, 4);
  });
  const a = (st.angle - 90) * RAD;
  g.lineStyle(4, flash === 'miss' ? 0xd5443c : 0x1a1420, 1);
  g.beginPath();
  g.moveTo(cx - Math.cos(a) * 10, cy - Math.sin(a) * 10);
  g.lineTo(cx + Math.cos(a) * (R - 4), cy + Math.sin(a) * (R - 4));
  g.strokePath();
  g.fillStyle(0xc8963a, 1).fillCircle(cx, cy, 6);
}

function clockworkWorld(scene, def, engine, ctx) {
  const a = ctx.anchor || { x: scene.player.x, y: scene.player.y - 120 };
  const R = def.radius || 52;
  const g = scene.add.graphics().setDepth(-11);
  const tool = hud.toolLine(3, 'accent');
  let flash = null;
  let flashT = 0;
  const marks = (st) => Array.from({ length: st.gears }, (_, i) => (i < st.seated ? '●' : '○')).join(' ');
  return {
    enter(st) {
      drawDial(g, a.x, a.y, R, st, null);
      tool.setText(`GEARS ${marks(st)}`).setVisible(true);
      hud.set('context', def.hint || '[E] when the hand is in the brass');
    },
    render(st, outcome) {
      if (outcome) {
        flash = outcome;
        flashT = scene.time.now;
        try {
          if (outcome === 'hit') [523, 659].forEach((f, i) => playTone(f, 0.18, 'triangle', 0.12, i * 0.06));
          else playTone(140, 0.2, 'square', 0.08);
        } catch {
          /* no audio */
        }
        scene.cameras.main.shake(outcome === 'hit' ? 90 : 60, outcome === 'hit' ? 0.002 : 0.004);
      }
      if (flash && scene.time.now - flashT > 220) flash = null;
      drawDial(g, a.x, a.y, R, st, flash);
      tool.setText(`GEARS ${marks(st)}`);
    },
    outro() {
      return new Promise((res) => {
        try {
          [392, 523, 659, 784].forEach((f, i) => playTone(f, 0.5, 'sine', 0.12, i * 0.12));
        } catch {
          /* no audio */
        }
        const ring = scene.add.circle(a.x, a.y, R, 0xf6d98a, 0).setStrokeStyle(4, 0xf6d98a, 1).setDepth(-10);
        scene.tweens.add({ targets: ring, scale: 2.2, alpha: 0, duration: 700, onComplete: () => ring.destroy() });
        scene.time.delayedCall(750, res);
      });
    },
    destroy() {
      g.destroy();
      tool.setText('').setVisible(false);
      hud.set('context', '');
    },
  };
}

function clockworkModal(scene, def, engine) {
  const cam = scene.cameras.main;
  const h = ModalManager.for(scene).open({ kind: 'encounter', name: `encounter:${def.id}`, freeze: 'none' });
  h.add(dim(scene, 0.55, 220));
  h.add(panel(scene, cam.width / 2, cam.height / 2, 420, 340, { depth: 221, accent: 0xe9b84a }));
  h.add(uiText(scene, cam.width / 2, cam.height / 2 - 150, def.title || 'THE CLOCK', { size: 'display', color: 'accent', align: 'center' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(222));
  const g = h.add(scene.add.graphics().setScrollFactor(0).setDepth(222));
  return {
    enter(st) {
      drawDial(g, cam.width / 2, cam.height / 2 + 20, 100, st, null);
    },
    render(st, outcome) {
      drawDial(g, cam.width / 2, cam.height / 2 + 20, 100, st, outcome);
    },
    destroy() {
      h.close();
    },
  };
}

export const PRESENTERS = {
  clockwork: { world: clockworkWorld, modal: clockworkModal },
};

export function makePresenter(scene, def, engine, ctx) {
  const set = PRESENTERS[def.view || def.id];
  if (!set) return null;
  const kind = def.presenter === 'modal' ? 'modal' : 'world';
  return (set[kind] || set.world)(scene, def, engine, ctx);
}
