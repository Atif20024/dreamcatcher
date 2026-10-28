#!/usr/bin/env node
// `npm run lint:scale [-- --json]`: every person, creature and kit prop at
// the §7 scale (1 m = 44 px). Fails on an out-of-range entity that is not a
// listed exception (src/data/scale.js SCALE_EXCEPTIONS).
import { register } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

register('./lib/stub-loader.js', import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { scaleIssues } = await import('./lib/scale-check.js');
const r = await scaleIssues(ROOT);
if (process.argv.includes('--json')) {
  console.log(JSON.stringify(r, null, 2));
} else {
  const n = (k) => r.measured.filter((m) => m.kind === k).length;
  console.log(`[lint:scale] measured ${n('person')} people, ${n('creature')} creatures, ${n('prop')} props`);
  for (const e of r.errors) console.log(`  ERROR ${e.kind} ${e.key}: ${e.h} px, ${e.cls} wants ${e.range.join('–')}${e.note ? ` (${e.note})` : ''}`);
  for (const e of r.exceptions) console.log(`  owned elsewhere: ${e.key}${e.h ? ` (${e.h} px)` : ''} — ${e.owner}`);
  console.log(r.errors.length ? `[lint:scale] ${r.errors.length} error(s)` : '[lint:scale] clean');
}
process.exit(r.errors.length ? 1 : 0);
