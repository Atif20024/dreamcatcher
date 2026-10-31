// Content validation (plan §2.16). `npm run lint:content [-- --json]`
// Absorbs lint-rooms.js (every check kept) and adds report-only checks:
//   - tutorial cards no code ever triggers (dead cards)
//   - Phaser default text (add.text( / make.text( / monospace / canvas
//     fillText): FAILS the run (phase 1.2: every use is the bitmap helper)
//   - checkpoints: id + readable label on every flag (FAILS the run)
//   - readability (round 2 §8): text-min-size, hud-slot (FAILS the run)
// Phase 1.4 (all FAIL the run): tutorial cards are data (src/data/teach.js)
// and each needs a trigger that can fire; every room has an objective;
// every gate a hint; no foe near a dream's spawn; landmarks stay in their dream.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { register } from 'node:module';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runRoomChecks, DREAMS as ROOMS_BY_DREAM } from './lib/rooms-check.js';
import { countDefaultText, readabilityIssues, checkpointIssues, teachIssues, objectiveIssues, gateIssues, spawnSafetyIssues, landmarkIssues, frameIssues } from './lib/content-checks.js';
import { CARDS } from '../src/data/teach.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// framework dreams import the painters, which import phaser: stub it (as the atlas build does)
register('./lib/stub-loader.js', import.meta.url);
const { FRAMEWORK_DREAMS } = await import('../src/dreams/index.js');
const { dreamIssues } = await import('./lib/dream-checks.js');
const { SHARED_MATERIALS, SHARED_DECOR_RULES } = await import('../src/world/MaterialLibrary.js');
const { PROP_IDS } = await import('../src/art/props.js');
const SRC = join(ROOT, 'src');
const json = process.argv.includes('--json');

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}

const log = json ? () => {} : console.log;
const realLog = console.log;
if (json) console.log = () => {};

// 1. geometry / placement (existing lint-rooms checks)
const rooms = runRoomChecks();

// 2. tutorial cards: every card has a trigger that can fire
const files = walk(SRC);
const dataPath = join(SRC, 'data', 'teach.js');
const others = files.filter((f) => f !== dataPath).map((f) => readFileSync(f, 'utf8'));
const allIds = Object.keys(CARDS);
const teach = teachIssues(CARDS, others, ROOMS_BY_DREAM);

// 3. default text: an error now (src/ui/text.js uiText is the only way)
const debt = [];
for (const f of files) {
  const c = countDefaultText(readFileSync(f, 'utf8'));
  if (c.addText || c.mono || c.canvas) debt.push({ file: relative(ROOT, f), ...c });
}
debt.sort((a, b) => b.addText - a.addText);
const totals = debt.reduce((t, d) => ({ addText: t.addText + d.addText, mono: t.mono + d.mono, canvas: t.canvas + d.canvas }), { addText: 0, mono: 0, canvas: 0 });

// 3b. readability (round 2 §8): text-min-size, hud-slot (fail-level)
const readability = [];
for (const f of files) {
  const rel = relative(ROOT, f);
  if (rel.startsWith('src/dev/') || rel.startsWith('src/ui/')) continue;
  readability.push(...readabilityIssues(readFileSync(f, 'utf8'), rel));
}
// 3c. identity (round 2 WP6 §9): ui-frame-single, panels only via Panel.js (fail-level)
const frames = [];
for (const f of files) frames.push(...frameIssues(readFileSync(f, 'utf8'), relative(ROOT, f)));

// 4. checkpoints: labelled, unique ids (fail-level)
const cps = checkpointIssues(ROOMS_BY_DREAM);

// 5. objectives, gate hints, spawn safety, landmarks (fail-level)
const objectives = objectiveIssues(ROOMS_BY_DREAM);
const gates = gateIssues(ROOMS_BY_DREAM);
const spawn = spawnSafetyIssues(ROOMS_BY_DREAM);
const landmarks = landmarkIssues(ROOMS_BY_DREAM);
// 6. framework dreams (phase 3): graph, reachability, headroom, refs, perf
const sharedProps = Object.fromEntries(PROP_IDS.map((k) => [k, { id: k }]));
const framework = [];
for (const def of Object.values(FRAMEWORK_DREAMS)) framework.push(...dreamIssues(def, { materials: SHARED_MATERIALS, props: sharedProps, decorRules: SHARED_DECOR_RULES }));
const content = [...teach, ...objectives, ...gates, ...spawn, ...landmarks, ...framework, ...readability, ...frames];

console.log = realLog;
const report = {
  rooms: { failures: rooms.failures, warnings: rooms.warnings },
  tutorials: { total: allIds.length, failures: teach },
  objectives: { failures: objectives },
  gates: { failures: gates },
  spawn: { failures: spawn },
  landmarks: { failures: landmarks },
  defaultText: { files: debt.length, ...totals, perFile: debt },
  readability: { failures: readability },
  identity: { failures: frames },
  checkpoints: { failures: cps },
  framework: { dreams: Object.keys(FRAMEWORK_DREAMS), failures: framework },
};

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  log(`\n--- tutorials: ${allIds.length} cards, ${teach.length} failures ---`);
  for (const t of teach) log(`  ✗ ${t}`);
  log(`\n--- objectives: ${objectives.length} failures; gate hints: ${gates.length}; spawn safety: ${spawn.length}; landmarks: ${landmarks.length} ---`);
  for (const t of [...objectives, ...gates, ...spawn, ...landmarks]) log(`  ✗ ${t}`);
  log(`\n--- default text (error): ${totals.addText} add.text( calls, ${totals.mono} monospace mentions, ${totals.canvas} canvas text calls in ${debt.length} files ---`);
  for (const d of debt) log(`  ✗ ${d.file}: add.text x${d.addText}, monospace x${d.mono}, canvas text x${d.canvas}`);
  log(`\n--- readability (text-min-size, hud-slot): ${readability.length} failures ---`);
  for (const r of readability) log(`  ✗ ${r}`);
  log(`\n--- identity (ui-frame-single): ${frames.length} failures ---`);
  for (const r of frames) log(`  ✗ ${r}`);
  log(`\n--- checkpoints: ${cps.length} failures ---`);
  for (const c of cps) log(`  ✗ ${c}`);
  log(`\n--- framework dreams (${Object.keys(FRAMEWORK_DREAMS).join(', ')}): ${framework.length} failures ---`);
  for (const f of framework) log(`  ✗ ${f}`);
  log(`\nrooms: ${rooms.failures} failures, ${rooms.warnings} warnings; default text: ${debt.length} files; content failures: ${content.length}`);
}
// round 2 WP2: the scale lint (also `npm run lint:scale`)
const { scaleIssues } = await import('./lib/scale-check.js');
const scale = await scaleIssues(ROOT);
log(`\n--- scale (§7, 1 m = 44 px): ${scale.measured.length} measured, ${scale.errors.length} failures, ${scale.exceptions.length} owned elsewhere ---`);
for (const e of scale.errors) log(`  ✗ ${e.kind} ${e.key}: ${e.h} px, ${e.cls} wants ${e.range.join('–')}`);
// every check above fails the run
process.exit(rooms.failures > 0 || cps.length > 0 || debt.length > 0 || content.length > 0 || scale.errors.length > 0 ? 1 : 0);
