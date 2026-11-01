// Scenarios run in the browser (they need Phaser + a canvas). See docs/redesign/HARNESS.md.
console.log(`Scenarios run in the dev page through the harness (no headless runner yet):

  1. npm run dev
  2. open http://localhost:5173/dreamcatcher/?scenarios=1   (results land in window.__dcResults and the console as [dc:scenarios])
     or, in any dev page console:  await __dc.runScenarios()   // returns pass/fail JSON
     one scenario:                 await __dc.runScenarios('bet-card-hidden')

Pre-merge set for anything touching ladders, the climb or Player.js (the climb has
only its pure parts under vitest: tests/ladders.test.js, tests/reach.test.js):
  hub-ladder-undercroft, hub-ladder-roof, dream-ladders-both-ways, writer-ladders-both-ways

Known-failing today (Phase 0 milestone): background-snap, eva-tether-trap, bet-card-hidden.`);
