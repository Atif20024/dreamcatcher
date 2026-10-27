# Dreamcatcher: final critique (for the redesign)

Status: FINAL. Built on `01_gamer_critique.md`, with every claim re-checked in code and, where it was cheap, in the running game (dev server, stepped `game.step` harness, synthetic keys, hidden pane).

**What this review covered beyond the gamer's run:** Astronaut pad, station (zero-g push-off), EVA (tether) and crater, played live. Writer rewrite, agent and city warps. A full Gambler bet (pit, roulette, 1 chip, lost). Painter studio: brush on a wall, the stroke ribbon, the underpainting reveal. Evening square and ridge. The background-snap measured frame by frame. The ending code of all six dreams. Save, death, respawn, tutorial and gate systems read end to end.

**What it did not cover:** I did not play any dream to its end; endings were judged from code. I heard no audio, and I did not play Chef or Musician past what the gamer covered.

---

## 1. Verdict

Dreamcatcher has a real idea and real writing, but it is not yet a finished game. The idea is a station of trains into lives Jo could have had, each of which costs him something, and a last evening that gives it all back. The gamer is right about the headline: the stage Jo stands on is a placeholder, and the backdrops behind it are better made. The gamer misread the cause, though. This is not mainly an art-skill problem. **It is a scope problem.**

`docs/DESIGN.md` §4 asks for dream levels "~2–3 minutes long… 5 levels ≈ 1 engine + 5 data files", "keep it simple". What exists is six dreams of 320–700 tiles each, specced at 15–22 minutes. Each one is a 1,000–2,000-line scene with its own verbs: there are 43 tutorial cards, a rhythm engine, a typing engine, six card games, zero-g, a paint palette and a word inventory. Width won out over finish. Each dream gets **one** ground material, tinted per room (`src/data/gambler/tiles.js:1-3`: "the carpet pass is the same tile everywhere"). The painterly roll-out planned in `docs/design_feedback.md` ("when the look is settled on THE LONG EVENING it gets rolled out to the hub and the three dreams") never happened for the dreams. Nothing is broken. Everything is half-built.

The gamer's biggest gap is the **failure-and-save loop**, which is worse than it reported:
- **Every hit teleports Jo back to the last flag** (`BaseLevel.js:444`, `PainterScene.js:350`). A rat bite costs up to a whole stretch between flags. That is why the flags feel random: they set how much you lose, and you are never told so.
- **Game over always restarts the whole dream**, flags or no flags (`BaseLevel.js:277,439` → `scene.restart()`, and `create` resets `checkpoint = spawn`). The gamer thought this happened only when no flag had been touched. DESIGN.md promised "failure costs the attempt, never overall progress". Inside a 20-minute dream it costs everything.
- **Nothing inside a dream is saved.** The save holds only dreams caught, wallet, moments and the cards already seen (`src/utils/save.js:3-26`). Close the tab at minute 18 and the dream starts over.
- **13 of the 43 tutorial cards never fire.** One of them is the EVA tether. In the EVA, the first push-off without the tether is an instant, untaught death: reproduced, "no tether. Earth does not get closer.", lose a heart.

So the owner's three complaints share causes:
- **"Detailing not up to mark"**: one material per dream, toy scale, system monospace text.
- **"Background changes all of a sudden"**: the backdrop swap is keyed to Jo's x, and the horizon snaps (measured: a 256 px jump in one frame, in mid-screen).
- **"Saving flags at random places, what to do is unclear"**: flags are unlabelled respawn points that also set what each hit costs, gates never say what they need, and objectives vary in quality.

**Recommendation:** shrink before you polish. Five places (hub, three or four dreams, finale), each 6–10 minutes, built enclosed room by enclosed room, with authored character atlases, a bitmap font, a real save, and one failure model.

## 2. Final ranked problems

Status key: C = confirmed in code or game; N = new (not in the gamer's critique); Cx = the gamer's claim, corrected.

| # | Problem | Evidence | Status |
|---|---|---|---|
| 1 | **Scope far beyond the design and the team.** Seven playable places, 15–22 min specs, 43 cards; the design asked for 2–3 min levels on one engine. Polish is spread thin by construction. | DESIGN.md §4 vs dream specs; scene sizes 1,045–2,678 lines; map widths: chef 320, musician 400, astronaut 522, gambler 520, writer 640, painter 700, evening 788 tiles | N |
| 2 | **The failure loop punishes and confuses.** A hit sends Jo to the last flag; game over restarts the whole dream; nothing in a dream persists; the death card offers "Choose another dream" and replays the auto-dialogue. | `BaseLevel.js:415-455`, `:266-279`; `save.js` | C + N (sharper than the gamer's version) |
| 3 | **Ground and stage are a single tinted material per dream.** No lips, props, room-specific floors or enclosures, so 40–60% of the screen reads as a placeholder. | `data/*/tiles.js` (`material: 'carpet' / 'board' / 'stroke'`); screenshots of painter studio, writer city, evening ridge | C (cause added) |
| 4 | **Backdrop swap at Jo's x, mid-screen, with a vertical snap.** Repro: `?gm=floor`, walk left. At x=1280 (camera scrollX 827, so the boundary sits at screen x≈453), `parallax.current` flips and every layer's y jumps 832→1088 in one frame while alpha begins a 550 ms fade. Vista rooms also fire a camera zoom on the same frame. | `BaseLevel.js:468-482`, `parallax.js:1067-1132`, `RoomBuilder.roomAt` | C |
| 5 | **Checkpoints and gates don't explain themselves.** The flag is a pale pennant with no text (`activateCheckpoint` = texture swap + sting). Gates are visible (chains plus a 5 px red light), not invisible as the gamer wrote, but they never say what opens them. Flag density is unrelated to difficulty (chef 7, gambler 11, musician 12, writer 15, astronaut 15, painter 19). | `BaseLevel.js:457-465`, `entities/Gate.js` | Cx |
| 6 | **Teaching is broken.** 13 cards are dead (`wall_jump, sound_bridge, call_response, rest_note, eva_tether, ledge_grab, hang_drop, careful_step, distract, plate_gate, loose_tile, slope, zero_g_rail`). The cards are seen-once per save, so a mechanic taught in one dream is never retaught in another. Long hints overflow the fixed 380 px card (seen on THE STROKE). The BET card renders *under* the stake selector (depth 240 vs 300), so it is never seen. | `systems/tutorial.js`; grep of `showTutorial(`; reproduced in `?gm=pit` and `?pt=studio` | C + N |
| 7 | **Scale and camera.** Jo is ~44 px tall in a 540 px view; trains, doors and people are toy-sized; there is no close-up camera for talk; the HUD is not on its own camera, so it shrinks and drifts at vista zoom 0.8 (and at the hub's 0.62). | `BaseLevel.js:58-62`, no `cameras.add` anywhere | C |
| 8 | **Text is system monospace at 7–14 px, with no font system.** There are 198 `fontFamily: 'monospace'` uses and 0 bitmap fonts, against the project's own ui-type skill. The left HUD stacks 5–6 lines in Writer and Gambler, and the hint strip never leaves. | grep | C (count corrected from 194) |
| 9 | **Characters are runtime pixel grids with a thin move set.** Jo has walk ×8, stand, idle-b, one run, one jump, one fall, plus Evening-only sit/sleep/lookup/laugh/shrug. There is no land, turn, hurt, climb, carry, float or play pose. The zero-g float uses `jo-run`. `public/atlas/jo.png`, `hub.png` and `foes.png` exist but **nothing loads them**. The only PNG override hook (`art/overrides.js`) is wired into the Evening alone, with an empty manifest. | `entities/jo.js:118-181`; grep `load.atlas` = 0 | Cx (the gamer said the atlas pipeline was "in place") |
| 10 | **Minigames are modal menus pasted over the platformer.** Roulette is a seeded RNG menu with no skill (`gamblerPuzzles.js:922-975`). The gig is a dots box at the top of the screen. The modals stack on top of each other without a queue (BET under stake, death card over tutorial card). | reproduced bet at `?gm=pit` | C |
| 11 | **Every dream ends on the same text card:** "X. / Was it enough? / You noticed a little." The thesis repeats six times in the same template. | Chef:732, Musician:1158, Astronaut:1373, Writer:1108, Painter:947, Gambler:1475 | C (sharper) |
| 12 | **Onboarding and structure promised in the design are missing:** no title/continue screen, no tutorial street. The hub offers "the last stop" on the very first visit (objective "board any train — or the last stop" with 0 dreams caught), so a new player can open the finale first. | DESIGN.md §2.1–2.3; `HubScene.js:142` | N |
| 13 | **The Painter borrows real people by name.** Roulin, Madame Ginoux and Dr Rey are the real names of Van Gogh's postman, café owner and doctor; Isak = Theo; Paul = Gauguin; the Yellow House, the café at night, the asylum garden, the one sale. The spec itself says "we borrow the way of seeing, not any specific picture". | `docs/dream_painter_the_yellow_house.md` §2; `data/painter/cast.js` | C (stronger than the gamer said) |
| 14 | **Audio is thin outside the Evening.** Every dream defines an `ambientLoop` ('sizzle', 'slots', 'typewriter'…) and **no code reads it**; only the Evening has a soundscape. There are no surface footsteps. | grep `ambientLoop`, `soundscape` | C (sharper) |
| 15 | **Smaller defects:** the astronaut survival-forest night overlay (`AstronautScene.js:776`, depth 88, α 0.7, 832 px wide, full height) is never removed, and its hard edge shows from the pad. The Chef arrival uses the Gambler's `meridian_sign` landmark (`data/chef/rooms.js:16`). The Chef HUD says "DREAM 03" on platform 1 (`ChefScene.js:62`). The Writer train has the `palette` emblem (`dreams.js`). The Painter has no hearts (hits spill paint) while the others do. The Evening holds ~14,000 display objects. | as cited | N / C |

## 3. Validation of the gamer's claims

Totals: **43 claims checked: 26 CONFIRMED, 10 CORRECTED, 5 REJECTED, 2 UNVERIFIED-PLAUSIBLE** (plus 6 minor unverified visual notes listed at the end).

| # | Claim | Status | Evidence / correction |
|---|---|---|---|
| T1 | Ground is a flat slab in every dream | CONFIRMED | One `material` per dream, tinted per room. The hub and Evening do have painted limestone courses, but at this scale they still read flat. |
| T2 | Background swaps all at once at a room boundary | CONFIRMED | Measured, see §2 #4. Its sub-points (x-triggered, full-viewport tileSprites, horizon snap, per-room scenery rebuild, sky swap) are all correct. |
| T2a | "No hysteresis: flips each frame on the boundary" | CORRECTED | `roomAt` uses one threshold, so it flips only when x actually oscillates across it (turning on the line, landing jitter). The tween restarts each time. Real, but rarer than stated. |
| T3 | Goals and saves unclear | CONFIRMED | Core claim true. See the sub-items below for the parts that were wrong. |
| T3a | Gates are invisible walls on invisible flags | CORRECTED | `Gate.js` draws a tinted tile column, two chain bars and a red light that turns green with a level-wide clank. They are visible, but they look like wall and never name their requirement. |
| T3b | Death restarts the dream "if no flag was touched" | CORRECTED | It restarts the whole dream on every game over, regardless of flags (`scene.restart`). Also, each single hit respawns at the last flag. |
| T4 | Everything too small | CONFIRMED | Jo ~44/540 px; no talk camera. |
| T5 | All text is default monospace, HUD clutter | CONFIRMED | 198 uses (not 194); sizes 7–14 px dominate. |
| T6 | Procedural characters with a thin animation set | CONFIRMED | Jo's list is accurate, though the Evening adds sit/sleep/lookup/laugh/shrug. |
| T6a | "A PNG atlas pipeline is already in place" | CORRECTED | The atlases exist in `public/atlas/` but are never loaded. Only `overrides.js` exists, and only for the Evening. |
| T7 | Mechanics taught by tiny cards, then forgotten | CONFIRMED | Worse: 13 dead cards, cards shown once per save, text overflow, BET card hidden. |
| T8 | Rooms are not rooms | CONFIRMED | True for chef, musician, writer, painter and gambler interiors. The astronaut station modules are enclosed (walls and ceiling seen at `?at=station`). |
| T9 | Level order/tone not controlled; darkening not monotonic | CORRECTED | Darkening is already by count: a screen overlay at 0.09 × dreams caught (`BaseLevel.js:70-75`), with +1 max heart per dream caught. What is not controlled is each dream's own palette and harshness. "DREAM 03" and the harsh chef opening are confirmed. |
| T10 | Painter and Gambler are pastiche and heavy; cut one | CORRECTED | The Painter is a near-biography (confirmed, stronger). The Gambler is not a pastiche of anyone: it is the dream that takes Jo's trumpet, which ties into his own story. Both are long. See §7 for the recommendation. |
| B1 | Chef chimney has no climbable tiles | CONFIRMED | `chefMap.js:39-42`: zero `'|'` tiles. The walls are 5 and 7 tiles (160/224 px), not 6/8. The jump is 150 px (600²/2·1200). Only the dumpster→col 39→col 41 staircase works. The `wall_jump` card is triggered nowhere in the whole game. |
| B2 | Chef death card over a stale tutorial card | UNVERIFIED-PLAUSIBLE | Not reproduced. The cause is real: independent modals at depths 240/250 with no queue. The same class of bug was reproduced in the Gambler. |
| B3 | Chef/astronaut HUD not zoom-compensated | CONFIRMED | No UI camera. |
| B4 | Hub title card over the board and bunting | UNVERIFIED-PLAUSIBLE | First-visit only; the save in use was not fresh. |
| B5 | Astronaut dark foreground blocks over gameplay | CONFIRMED | Cause found: the survival-forest `darkZone` rectangle (`AstronautScene.js:776`) persists for the whole dream. Its edge shows from the pad. At the station, the dark left half is open space, which is correct. |
| B6 | Astronaut "zero-g" is on a floor; nothing floats | REJECTED | Aim up + Space: y 893 → 770 in 36 frames, no gravity (`zeroUpdate`). A horizontal shove slides along the floor, which is what the gamer tried. The real issue is presentation: Jo uses the `jo-run` pose, does not rotate, and the corridor has a floor. |
| B7 | Writer attic left half dark/empty | CONFIRMED (class) | A similar seam was seen at `?wr=rewrite`: two backdrops, one beside the other, at x≈200. |
| B8 | Painter house interior is a black rectangle | CORRECTED | That is the designed *underpainting* state. Pressing E on "paint the front wall — yellow" turns it into a painted yellow house with a red roof (reproduced). The unpainted state reads as a bug and needs to look like a sketch. |
| B9 | Gambler carpet floor outdoors | CONFIRMED | `gambler/tiles.js:1-3`: one carpet everywhere by design. |
| B10 | "[dev] warped" captions ship | CORRECTED | They appear only with a `?at=`/`?ev=` dev URL. Strip them for release; this is not a player-facing bug. |
| H1 | Hub objective shows the raw id `board_any_train` | REJECTED | No such string in `src/`. The objective reads "board any train" / "board any train — or the last stop" (`HubScene.js:142,816`). |
| H2 | Pemberton dialogue fires on proximity and freezes Jo | CONFIRMED | `HubScene.js:1148-1151`. |
| H3 | 4,800 px hall with nothing to do | CONFIRMED | World bounds 4,800. |
| C1 | Two rats in the first seconds | CONFIRMED | `chef/rooms.js:20-21`, cols 12 and 15, spawn ~col 3. |
| C2 | Chef objective stale from the alley to the roof | REJECTED | 13 `setObjective` calls cover the vault, ticket rail, dumbwaiter, RUSH, waves and roof (`ChefScene.js:101-666`). The gamer teleported past the flag events that drive them. Only "find saffron" in the alley is early. |
| C3 | Retry replays the opening dialogue | CONFIRMED | `scene.restart`. |
| C4 | "You're the new stage?" is jargon | CONFIRMED | `chefMap.js:136`. |
| M1 | Musician objective stays "get to The Blue Cellar" while at the corner | CONFIRMED | Set at `:136`, next change at the gig `:275`. |
| M2 | Every gig is the same four-dot Simon | CORRECTED | The engine varies: rests, `invertRests` (studio: fill every bar), `hideIcons` (blind recovery), a HOLD note (`rhythm.js`). The *presentation* is identical, which is why it feels the same. |
| A1 | EVA art is thin; tether invisible | CONFIRMED | Plus N: the tether card never fires, and the first push without the tether is death. |
| A2 | Station HUD overload | CONFIRMED | Hearts, title, O2, PWR, objective, coins, satchel, hint strip. |
| A3 | Crater has no ground read | CONFIRMED | Grey blocks in black (`?at=crater`). |
| W1 | E at the typewriter gives no response | CORRECTED | It floats "the typewriter is jammed." (`WriterScene.js:699`). The fix the gamer proposed (strike "jammed"→"working" as the tutorial) *is* the current design: the "working" word lies on a coffee tin at col 33 and picking it up fires THE PEN. The beat is there; it is just too small to notice. |
| W2 | "[working] [light] [honest]…" is a debug-looking list; remove it | REJECTED | It is the pen's word inventory, the core mechanic. It has a cap that silently drops the oldest word (`WriterScene.js:305-309`). Redesign the presentation (word tiles); don't remove it. |
| E1 | The Evening still shows hearts, coins, title and objective | REJECTED | Deliberate "HUD ritual": each element fades out one by one in the first ~6 s (`EveningScene.js:449-472`). The gamer saw it mid-fade. |
| E2 | Evening people in a row, same size, no depth | CONFIRMED | Seen at `?ev=square`. |
| X1 | Checkpoint density arbitrary (7/12/15/15/19/11) | CONFIRMED | Exact counts. |
| X2 | Audio: no per-room ambience | CONFIRMED | `ambientLoop` is unused. |
| X3 | No tutorial street, no title screen | CONFIRMED | DESIGN.md §2.1–2.2 is not built; `main.js` comment: "never on a menu". |

Minor visual notes left unverified (low value): the hub haze band, the musician's triple "THE BIG STAGE" text, the musician sky seam at x≈345, the Writer press clock overlapping the objective, the Painter cypress objective clipped, and the Gambler objective's contrast. All are plausible given 7–14 px monospace and no layout system. Fix them with the HUD rebuild rather than one by one.

## 4. Per level

### 4.1 Crossroads Station (hub)
**Assessment:** the best-lit place in the game, but its time is spent on walking. It never teaches anything, and it opens the finale too early.
**Bugs:** Pemberton's proximity dialogue grabs control (`HubScene.js:1148`). The finale is offered with 0 dreams caught (`:142`). The Writer train has the wrong emblem (`dreams.js` writer `emblem: 'palette'`). The HUD shrinks at zoom 0.62.
- REMOVE: half the hall length (4,800 → ~2,400 px); the sign soup; the finale on the first visit.
- CHANGE: trains at real scale, with a boarding animation (doors, platform slides away); one big identity prop per platform; the hall as a single readable map (board → platforms).
- ADD: a title/continue screen; a 60–90 s tutorial street ending at the steps (DESIGN.md §2.2); a visible trophy per caught dream; an explicit lock on the last stop (e.g. after 3 dreams), or a conductor who asks "Are you sure?" the first time.
- KEEP: the architecture and lamps, the split-flap board, the conductor's questions, NOT IN SERVICE tags, the station quieting as dreams are caught.

### 4.2 Five-Star Dream (chef)
**Assessment:** the most conventional platformer and the harshest first minute. Its ending ("…Next.") is the best single beat among the original dreams.
**Bugs:** the chimney can't be wall-jumped (no `|`) and its card is dead. Two rats inside 12 tiles of spawn. HUD label "DREAM 03". The arrival landmark is the gambler's `meridian_sign`. Retry replays d0. The death card can stack over a tutorial card (plausible).
- REMOVE: the second rat; the chimney as built; the stagiaire jargon.
- CHANGE: one floor per section (dock concrete, freezer frost, kitchen tile); enclosed kitchen with the pass in the foreground; make the chimney ribbed with `|` and teach the wall-jump there, or replace it with the stair; Aurelio's voice from minute one.
- ADD: room ambience (sizzle, compressor), a visible "approval" meter that never fills.
- KEEP: d6 "Is it good?" / "…Next.", the ticket rail, conveyors, the three Small Moments, the brass-tip coin.

### 4.3 The Big Stage (musician)
**Assessment:** Jo's own dream and the best written of the first three. The rhythm engine is richer than it looks; the presentation is a dots box.
**Bugs:** stale objective from the cellar to the gig; backdrop swaps at the cellar→corner boundary.
- REMOVE: the HUD title duplicating world signs.
- CHANGE: gigs happen in the room: camera pushes in, lights dim, HUD fades, audience heads react per phrase. Show the existing engine variants (rest, fill-every-bar, blind, hold) with distinct visuals. Objective per flag.
- ADD: the Tally/Nia choice as a staged scene; sound-bridge and call-and-response teaching (both cards are dead today).
- KEEP: the trumpet as a world-changing verb, Nia/Marcus/Ray/Sol, the "third bar" ending lines.

### 4.4 The Quiet Above (astronaut)
**Assessment:** the strongest writing and the cleverest physics (three gravity models plus swimming). The art is grey boxes, and the best content sits 60–70% of the way in.
**Bugs:**
- **EVA death trap:** at `?at=eva`, press → + Space before F, and you drift and lose a heart. The `eva_tether` card never fires (`AstronautScene.js:1513-1516`; `tutorial.js` has no trigger).
- The `darkZone` night overlay persists (`:776`).
- The zero-g float uses the run pose.
- The crater has no readable ground.
- The station HUD carries 8 readouts.
- REMOVE: one of gym-stats or flashcards/Board quiz; O2/PWR outside space; the tether readout outside EVA.
- CHANGE: a palette and floor per phase; a float pose with slow rotation; draw the tether as a line to the hull; teach the tether by forcing the clip-on before the airlock opens; remove the darkZone when leaving the forest and feather its edges.
- ADD: a fixed caption bar for radio (Osei, Halvorsen).
- KEEP: Priya's lines, rejection before acceptance, the rescue, the field ending "walk.", the in-voice objective style.

### 4.5 The Second Draft (writer)
**Assessment:** the most inventive mechanic (adjectives as levers, words as platforms, an editor that erases). The parts exist but are presented at a size nobody will notice.
**Bugs:** backdrop seams between rooms (rewrite). The word cap silently drops the oldest word. The FRIDAY clock is a second HUD clock. Labels are 7–9 px.
- REMOVE: nothing mechanical; remove the second clock.
- CHANGE: the attic first beat stays as designed (coffee tin → "working" → strike "jammed") but staged big: camera push-in, slow strike, the label at 3× size. Show the word inventory as physical word tiles with the cap visible. Give each place its own floor.
- ADD: a place-title card per chapter ("THE COPY SHOP, 3 A.M.").
- KEEP: rain/bus night, the press, the library sources, the agent's words-as-platforms.

### 4.6 The Yellow House (painter)
**Assessment:** the paint verb works and looks good once applied (the studio wall goes from void to a yellow house), but the unpainted state reads as broken. The camouflage floor undercuts the premise. The biography is borrowed.
**Bugs:** the unpainted house is a translucent black box. Two interacts share a spot (front wall and "a letter from the north", both at x=1456). THE STROKE card overflows its box. Strokes are thin and hard to see. There are no hearts (inconsistent fail model).
- REMOVE: the camo floor; real names (Roulin, Ginoux, Dr Rey) and the literal Van Gogh beats.
- CHANGE: the underpainting as a pencil/sepia sketch, not black; a thicker, brighter stroke with a wet sheen; HUD down to palette + canvas count.
- ADD: an original painter's life for Jo (see §7, decision 3).
- KEEP: the swirling sky, the palette wells HUD (the best UI in the game), the emptied-palette act, "ten canvases in ten days".

### 4.7 The Last Hand (gambler)
**Assessment:** the strongest opening frame (neon, rain, one chip) and the strongest arc outside the finale (pawn the trumpet). Mechanically it is six modal card games strapped to a corridor.
**Bugs:** the BET card is hidden under the stake selector (`tutorial.js` depth 240 vs `gamblerPuzzles` modal 300). The stake-selector odds line overflows its panel. Roulette is pure seeded RNG. Carpet everywhere, including the bus stop.
- REMOVE: at least two of the six card games (keep twenty-one and poker); the carpet outdoors.
- CHANGE: bets happen at a table in the world (Jo sits, camera closes in); show "house wins ties" on the felt; perform the pawning (case on the counter, empty-hand idle).
- ADD: a first bet you can't lose; asphalt and puddles outside.
- KEEP: the neon arrival, the room-title objectives, the marker, NO HORN.

### 4.8 The Long Evening (finale)
**Assessment:** the most beautiful sky, and a deliberate HUD fade (the gamer misread it). The foreground and the people do not match the sky.
**Bugs:** ~14,000 display objects (a perf risk on weak machines). People stand in a single row on one baseline. The ground is flat stone/earth with hard rectangular steps (ridge).
- REMOVE: nothing structural.
- CHANGE: a painted foreground (cobbles, grass lip, leaves); depth-layered townsfolk; a closer camera for "her" and the dog; batch static scenery into render textures.
- ADD: a closing camera and the station seen behind Jo.
- KEEP: the sky cycle, the town, "you're here.", the HUD ritual, no fail state.

## 5. Cross-cutting

### 5.1 Art direction and detail
The decision in `design_feedback.md`, "painterly world, pixel people", is sound. It was executed only for the Evening and only for the backdrop. To finish it:
- **One material per room, not per dream.** Every tile set gets a lit lip, a mid body, a dark underside, 3–4 variants, and a prop fringe (grass, cables, puddles, crumbs).
- **Enclosure.** Interiors get a back wall, a ceiling band and door frames in the *foreground* layer, so entering a room is a visible event.
- **Scale.** Jo at ~64 px in a 540 px view (or the camera at 1.25×), and doors, trains and counters sized to him.
- **Readability.** Each hazard class gets a unique colour and silhouette (red-orange for harm, nothing else uses it); coins get a distinct shape; lights in the world stay soft discs.
- **Unpainted, unlit and dark-zone states** must look designed (sketch lines, fog with feathered edges), never as a flat translucent rectangle.

### 5.2 Background transitions (fix spec)
1. Drive the blend by **distance to the boundary**: `t = smoothstep(x0-300, x0+300, camera.midPoint.x)` on both layer pairs, every frame. No event tween.
2. **Lerp the horizon** with that same `t`. Never assign `_horizon` raw.
3. Trigger on the **camera centre**, not the player, so the change happens where the eye is. Add 1 tile of hysteresis for music and zoom.
4. Rebuild scenery for the next room **in advance** (both rooms' scenery live while `t` is between 0 and 1).
5. Put a **physical seam** at every boundary: a door, an arch, a tunnel mouth, a fog bank. Where there is a door, a short fade-through-black is allowed and honest.
6. Move vista zoom onto the same `t` (zoom = lerp).

### 5.3 Checkpoints, saving and goal communication
- **One failure model across the game:** a hit costs a heart and knocks Jo back a short distance, *not* to the flag. Zero hearts sends him to the last flag with hearts refilled. Only quitting loses the dream. Remove "Choose another dream" from the death card; keep it in pause.
- **Persist mid-dream progress:** the last flag id, the flags set, inventory, wallet delta. Offer "Continue dream" from the hub's platform.
- **Flags:** big lantern/flag sprite in every dream's theme. It unfurls and lights, and the first time ever, a caption reads "Saved here". Place flags at the *start* of each hard section and at every gate.
- **Gates** carry a sign naming what opens them ("STAFF ONLY: needs saffron"), with an icon that ticks as the requirement is met.
- **Objectives:** one GoalLine per flag, authored in the Astronaut/Gambler voice, top-centre, at least 16 px bitmap. Never leave one stale across a room boundary (lint it: each room declares its objective).

### 5.4 Character art and animation (stored multi-frame atlases)
Pipeline: `public/atlas/<char>.png` + JSON, frames named `char/anim/NN`, loaded in a Boot scene, falling back to the procedural rig when absent. Extend `overrides.js` to every scene now; it is a 10-line change. One canvas size per class: Jo 64×80 frame, ~64 px tall; NPCs the same; portraits 96×96. Views: side (flippable) for all; a 3/4 front view for Jo and speaking NPCs in dialogue scenes.

**Jo, core (every dream):** idle (breath loop 6, blink 2, look-around 6); walk 8; run 8; start 2; skid/stop 3; turn 3; jump: crouch-anticipation 2, rise 2, apex 1, fall 2; land soft 2, land hard 3; crouch idle 2; crouch-walk 6; slide 3; wall-slide 2; wall-jump 3; ledge grab, hang 2, pull-up 5; ladder climb 6 + idle 1; push 6; carry idle 2, carry walk 8; pick up/put down 4; interact/reach 3; hurt 3; knockback 3; KO/sleep-fall 6; respawn/wake 4; hide in cover 3; talk gestures (nod, shrug, point) 3 each; sit down 4, sit idle 2, sleep 2; look up 2; wave 4.
**Jo, per dream:** chef: stir 4, carry plate 8, slide-plate 4. Musician: play-trumpet stand 4, long-note 2, walk-play 8, kneel-play 4, case open/close 4. Astronaut: float idle 4 (rotatable), push-off 3, rail crawl 6, tether reel 4, moon bound 4, swim 6, carry Priya walk 8. Writer: type 4, pen-strike 4, pick word 3. Painter: brush stroke 5, held stroke loop 4, palette idle 2. Gambler: sit at table 3, play card 3, push chips 3, poker-face hold 2, empty-hand idle (no horn) 6. Evening: walk-with-her 8, hand-hold idle, pet dog 4, sit together 2.
**Jo outfits:** street (default), bare-headed, chef whites, suit/EVA suit, smock, gambler coat. Dialogue portraits: neutral, smile, doubt, tired, afraid, relieved, laugh, crying.
**Speaking NPCs** (Pemberton, Ro, Bilal, Marguerite, Aurelio, Nia, Marcus, Ray, Sol, Tally, Priya, Halvorsen, Osei, the painter cast, Lou, Favour, Sal, "her"): idle 4, talk 4, walk 8, one signature gesture 4, react (startle/laugh/nod) 3 each, sit 2. Portraits with 4–6 expressions, the same face across hub, dream and Evening.
**Crowd/townsfolk:** 3 body types × 4 palettes, idle 4, walk 8, sit 2, clap/cheer 4 (gig audiences).
**Foes:** idle 2, move 6, tell/windup 3 (readable in 0.4 s), attack 3, stagger 3, flee/defeat 4. Human foes add notice ("!") 2, search 4, catch 4.
**Animals:** dog: idle, walk, run, sit, sniff, wag. Cats, crows: idle, move, fly-off.

### 5.5 Dialogue and writing
Keep the voice; it is the game's asset. Fix the delivery:
- Two channels: a slim **caption bar** for barks, radio and passers-by that never stops play; a **scene box** with portrait only for real scenes, opened by E, never by proximity.
- Retry never replays a scene.
- Open each dream on action, not exposition.
- Vary the endings: the "Was it enough?" card should be the *finale's* line, earned once, not six times.
- Give the Counter a face in the hub early.

### 5.6 UI, HUD, typography
- A bitmap font in 2 sizes (per the ui-type skill), with outline.
- A fixed HUD grid: hearts top-left; goal top-centre; dream tool top-right; nothing else on screen by default.
- Tool readouts appear only when relevant (O2 in space, chips at a table, ink while writing).
- A UI camera that ignores world zoom.
- One modal manager with a queue. Tutorial cards auto-size to their text and never open under another modal.
- A pause menu with controls, volume, text size, screen-shake toggle, "restart from flag", "return to station".

### 5.7 Audio
Wire the existing `ambientLoop` per dream, then per room (it is defined and unused). Add surface footsteps (6 materials), a per-dream motif in the MusicDirector, and stingers for "saved", "gate opened" and "goal changed". One recorded live-instrument loop for the finale. Keep the in-fiction trumpet.

### 5.8 Onboarding
A title screen with Continue. A 60–90 s tutorial street (curb, low pipe, busker, gap; no fail state) that teaches move, jump, crouch, interact and the trumpet once, ending at the station steps. Retire the global seen-once rule: a card is per dream when the verb behaves differently there, and every card is retriggerable from the pause menu's "controls".

### 5.9 Difficulty and level order
Keep difficulty-by-count; it is already wired for hearts, darkness and chef cold/waves. Recommended order control: the first train is fixed (the Musician, Jo's own dream, as the gentlest and most personal), then free choice, with the finale unlocked after 3. Every dream's first 2 minutes must be harmless. Add an assist toggle (+2 hearts, no knockback).

### 5.10 Consistency
Same failure model everywhere (the Painter's well-spill is a fine *flavour*, but show it as hearts). Same flag look per dream family. Same modal frame. Same objective voice. Same ending structure (played beat, then orb, then a short line), with varied content. Fix the naming: "DREAM — X" everywhere, no numbers.

### 5.11 The hub's role
The hub should be a 40-second place with three jobs: show progress (caught tokens), let the player choose, and make the finale a decision rather than an option on day one. Shorten it, enlarge the trains, and make boarding a moving-train moment.

### 5.12 Scope
Today there are 7 playable places totalling ~3,900 tiles and ~2 hours of specced content, all unfinished. A finished 60–80 minute game beats an unfinished 2.5-hour one.

### 5.13 Controls, accessibility, performance
- **Controls.** Keyboard only, no gamepad, no remap. The key set grows per dream: Q, E, F, X, C, V, Tab, 1/2/3, Enter, A–Z typing. Cap it at move/jump/crouch + 2 action keys + pause, and add gamepad support.
- **Accessibility.** Colour-dependent puzzles (painter wells, roulette red/black) need symbols as well as colour. Add text size, a reduced-shake setting, and a hold-vs-toggle option for crouch and the long note.
- **Performance.** The Evening holds ~14k display objects (measured), and the parallax wall bands are 1,746 × 2,700 px tileSprites. Bake static scenery to render textures before adding more painted detail.
- **Engineering.** Physics is solid (coyote 100 ms, buffer 120 ms, variable jump). Keep it.

## 6. Judging the gamer's judgement
- **Right:** the ground, the backdrop snap, text, scale, the flags, the writing being the asset, the Painter being too close to Van Gogh, the Evening sky. Its parallax diagnosis was exact.
- **Wrong or overstated:**
  - It played in teleports, so it reported stale objectives that the flag system actually updates (chef), a raw-id objective that does not exist, a "debug" list that is the writer's core inventory, a "floor-bound zero-g" that floats, and a Painter "black hole" that is the underpainting.
  - It called gates invisible; they are chained and lit.
  - It called the Evening HUD a bug; it is a deliberate fade.
  - It said the atlas pipeline was in place; the atlases are dead files.
- **Missed:**
  - The real failure loop (hit = back to the flag; game over = whole dream; no mid-dream save).
  - Dead tutorial cards, the EVA death trap, and modal stacking.
  - That the scope contradicts DESIGN.md.
  - The finale being open on the first visit.
  - Unused ambience data, performance, input and accessibility.
- **Priorities:** its #1 (ground) is the most *visible* issue, but fixing ground in six 20-minute dreams is the trap that produced the current state. The real #1 is scope, then the failure/save loop (it decides whether anyone finishes a dream), then the ground and transitions.
- **Cut Painter or Gambler?** I agree something must be cut, but not on the "both are pastiche" basis. The Gambler is original and is the only dream that takes something from Jo (the trumpet). The Painter's problem is fixable by writing (an original painter), but it is the longest dream (700 tiles, 19 flags) and the most art-dependent: a painted world needs the most finished art in the game. If cutting one, cut or postpone the Painter. If the owner loves it, rewrite it as an original life and halve it.

## 7. Redesign direction

**The shape.** Station (short) → 4 dreams, 6–10 minutes each, 4–6 enclosed rooms each, one verb deepened per dream → the Long Evening. Proposed set: Musician (sound), Chef (approval, timing), Astronaut (gravity and carrying), Writer (words), plus the Gambler as an optional fifth "dark" dream. The Painter is postponed.

**Build order:**
1. Failure/save loop and modal manager.
2. Bitmap font and HUD camera.
3. Room-based transitions with seams.
4. Character atlas pipeline (Jo first).
5. One dream finished end to end as the art bar (the Musician), including floors, enclosures, ambience and the staged gig.
6. Roll that bar out.
7. The Evening foreground last.

**Decisions the owner must make:**
1. *How many dreams ship?* Recommend 4 (+ the Gambler optional). Alternative: keep all 6 at 5 minutes each.
2. *How long is a dream?* Recommend 6–10 minutes, as DESIGN.md intended, not 15–22.
3. *Painter: cut, postpone, or rewrite as an original life?* Recommend postpone; if kept, rewrite with no real names or events.
4. *Order:* free choice, or a fixed first dream? Recommend the Musician fixed first, then free; the finale after 3 dreams.
5. *Failure model:* recommend hearts → last flag; never a whole-dream restart; a mid-dream save.
6. *Art source:* procedural paint, commissioned PNG atlases, or mixed? Recommend authored PNG atlases for all characters (Jo first) and procedural backdrops kept, with the PNG override hook enabled in every scene.
7. *Character size and camera:* recommend Jo at ~64 px with a 1.25× default camera and a talk-camera push-in.
8. *Minigames:* keep modal card games or move them into the world? Recommend fewer, in-world, skill-based (twenty-one with a visible shoe, poker face), and drop roulette.
9. *Hub length and finale gating:* recommend halving the hall and locking the last stop until 3 dreams.
10. *The Counter:* boss fight (DESIGN.md), presence only, or cut? Recommend a presence (the gate, the voice) and no boss; the finale is the answer.
