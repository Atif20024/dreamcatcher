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
