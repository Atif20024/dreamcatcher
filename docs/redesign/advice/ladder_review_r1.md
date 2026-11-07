# Ladder fix review, round 1

Reviewed (read-only, nothing run): round2/LADDER_REPORT.md, src/world/ladders.js, src/world/reach.js, tests/reach.test.js, the climb block in src/entities/Player.js (l.519-642), HubScene safety net (l.248-274), screenshots ladder_hub_after.jpg and ladder_chapel_down.jpg.

Verdict: converged. No MUST. One SHOULD that is a real trap candidate (Writer col 210).

## Designer

Root cause is genuinely fixed, at the right layer. The bug was a disagreement between two models of the same world: the Player climbs through the grate tile (HubScene sets `ladderLids`, all solids off while climbing), but `reach.js` saw a wall. The safety net trusted the model and "rescued" Jo from a place he had legitimately walked to. The fix teaches the model the hatch (`lid()` plus the down and up edges, reach.js l.33, 51-64) and leaves the net alone. That is correct: changing the net would have hidden the next model gap. The new tests fail on the old reach.js, which is what you want.

The roof-rib pop/re-grab loop was a second, real bug and the cap is a sound answer. Screenshot ladder_hub_after shows the result reads well: the ladder rails run to Jo's feet on the leads, and the grate has a sign and a prompt (HubScene l.591-594, 1560). Ladders lead somewhere legible: a visible hatch, a named destination.

Concerns:
- Two systems now encode "can Jo get through this tile": Player.js `downGrab`/`lidOver` and reach.js `lid()`. They agree today (one-tile solid, rung right under, `ladderLids`). Any future ladder under a lid in a dream scene (no `ladderLids`) is up-only from below and un-enterable from above, yet reach.js still models it as a hatch. The net would then believe a route exists. Nothing breaks today because no such ladder exists, but nothing enforces it.

## Gamer

Feel is good on paper. Step-out at the head snaps to the surface only once the feet are at or above it (Player l.610), so the pop is at most about 2.5 px: smooth. Pressing DOWN on a cap or plank and sinking straight into the ladder is what Prince of Persia, Flashback and Contra-likes teach; the 150 ms regrab lock after step-out and jump-off stops the old stutter. Jump-off with a direction held (0.85 jump, run speed) is generous and good.

Things I would poke at in play:
- Top shelf in the Writer library (col 210): see SHOULD 1. This is where a pro would find the next loop.
- Invisible caps: you cannot tell a cap-with-hatch from plain floor until you press DOWN. The grate has a prompt, the roof hatch has none. The rails are visible so veterans will guess, but a first-timer walking across the roof might not know there is a 17-row shaft to explore. Not a trap (the descent is a slow climb, not a fall), just an undiscovered route.
- Holding DOWN while walking over a cap drops you into the ladder (grab triggers on `crouch && downGrab`, Player l.548). Harmless but surprising on a roof walk.
- The grab window is wide (feet row, +1 and +2 with plank), so DOWN within about a tile of a ladder top can latch it. Feels forgiving; fine.

## Findings

### MUST
None.

### SHOULD

1. Writer col 210, top shelf, 22 px headroom. The report calls it "a level-design item", but Player l.592-618 will still try to step Jo out there. `body.reset` puts a roughly 76-82 px body under a ceiling with 22 px of room; the ceiling collider shoves him down, the plank is one-way from above only, so he falls back onto the ladder and, once the 150 ms lock ends, re-grabs. That is the same loop that was just fixed on the roof rib. I could not run it, so this is a prediction. Fix, either or both:
   - Player.js l.610: before stepping out, check headroom. If the cells over `surface` (body height) are `blocked`, do not step out; treat the head as a dead end and keep him climbing (stay on the top rung, up ignored). Needs a `solidAt` probe over the body height.
   - Level: raise the shelf or lower the ceiling in the Writer map around col 210, and add a headroom check to `lint:rooms` (every ladder head with a stand-out surface needs `body` clear rows above it, same constant as `REACH.body`). This also makes the "not a ladder fault" claim enforceable.
   Add the shelf to `writer-ladders-both-ways` once fixed (it says 7 of 9 are covered).

2. Keep reach.js and Player in step. Add one vitest that scans every scene grid that sets `ladderLids = false` (all dreams) for a one-tile solid directly over a rung, and fails if any exists; or make `reachGrid` take an `opts.lids` flag so dream callers turn `lid()` off. Files: src/world/reach.js l.33, src/entities/Player.js l.547, 602.

3. The Player climb logic has no CI coverage; the fix is protected by the dev scenarios (ladders.js, not in vitest) and by reach.test.js, which only covers the model. A regression in `downGrab` or the step-out would pass `npm test`. Fix: add a tiny headless Player-less test of the pure parts (`overLadder`, `openLadderTop` in src/world/ladders.js are already pure) and note in the scenario runner that ladder scenarios are part of the pre-merge set.

### NICE

4. Hatch affordance. Show a small down chevron or the existing floatText style ("down") when Jo stands on a cap or lid and a rung is under him; the grate already has `hatchPrompt` (HubScene l.1560), so generalise it to caps via `ladderCap` bodies. Helps the roof hatch and the dream open-topped ladders.
5. Accidental drops: on a cap, require DOWN freshly pressed (justDown) or held about 80 ms, instead of `crouch` level, so crossing a hatch with DOWN held does not latch. Player l.548.
6. Legacy GamblerScene still has the plank pin (one line: `ladderPass(this)` on its oneWays collider, `src/scenes/GamblerScene.js`). It is behind `LEGACY_GAMBLER`, so low priority, but it is a one-liner.
7. Writer col 141 (the broken cafe ladder) and the press ladder (col 555): add them to the scenario once their states are reachable, so all 9 are covered.

## Edge-case checks

- Safety net firing wrongly elsewhere: the net only acts in the Hub, needs `grounded && !climbing`, 500 ms off-home, or `p.y > UNDER + 2T`. Moving the undercroft into the home set removes the known false positive. Remaining risk is any other place where Player can reach but the model cannot; the pocket lint plus scenarios catch these only for ladders already modelled. The roof rib and grate are modelled; no other hub ladders were listed.
- Ladders in other dreams: `ladderPass` is attached only to the one-way colliders, not to solids, so a solid one-tile cover in a dream still stops a climber from below (he stays pinned climbing under it, DOWN releases him; no trap). Planks and caps pass. Consistent with the report.
- Safety net and Evening: Evening has `ladderLids` but no net in the files read; not checked.

## Converged?

Yes, for this round: no MUST. Do SHOULD 1 before the Writer pass or the library shelf may reproduce the roof loop; SHOULD 2-3 are cheap guards against the two-model drift that caused this bug in the first place.
