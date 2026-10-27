// Content validation (plan §2.16). `npm run lint:content [-- --json]`
// Absorbs lint-rooms.js (every check kept) and adds report-only checks:
//   - tutorial cards no code ever triggers (dead cards)
//   - Phaser default text debt (add.text( / monospace) per file
// New checks are warn-level: they print but do not fail the run yet.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runRoomChecks } from './lib/rooms-check.js';
import { deadCards, countDefaultText, parseCardIds } from './lib/content-checks.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
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

// 2. dead tutorial cards
const files = walk(SRC);
const tutorialPath = join(SRC, 'systems', 'tutorial.js');
const tutorialSrc = readFileSync(tutorialPath, 'utf8');
const others = files.filter((f) => f !== tutorialPath).map((f) => readFileSync(f, 'utf8'));
const allIds = parseCardIds(tutorialSrc);
const dead = deadCards(tutorialSrc, others);

// 3. default-text debt
const debt = [];
for (const f of files) {
  const c = countDefaultText(readFileSync(f, 'utf8'));
  if (c.addText || c.mono) debt.push({ file: relative(ROOT, f), ...c });
}
debt.sort((a, b) => b.addText - a.addText);
const totals = debt.reduce((t, d) => ({ addText: t.addText + d.addText, mono: t.mono + d.mono }), { addText: 0, mono: 0 });

console.log = realLog;
const report = {
  rooms: { failures: rooms.failures, warnings: rooms.warnings },
  tutorials: { total: allIds.length, dead },
  defaultText: { files: debt.length, ...totals, perFile: debt },
};

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  log(`\n--- tutorials: ${allIds.length} cards, ${dead.length} never triggered (warn) ---`);
  for (const id of dead) log(`  ! card "${id}" is defined but no code triggers it`);
  log(`\n--- default text debt (warn): ${totals.addText} add.text( calls, ${totals.mono} monospace mentions in ${debt.length} files ---`);
  for (const d of debt) log(`  ! ${d.file}: add.text x${d.addText}, monospace x${d.mono}`);
  log(`\nrooms: ${rooms.failures} failures, ${rooms.warnings} warnings; content warnings: ${dead.length + debt.length}`);
}
// only the room checks can fail the run today
process.exit(rooms.failures > 0 ? 1 : 0);
