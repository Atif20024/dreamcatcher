# Deep review: Crossroads Station and THE LAST STOP (the Evening)

Lens: senior game designer and pro gamer. I did not play it. Everything below is read from code and data and is **inferred** unless a line says otherwise. Read-only: no code changed, no server started. Skills applied: level-design, game-feel, audio-design, dialogue-systems, platformer, game-balancing. The three "fresh review" files were read; I skip what they already cover (hub N cap as a general matter, Evening cast gaps F10, name reuse F9, camera lerp, Jo's contrast, the swing scale job).

## Verdicts

| Area | Engaging? | Single biggest thing wrong |
|---|---|---|
| Crossroads Station | Atmospheric and well written, thin to play. A strong first 90 seconds, then a long walk past nine near-identical bays. | The hub's best payoffs happen where the player is not looking: the strand woven into the dreamcatcher (HubScene.js:664) and Pemberton's and Ro's return lines all sit 13 to 80 tiles from where Jo is dropped after a dream. |
| THE LAST STOP / Evening | Yes. Warm, dense with small authored things, a real ending. The best-thought-out area in the game. | The verbs that matter (hold Down to sit, Q to play the horn) are never taught, and sitting on the station bench is also the only way to end it, with no cue that this is "the way". |

---

## 1. Minute by minute, first-time player

### Station (inferred from `rooms.js`, `HubScene.js`)

- **0:00 to 0:12, the street.** Jo spawns at col 3 beside the newspaper kiosk, in rain, with a queue of silhouettes moving in. Nothing is asked of him. After 700 ms of walking: "walking. hold SHIFT (LB) to run". Good: the world pulls him east, the headline is a joke ("LOCAL MAN CATCHES DREAM, SAYS 'FINE'" is one of several). Walking speed is 80 px/s (a body height per second), so the 29-tile steps room is about 12 s on foot.
- **0:12, Ro and the doors.** Ro sits at her shoeshine stand with no shoes to shine. Three doors; two have chains and an emoji padlock; only the middle turns. The two chained doors promise something and never deliver (see S5).
- **0:25, the hall opening.** Crossing the doorway fires the vista: camera zooms out, board clacks through all rows, steam from every train, title "CROSSROADS STATION / NINE O'CLOCK. EVERY TRAIN LEAVES NOW." Skippable by any key. This is the best beat in the hub. Keep it.
- **0:30 to 0:55, the hall.** Pemberton calls once ("Sir? A word, at the desk. [E]") without taking control. Good design. The prompt over him is a bare `[E]` (see M3). After the desk the objective becomes "board any train" and a float text says "the grate past the fountain goes down", which spawns at the grate (col 77), about 29 tiles from Pemberton, so it is off-screen when it appears (HubScene.js:1076). Player wants: a train. The board lists ten rows. Which one? No guidance, which the earlier review covered.
- **0:55 to 1:30, the platforms.** Through the arch (a dip through dark), then nine bays at 7-tile pitch that each use the same template: platform, board post, bench, lamp, train (`rooms.js:18-27`). Differences are livery and sign text. Two bays (3 and 8) have red "NOT IN SERVICE" bars. Standing in front of one and pressing E gets "nothing runs on them yet" (HubScene.js:1156), which reads as a developer note. I would mark this stretch as where a first-timer feels "this is a corridor".
- **Boarding.** Conductor line, a real choice (Board / Not yet / Continue), walk-in, door, train runs away, wipe in the dream's colours. Strong. Keep all of it.
- **Return from a dream (N=1).** Control is locked 7.5 s; the train comes back, a row flips, Jo steps out at the bay. Then: objective is "board any train — or the last stop" and he is standing on the platforms. Everything that reacts to him (Pemberton's return line, Ro's per-dream line, the dreamcatcher strand, the sleeper, the tea) is back in the hall or on the street. Most players will walk to the next bay. **Nothing happened** is the likely feeling.

### Evening (inferred from `EveningScene.js`, `data/evening/*`)

- **0:00, the arch.** Fade in at col 55 on a little knoll with a sign ("you're here."), a sleeping cat, a bench. Control returns after 1.4 s. HUD pieces vanish one at a time over about 6 s. Lovely: the ritual removes the game's UI piece by piece.
- **0:10, which way?** East is the road to the orchard, laundry, square. West wraps into the east meadow and puts Jo at the station within about 60 tiles. A player who goes west first reaches the station bench in under a minute, having met nobody.
- **0:30 to 5:00, the town.** Overheard conversations start when two people stand within 4 tiles for 8 s, one of them turns toward Jo if he lingers. Each place offers an activity (hold the basket, skip, hold the bike seat, share a rod, take the bread round...). The prompt reads "e · have a tea". This is dense, kind, and funny. It is also where the player is told nothing about **sit** (hold Down 320 ms, EveningScene.js:~551) or **the horn** (Q, :1047) or **throw** (X). Only the camera says "[C]" when picked up.
- **When does it end?** Sitting on the station bench for 20 s (`updateSits`, EveningScene.js:957). A player who sits there by accident gets the ending; a player who never sits at it loops the wrapped town for ever. The board there reads "— — —" until a sit-event flickers it.
- **Ending 1 (station), then the road.** "YOU'RE HERE", the people he helped walk home, three count cards, "Stay as long as you like.", 7 s later the board says "THERE'S A ROAD" and the hedge parts. Wren is on the wall seat. Stop by her and she comes; walk past and she says "…suit yourself." This is excellent: a choice with no UI.
- **The road, about 3 to 4 minutes.** 11 screens, fragments from her, point-outs (lake, first star, owl, deer, aurora), a snowball fight she wins, the dog, music thinning to silence then the band returning under the aurora. Ridge bench, 2.5 s of sitting, the cards, three of his own photos, credits.

---

## 2. Aspect by aspect

### Characters

**Good, keep.**
- The Evening's activities all share one rule (a success is never announced; walking away is fine). The cast has idle pools bigger than any visit, `knows`-gated roasts, "kindnesses remembered" (NEEDS, `cast.js:~270`) and a dinner exodus at 13 min. They have reasons to be there and they react to Jo.
- Hub: Pemberton calling out but not forcing, Ro's per-dream `roLine` ("Gold under your nails. And lime."), Bilal's tea lines that escalate and then fall silent, the sweeper who "has been here longer than the trains". The last-walk floating lines at N>=2 are a nice idea.
- The hub people reappearing in the Evening (`knows: 'always'` = Bo, Kite Kid, Bilal, the sweeper) is the right connective tissue.

**Problems.**
- Three hub people are mute props: the flower seller, the sweeper and the sleeper have no `addInteract` (HubScene.js ~560, ~1445). The flower seller's last-walk line says "…the last one. Take it." (HubScene.js:~1460s, `LAST_WALK.flower`) and there is nothing to take; the `lastFlower` flag it writes is read by nothing in `src/` (inferred by grep).
- Hub NPCs are not all consistent with their own station: Pemberton's N>=2 line is the same "Mind the gap." as his floating last-walk line (HubScene.js:66 and :1088). Played in sequence you hear it twice.
- Collecting all three hub Small Moments wakes the sleeper by swapping one texture and bobbing him (HubScene.js:~1470). He has no line and no interaction. The only hub collection quest pays out with a sprite swap.
- The Evening duplicates the hub's four "always" people at the same time. A player who visits the Evening at minute 2 and comes back finds Bilal in both places. One line of acknowledgement would turn the glitch into the theme.
- Bo's idle line says "I used to play the tutorial street" (`cast.js:49`). No tutorial street exists. The spec's mention of it survived in dialogue.
- Hub busker has no name and no word; Evening Bo is the same man with the same accordion. The link is invisible.
- Wren's roasts only exist for chef, musician and astronaut (`talk.js:184-188`). Four running dreams (writer, painter, gambler, clockmaker) give her nothing, and she is the one voice the player hears for five minutes on the road.

### Level

**Good, keep.**
- The station's vertical read: mezzanine café by one-way iron stairs, a ladder up a skylight rib to a roof walkway with a vista zoom, an undercroft by a ladder under a floor tile. Doorway frames carry the room changes through short dips so the camera never fights the map.
- The Evening's geography: arch knoll, orchard slope, courtyard, square, canal steps down and a footbridge, the steep street up to the roofs, roofs, fire ladder down to the school, gardens, hill, a station that isn't, and a wrapping town with the east and west meadows identical. The ground rising in stages toward the ridge is a physical story.

**Problems.**
- Platforms 1 to 8 are a monotone: same sign, same bench, same lamp, same train silhouette, same 7-tile pitch, with no ambient difference between bays (the dreams.js `ambientLoop` field is declared for each dream and never played in the hub; `BaseLevel.js:195` only plays it inside dreams).
- Dead ends with nothing in them: the clock tower top (reached only from the roof), the whole east roof past the water tower to the gate lintel, and the roof west of the hatch. A player who climbs a 17-tile ladder has earned something.
- The service gate and the Last Stop train are two doors to the same room, in two voices. The gate (a push, a line, a second push, a card) and train G (a conductor and a choice) are redundant in flow and differ in text ("Past the turnstile, a door stands open." while train G is not past the turnstile).
- Chained front doors never open (see S5).

### Obstacles and hazards

The hub has none and should not. The Evening has none by design, apart from the hedge, the canal steps, ice on the stream and a ladder or two. The Evening's real obstacle is **the unclear route to the ending**, not a pit. Nothing is "filler" here. I do not recommend adding hazards: the contrast with the dreams is the point.

### Story

**Good, keep.** "One strand for every dream caught", the tally on the service gate, the queue moving in and never out, the desaturating wash, the fountain going dry, the flower seller's cart emptying. The Evening's cards ("You caught 0 dreams. You came anyway.") already handle the skipper. `countLine` handling of low numbers is exactly right.

**Problems.**
- Nothing in the hub reads that the Evening was finished: `save.evening.finished` and `save.evening.trumpet_left` are written (EveningScene.js:~2578, ~2592) and read by nothing in `src/` (grep). The ridge's last card "Somebody's playing it" is not heard anywhere later.
- Money has no end. The wallet appears on the Evening's HUD ritual, then dies. The hub's ledger counts it, Pemberton quotes it, the turnstile draws it as tally, and Bilal's tea in the Evening is "no prices, there never were". The postbox answers "(nothing to post.)" (EveningScene.js:1178).
- The original spec (docs/hub_crossroads_station.md:46, :61, :30) had the sleeper's bench empty with a folded coat on the last visit, and the chained front doors opening in the finale. Both were dropped when the Last Stop became open from the start.

### Objectives

- Hub: blank on first visit, then "board any train", then "board any train — or the last stop". Honest and short. The weakness is that after a return there is no next-step sentence for **the hub itself** (see M1). Fine otherwise.
- Evening: none, by design. That is right, but the ending needs a cue (M2).

### Movement

- Hub: walk, run on Shift, climb two ladders, jump onto the first stair tread, crouch for the bench. Everything is fine for a safe place. The hub does not use the moveset beyond that and should not.
- Evening: the best use of the moveset in the game for a no-hazard level: ramps and hills, a rope swing, a rowboat, skip-rope timing (jump on the beat), run alongside a bike and let go, kick a ball, skim a stone with a timing bar, kite running. Good.
- One gap: the Evening's `p.upJumps = true` makes Up a jump, while the "look up" verb (hold Up while sitting) is not told to anyone. Fine in itself.

### Music and sound

**Good, keep.** Hub: the band drops a stem per catch (ride cymbal, then piano, trumpet, bass), then pad + hum, the clock stutters at the end, the hall's reverb widens, the crowd ambience thins. Evening: an ensemble that changes on **time** not place, stays in Jo's key, hushes in snow and rain, goes down when he sits; road music steps down to silence then the band under the aurora; Bo's tune is a source you walk toward; each place has its own loops.

**Problems.**
- The hub has one bed for all five rooms (`audio/places.js:86-92`: gate = `R('hall','hub')`, same as platforms). The service gate room should sound like the station with the PA off: no announcement, a hum, a distant counting click. The PA announce event ("announce", 50 to 100 s) will play over "NO PASSENGERS".
- The clock `tick` plays every second, globally, at a fixed volume, for the entire time Jo is anywhere in the station including the undercroft and the roof (HubScene.js:500-507). It is the only sound that is not placed in space.
- Per-platform ambience is spec'd (docs/hub_crossroads_station.md:56: "each has a unique ambient loop — sizzling, tuning, a starter pistol far off") and not built.
- Hub music has one tempo (104 bpm) and one mix for outside rain and for the inside hall. The wall filter handles loudness, not feel.

### Anything unconsidered

- Hub prompts are a bare `[E]` over every interactable; the label passed to `addInteract` is never shown (HubScene.js:1432 sets position and visibility only, `hud.prompt()` default text is "[E]"). The Evening shows "e · have a tea". A player cannot tell a gate from a train from a lever.
- Props with no purpose: phone boxes, ticket booth, lost & found window, cages, signal-box levers (random clang), shoeshine with nothing shined, two chained doors with an emoji padlock (HubScene.js:436, an emoji in a game whose rule is authored bitmap fonts, **inferred risk** that it renders in the system font).
- `DELAYED` on the board (HubScene.js:709) vs "NOT IN SERVICE" on the sign vs "nothing runs on them yet": three words for one state.
- Headline 0 says "EIGHT TRAINS, EIGHT DREAMS — ALL ON TIME"; there are nine dream platforms plus G, seven running (`systems/hubState.js:24`).
- Bilal's shop: postcards offered only for `chef` and `musician` (HubScene.js:1272); five more dreams exist. The shop closes at N>=5 ("Keep the change", :1232), which is against the owner's "nothing closes at 5".
- The shop is down a ladder in the undercroft and nothing above says so. Bilal upstairs gives free tea and never mentions it; Pemberton mentions "Left luggage" at N=1 only for the suitcase tags.

---

## 3. Prioritised list

File pointers are to the code as it stands now.

### MUST (a player would notice, it reads as not thought out)

**M1. The return ritual happens where Jo is not.**
- Pointers: `HubScene.js:1118-1145` (runReturn), `:664` (weaveStrand), `:1078-1091` (talkPemberton), `:1096` (talkRo).
- Case: back from the Chef at bay 1 (col 85), the strand is woven into the dreamcatcher at col 72, in the hall, in another room behind the hall-end doorway. From platform 7 it is 52 tiles away. The player hears a chime and sees nothing.
- Fix: after `returnAndDie`, play the existing dip (`dipThroughDark`, DIPS.inin) to the hall under the dreamcatcher (x = px(72), floor), hold the control lock, weave the strand with the camera on it (1.6 s), then give control with Jo standing there. Pemberton is 24 tiles west and calls out as today ("Welcome back, sir. [E]" already exists at :1426-1431; extend `pemCall` to fire here). Cost: one `placePlayer` + the existing weave. Skip the Ro line on the street: move Ro (see S2).

**M2. The Evening's ending has no cue and its key verb is never taught.**
- Pointers: `EveningScene.js:~551` (down hold sits at 320 ms), `:957` (station bench 20 s), `:1047` (Q horn), `:1007-1010` (the only hint is "walking. hold SHIFT"), `world.js:466-472` (board shows "— — —").
- Case: a player never learns to sit. The town's best content (sit events, hill nap, fire, ridge ending) is all behind that verb. Meanwhile the shortest route to the ending is west (wrap), sit on the station bench, done in under a minute, having seen nothing.
- Fix, three small parts:
  1. A one-time floatText the first time Jo stands still within 40 px of any bench for 3 s: `hold ↓ to sit`. A second, once, after 25 s of standing anywhere: `Q — the horn`. Add both to the pause screen footer.
  2. Gate the station ending on having had an evening: `this.visitedPlaces.size >= 6 || this.helped.size >= 2`. Before that, sitting at the station bench behaves like any other bench (sit event, board clacks). When the condition first becomes true anywhere else in the town, fire `board_clacks`' bell from the far east (a single station chime, `chime('board','evening')`, faint, once). That is the objective with no HUD: a sound from the east.
  3. Reword the board's idle: when the condition is met it flickers "STAY AWHILE" then returns to dashes.

**M3. Hub prompt shows `[E]` only.**
- Pointer: `HubScene.js:1432`.
- Fix: `this.promptText.setText('[E] ' + nearest.it.label)` and rename the labels at their `addInteract` calls to verbs: `'ro'` → `'talk'`, `'pemberton'` → `'ask'`, `'train'` → `'board'`, `'gate'` → `'push the gate'`, `'shop'` → `'browse'`, `'levers'` → `'pull'`, `'slot'` → `'look'`, `'bilal'` → `'have tea'`. It matches the Evening's "e · label".

**M4. The hub cannot count past five and Pemberton, Bilal, the headlines and the shop all stop.** (The owner decided the station counts every running dream; here is what must change.)
- Pointers: `HubScene.js:91` (`Math.min(5`), `systems/hubState.js:24-31` (headlines 0 to 5, TABLE 0 to 5), `HubScene.js:49-64` (PEMBERTON_RETURN and BILAL_TEA to 5), `:1232` (shop closes), `:965` (`acousticsTweak` uses N/5).
- Fix: `k = caught / runningCount` (runningCount = `DREAMS.filter(d => d.scene).length`, currently 7), pick TABLE row `Math.round(k * 5)`, and keep the five rows; give each of N=1..7 its own Pemberton and headline. Remove `N >= 5` in `shop()`. Suggested lines:
  - Headline 0: `NINE PLATFORMS, ONE TIMETABLE — ALL ON TIME` (not "eight").
  - Pemberton return, by N: 
    1. `Back already. Was it everything?` (keep)
    2. `Two off the board. I haven't touched it. It does that.`
    3. `Three. You look… thinner around the eyes.` (keep)
    4. `Four. I used to announce the delays. Now there's nobody to be late.`
    5. `Five. The platforms ring when you walk them now.`
    6. `Six. You could stay, sir. I'd put it in the ledger.`
    7. `That's the board, sir. All of it. The one train left isn't a dream. It's been warm in there all night.`
  - Replace the flat `N >= 2 → 'Mind the gap.'` (HubScene.js:1088) with the same table. Keep "Mind the gap." as the **last-walk** floating line only.
  - The shop stays open at every N; its last stock line at N>=7: Bilal says `Everything left on the shelf is yours. I never found a price for it.`

**M5. Mute props promise things.**
- The flower seller: `LAST_WALK.flower` = `'…the last one. Take it.'` with nothing to take (HubScene.js:~66-70, `:~1460`). Fix: give her an interact (`E` → "a flower") that attaches a small flower to Jo's lapel (a tint on the existing hat sprite is enough) and sets `flags.hub.lastFlower` (already written). Read that flag in the Evening: Wren says once at the hedge `Nice flower. Where'd you find that?` (add to `HER_LINES.hedge_greet` as a conditional line). This turns a dead flag into a handoff between the two areas.
- The sleeper: at N>=2 the three-moment wake only swaps a texture (HubScene.js:~1470). Give him an interact after waking (or at any time as a passive line): `…is it still evening? good.` (the same line the Evening's charpoy man says, `cast.js` sleeper idle) so the player can recognise the man the Evening is for.
- The two chained doors: see S5.

**M6. The shop is undiscoverable and half-finished.**
- Pointers: `HubScene.js:1096-1117` (tea), `:1232-1300` (shop), `:1076` (hatch float text), `:1272` (postcards).
- Case: coins are collected for hours and Jo is never told they buy anything. The only hint ("the grate past the fountain goes down") floats 29 tiles from where it is said.
- Fix: put the sentence where the player is and in Bilal's mouth. First tea: `On the house. The real stall's under the floor. The grate by the fountain. Bring change.` Delete the off-screen float. Offer postcards for all running dreams by building the choice list from `DREAMS.filter(d => d.scene)` instead of the hard-coded pair.

### SHOULD

**S1. Platforms are a corridor: give each bay a voice.**
- Pointers: `rooms.js:18-27` (bay template), `audio/places.js:86-92`, `dreams.js` (`ambientLoop`, `propsKind`), `HubScene.js:~740` (the one `smell` effect for chef).
- Fix (cheap, audio): as Jo walks within 5 tiles of a running train, fade in 2 s of that dream's `ambientLoop` at about -26 dB (sizzle, tuning, typewriter, engines, the quay...), and fade out as he leaves. Silenced for caught trains (this is the spec's own line). Visual: each bay gets a `propsKind` item beside the bench (a stack of crates, a music stand, a pile of paper, a coil of rope), since the field is already authored for every dream and used by nothing in the hub (grep). It makes 9 bays 9 places.

**S2. Move Ro in from the street, and give her a thing to do.**
- Pointers: `rooms.js:43` (Ro at col 15), `HubScene.js:446-454`, `:1096`.
- Case: her `roLine` per dream is the station's best personal beat, and nobody is placed to hear it.
- Fix: put Ro on a bench at the hall's west wall (col 33), or keep the stand but add a "come to the stand" cue when `returnedFrom` is set (a one-line float, `Ro: "You. Over here."`). Let her actually do a shoeshine: `E` plays 1.5 s of a brush, Jo's shoe tint shifts, her line plays. That also pays off "Shoes first. Dreams after."

**S3. Rewrite the board and conductor states.**
- Pointers: `HubScene.js:709` (`DELAYED`), `:1156` (conductor "nothing runs on them yet"), `:445` platform sign text.
- Fix: one word for one state. `NOT IN SERVICE` on sign and board. Conductor line for a dead train: `Platform 3 hasn't left in years, sir. Whoever dreams it hasn't fallen asleep yet.` (Platform 8: `Platform 8 is waiting on a night shift.`) That also gives the unrun dreams a reason that fits the fiction instead of "the programmer hasn't done it".

**S4. Hub-to-Evening and Evening-to-hub handoffs.**
- Pointers: `EveningScene.js:~2578-2592` (`trumpet_left`, `finished`), `HubScene.js:create` (read the save), `HubScene.js:~175` objective, `:1213` (`boardLastStop`).
- Fix (all small): 
  - If `evening.finished`, add a Pemberton line: `You've been to the end of the line, sir. I've never. Is it as warm as they say?` 
  - If `evening.trumpet_left`, the busker's ♪ puff (`buskerPuff`, :~590) becomes a trumpet note, and a line: `Somebody left a horn on a bench out there. I can hear it from here.` (Bo) — that is the ridge card's loop closed.
  - Evening finds: show the 12 `FINDS` as small items in the hub's Lost & Found window as they are pocketed (`lostfound` at `rooms.js:75`), with a label count and a prompt `look` (`pocket: 7/12`). The window currently labels nothing.

**S5. The chained doors, the sleeper's bench and the final state.**
- Pointers: `HubScene.js:433-437` (chained doors), `:1470` (sleeper), `docs/hub_crossroads_station.md:30,46`.
- Fix: when all running dreams are caught (k=1), the chains fall at the front doors with a scrape on re-entry, warm light spills through them onto the steps (the Evening's amber), the sleeper's bench is empty with the coat folded, and the first line Pemberton says is the N=7 one above. This restores the spec's closing image, costs a tween and two sprites, and gives the two prop doors a payoff. Until then, remove the chains and padlock emoji (an unkept promise and a glyph outside the bitmap font).

**S6. The gate room's sound and one more line.**
- Pointers: `audio/places.js:91`, `HubScene.js:863` (`pushGate`).
- Fix: `gate: R('hall', 'gate_hum')` with a bed that has no PA, a low drone and one tally click every 20 to 40 s. The first push's line is good; make the second push's card shorter: `THE LAST STOP / Past the turnstile, a door stands open. It is warm.` and keep `[E] Go through  [Q] Not yet`.

**S7. The Evening's cast lines that don't match the world.**
- Pointers: `cast.js:49` (Bo), `cast.js` (Bilal idle), `talk.js:166-188` (Wren).
- Rewrites:
  - Bo: `I play the station hall, mostly. The acoustics lie.` (replaces "I used to play the tutorial street").
  - Bilal (Evening idle, new): `Kettle's on at the station too. Don't ask how.` 
  - Wren roasts for the four missing dreams (names are in `data/writer/cast.js`; painter and gambler names are from the dream specs; check spelling when wiring): 
    - writer: `Page three. You kept it. I read it. Don't look like that.`
    - painter: `Gualtiero asks after you. He says you sweep like a man who'd rather be painting.`
    - gambler: `Lou got up from the table. Eventually. Did you?`
    - clockmaker: `Every clock in the square is five minutes wrong now. Nell says it's a feature.`
  - (These also address the earlier F10 gap in part.)

**S8. Money's ending.**
- Pointers: `EveningScene.js:1178` (`postbox`), `:2270-2284` (`countLine`), `HubScene.js:~885` tally.
- Fix: `postbox()` takes whatever is in the wallet: `post what's in your coat` → the wallet goes to 0, a soft chime, line `(it went in. someone will be glad.)`. Add one count card on the ridge when posted: `You carried $N. You posted it.` The ledger Pemberton reads out stops mattering at the right moment. Optional gating on N>0.

### NICE

- **N1.** The roof east end (cols 130 to 160) is a dead run above the Last Stop. Add a bench at the end and a lamp; sitting there plays one Evening-style sit event (a chime from the east, a single warm window lighting in the far gate room). It is the station's own "you're here".
- **N2.** The clock tower top: a bench with a view down on the steps (queue, rain), one hidden Small Moment (a pigeon that lets Jo sit). Reachable only from the roof; give the 17-tile climb a reward.
- **N3.** Clock tick: scale the volume by distance to the clock tower (or only play in the steps and hall).
- **N4.** The hub's phone boxes: one rings once at N=3 and again at N=6; E picks up; a line (`wrong number. keep the line.`). Gives the booth a purpose and a rare event.
- **N5.** The hub busker: show his name on E before the duet (`Bo.`) so the Evening's Bo is recognised. His moment text (`He'd been playing to the board for years.`) is perfect; leave it.
- **N6.** The signal-box levers clang at random; make them act: three levers each flip a specific board row from BOARDING to HELD for 10 s (harmless, funny). Or remove.
- **N7.** The rare balloon, the wedding, and the dinner exit exist in the Evening; add a tiny visible hint that they can happen (the pause map's margins) so a player who sits for 20 minutes feels rewarded rather than lucky.

---

## 4. Needs a MAJOR change (flagged separately)

**A. The Evening exists at minute two and the station dims toward it; both cannot be the story at once.** The station's whole arc says "each dream you catch makes this place quieter, until the only thing left is the last train". The Evening is open from the start (owner decision), so a player can see the destination first, and the station's slow loss reads as a countdown only for players who play in order. I do not recommend closing it (the owner wants it open and the N=0 cards handle it). The cost-effective path: keep it open but make the hub **react to it** (S4, S5). If you want the strongest version, the first visit to the Evening before any dream sets a flag (`evening.early = true`), and the whole hub treats the first caught dream differently (`Pemberton: "You've been through the gate. The board noticed. Back for the rest?"`). That is a story fork, hence major. Needs an owner decision; cost is about two lines of Pemberton plus a handful of flags.

**B. The hub's roof and undercroft are an optional layer with no payoff curve.** The undercroft (shop, signal box, lost dreams, the slot) and the roof (kite kid, vista) are real places. Right now only the shop is a reason to go. If the owner wants the hub to feel "worth exploring", a short secret chain would be needed (e.g. three marked suitcases that are the dreams' MacGuffins) rather than a set of dead ends. This is a level addition, not a fix, so I leave it as a question; the SHOULD/NICE items above are the minimal version.

I do not see a case for rebuilding any current area.

---

## 5. What is good and should be left alone

- The hub opening vista, the doorway-dip transitions, the Pemberton "calls once, never takes control" pattern, the dreamcatcher itself, the tally on the gate, the station's desaturation curve, the board.
- The conductor's boarding choice, the train walk-in and wipe.
- The Evening's whole premise (help is optional, nothing announced, the town remembers kindnesses), the HUD ritual, the wrap, the road's fade of music to silence then the band under the aurora, the "you walked it alone. It still counted." variants, the pause "map drawn by a child" and the "things to do" list.
- Wren at the hedge: stop or walk past. No UI. Do not touch.

## 6. What I did not check

- No playtest. Distances in seconds use `WALK_SPEED = 80` px/s (`Player.js:31`) and 32 px tiles; the jog speed was not measured. All feel claims are inferred.
- I read `activities.js` headers, not every activity's tuning. I did not audit `Townsfolk.js`, `Companion.js`, the art files, `hubArt.js` or `eveningArt.js` (art is covered elsewhere and the scale job is running).
- I did not read the dreams' dialogue files for the four missing roasts; the lines in S7 are drafts to be checked against the dream text.
- The "grep finds no reader" claims (`lastFlower`, `evening.finished`, `trumpet_left`) were searched in `src/` only, not in tests or dev scenarios.
