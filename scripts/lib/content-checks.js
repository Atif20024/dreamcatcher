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
// Phaser default text, canvas text and web/system fonts are banned (ui-type
// skill; phase 1.2): everything goes through src/ui/text.js (uiText) or
// paintGlyphs. A line can opt out with `lint-allow default-text: <reason>`.
export const ALLOW_DEFAULT_TEXT = /lint-allow default-text:/;
export function countDefaultText(src) {
  const code = src
    .split('\n')
    .filter((l) => !ALLOW_DEFAULT_TEXT.test(l))
    .join('\n');
  const addText = (code.match(/\b(?:add|make)\s*\.\s*text\s*\(|GameObjects\.Text\s*\(/g) || []).length;
  const mono = (code.match(/monospace/g) || []).length;
  const canvas = (code.match(/\.fillText\s*\(|\.strokeText\s*\(|ctx\.font\s*=/g) || []).length;
  return { addText, mono, canvas };
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

// ---- phase 1.4: teaching, objectives, gates, spawn safety, landmarks -------

// tutorial cards as data (src/data/teach.js): every card has a trigger that
// can fire. An event trigger needs a showTutorial(…, 'id') call in code; a
// zone trigger needs its room (and columns) in that dream's room data.
export function teachIssues(cards, srcs, roomsByDream) {
  const out = [];
  const called = findTriggeredIds(srcs);
  for (const [id, c] of Object.entries(cards)) {
    const trig = c.triggers || [];
    if (!trig.length) {
      out.push(`card "${id}" has no trigger`);
      continue;
    }
    for (const t of trig) {
      if (!t.dream) out.push(`card "${id}": a trigger has no dream`);
      if (t.event !== undefined) {
        if (!called.has(id)) out.push(`card "${id}": event trigger "${t.event}" but no code calls showTutorial(…, '${id}')`);
      } else if (t.zone) {
        const rooms = roomsByDream[t.dream];
        const room = rooms && rooms.find((r) => r.id === t.zone.room);
        if (!room) out.push(`card "${id}": zone room ${t.dream}/${t.zone.room} does not exist`);
        else {
          const w = Math.max(...room.grid.map((g) => g.length));
          if ((t.zone.x0 !== undefined && (t.zone.x0 < 0 || t.zone.x0 >= w)) || (t.zone.x1 !== undefined && (t.zone.x1 < 0 || t.zone.x1 >= w))) out.push(`card "${id}": zone columns outside ${t.dream}/${t.zone.room} (width ${w})`);
        }
      } else out.push(`card "${id}": trigger is neither an event nor a zone`);
    }
  }
  for (const id of called) if (!cards[id]) out.push(`code shows card "${id}" which has no data`);
  return out;
}

// every room declares an objective: a string, or a list of entries
// [{ text, flag?, unless? }] where the last entry whose flag is set wins
export const OBJECTIVE_MAX = 64;
export function objectiveIssues(roomsByDream) {
  const out = [];
  for (const [dream, rooms] of Object.entries(roomsByDream)) {
    for (const room of rooms) {
      const o = room.objective;
      const list = typeof o === 'string' ? [{ text: o }] : Array.isArray(o) ? o.map((e) => (typeof e === 'string' ? { text: e } : e)) : null;
      if (!list || !list.length) {
        out.push(`${dream}/${room.id}: room has no objective`);
        continue;
      }
      if (list[0].flag) out.push(`${dream}/${room.id}: the first objective entry must be unconditional`);
      for (const e of list) {
        if (!e || !e.text) out.push(`${dream}/${room.id}: an objective entry has no text`);
        else if (e.text.length > OBJECTIVE_MAX) out.push(`${dream}/${room.id}: objective "${e.text}" is over ${OBJECTIVE_MAX} chars`);
      }
    }
  }
  return out;
}

// every requirement-bearing gate carries a hint naming what opens it
export const GATE_HINT_MAX = 40;
export function gateIssues(roomsByDream) {
  const out = [];
  for (const [dream, rooms] of Object.entries(roomsByDream)) {
    for (const room of rooms) {
      for (const o of room.objects || []) {
        if (o.type !== 'gate' || !(o.requires && o.requires.length)) continue;
        const where = `${dream}/${room.id} gate ${o.id}`;
        if (!o.hint) out.push(`${where}: no hint (what opens it?)`);
        else if (o.hint.length > GATE_HINT_MAX) out.push(`${where}: hint "${o.hint}" is over ${GATE_HINT_MAX} chars`);
      }
    }
  }
  return out;
}

// the first 2 minutes are harmless (F§5.9): no foe within 15 tiles of the
// spawn in a dream's first room
export function spawnSafetyIssues(roomsByDream, tiles = 15) {
  const out = [];
  for (const [dream, rooms] of Object.entries(roomsByDream)) {
    const room = rooms[0];
    const spawn = room && (room.objects || []).find((o) => o.type === 'spawn');
    if (!spawn) continue;
    for (const o of room.objects || []) if (o.type === 'foe' && Math.abs(o.x - spawn.x) < tiles) out.push(`${dream}/${room.id}: foe ${o.kind} ${Math.abs(o.x - spawn.x)} tiles from spawn`);
  }
  return out;
}

// a landmark belongs to one dream (the chef arrival once used the gambler's
// meridian_sign). Generic street furniture (a lamp post) may be shared.
export const GENERIC_LANDMARKS = new Set(['one_lamp']);
export function landmarkIssues(roomsByDream) {
  const owner = {};
  const out = [];
  for (const [dream, rooms] of Object.entries(roomsByDream)) {
    for (const room of rooms) {
      const l = room.bg && room.bg.landmark;
      if (!l || GENERIC_LANDMARKS.has(l)) continue;
      if (owner[l] && owner[l] !== dream) out.push(`${dream}/${room.id}: landmark "${l}" belongs to ${owner[l]}`);
      else owner[l] = dream;
    }
  }
  return out;
}

// Readability (round 2 WP5, critique §8). Static half of the rule; the
// runtime half is the `readability-<place>` scenarios (src/dev/readability.js).
//   text-min-size  screen-space text pinned to scale 1 (cap 7 or 9 on
//                  screen; the minimum there is 14), or a world text forced
//                  to small ×1 with `decor` missing
//   hud-slot       a screen-space bar a dream draws at HUD depth (149-151)
//                  instead of a HudGrid meter (hud.meter) or region
// A line opts out with `lint-allow readability: <reason>`.
const ALLOW_READ = /lint-allow readability:/;
export function readabilityIssues(src, file) {
  const out = [];
  const lines = src.split('\n');
  lines.forEach((l, i) => {
    if (ALLOW_READ.test(l) || ALLOW_READ.test(lines[i - 1] || '')) return;
    const at = `${file}:${i + 1}`;
    if (/uiText\(/.test(l) && /scale:\s*1\b/.test(l) && /setScrollFactor\(0\)/.test(l)) out.push(`${at}: text-min-size: screen text at scale 1 (cap < 14)`);
    if (/uiText\(/.test(l) && /size:\s*'small'/.test(l) && /scale:\s*1\b/.test(l) && !/decor:\s*true/.test(l) && !/setScrollFactor\(0\)/.test(l)) out.push(`${at}: text-min-size: world small ×1 (cap 7) without decor: true`);
    if (/add\.rectangle\(/.test(l) && /setScrollFactor\(0\)/.test(l) && /setDepth\(1(49|50|51)\)/.test(l)) out.push(`${at}: hud-slot: a HUD bar outside the HudGrid (use hud.meter / hud.region)`);
    // feedback 3 ("text written in notes and stuff is not very readable"):
    // information text is never tilted (a letter, a sign, a label); a
    // document Jo reads opens on the reading panel (src/ui/ReadingPanel.js)
    if (/uiText\(/.test(l) && /\.setAngle\((?!0\))/.test(l) && !/decor:\s*true/.test(l)) out.push(`${at}: text-tilted: information text set at an angle (keep it level, or read it on the reading panel)`);
    // words painted into a texture at small ×1 are cap 7, under the §8 world
    // minimum: paint them at scale 2, or mark them as decoration
    if (/paintGlyphs\(/.test(l) && /size:\s*'small'/.test(l) && !/scale:\s*[2-9]/.test(l) && /paintGlyphs\(ctx,\s*'[^']*[A-Za-z0-9][^']*[A-Za-z0-9]/.test(l)) out.push(`${at}: text-min-size: painted small ×1 (cap 7): paint at scale 2 or mark it decoration`);
  });
  return out;
}

// Identity (round 2 WP6, critique §9 "UI frame"). ui-frame-single: the one
// frame is drawn by src/ui/Panel.js (drawPanel / panel). A rounded-rect frame
// drawn anywhere else in the UI, the play services, the narrative or a scene
// is a second frame style. Painted art (src/art, entities) is not UI.
// A line opts out with `lint-allow frame: <reason>`.
const FRAME_SCOPE = /^src\/(ui|play|narrative|systems|scenes)\//;
const ALLOW_FRAME = /lint-allow frame:/;
export function frameIssues(src, file) {
  if (!FRAME_SCOPE.test(file) || file === 'src/ui/Panel.js') return [];
  const out = [];
  const lines = src.split('\n');
  lines.forEach((l, i) => {
    if (ALLOW_FRAME.test(l) || ALLOW_FRAME.test(lines[i - 1] || '')) return;
    if (/\.(fill|stroke)RoundedRect\(/.test(l)) out.push(`${file}:${i + 1}: ui-frame-single: a frame drawn outside src/ui/Panel.js (use panel / drawPanel)`);
  });
  return out;
}
