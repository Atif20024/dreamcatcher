// Pure content-scan helpers (no Phaser, no fs) so vitest can exercise them.

// tutorial card ids defined in tutorial.js: the keys of `const CARDS = { ... }`
export function parseCardIds(src) {
  const m = src.match(/const CARDS = \{([\s\S]*?)\n\};/);
  if (!m) return [];
  return [...m[1].matchAll(/^\s{2}([a-z_][a-z0-9_]*)\s*:\s*\{/gim)].map((x) => x[1]);
}

// ids that some source triggers: showTutorial(scene, 'id'), showTutorialSafe('id'),
// or any call whose function name contains "Tutorial" with a string literal arg.
export function findTriggeredIds(srcs) {
  const out = new Set();
  const re = /\b\w*[Tt]utorial\w*\s*\(\s*(?:[\w.]+\s*,\s*)?['"`]([a-z_][a-z0-9_]*)['"`]/g;
  for (const src of srcs) for (const m of src.matchAll(re)) out.add(m[1]);
  return out;
}

export function deadCards(tutorialSrc, otherSrcs) {
  const ids = parseCardIds(tutorialSrc);
  const trig = findTriggeredIds(otherSrcs);
  return ids.filter((id) => !trig.has(id));
}

// Phaser default text debt: add.text( and monospace font mentions
export function countDefaultText(src) {
  const addText = (src.match(/\badd\s*\.\s*text\s*\(/g) || []).length;
  const mono = (src.match(/monospace/g) || []).length;
  return { addText, mono };
}

// checkpoints (plan §2.8, F#5): every flag has an id unique in its dream and
// a short readable label ("THE PASS"). `rooms` is { dream: [room, ...] }.
export const CHECKPOINT_LABEL_MAX = 24;
export function checkpointIssues(roomsByDream) {
  const out = [];
  for (const [dream, rooms] of Object.entries(roomsByDream)) {
    const seen = new Set();
    for (const room of rooms) {
      for (const o of room.objects || []) {
        if (o.type !== 'checkpoint') continue;
        const where = `${dream}/${room.id} x=${o.x}`;
        if (!o.id) out.push(`${where}: checkpoint has no id`);
        else if (seen.has(o.id)) out.push(`${where}: duplicate checkpoint id ${o.id}`);
        seen.add(o.id);
        if (!o.label) out.push(`${where}: checkpoint ${o.id || '?'} has no label`);
        else if (o.label.length > CHECKPOINT_LABEL_MAX) out.push(`${where}: label "${o.label}" is over ${CHECKPOINT_LABEL_MAX} chars`);
      }
    }
  }
  return out;
}
