# Station and THE LAST STOP: review round 1 (designer + pro gamer, read-only, not played)

Read: both earlier reviews, the round-2 report, `HubScene.js`, `hubState.js`, `EveningScene.js` (the cue, teach, postbox, ending paths), `bayProps.js`, `SaveStore.js`, 12 `station_*.jpg` shots. Everything below is from code and stills; nothing heard, nothing played. No `scale-hub` scenario file exists in the repo to check (grep finds none outside docs), so the sleeper flag is judged from `src/dev/scenarios/scale.js`.

## Verdict: no MUST. One SHOULD that a first-timer will see (the ghost houses). Not fully converged; one small round.

## Verified in code (each MUST/SHOULD from the deep review)

| Item | Result |
|---|---|
| M1 staged return | Real. `runReturn` (HubScene.js:1391) locks Jo, `returnAndDie` callback calls `stageReturn` (:1421). It dips to the hall under the dreamcatcher only when `weaveNext` is set (:1426), and `weaveNext` is set only when the returned dream is caught (:702). Nothing caught, or no train: `free()` / `controlLockUntil = 0` (:1415, :1426). Every path to `free()` is a timer or a dip callback, and the 2.5 s timer does not depend on the dreamcatcher existing, so Jo is not trapped. Pemberton's desk E-line still works (`deskReturn` is not consumed by the float, :1447 sets only `pemCall`). |
| M2 Evening way out | Real. Sit hint after 3 s still by a bench, horn hint after 25 s (EveningScene.js:986-987), both once per save and also on the pause footer (:2705). Gate: 6 places (cumulative across visits) or 2 helped (:999-1000), chime once, board flickers `STAY AWHILE` within 16 tiles (:1005). Station sit ends it only when `stationReady` (:1022). Reachable by a normal player: walking east from the arch gives arch, orchard, laundry, square, canal, steep = 6 places by col 247, so the rule is met on the ordinary walk. Walking west (arch, meadow, station) gives 3, correctly just a bench. |
| M3 prompts | Real, verbs shown (`[E] ASK`, `[E] LOOK` in stills). |
| M4 count scaling | Correct. `stretch()` (hubState.js:53) has first/last pinned and the middle shared: n=1 always row 1, last always last; at 10 dreams two adjacent counts share a line (n=1/2), no gap, no crash. `hubState` interpolates; fountain and skylights step on their row. Old saves: `caughtRunning` ignores dead ids, `SaveStore.js:46` merges `evening` defaults, so `evening.early/finished/posted/hints` read undefined = false. Seven then ten dreams: `allCaught` drops back to false when a dream is added, chains stay fallen (flag persisted, HubScene.js:436, :1806), sleeper returns, shop re-prices. Coherent. |
| All caught | Chains fall once, shop free (:1540), sleeper gone, objective `the last stop` (:1243). Postcard choice says "No more postcards" (:1625) while the shop still offers the item. Fine. |
| M5 flower | Gives the flower, sets `lastFlower`, drawn by `lapelFlower` (bayProps.js:175) as a 9 px pink and gold cross at chest height, and both scenes call the updater each frame (HubScene.js:1798, EveningScene.js:590). It does show in code. In the 960 px stills I cannot pick it out from the lantern glow (see SHOULD 2). |
| M6 shop hint | Bilal's first tea says it (:1382). Real. |
| S8 postbox | Takes the whole wallet only on a second press within 3 s, after showing the amount (EveningScene.js:1238-1257). Not accidental. |
| Bench gate / false lines | Pemberton `early` line only when N==1 and `early` (:1257). `pemEnd`/`pemPosted` once each. `Mind the gap.` is not duplicated. The `from the desk, down the hall` float is anchored to the camera, 1.2 s after control returns, and Jo is under the dreamcatcher 35 tiles from the desk, so it is true when it fires. |

## SHOULD

1. **Ghost row of houses over the western range at the mill** (`station_mill.jpg`: translucent apartment blocks across the mountains left of the mill, and the same wash over the left terrain gap). Every player who walks the road sees it; it reads as a render error, not as a place. The report calls it an owner note and did not pin it. Fix: find the horizon band that cross-fades the town layer over the range (Evening `Sky`/band setup near EveningScene.js:214-215, art in `src/art/eveningArt.js`) and clamp the town band's alpha to 0 past the station; or give it a solid fill so it is not see-through. I could not locate the exact line from here. One look at a lowered alpha value will find it.
2. **Lapel flower is invisible at play size** (`bayProps.js:176`, 9 px sprite, `station_flower_lapel.jpg`, `station_lapel_hall.jpg`). The reward for talking to the seller is not readable; Wren's "Nice flower" line will land on a player who cannot see it. Fix: draw 12 px with a green stem and a 1 px dark outline, or add a 2 px dark rim; keep the pink.
3. **Roof busker coins are pocket change** (`HubScene.js:1036-1037`, 15 coins at $1; `dreams.js:20`). The shots show Jo carrying $420 and a first shard costs 150, so $15 is not "worth going for". The real roof reward is the window, the pigeon and the heart shard, which are good, but a first-timer will take the coins as the bait and find them small. Fix: set the roof coin id to a dream with worth 5 (use `lay` with a coin of that dream, or double the count to 30) so the line sums to about $75, or drop the coins on the west half and keep only the two bench payoffs. Do not raise the shard.
4. **Undercroft case payout is uneven by design and now told** (`HubScene.js:1358`, $145 total). Worth the descent only once 4 or more dreams are caught; at N=1 it is $5 to $25. Acceptable; it matches the owner's "some pay, some don't". No fix; mention only so nobody tunes it blind.

## NICE

1. **Scale lint flags the sleeper at 54 px** because he lies down. `scale.js` already says lying frames are "listed, not judged" but `hub-sleeper` has no pose tag. Fix: add the key to the lying list in `src/dev/scenarios/scale.js` (or class `hub-sleeper` as lying); art is fine.
2. **Row of houses near the mill and 6 sheets on the line.** Sheets are fine at six, spaced and not overlapping (`station_laundry.jpg`, though they are large and tilted and one touches Jo's prompt). Leave.
3. **Postbox confirm text** (`EveningScene.js:1249`): `($421. all of it? [E])` sits on top of the `e · post what's in your coat` label (`station_postbox.jpg`); lift the confirm line 14 px.
4. **Return N for a non-catch return** (`HubScene.js:1258`): Pemberton repeats the last N line (`pembertonLine(N)`) after a return with nothing new caught. Use the plain `Back again.` when `weaveNext` is null.
5. **Stale float** `station_prompt.jpg` shows the "from the desk" float while Jo stands at the desk; only possible from a teleport, not from play, so ignore.
6. Pemberton's `visitLines.pemCall = true` at :1447 means he never calls out in person after a staged return; the desk E is still there. Fine.

## Rewards, judged

- **Roof east bench** (far window lights): good, small, earned by a ladder and a walk, hinted by the Kite Kid. Keep.
- **Clock tower** (arc of coins, bench, pigeon, shard): the best of the set. The coins are shown as the jump. Keep.
- **Roof coins**: see SHOULD 3.
- **Undercroft tags**: fine, see SHOULD 4.

## Converged?

No MUST. Not converged on strict reading because SHOULD 1 (ghost houses) and SHOULD 2 (flower unreadable) are visible to a first-time player on the main path. Neither can trap or mislead. Fix those two, skip SHOULD 3 if the owner likes the roof as a taste not a payday, and call it converged.

## Not checked

Sleeper's lying height measured in-engine; ghost-house line number; sounds; the Evening credits to the end; the coin arc's reachability on the tower jump (the report says it passed `hub-roof-drops`).
