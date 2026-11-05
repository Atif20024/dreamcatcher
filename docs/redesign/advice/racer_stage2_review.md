# Racer stage 2: senior designer and pro gamer review

Read-only review of the walk-in places, cast, story beats, choices, TUNE and the shop. Races, side-on road, rivals are out of scope. Sources read: `RACER_STAGE2_REPORT.md`, `docs/dream_racer.md`, ROADMAP, everything in `src/dreams/racer/` outside `race/`, `engines/tune.js`, `engines/escapement.js`, `play/Encounters.js`, `narrative/DialogueRunner.js`, the nine room pictures. Nothing was run or heard. Where only a playtest can tell, it says so.

Line numbers are in `src/dreams/racer/` unless a path says otherwise.

## Verdict in one paragraph
The writing is the strongest part and mostly lands: the hospital scene is restrained and right in tone, the choices echo in dialogue within a scene or two, and the garage (TUNE, rack, Aldo's choice) is a real opening. The weak points are not tone but plumbing and weight: two permanent stuck states reachable by quitting at the wrong second, one continuity contradiction in the keystone scene, a TUNE with no assist, and a money system with nothing to spend on, so the sponsor and the jars have no pull. Pit stop and chalk are thin verbs.

## MUST

### M1. Two permanent stuck states if the player quits (Esc, quit to station, close tab) just after finishing a room
The verb saves the run before the beat that sets the flag the story needs.
- **Kitchen.** `verbs/places.js:134-139` sets `rent_*`, `med_short`, `tyres_short`, calls `saveRun()`, then plays `jars_settled`. `beats.js:23` runs the 5-line `jars_said` talk and only then `{ set: 'jars_done' }`. `places.js:128` disables the jars once `tinLeft` is 0. Quit during the talk and Continue: tin empty, jars dead, `jars_done` never set. Race 3 never hooks (`season.js:12` needs it), Ottavia never comes back to the bench (`rooms/garage.js:57`). Dead run.
- **Sable.** `places.js:176-187` `settlePapers` saves after the last paper (every `paper_done_i` true, so the papers are disabled at `:162`), then the `sable_signed` beat sets `signed` only after `sable_done` (`beats.js:24-29`). Same window, same result: race 4 never hooks.
- What the player experiences: after Continue the room looks finished, the objective says "drive", and the shutter just opens onto a road that counts for nothing. No hint why.
- **Fix:** set the flag in the verb before `saveRun()`: `F.jars_done = true` at `places.js:134`, and `F.signed = true` inside `settlePapers`. The beats keep playing the talk. (Also the same shape, harmless today: `chalked` at `places.js:206` and `pit_drilled`; only the objective text hangs.)
- Whether Esc is reachable during a talk is a playtest question, but the tab-close and "return to station" routes exist either way.

### M2. The corridor confession contradicts what the player saw in the garage
- `dialogue.js:50` (Aldo scene, before the Cup): Ottavia says "Your car is a hair flat tonight, Aldo. It will keep till the morning." Aldo: "Everything keeps till the morning."
- `dialogue.js:75` (hospital): "His engine was flat on Saturday. A hair. I heard it, and I thought: tomorrow. I'll tell him tomorrow." The choice "Why didn't you say?" (`:82`) then asks her why she stayed silent, when the player watched her say it.
- This is the emotional keystone, and the player (and Jo, who stood there silent) remember it. It reads as not thought through.
- **Fix (text only):** make it the thing she did say, too lightly. `flat`: "I told him. I said it was a hair flat, in the voice you use for weather. He said it would keep, and I let him." Then "Why didn't you say?" becomes "Why so quiet about it?" or "You did say." and her answers keep working ("He was tired. It was a hair. He has been kind to me."). This also gives Jo a share of the silence, which suits "nobody is a villain". Keep "Saturday" consistent with "tonight" (it was the night before the Cup).

### M3. TUNE has no assist, a tight window, and on touch no way out
- `engines/tune.js:9,20`: slot is 0.06 of half travel, rate 0.36 per s, so the "still" window is about 333 ms. The fumes freeze only when Jo enters it (`tunePresenter.js:69`), and the beat only falls from about 2.4 Hz to 0 in the last 0.4 s, so there is almost no lead-in. Reaction time (about 250 ms) leaves roughly 80 ms of margin, before any touch latency.
- Other verbs in this game follow a house rule that a poor hand cannot loop (`engines/escapement.js:5-11`: `assist`). TUNE has none.
- Touch has no `back` key (`input/touchLayout.js:75-81` has E, X, Q, JUMP, pause only), while `play/Encounters.js:64` leaves on `back`. A touch player who cannot hit the slot can only pause and restart. This is the first verb of the dream and the decision was that every dream plays by touch.
- What the player experiences: "I let go when it froze and it says Still beating", several times, with the dream's first verb.
- **Fix:** widen the slot after misses like the escapement does (e.g. slot 0.06 plus 0.03 per miss, up to 0.12), and slow the screw inside |jet| < 0.25 (a detent) so the freeze is anticipatable. Both are numbers in `tune.js`. The tests pin the engine, so change them with it.
- Playtest: the real feel of 333 ms on a laptop and on a phone. I cannot tell, but the margin on paper is thin.

## SHOULD

### S1. The hospital staging puts the action before the line that asks for it
- `places.js:49-57`: the prompt is "put the gloves on the chair" at col 9. Pressing it runs `corridor`, and Ottavia's line at `dialogue.js:88` is "Put them on the chair". Jo has already pressed the thing she asks for, and the gloves only appear after the whole talk.
- Ottavia sits at col 14 (`rooms/hospital.js:69`), 5 tiles behind the chair. Jo walks past her, says nothing (she has no talk until `gloves_left`, `:69`), then talks to her over his shoulder with camera focus `null`.
- What the player experiences: the biggest scene in the dream starts from a prompt about furniture.
- **Fix:** make Ottavia the trigger ("[E] give her the gloves"), run `corridor`, and make the chair the last, silent act ("[E] set them on the chair", the caption at `beats.js:20`). Same data, two interactions swapped. Use the `talk` camera.

### S2. Nuts have nothing to bite on, so the sponsor and the kitchen jars have no pull
- Faucet: 67 placed nuts (`RACER_STAGE2_REPORT.md`), plus the one-off prize of 12 (`race/tracks.js:35`, paid only for an improved best, `race/result.js:42`), plus Sable's 6 to 36 (`season.js:93-102`). Sink: soft 24 (at most 12 off) and chalk 16 (`season.js:51`). The garage (16) and quay (19) coins alone cover both before Sable. By the desk the player has nothing to buy.
- So signing every clause for 36 nuts has no upside, and striking them costs nothing that matters. The tyre jar's 2 nuts per coin (`season.js:52`) is worth 12 nuts the player does not need. Rent and medicine are pure flags.
- What the player experiences: the moral choices are real in text and weightless in play.
- **Fix:** give the money a place to go after Sable, tied to the design: a rain set for race 5 (30 to 36 nuts, from `season.js` PRICES, a `tyre_wet` flag read by `carTune`), and raise soft to about 32 and chalk to about 20. Then the advance buys the wet set, and "the bad clauses pay 10" is a temptation with a price. Check against the budget with the game-balancing skill after.

### S3. The tyre choice is a dominated pair, and can be dodged by shopping first
- `garage.js:120` and `dialogue.js:144-160`: the rack sells the soft set from the first minute. 35 nuts are reachable before Aldo's scene (`dialogue.js:36-52`), so a player who bought it first makes "give them to Aldo" free, and Aldo's "one new set in this building" untrue.
- Even without that, "keep" is strictly better in play (24 nuts and a free soft set, `dialogue.js:44`). "Give" earns only the corridor line (`dialogue.js:71-72`). Tullio's line after the Cup (`:57`) does not vary.
- **Fix:** (a) until `tyres_settled`, the rack says "That set is Aldo's. Ask him" (guard in `rackConversation`, `dialogue.js:144`). (b) vary `tullio_after` and `nino_after` by `kept_tyres` / `gave_tyres` (one line each: Tullio checks those tyres twice if Aldo gave them; stays quiet about them if Jo kept them). Both are text and a guard.

### S4. Sable's papers: the first clause is always the bad one, and the cost is invisible
- `season.js:70-89`: in all three papers `a` is the harmful clause and `b` a harmless, almost decorative one. Strike the first on each and you never lose. Only one of them needs reading.
- Of the flags, only `sable_orders` (an Ottavia line, `dialogue.js:120`) and `sable_cut` (a fifth of a prize that pays once, `garage.js:59`) show anything. `sable_lien` shows nothing.
- **Fix:** shuffle which slot is bad (per paper, in `PAPERS`), and make one `b` clause cost something real (the "Sable oil and no other" clause could set `oil_sable` so the HOT meter sits higher in the rebuild). Add one beat that echoes `sable_lien` (Tullio: "Sable has been asking about the debts"). Without S2 the money side stays dead.
- Papers cannot be read before talking to Sable (`places.js:162` needs `met_sable`), and with no prompt shown. Add a caption on the empty desk: "Mr Sable first." (NICE).

### S5. TUNE's miss line is wrong for half the misses
- `tunePresenter.js:95` always says "Still beating. Back the other way." `engines/tune.js:58` points the screw towards the note after any miss, so after an early release the next hold keeps going the same way. The line tells the player to do the opposite of what the screw does.
- **Fix:** pick by `st.jet`: you cannot tell overshoot from early release from state alone, so add `last: 'early' | 'past'` to the engine's state (one assignment in `release`), and say "Not yet. Keep turning." or "Past it. It will turn back."

### S6. Pit stop is the clockmaker's pendulum with four labels
- `dream.js:75-97`, `engines/escapement.js`: "Wheel! Wheel! Fuel! Flag!" are all the same press at the same pace, the calls are a caption that follows each hit, and the pendulum draws as a clock bob. Tullio says "Three seconds a miss" (`beats.js:44`), and nothing keeps time: `+3 s` is fiction. Ottavia "on her call" is not in the pit lane (`rooms/pitlane.js:42-43`: Tullio and Nino).
- What the player experiences: the same thing they did in the clockmaker's, wearing a different hat.
- **Fix (small):** make the four calls differ in rhythm, not key: wheel and wheel on the beat, fuel a held press (hold E for one swing), flag a quick double. Show a slate time (the clock engine already exists in the walk-in set) so "+3 s" is a number. If kept as is, remove "three seconds" from Tullio's line.
- `pitlane.js:42-43` reuses `tullio_tyre` ("the Roche boy covers his mirror...") and `nino_after` ("They have put his car under the sheet. I swept round it.", the sheet is in the garage). Write two pit-lane lines each (NICE until then, SHOULD before anyone plays the end).

### S7. TUNE pays nothing, and nothing shows she is in tune
- `RaceScene.js:101,144` (race file, noted only): untuned is a warning and one radio line. `garage.js:139` flips only a prompt after tuning. No idle change, no smoke, nothing on the Heron.
- A verb with no consequence is optional by feel, and the design (§4 A) wants the ear to matter. For the walk-in side: after `tuned`, the garage's idle loop should lose its beat (one more ambience key, `pv_garage_tuned`), and the Heron's exhaust puff steadies. For the rebuild: the untuned race engine should carry an audible, visible-in-the-tach beat, so skipping TUNE is something you can hear, not something you are told.
- Playtest: whether the sound sells it. Nobody has heard TUNE.

### S8. The gloves are never planted
- `rooms/garage.js:63`: the gloves exist only from `cup_told`. Aldo's cap and rag are his only things. The player never sees him wear or set them down, so "his gloves were on the bench" (`dialogue.js:60`) is information, not memory.
- **Fix:** put the gloves on the Heron's cowl or in Aldo's hand before the Cup (a prop, `live`, `unless: 'done_race2'`), with one line from `aldo_settled` ("Gloves, Tullio."). Cheap, and it makes the corridor hit harder. Aldo has three lines in the whole dream; one more here is cheap payoff.

### S9. The kitchen's jars cannot be undone and the last coin commits without a look
- `places.js:128-141`: 12 presses, nearest jar wins, no undo, and the 12th press ends the verb. On touch, with the jars 3 tiles apart, an errant last tap commits a different end. Jars also take unlimited coins (no cap at `wants`), so 12 in tyres is allowed (fine as a choice) but coins 7 to 12 in tyres do nothing (`season.js:52` floors at 12).
- **Fix:** let the last coin wait for a confirm ("[E] close the tin") and let a second press on a jar's label take one back before that. Cap the tyre jar at its `wants` or say so on the plate.
- What the player experiences today: a mis-tap on coin 12 becomes the ending's flag.

### S10. The quay is needed but empty
- Needed: yes. It carries "each door says what opens it" (a good device), hosts the roof and awning coin runs, and makes the doors a place. A menu would lose all three. The walk is about 100 tiles to the Gull road and 83 to the pit lane, and the last two stops are both at the far end.
- But no one lives on it (`rooms/quay.js`: no NPCs, one moment, one bark), and it does not change after the Cup, though the doors do. The design's "a world that goes on" is exactly what this street should show.
- **Fix:** 2 or 3 background people with a line each (cafe owner, a fisherman); after `done_race2`, the quay's talk changes (the black car, the money). Move the pit and Gull doors in to about 70 and 80 if the walk feels long in a playtest.

### S11. The chalk is three E presses
- `places.js:195-211`: walk the road, press E at three posts in order. The washout jump (`rooms/nightbefore.js:12`) is the only skill. The picture shows a night street of houses (`nightbefore.jpg`), not a corner: nothing tells you where the Bend turns.
- It teaches nothing the player can use unless the position matters. **Fix (still within the stage):** save where Jo stood (`mark_x`) and, in the rebuild, draw the player's own chalk at that spot; give a short rail of tolerance so standing early or late is a choice, and say "late" or "early" on the caption. If that is too much, at least make the three captions describe the Bend (a long right, a tight left) so it reads as geography.
- Chalk bought at the bench (`dialogue.js:164-179`) and the soft aid after 3 retries (`race/result.js:48`) also overlap; the 16 nuts buy what the game gives free after three tries. Decide which one it is when the races exist.

## NICE
- `dialogue.js:146` says the tyre jar "has paid ${jar*2}" even when the floor caps it (8 coins says 16, real discount 12). Use `PRICES.soft - price`.
- `rooms/quay.js:55` lockedLine "Ottavia is at the garage" is wrong between the Cup and the corridor (she is at the hospital). Say "Nobody home."
- `tunePresenter.js:69,78`: the fumes pulse alpha at the beat's Hz, up to 9 Hz, in a small panel. It is a smooth sine, not a hard flash, but cap the visual rate near 3 Hz if there is any photosensitivity concern.
- The garage shows the same instruction four times at the start: arrival plate (`rooms/garage.js:50`), objective, Ottavia's caption (`garage.js:130`), and `ottavia_first`. Drop the caption.
- `places.js:163-171`: `ctx.state.reading` is never cleared if the talk or panel throws. A `try/finally` closes it.
- `places.js:208`: the first two chalk captions are good; the third (apex) falls to the beat's line. Fine.
- Aldo, the heart of the tragedy, speaks in 3 short exchanges. Playtest whether the player misses him enough; if not, give him one quiet talk in the garage after race 1.

## What is fine
- **Hospital scene.** The tone is right: nobody shown hurt, the shut door, "He asked what the tide was doing", "Everybody saw something", the gloves "left out for the morning" echoing Aldo's "Everything keeps till the morning". Sister Agnese is a firm rule, not a villain. Once M2 and S1 are fixed it hits.
- **Choices echo fast.** The corridor choice returns at `dialogue.js:117-119`; tyres, jars, clauses and "whose car" each change a later line. `DialogueRunner` skips failed `if` nodes cleanly, so no empty line (checked `narrative/DialogueRunner.js:44-61`).
- **No double payment found.** `buy()` (`garage.js:73-82`) changes the flag, the count and the wallet together and saves at once. `payPrize` (`:54-69`) stamps `paid` in the same call as the coins. Sable's re-open guard (`places.js:164`) works as the report says.
- **Fail states are forgiving where they should be.** Hospital drop costs nothing, Agnese sends Jo to the foot; TUNE floods and resets; pit drill repeats.
- **Quay doors** show their own condition ("up to Sable Oil" or "by appointment"), a good way to show what is next.
- **Nothing in the walk-in side assumes lanes or the side-on road.** Dialogue, rooms and verbs reference none (grepped). What the rebuild must redo is in the race files: chalk drawn per lane (`RaceScene.js:185-189`), `SOFT_TYRES`/`gripMin`, the HOT meter. The purchases, flags and TUNE survive.
- **Touch.** Every verb is [E], a tappable choice, or a repeated [E]: papers, jars, chalk, chair, pit. The real-touch test covers TUNE hold. Only the missing `back` (M3) and the jar mis-tap risk (S9) need attention.
- **Cast and names** are clean of collisions, and the gaits suit the people (the report's table).
- **Contrast and budget** numbers are honest, including the 2.5 at the kitchen dresser.

## Only a playtest can tell
- TUNE: the 333 ms window with a real hand and a real touch; whether the fumes alone carry it with sound off; whether the two oscillators beat audibly at gain 0.05.
- The hospital: reading pace of the four-line exchange, and whether the iron stairs feel like a quiet climb or a platform test while Jo walks.
- The quay: whether the walks (about 100 tiles each way, ten times in a season) wear.
- The pictures show the corridor objective already reading the kitchen text on the landing, with no gloves on the chair. That may be the warp's flags, not a bug; check in a real run.
- The caption bar over Jo's feet (the report's own rough edge) in the kitchen and garage.
- Whether a washout fall in the Night Before costs a heart (the report says "back to the lamp" only).
