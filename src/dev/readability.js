// Readability audit (round 2 WP5, docs/redesign/round2/02_final_critique.md §8).
// Reads what is on screen NOW and lists every rule it breaks:
//   min-cap      information text whose on-screen cap height (camera zoom and
//                container scale included) is under 9 px in the world or
//                14 px on screen (HUD, prompts, cards, menus)
//   no-plate     world information text with no plate and no declared board
//   contrast     glyph colour vs its plate (or board) under 4.5:1
//   plate-clash  two world text plates drawn over each other
//   text-clash   two lines of text drawn over each other (panels, boards)
//   hud-overlap  two HUD rects (HudGrid slots, meters) closer than 8 px
// `__dc.readability()` runs it in a session.
import { CAP, READ, contrast, isInfo } from '../ui/text.js';
import { UI_KEY } from '../ui/ui.js';

const HUD_MARGIN = 8;

function shown(o) {
  let a = o.alpha;
  if (!o.visible) return 0;
  for (let p = o.parentContainer; p; p = p.parentContainer) {
    if (!p.visible) return 0;
    a *= p.alpha;
  }
  return a;
}

function totalScale(o) {
  let s = Math.abs(o.scaleY);
  for (let p = o.parentContainer; p; p = p.parentContainer) s *= Math.abs(p.scaleY);
  return s;
}

// screen rect of a world or UI object
function screenRect(o, cam) {
  const b = o._bg && o._bg.visible ? o._bg.getBounds() : o.getBounds();
  if (o.scrollFactorX === 0) return { x: b.x, y: b.y, w: b.width, h: b.height };
  const z = cam.zoom;
  return { x: (b.x - cam.worldView.x) * z, y: (b.y - cam.worldView.y) * z, w: b.width * z, h: b.height * z };
}

const onScreen = (r) => r.x < 960 && r.y < 540 && r.x + r.w > 0 && r.y + r.h > 0 && r.w > 0;
const overlapArea = (a, b, m = 0) => Math.max(0, Math.min(a.x + a.w + m, b.x + b.w) - Math.max(a.x - m, b.x)) * Math.max(0, Math.min(a.y + a.h + m, b.y + b.h) - Math.max(a.y - m, b.y));
const label = (o) => String(o._raw ?? o.name ?? o.type).slice(0, 32).replace(/\n/g, '/');

export function auditText(scene, { ui = true } = {}) {
  const out = [];
  if (!scene || !scene.cameras) return out;
  const cam = scene.cameras.main;
  const plates = [];
  const glyphs = [];
  const texts = [...(scene.__dcTexts || [])];
  const uiScene = scene.game.scene.getScene(UI_KEY);
  if (ui && uiScene && uiScene.__dcTexts) texts.push(...[...uiScene.__dcTexts].filter((t) => t.__ui === scene || t.scene === uiScene));
  for (const t of texts) {
    if (!t.active || !t._text || !t._text.trim() || t.dc.decor || !isInfo(t._raw)) continue;
    if (shown(t) < 0.3) continue;
    const isUI = t.displayList && uiScene && t.displayList === uiScene.sys.displayList;
    const screen = isUI || t.scrollFactorX === 0;
    const c = isUI ? uiScene.cameras.main : cam;
    const r = screenRect(t, c);
    if (!onScreen(r)) continue;
    const cap = CAP[t.dc.size] * t.fontSize * totalScale(t) * (screen ? 1 : cam.zoom);
    const min = screen ? READ.screen : READ.world;
    if (cap < min - 0.05) out.push({ rule: 'min-cap', text: label(t), cap: +cap.toFixed(1), min, screen });
    if (!screen) {
      const back = t.backingColor();
      if ((back === null || back === undefined) && !t.parentContainer) out.push({ rule: 'no-plate', text: label(t) });
      if (t._bg && t._bg.visible) plates.push({ t, r });
    }
    if (!String(t.name || '').startsWith('hud-')) {
      const b = t.getBounds();
      const z = screen ? 1 : cam.zoom;
      const sr = screen ? { x: b.x, y: b.y, w: b.width, h: b.height } : { x: (b.x - cam.worldView.x) * z, y: (b.y - cam.worldView.y) * z, w: b.width * z, h: b.height * z };
      glyphs.push({ t, r: sr, isUI });
    }
    const back = t.backingColor();
    if (back !== null && back !== undefined && t.dc.color !== undefined) {
      const k = contrast(t.dc.color, back);
      if (k < READ.contrast) out.push({ rule: 'contrast', text: label(t), ratio: +k.toFixed(2) });
    }
  }
  for (let i = 0; i < plates.length; i++) {
    for (let j = i + 1; j < plates.length; j++) {
      if (overlapArea(plates[i].r, plates[j].r) > 6) out.push({ rule: 'plate-clash', text: `${label(plates[i].t)} × ${label(plates[j].t)}` });
    }
  }
  for (let i = 0; i < glyphs.length; i++) {
    for (let j = i + 1; j < glyphs.length; j++) {
      const a = glyphs[i];
      const b = glyphs[j];
      if (a.isUI !== b.isUI || Math.abs(a.t.depth - b.t.depth) > 50) continue; // a modal over the world
      if (overlapArea(a.r, b.r) > 20) out.push({ rule: 'text-clash', text: `${label(a.t)} × ${label(b.t)}` });
    }
  }
  if (ui) out.push(...auditHud(scene));
  return out;
}

// the HUD's own rects (HudGrid) must keep an 8 px margin between them
export function hudRects(scene) {
  const uiScene = scene.game.scene.getScene(UI_KEY);
  const grid = uiScene && uiScene.hudGrid;
  if (!grid) return [];
  const rects = [];
  for (const o of grid.objects()) {
    if (!o || !o.active || !o.visible || o.alpha < 0.05 || o.name === 'hud-prompt') continue;
    if (o.isDCText && !o._text.trim()) continue;
    const b = o._bg && o._bg.visible ? o._bg.getBounds() : o.getBounds();
    if (b.width <= 0) continue;
    rects.push({ name: o.name, x: b.x, y: b.y, w: b.width, h: b.height });
  }
  // the hearts are one group
  const hearts = rects.filter((r) => r.name === 'hud-heart');
  const rest = rects.filter((r) => r.name !== 'hud-heart');
  if (hearts.length) {
    const x0 = Math.min(...hearts.map((r) => r.x));
    const y0 = Math.min(...hearts.map((r) => r.y));
    rest.push({ name: 'hud-hearts', x: x0, y: y0, w: Math.max(...hearts.map((r) => r.x + r.w)) - x0, h: Math.max(...hearts.map((r) => r.y + r.h)) - y0 });
  }
  return rest;
}

export function auditHud(scene) {
  const out = [];
  const rects = hudRects(scene);
  // the coin icon belongs to the coin count
  const pairOk = (a, b) => [a.name, b.name].sort().join() === 'hud-coin-icon,hud-coins';
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      if (pairOk(rects[i], rects[j])) continue;
      if (overlapArea(rects[i], rects[j], HUD_MARGIN) > 0) out.push({ rule: 'hud-overlap', text: `${rects[i].name} × ${rects[j].name}` });
    }
    const r = rects[i];
    if (r.x < 0 || r.y < 0 || r.x + r.w > 960 || r.y + r.h > 540) out.push({ rule: 'hud-offscreen', text: r.name });
  }
  return out;
}
