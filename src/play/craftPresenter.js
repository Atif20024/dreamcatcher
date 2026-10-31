// The workshop presenter (THE MASTER'S LADDER, src/engines/craft.js).
// Staged at the job: the piece itself builds up on its easel or wall as the
// steps are done (def.work paints it at k steps done), and under it a plate
// with the bar: the gold mark is where the brush must land, the brush sweeps
// across and back. The step's name rides the HUD context line; WET → DRY is a
// HUD meter when the plaster is the clock; the rival's bay is another.
//   PRESENTERS.craft.world (src/play/encounterPresenters.js)
import { drawPanel } from '../ui/Panel.js';
import { hud } from '../ui/hud.js';
import { playTone, sfx } from '../systems/audio.js';

const GOLD = 0xf2d580;
const LAPIS = 0x3a5ab8;
const HIT = 0x7ec87e;
const BAD = 0xd06050;

export function drawCraft(g, cx, cy, st, flash) {
  g.clear();
  const w = 300;
  const x0 = cx - w / 2;
  drawPanel(g, x0 - 22, cy - 26, w + 44, 62, { accent: 0xc8a24a });
  // the steps as pips (a symbol and a colour: a filled lozenge when done)
  for (let i = 0; i < st.n; i++) {
    const px = cx - ((st.n - 1) * 16) / 2 + i * 16;
    const done = i < st.idx;
    const cur = i === st.idx;
    g.fillStyle(done ? HIT : cur ? GOLD : 0x5a5060, done || cur ? 1 : 0.7);
    g.fillTriangle(px, cy - 22, px + 5, cy - 16, px - 5, cy - 16);
    g.fillTriangle(px, cy - 10, px + 5, cy - 16, px - 5, cy - 16);
  }
  // the bar: a plaster strip, the gold mark, the brush
  const by = cy + 12;
  g.fillStyle(st.phase === 'dried' ? 0x8a8478 : 0xe8dcc0, 1).fillRect(x0, by - 7, w, 14);
  g.fillStyle(0x14122a, 0.35).fillRect(x0, by + 5, w, 2);
  if (st.auto) {
    // someone else's hand: a slow fill, no mark
    g.fillStyle(LAPIS, 0.85).fillRect(x0, by - 7, w * Math.min(1, st.autoK), 14);
    return;
  }
  const zx = x0 + (st.at - st.zone / 2) * w;
  const zw = st.zone * w;
  g.fillStyle(st.inZone ? 0xfff0b0 : GOLD, 1).fillRect(zx, by - 7, zw, 14);
  g.lineStyle(1, 0x8a6a2a, 1).strokeRect(zx, by - 7, zw, 14);
  if (st.phase === 'dried') return;
  const bx = x0 + st.p * w;
  g.lineStyle(3, flash === 'miss' ? BAD : 0x2a1e1a, 1).lineBetween(bx, by - 14, bx, by + 12);
  g.fillStyle(flash === 'miss' ? BAD : 0x6a4a2a, 1).fillRect(bx - 2, by - 24, 4, 10);
  g.fillStyle(flash === 'hit' ? HIT : LAPIS, 1).fillTriangle(bx - 4, by - 14, bx + 4, by - 14, bx, by - 6);
}

export function craftWorld(scene, def, engine, ctx) {
  const a = ctx.anchor || { x: scene.player.x, y: scene.player.y - 150 };
  const g = scene.add.graphics().setDepth(40);
  const tool = hud.toolLine(3, 'accent');
  const st0 = engine.state();
  const plaster = st0.clock !== null ? hud.meter('plaster', { label: 'PLASTER: WET', color: '#c8b48a', order: 5 }) : null;
  const rival = st0.rival !== null ? hud.meter('rival', { label: def.rivalLabel || 'THE RIVAL', color: '#7ea86a', order: 6 }) : null;
  // the piece itself, painted at k steps done (def.work: { w, h, paint, dy?, keep? })
  const work = def.work || null;
  const wx = a.x + ((work && work.dx) || 0);
  const wy = a.y + ((work && work.dy) ?? -40 - (work ? work.h / 2 : 0));
  const key = `craft-work:${def.id}`;
  let canvas = null;
  let img = null;
  let shownK = -1;
  if (work) {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    canvas = scene.textures.createCanvas(key, work.w, work.h);
    img = scene.add.image(wx, wy, key).setDepth(work.depth ?? 39);
  }
  const paintWork = (k) => {
    if (!work || k === shownK) return;
    shownK = k;
    const c = canvas.getContext();
    c.clearRect(0, 0, work.w, work.h);
    work.paint(c, work.w, work.h, k, engine.steps.length);
    canvas.refresh();
  };
  let flash = null;
  let flashT = 0;
  let said = null;
  const context = (t) => {
    if (t !== said) hud.set('context', (said = t));
  };
  const hint = (st) => {
    if (st.phase === 'dried') return 'the plaster dried. chip it off, lay it fresh…';
    if (st.auto) return `${st.label}: hold the ladder steady`;
    return `${st.label}: [E] when the brush is on the gold`;
  };
  const marks = (st) => `${def.title || 'THE WORK'}  ${Math.min(st.idx + 1, st.n)}/${st.n}`;
  const sync = (st) => {
    tool.setText(marks(st));
    if (plaster) plaster.set(st.clock ?? 1).setLabel(st.clock > 0.35 ? 'PLASTER: WET' : 'PLASTER: DRYING');
    if (rival) rival.set(st.rival ?? 0);
    context(hint(st));
    paintWork(st.idx);
    // a dream's own reaction to the job's progress (the contract, the music)
    if (def.onRender) def.onRender(scene, st);
  };
  let dried = 0;
  return {
    enter(st) {
      drawCraft(g, a.x, a.y, st, null);
      tool.setVisible(true);
      if (plaster) plaster.setVisible(true);
      if (rival) rival.setVisible(true);
      if (scene.player.pose) scene.player.pose('brush_hold');
      sync(st);
    },
    render(st, outcome) {
      if (outcome === 'hit' || outcome === 'miss') {
        flash = outcome;
        flashT = scene.time.now;
        try {
          if (outcome === 'hit') [392, 494, 587].forEach((f, i) => playTone(f * (1 + st.idx * 0.06), 0.22, 'triangle', 0.08, i * 0.05));
          else playTone(150, 0.16, 'square', 0.05);
        } catch {
          /* no audio */
        }
        if (outcome === 'hit' && scene.player.pose) scene.player.pose('brush');
        scene.cameras.main.shake(outcome === 'hit' ? 70 : 50, outcome === 'hit' ? 0.0015 : 0.003);
      }
      if (st.dried > dried) {
        dried = st.dried;
        sfx('fail');
        scene.cameras.main.shake(160, 0.004);
      }
      if (flash && scene.time.now - flashT > 220) flash = null;
      drawCraft(g, a.x, a.y, st, flash);
      sync(st);
    },
    outro(result) {
      return new Promise((res) => {
        if (result && result.ok) {
          paintWork(engine.steps.length);
          try {
            [392, 494, 587, 784].forEach((f, i) => playTone(f, 0.5, 'sine', 0.1, i * 0.12));
          } catch {
            /* no audio */
          }
          const ring = scene.add.circle(wx, wy, 50, GOLD, 0).setStrokeStyle(4, GOLD, 1).setDepth(40);
          scene.tweens.add({ targets: ring, scale: 2.4, alpha: 0, duration: 800, onComplete: () => ring.destroy() });
        }
        scene.time.delayedCall(result && result.ok ? 900 : 200, res);
      });
    },
    destroy() {
      g.destroy();
      if (img) img.destroy();
      tool.setText('').setVisible(false);
      if (plaster) plaster.setVisible(false);
      if (rival) rival.setVisible(false);
      hud.set('context', '');
    },
  };
}
