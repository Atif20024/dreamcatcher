// The one panel frame every modal and card uses (ui-type skill "Panels"):
// a 2-px chamfered corner, a `panel-edge` border, a light top-left and a
// dark bottom-right bevel. Never a plain rectangle fill.
import { THEME, PANEL_ALPHA } from './theme.js';

export function drawPanel(g, x, y, w, h, { fill = THEME.panel, alpha = PANEL_ALPHA, edge = THEME['panel-edge'], accent = null } = {}) {
  x = Math.round(x);
  y = Math.round(y);
  w = Math.round(w);
  h = Math.round(h);
  const c = 4;
  const pts = [
    { x: x + c, y }, { x: x + w - c, y }, { x: x + w, y: y + c }, { x: x + w, y: y + h - c },
    { x: x + w - c, y: y + h }, { x: x + c, y: y + h }, { x, y: y + h - c }, { x, y: y + c },
  ];
  g.fillStyle(fill, alpha);
  g.fillPoints(pts, true);
  g.lineStyle(2, 0xffffff, 0.07);
  g.lineBetween(x + c, y + 3, x + w - c, y + 3);
  g.lineBetween(x + 3, y + c, x + 3, y + h - c);
  g.lineStyle(2, 0x000000, 0.3);
  g.lineBetween(x + c, y + h - 3, x + w - c, y + h - 3);
  g.lineBetween(x + w - 3, y + c, x + w - 3, y + h - c);
  g.lineStyle(2, accent === null ? edge : accent, 1);
  g.strokePoints(pts, true);
  return g;
}

// a screen-space panel centred on (cx, cy); lands on the UI scene by depth
export function panel(scene, cx, cy, w, h, opts = {}) {
  const g = scene.add.graphics();
  drawPanel(g, cx - w / 2, cy - h / 2, w, h, opts);
  g.panelRect = { x: cx - w / 2, y: cy - h / 2, w, h };
  return g.setScrollFactor(0).setDepth(opts.depth ?? 200);
}

// the full-screen dim behind a modal
export function dim(scene, alpha = 0.6, depth = 200) {
  const cam = scene.cameras.main;
  return scene.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, THEME['ink-shadow'], alpha).setScrollFactor(0).setDepth(depth);
}
