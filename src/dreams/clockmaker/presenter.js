// The escapement's presenter (src/engines/escapement.js): a small plate over
// Jo's head with the bob swinging across a brass mark, pips for the count. The
// room is the picture (the bell, the lamps down the hill); this only says when.
//   PRESENTERS.escapement.world (src/play/encounterPresenters.js)
import { drawPanel } from '../../ui/Panel.js';
import { hud } from '../../ui/hud.js';
import { playTone, sfx } from '../../systems/audio.js';

const BRASS = 0xc8963a;
const LIT = 0xf6d98a;
const BAD = 0xd5443c;

function draw(g, cx, cy, st, flash) {
  g.clear();
  const w = 200;
  drawPanel(g, cx - w / 2 - 14, cy - 28, w + 28, 62, { accent: BRASS });
  for (let i = 0; i < st.beats; i++) {
    const px = cx - ((st.beats - 1) * 16) / 2 + i * 16;
    if (i < st.count) g.fillStyle(LIT, 1).fillCircle(px, cy - 16, 5);
    else g.lineStyle(2, BRASS, 0.8).strokeCircle(px, cy - 16, 5);
  }
  const by = cy + 12;
  g.lineStyle(3, 0x3a2e24, 1).lineBetween(cx - w / 2, by, cx + w / 2, by);
  // the mark in the middle, wide as the window really is (2 crossings a period)
  const half = (w / 2) * Math.sin(Math.PI * st.window);
  g.fillStyle(st.inWindow ? LIT : BRASS, 1).fillRect(cx - half, by - 7, half * 2, 14);
  g.fillStyle(flash === 'miss' ? BAD : 0x2a1e1a, 1).fillCircle(cx + st.x * (w / 2), by, 8);
}

export function escapementWorld(scene, def, engine) {
  const g = scene.add.graphics().setDepth(40);
  const tool = hud.toolLine(3, 'accent');
  const at = () => ({ x: scene.player.x, y: scene.player.y - 112 });
  let flash = null;
  let flashT = 0;
  let count = 0;
  return {
    enter(st) {
      const a = at();
      draw(g, a.x, a.y, st, null);
      tool.setText(def.title).setVisible(true);
      hud.set('context', def.hint);
      if (def.onRender) def.onRender(scene, st);
    },
    render(st, outcome) {
      // a strike, whoever struck it (Jo, or the clock left to itself)
      if (st.count > count) {
        if (def.sound) sfx(def.sound);
        else {
          try {
            [523, 659].forEach((f, i) => playTone(f, 0.18, 'triangle', 0.12, i * 0.06));
          } catch {
            /* no audio */
          }
        }
        scene.cameras.main.shake(90, 0.002);
      }
      count = st.count;
      if (outcome === 'miss') {
        flash = 'miss';
        flashT = scene.time.now;
        sfx('click');
      }
      if (flash && scene.time.now - flashT > 220) flash = null;
      const a = at();
      draw(g, a.x, a.y, st, flash);
      if (def.onRender) def.onRender(scene, st);
    },
    outro() {
      return new Promise((res) => scene.time.delayedCall(def.outroMs ?? 600, res));
    },
    destroy() {
      g.destroy();
      tool.setText('').setVisible(false);
      hud.set('context', '');
    },
  };
}
