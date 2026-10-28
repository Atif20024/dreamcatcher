// Teach (plan §2.9): tutorial cards from data (src/data/teach.js).
//   showTutorial(scene, id, {force})  an event trigger fired from code; a
//                                      card is shown once per dream (scope
//                                      'perDream') or once per save ('once')
//   updateTeach(scene, room)           runs the zone triggers each frame
//   seenInDream(scene)                 cards this dream has shown (pause
//                                      menu "Replay tutorials")
// The card is a ModalManager modal ('tutorial'): it goes on top of an
// encounter panel that opened with it (the BET card over the stake
// selector), waits under a death or pause card, and is cleared by the death
// card. It sizes itself to its text, so a long hint never spills out.
import ModalManager from '../ui/ModalManager.js';
import { uiText } from '../ui/text.js';
import { panel, dim } from '../ui/Panel.js';
import { saveStore } from '../meta/SaveStore.js';
import { CARDS } from '../data/teach.js';
import { events } from '../core/events.js';

const SCENE_DREAM = { Hub: 'hub', Chef: 'chef', Musician: 'musician', Astronaut: 'astronaut', Writer: 'writer', Painter: 'painter', Gambler: 'gambler', Evening: 'evening' };
export const dreamOfScene = (scene) => SCENE_DREAM[scene.scene.key] || scene.scene.key;

const appliesTo = (card, dream) => (card.triggers || []).some((t) => t.dream === '*' || t.dream === dream);

export function cardSeen(dream, id) {
  const c = CARDS[id];
  if (!c) return true;
  if (c.scope === 'once') return saveStore.seenCards('*').includes(id);
  return saveStore.seenCards(dream).includes(id);
}

export function showTutorial(scene, id, { force = false } = {}) {
  const c = CARDS[id];
  if (!c) return false;
  const dream = dreamOfScene(scene);
  if (!force) {
    if (!appliesTo(c, dream)) return false;
    if (cardSeen(dream, id)) return false;
    saveStore.markCard(c.scope === 'once' ? '*' : dream, id);
  }
  events.emit('teach:card', { id, dream, force });

  const cam = scene.cameras.main;
  const cx = cam.width / 2;
  const cy = cam.height / 2;
  scene.tutorialActive = true;
  const depth = 240;
  const h = ModalManager.for(scene).open({
    kind: 'tutorial',
    name: `tutorial:${id}`,
    freeze: 'physics',
    guardMs: 250,
    onKey: () => h.close(),
    onClose: () => {
      scene.tutorialActive = !!(scene.modals && scene.modals.has('tutorial'));
    },
  });
  h.cardId = id;
  const t = (y, str, opts) => h.add(uiText(scene, cx, y, str, { align: 'center', ...opts }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(depth + 2));
  const name = t(0, c.name, { size: 'display', color: 'accent' });
  name.name = 'tutorial-name';
  const hint = t(0, c.hint, { size: 'body', color: 'ink', wrap: 520 });
  const key = t(0, c.key ? `[ ${c.key} ]` : '[ any key ]', { size: 'small', color: 'calm' });
  const W = Math.max(360, Math.min(600, Math.max(name.width, hint.width, key.width) + 64));
  const H = 24 + name.height + 14 + hint.height + 16 + key.height + 22;
  let y = Math.round(cy - H / 2) + 24;
  for (const o of [name, hint, key]) {
    o.setY(y);
    y += o.height + (o === name ? 14 : 16);
  }
  h.add(dim(scene, 0.55, depth));
  h.add(panel(scene, cx, cy, W, H, { depth: depth + 1, accent: 0xe9b84a }));
  return true;
}

// zone triggers: Jo standing in a room (and column range) of this dream
export function updateTeach(scene, room) {
  if (!room || scene.tutorialActive || scene.dialogActive || scene.puzzleActive || scene.cardActive || scene.paused) return;
  const dream = dreamOfScene(scene);
  const p = scene.player;
  if (!p) return;
  const tx = Math.floor(p.x / 32) - (room._x0 || 0);
  for (const [id, c] of Object.entries(CARDS)) {
    for (const t of c.triggers || []) {
      if (!t.zone || (t.dream !== dream && t.dream !== '*') || t.zone.room !== room.id) continue;
      if (t.zone.x0 !== undefined && tx < t.zone.x0) continue;
      if (t.zone.x1 !== undefined && tx > t.zone.x1) continue;
      if (showTutorial(scene, id)) return;
    }
  }
}

// cards this dream has shown (and the once-per-save cards that belong here)
export function seenInDream(scene) {
  const dream = dreamOfScene(scene);
  const mine = saveStore.seenCards(dream);
  const once = saveStore.seenCards('*').filter((id) => CARDS[id] && appliesTo(CARDS[id], dream));
  return [...new Set([...mine, ...once])].filter((id) => CARDS[id]).map((id) => ({ id, name: CARDS[id].name }));
}

export { CARDS };
