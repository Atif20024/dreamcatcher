// D2 — room validation. `npm run lint:rooms` (kept; lint-content.js runs the same checks plus more)
import { runRoomChecks } from './lib/rooms-check.js';

const { failures, warnings } = runRoomChecks();
console.log(`\n${failures} failures, ${warnings} warnings`);
process.exit(failures > 0 ? 1 : 0);
