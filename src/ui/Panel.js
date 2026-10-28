// The one frame (round 2 WP6, critique §9 "UI frame"): ink-dark fill at 88 %,
// one 1 px brass line, a 1 px inner shadow, 3 px rounded corners. Five uses
// share it: dialogue, cards, signs (with an accent line), HUD slots and
// menus. Never a plain rectangle fill; never a second frame style. The
// `ui-frame-single` lint keeps rounded-rect frames out of every other file.
import { THEME, PANEL_ALPHA } from './theme.js';

export const FRAME = Object.freeze({ radius: 3, line: 1, inner: 1 });

export function drawPanel(g, x, y, w, h, { fill = THEME.panel, alpha = PANEL_ALPHA, edge = THEME['panel-edge'], accent = null } = {}) {
  x = Math.round(x);
  y = Math.round(y);
  w = Math.round(w);
  h = Math.round(h);
  const r = FRAME.radius;
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(x, y, w, h, r);
  // the inner shadow: 1 px, just inside the line, darker at the top and left
  // (the frame is set into the screen, not stuck on it)
  g.lineStyle(1, THEME['ink-shadow'], 0.9);
  g.strokeRoundedRect(x + 1.5, y + 1.5, w - 3, h - 3, Math.max(1, r - 1));
  // the one brass line (a sign plate swaps it for its accent)
  g.lineStyle(FRAME.line, accent === null ? edge : accent, 1);
  g.strokeRoundedRect(x + 0.5, y + 0.5, w - 1, h - 1, r);
  return g;
}

// a screen-space panel centred on (cx, cy); lands on the UI scene by depth
export function panel(scene, cx, cy, w, h, opts = {}) {
  const g = scene.add.graphics();
  drawPanel(g, cx - w / 2, cy - h / 2, w, h, opts);
  g.panelRect = { x: cx - w / 2, y: cy - h / 2, w, h };
  g.isDCPanel = true;
  return g.setScrollFactor(0).setDepth(opts.depth ?? 200);
}

// the full-screen dim behind a modal (the night indigo, never black)
export function dim(scene, alpha = 0.6, depth = 200) {
  const cam = scene.cameras.main;
  return scene.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, THEME['ink-shadow'], alpha).setScrollFactor(0).setDepth(depth);
}
