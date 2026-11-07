# Dreamcatcher: a player's critique (for the redesign)

Status: COMPLETE (partial-play caveats noted in the verdict).

Method note: browser pane was hidden, so I drove the game with a stepped harness (game.step) and synthetic key events. Where I teleported (player.setPosition) it is stated. Viewport was small (about 750px wide game canvas), so "Jo is tiny" is partly the pane, but see the camera notes.


# VERDICT

Dreamcatcher has an unusually good idea (dreams that each cost something; a finale that gives it all back as an evening walk), real writing talent (astronaut, Small Moments, the gambler's room titles), and two or three genuinely lovely frames (hub platforms, the Evening sky, the gambler's Meridian sign, the press, the painter's swirl sky). It does not yet look or read like a finished game. The player stands on a flat slab of tile in front of nicer scenery, small, with six lines of 6px type around him, being told by a modal box what happened, and unsure what the little blue flags mean. The dreams are ambitious in mechanics (call-and-response trumpet, adjective pen, palette wells, odds, tether) but each is taught by a tiny card and then lost in HUD clutter. Coverage note: I played the hub, Chef (first 2 rooms live, rest by warp), Musician (street, corner, one gig), Astronaut (all phases by warp, shove tested), Writer (attic, 9 more warps), Painter (arrival live, 6 warps), Gambler (arrival live, 8 warps), Evening (start live, 6 warps). No dream was played to its ending; judgements on late mechanics come from code/spec.

Scores (goal clarity / feel / art / story / fun): Hub 3/6/7/6/3; Chef 4/5/4/5/4; Musician 5/6/5/7/5; Astronaut 6/5/4/8/5; Writer 4/5/6/7/6; Painter 6/5/6/6/5; Gambler 5/5/6/6/5; Evening 7/6/8(bg) 4(fg)/7/6.

## The 10 most important problems, ranked

1. **The ground is a flat slab in every dream.** One autotiled block, no top edge, no variants, no props, filling 40-60% of the screen (grey chef, tan musician, brown writer, camouflage painter, red hatched gambler, flat dirt in the Evening). This is the main reason "the detailing is not up to mark".
2. **Background changes all at once at a room boundary.** `BaseLevel.updateMusicRoom` -> `Parallax.setRoom` swaps sky + 3 layers + landmark + scenery on the player's x, over 550ms, on full-viewport layers; horizon y snaps per room; no hysteresis; the camera still shows the old room. (Details in Cross-cutting A.)
3. **Goals and saves are unclear.** Checkpoint flags are an unlabelled pale pennant; invisible gates open on invisible flags; objective strings are stale (chef, musician), raw ids (hub `board_any_train`), or low contrast (gambler). Death offers "Choose another dream" and restarts the whole dream if no flag was touched.
4. **Everything is too small.** Jo ~44px on a 960x540 view; trains are toys; NPCs are the same size and pose; faces never read. Close-ups and a 1.25x camera are needed.
5. **Text rendering and HUD clutter.** All 194 text objects are default `monospace` at 6-13px; the left HUD is a 5-6 line stack in Writer and Gambler; world labels are unreadable in motion; the dialogue box covers a third of the screen and auto-fires on proximity.
6. **Characters are procedural grids with a thin animation set.** One run frame, one jump, one fall; no land, crouch, turn, hurt, climb, interact, carry, play, brush, type frames. NPCs mostly static. Move to authored PNG atlases (list in Cross-cutting C).
7. **Mechanics are taught by tiny cards and then forgotten.** Pen, wall-jump (chef has *no* ribbed tiles at all, so the chimney is plain grey slabs and the card can never fire), sound-bridge, shove, hide, bet: each arrives with a modal and no scripted first success.
8. **Rooms are not rooms.** Kitchen, cellar, cafe, library, casino, house, gym are open sets with no walls, ceilings or doorways, so "entering" never happens and places blur together.
9. **Level order and tone are not controlled.** Players choose any dream first; darkening-by-dream is not monotonic; hub numbering ("DREAM 03" for chef) is arbitrary; chef is the harshest first minute (two hearts gone in 30s) but is platform 1.
10. **The newest two dreams are pastiche and heavy.** The Painter borrows a famous life nearly point for point; the Gambler piles four UI-on-top minigames on one platformer verb; both add HUD complexity and long lengths (painter 19 checkpoints, ~650 tiles). Pick one or shorten both hard.

Smaller bugs found (details per level): chef wall-jump chimney has no climbable tiles; chef death card overlaps tutorial card; chef/astronaut HUD not zoom-compensated in vista rooms; hub title card overlaps board and bunting; hub background haze bands; astronaut dark foreground blocks cover gameplay; astronaut "zero-g" is on a floor; writer attic left half dark/empty; painter house interior is a black rectangle; gambler carpet floor outdoors; "[dev] warped to ..." captions live in shipped code (AstronautScene.js:251 and similar).

---

---

# 1. CROSSROADS STATION (hub)

**Trying to be:** the connective cathedral: departure boards, eight platforms, people who live there, a station that dims as dreams are caught.

**Play log:** fresh save, spawned at far-left front steps (x=112). No prompt of any kind about controls or what to do. Walked right, hit a stair step at x=308 and stopped dead (a low step, nothing says "jump"). Jumped up, got the long cinematic camera pull-back (zoom 0.62) and a big "DREAMCATCHER / Crossroads Station. Everyone here is going somewhere else." title card over the hall. Walking right triggers Mr. Pemberton's dialogue automatically ("New face. Which dream, sir?"). Walked the whole 4800px hall in about 20 seconds with nothing to do on the way. Walked past platform 8 by accident (no stop). Teleported to platform 1 (to save time, noted), pressed E, conductor line, train departs, IntroScene.

Scores (1-10): goal clarity 3, feel 6, art 7, story/dialogue 6, fun 3.

**BUGS**
- HUD objective shows the raw debug id `board_any_train` (top right, under "[Esc] pause"). Seen on platform screen. Should be a sentence.
- Title card "DREAMCATCHER / Crossroads Station..." appears at x~850 as Jo climbs the stairs, over the split-flap board and the "CROSSROADS STATION" bunting sign, so three overlapping pieces of text at once. Card also fires late (it should be on arrival).
- Hall wall layers: a translucent lighter band cuts horizontally across the green wall panel behind the information desk (y~250 in screenshot) and again across the platform area; reads as a misregistered haze layer, not as light.
- Pemberton dialogue fires on proximity with no input, freezing Jo mid-stride. Fine once, annoying on every pass (it did not repeat for me, but the first time it takes control away with no cue).
- Camera: at the top of the stairs the departure board is clipped by the top of the screen (zoom 0.62 -> 1 transition leaves the world half in view). Jo is ~20px tall at that zoom.

**REMOVE**
- The long empty walk from steps to platforms. 4800px at walking speed with no event.
- Overlapping signage: "PLATFORMS 1-4", "PLATFORMS 5-8", platform hangers, "TEA ROOM", "WAY OUT", "LEFT LUGGAGE", all at the same depth and size. It is a sign soup; Jo cannot read priority.

**CHANGE**
- Make the first screen teach: show "<- -> move, SPACE jump, E board" as a physical station sign or a one-time card, and put the first goal on screen ("Take any train").
- Trains are toys: Jo's head reaches the roof of the carriage. Scale the trains up 1.6x or the character down; a train should be a wall of metal you walk into. The boarding beat (conductor line then fade) is weak for the same reason: nothing physically happens.
- The conductor lines are good flavour ("Do you still want to be heard that badly?") but they are modal text on a static scene. Let Jo step on the train and the platform slide away behind him.
- Platform-to-dream identity is only in the sign colour. Each platform needs one big, unmistakable prop (a stove, a mic stand) at train scale.

**ADD**
- A physical "Departures" hub at the start so Jo does not have to guess the world is 4800px wide: a map strip or arrows.
- A skip-intro/replay marker for each caught dream's platform (spec says it exists; I could only verify the "NOT IN SERVICE" red tag on platform 3 and 8).
- Reaction to the player: Pemberton reacts only the first time.

**KEEP**
- The architecture: arched windows, brass bunting, green iron roof, warm lamp pools. This is the best-looking place in the game.
- The split-flap board and "NOT IN SERVICE" red tags: a clear read of "these are the dreams you can't take".
- Conductor's line pitch.


---

# 2. FIVE-STAR DREAM (chef)

**Trying to be:** a night in a three-star kitchen: alley, dry store, freezer (ice + valve puzzle), the line (rush orders), service lift, loft, arena (service), rooftop. Chef Aurelio never says "good"; the dream is catching approval from someone who cannot give it.

**Play log:** started from the hub intro (a flat parked-street cut-in with "LE REVE", Jo walking: forgettable). Marguerite's two-box opener auto-plays. Ran right: kicked by two rats immediately (no telegraph, hearts 3 to 2 in the first 30 seconds), picked up 3 coins. Reached the "wall-jump chimney" at tile 39/41 and stood there: the walls are plain grey slabs, no ribs, no card, no hint; the route is "stack up from the dumpster" and nothing says so. Teleported past it (noted) to sample every room. I died once by teleporting into a hazard at full invulnerability off: the game-over card played, "Try again" restarted the whole dream from x=112 (checkpoints never activated because I teleported) and replayed the auto-dialogue d0 with no skip. Sampled alley, dry store, freezer, the line, lift, loft, roof at invulnerable.

Scores: goal clarity 4, feel 5, art 4, story/dialogue 5, fun 4.

**BUGS**
- Arrival room, x~1236-1330: the "wall-jump chimney" is two plain solid walls (cols 39 and 41, 6 and 8 tiles high). There are zero climbable tiles anywhere in chefMap (`grep "'|'"` finds none), so the WALL JUMP card can never fire in this dream and the room is visually a pair of grey pillars. Jump is 145px; the wall is 192px; only the dumpster stair works, which the player is never shown.
- Objective text is wrong or stale: starts "find the service entrance", flips to "find saffron -> deliver to pass" in the alley (hundreds of pixels before there is any saffron) and never changes through the line, the lift or the roof.
- Death/retry: "You gave everything... and it slipped away. Do you really want to pursue this dream? [X] Try again [Q] Choose another dream" renders over a leftover "SLIDE UNDER" tutorial card (two text layers overlapping, tutorial card visible underneath the death card). Retry replays the full opening dialogue (d0) every time.
- Roof (vista zoom 0.8): the HUD is not zoom-compensated; hearts, DREAM title and objective shrink and shift inward off their anchors.
- HUD: the tutorial card "SLIDE UNDER" was queued while I was dead.

**What is wrong, plainly**
1. Art: every room is the same flat grey tile slab for the ground (three quarters of the screen is that slab, with no variation, grout, wear, or depth), plus one thin raised platform on stilts. The "dock", "dry store", "kitchen line", "loft" and "roof" all read as the same rooftop-with-scaffolding. Interiors are never enclosed. A kitchen game with no kitchen: no stoves, steam, pass window with heat lamps in front of Jo, only a dark brown wall and a few lamp bulbs.
2. Hazards read as chrome (little white spikes on the floor, "lamps" in the air). The rats and crawlers share a silhouette with background clutter; Jo took damage before the player can read them.
3. The alley opens to HP 3 and goes to 1 in about ten seconds of normal movement. Respawn is the start of the dream, not the checkpoint, if you have not touched a flag. Checkpoints are little pale blue flags that blend into the sky; at 4400 they float in front of dark bg with a faint blue pennant that you cannot tell is a save.
4. Gates in the data (g0..g2) are invisible walls until their `requires` flags are met; the player sees nothing change when he talks to Marguerite, so d0 "auto: true" is a hidden unlock that the player does not know is blocking him.

**REMOVE**
- The first two rats. Start with one rat that is clearly slow and visible.
- Chimney as-is.
- "Dream 03" label: Jo's chef dream is the first dream a new player picks. The numbering follows data order, not play order.

**CHANGE**
- Rebuild the ground per room: tiled kitchen floor (checker), delivery dock concrete with oil stains, walk-in freezer with frost rim, etc. Draw pillars/walls as bricks with a dark top edge.
- Make each section an enclosed room with a ceiling band and a back wall so the "background" changes with the room *and* the player sees the doorway he walks through.
- One objective string per section driven by flags, written like instructions: "Get the crates onto the plate (2)".
- Marguerite's first lines: "You're the new stage?" is nonsense for a player ("stagiaire" is never explained). Replace with a plain: "You're the stage? Intern. Fine. Saffron is in the freezer."
- Chef Aurelio payoff (d6): "Is it good?" / "...Next." is the right line. Everything before it is straight task dialogue. Move one Aurelio intercom line to the first room so the player meets the antagonist before the last minute.

**ADD**
- A real visible mechanic for approval: a "critic" counter or a stamp so that the theme (approval you cannot have) is in the HUD, not only the last line.
- Frame animations on the people (Marguerite appears as a still portrait; the cooks in the line are static).
- Sound: kitchen ambience changes with room (sizzle, compressor hum). The current music director changes bpm only.

**KEEP**
- The dream's last beat (empty dining room, lamps click off).
- Ticket-rail concept; conveyor and dock-hand idea; the three Small Moments (onion cook, cat on warm pipe, Bastien singing). They are the best writing.
- Coin as "brass tip": the money is flavourful.

---

# 3. THE BIG STAGE (musician)

**Trying to be:** Jo's own dream, the longest and most personal (spec: seven "days", 15-18 minutes): open mic at the Blue Cellar, busking, the basement band, the road, the studio and Mr. Tally's offer, the festival, backstage after. Theme: being heard vs being listened to.

**Play log (partial, honest coverage):** Opened with Jo's one-line d0 ("Saturday. Big stage. That's... that's the whole thing."), ran the street, grabbed coins, read the control strip. Teleported (noted) to the Blue Cellar, the corner busk room, then back to the cellar gig at world x~2256 and pressed E: the gig started (call-and-response, four dots at the top, "phrase 1/6 = listen..."). Pressed Q in the corner room: a sound-ring appears with a floating pink text bubble ("(the valve sticks)"). I did not play through the road, studio, festival or backstage; the data shows they exist (gigPavilion, gigBigStage, Mr. Tally, the wing). My notes on those are from the code/spec only.

Scores: goal clarity 5, feel 6, art 5, story/dialogue 7, fun 5.

**BUGS**
- Objective stays "get to The Blue Cellar" while you are in the corner room 40 tiles past it, in the busk, and with a 0/12 busk counter on screen. The objective only changes when a gig starts.
- Background change: walking east out of the cellar room the whole backdrop (rooftops with a "THE BLUE CELLAR" sign and rail) swaps for a harbour skyline with two huge sails (mid layer) inside about half a second; the sails are in a city street. The cellar sign hangs in mid-air at the edge of the screen while the new bg fades in beneath it. See the cross-cutting parallax section for the code cause.
- Opening street: three different visible sign texts "THE BIG STAGE" (festival banner, marquee, HUD title "DREAM - THE BIG STAGE" which sits on top of a wooden world sign so the HUD looks like it is hanging on the scenery in the corner room).
- A faint lighter vertical rectangle (a haze layer edge) appears at x~345 of the first street screen at the top of the sky; reads as a texture seam.
- Echo ring + pink dialogue overlaps the player, the hint strip and a second tiny text. Hard to read.

**What is wrong**
1. "The Blue Cellar" is not a cellar. The cellar room is an open street with nine grey folding chairs, a tiny sign and no enclosure. No stage, no light, no sax-man silhouettes. The gig's emotional premise (nine people and a bartender) has no room to land: the chairs are drawn as outline rectangles; the nine "people" are one standing NPC.
2. The gig UI is a small box floating top-centre (four yellow dots, "phrase 1/6 = listen...") above a street scene. It is a UI-on-top game, not a gig. The camera does not push in, the lights do not dim, the audience does not react visibly.
3. Rhythm/Simon is the right verb for a trumpet dream but it appears to be the same four-dot call and response for every song. A musician's dream needs the verb to evolve (rest, swing, solo, hold a note).
4. The hint line "[Q] play · [E] interact/case · [F] call mic" is faint grey at the bottom for the whole level; three keys, no tutorial. Q does something different in the corner (a sound ring that interacts with the world: "the valve sticks") vs the gig vs bridging gaps (sound bridge). Fine idea; undersold.
5. Ground is a sandy brown flat slab (same family as chef's grey slab). Again three quarters of the screen is flat tile.

**REMOVE**
- The duplicated "THE BIG STAGE" text on screen.
- Any gig that repeats the same four-dot Simon.

**CHANGE**
- Make the gigs rooms, not UI. Cellar = actually below ground (darker, low ceiling, one blue light, nine chairs filled with silhouettes that perk up as you hit phrases). Camera zooms in during a gig; HUD fades.
- Corner: actual cold: puffs of breath, snow/rain, passers-by that walk past (and one that stops: the kid).
- Update the objective at every flag: "Play the corner: 12 coins" etc.

**ADD**
- Trumpet hold: show the note on screen as notation, not as dots.
- A visible crowd meter that is the audience (heads), not a bar.
- The offer from Mr. Tally needs a fork with a visible cost (a choice screen), per the spec.

**KEEP**
- The story arc is the best-written of the original three dreams (basement with Nia and Marcus as the emotional centre; Old Sol's bench; the kid at the corner; Ray's "notes, not music").
- The trumpet verb itself: sound as a mechanic that reshapes the world (ring, ladder, bridge).
- Jo's first line.

---

# 4. THE QUIET ABOVE (astronaut)

**Trying to be:** the "Soul" version of an astronaut dream: a gym with three-pip stats, the selection board, a rejection, Priya gets in instead, Jo is selected a year later, launch, docking, the coolant leak, EVA with a tether, a moon walk (one-sixth g), a rescue of Priya in a crater, and a "walk." coda in a field. Spec'd as three gravities.

**Play log:** booted every `?at=` phase (gym, gate, pad, station, eva, moon, crater, field), dismissed dialogues, ran right at invulnerability and walked the field to its end. Tried the zero-g shove in the station (hold arrow + Space). I did not play the gym stat puzzles, flashcards, the board quiz, the centrifuge, the pool, the sim, the shelter or the launch through to completion; I judge those from the phase list and screenshots. Per-phase screenshots only.

Scores: goal clarity 6 (the objective line is the best in the game), feel 5, art 4, story/dialogue 8, fun 5.

**BUGS**
- Pad (`?at=pad`) and station (`?at=station`), moon: large dark rectangles stand in front of the scene, several hundred pixels wide and the full screen height (x 0-200 and 340-375 and 500-540 of the 560px shot). They look like unlit foreground columns, but they cover the actual gameplay (the launch pad, the rocket, a ladder) and make a "map-edge" look: the screen is tiled with strips of different brightness. This is the foreground (near) layer / room wall band rendering at the wrong height, or room tint overlays, not a designed cover. Strongest instance: pad.
- Crater (`?at=crater`): a solid grey block floating in black with a translucent striped lighter column on it; Jo stands on an unrelated dark ledge. There is no ground read at all, the screenshot is a few grey rectangles in the dark.
- Dev text "[dev] warped to ..." is left over the HUD (only on warps; but it is in the player build).
- Zero-g room ("NO FLOOR HERE... aim with the arrows, then shove off a surface") puts Jo on a flat grey floor. He walks along it with his feet planted, so the card lies: nothing floats. The shove moved him ~150px on the floor, y never changed. Zero-g needs to look like zero-g (no ground contact, drift, rotation).
- Objective "the coolant leak - follow the droplets": there are no visible droplets in the first screen; the red dots at the pillars are the only clue and they are tiny.
- HUD overload in the station: hearts, O2 bar, PWR bar, radio meter, tether, COMMS [F], objective, coins, a mini sat icon, a control-hint strip at the bottom in tiny low-contrast type that overlaps railings. Six different readouts in 100px of top-left.

**What is wrong**
1. EVA (`?at=eva`): the prettiest idea of the dream and the thinnest art: a grey bar across a black void, a lone planet at the bottom, a few pickups hanging in space. The spec wants the station truss, the array, the tether line; none of it reads. The tether (a life mechanic) is invisible at this shot.
2. Moon: grey slab, a dark column, silhouettes of nothing. One-sixth gravity is the only change. Colour palette is the same grey as the gym.
3. The gym (first thing the player sees in this dream): a stat panel (LUNGS/GRIP/LEGS/NERVE with dot pips), a ledger of tasks, an old-brown wall, a grey slab floor. "Reach 3 pips in every stat" is a chore list. The first minutes of an astronaut dream are a gym with a coach saying "Don't touch the good bag", and after you fail, you grind again. The pacing risk is that the dream's most interesting parts (EVA/moon/rescue) are 70% of the way in.
4. Field ending (`?at=field`) is the best shot: a green meadow, a truck, a red-coated figure, a falling Jo. "walk." as the objective is perfect. Text "Osei, from the truck, not on radio: '...Good.'" plays in a floating caption above Jo's head, small and low-contrast.

**REMOVE**
- Dev warps' on-screen text in release builds.
- Any HUD readout that is not safety-critical at that moment (hide O2/PWR on the ground; show tether only on EVA).
- One of the two preliminary chores: either the gym stats or the flashcards/Board quiz. Keep one clear failure (the Board says no) and a time skip.

**CHANGE**
- Give every phase its own palette and a ground that is not the same grey slab: gym = warm rubber floor, centrifuge = bolted steel, pad = concrete + gantry; station = white module panels with rounded windows; moon = grey regolith with long shadows and a black sky; crater = rim light.
- Make the dark foreground bands intentional: draw gantry girders, cables, window mullions, not blank dark blocks, or remove.
- Make weightlessness visible: slow rotation, no floor contact, particle trails, hair/hat floating.

**ADD**
- A single readable "radio" voice, subtitled in a fixed place (a captions bar), not floating near Jo.
- A big clear visual for the tether (a line to the hull) and one danger icon per hazard.

**KEEP**
- The writing. Priya ("You carried me for a kilometre." / "You carried me for a year."), Halvorsen ("Your numbers were your numbers. Good numbers, this time."), Osei's "Copy." The notebook pages, especially page 5, and the Small Moments ("Everyone he'd ever met was in the window.").
- The idea that rejection comes first, then acceptance, then a rescue; and the field ending with "walk."
- The objective line style: short, instructive, in-voice. Use this across all dreams.

---

# 5. THE SECOND DRAFT (writer)

**Trying to be:** Jo as the unpublished novelist: attic (the pen verb: strike an adjective under a label), copy shop, cafe, library (five sources), post office, night bus, rain, rewrite, the Inner Editor chase, agent, city, the press (ride the paper: ink, press, fold), reading at the lectern. The dream spec is the most mechanically inventive (words as platforms, an editor that erases what you have crossed).

**Play log:** booted 9 of 13 warps (attic, copyshop, cafe, library, bus, rain, editor, press, reading), ran the attic and cafe at invulnerable, pressed E at the jammed typewriter. I did not complete the typing rhythm, the rewrite chase or the agent/city phases.

Scores: goal clarity 4, feel 5, art 6, story/dialogue 7, fun 6.

**BUGS**
- Attic: objective says "write chapter one (12 pages)" and the typewriter is labelled "jammed typewriter". Nothing tells the player how to unjam it; E next to it gave no card or response in my run (the first attic screen has a "working" and a "light" label above scrap items; the pen-mechanic card has to be earned first). A new player will stand at the typewriter and press E.
- Attic and copyshop: the left half of the screen is a dark, empty, ungrounded vertical-band background; the attic room is only ~half lit. It reads as unfinished or as the room transition not having completed, a visible seam between a lit room and a black void. Same in the editor room where the entire left 45% of the screen is a brown diagonal staircase mass (stacked brown slabs) against a pale grey-beige sky.
- Copyshop: the ground profile is a huge diagonal brown block that fills the left of the screen; the "stairs" are 20+ tiles of identical brown slab; the "COPIES - 5c" banner floats; the copyshop never reads as a shop.
- HUD text stack at left: "[working] [light]" tag line, ink bar, DRAFT pp., hearts, DREAM title: 6 elements in 80px, overlapping labels above world objects ("working", "jammed typewriter", "light") in tiny text. Reading the labels while moving is impossible.
- Press scene: a red "FRIDAY 5:55" clock hovers at top-centre over the HUD with the objective text; three layers of text.

**What is wrong**
1. The writer's mechanics are hidden behind tiny floating labels. The "pen" verb (strike an adjective under a label to change the world) is brilliant but is taught by a card ("THE PEN: stand under a label and strike its adjective") and then by 6-pt text labels. The player needs one big, slow, scripted moment where a "heavy" door becomes "light" in the middle of the screen.
2. Same brown slab ground as the musician (hue-shifted). Rain level (night bus, rain) is the best looking: slanted rain lines, a lit bus stop, hanging ropes and steeple silhouettes, and a hanging "N" sign. Press is also good (the wheel, the girders, yellow ladders, red alarm clock).
3. Reading (final): a single lectern and six audience figures in a row on the floor, drawn all the same size, at the same height, facing the camera, no depth. The pay-off (the reading) needs a stage, a light, and faces that react.
4. The editor room is a pale grey-beige "office" sky with a red banner and a red railing: it changes tone entirely from the sepia library. Good idea (the editor's world is bloodless), executed as a flat colour fill.
5. Text readability: labels are 6-7 px, shadowed; "[working] [light]" in the top-left is a status string that means nothing until you have found the verb.

**REMOVE**
- The status line "[working] [light] [honest] [wide] [quiet] [fixed] [true] [low]" under the HUD title at the library (it is a debug-looking list).
- Second HUD clock when the objective already tells the time.

**CHANGE**
- Make the adjective strikes a scripted first beat in the attic: the jammed typewriter blocks the door; striking "jammed" -> "working" on the label above the typewriter is the tutorial. The first word on screen should be bigger than any other text in the game.
- Give each place a different floor: attic planks, copy-shop lino, cafe tiles, library parquet, bus shelter wet asphalt, press concrete, lectern wood.
- Rework the editor chase so that the left half of the screen is not a staircase of brown.

**ADD**
- Typed words on screen that trail Jo, so the "writer" fantasy is in the animation (inkblots at each footstep, page flutter on jump).
- Scene punctuation: a short title card per place ("THE COPY SHOP, 3 A.M.").

**KEEP**
- The press level concept and look.
- The rain/bus night: the first place in the game where weather is doing mood work.
- The writing: the best dialogue after the astronaut; anything in the library about sources.
- The idea that words are objects with adjectives.

---

# 6. THE YELLOW HOUSE (painter)

**Trying to be:** "the dream that looks like nothing else": a post-impressionist level in seven canvases (studio, fields, cafe at night, quarrel, wind/emptied palette, garden, cypress, Isak's room), with a brush verb and paint wells (yellow, blue, green, red, violet) that change the world. It is also the first dream that deals openly with poverty, loneliness and a hospital.

**Play log:** booted `?pt=arrival` and played it live (dialogue, 300 frames of running with jump bot, saw the first ladders and the house enclosure); then warped to studio, fields, cafe, roofs, wind, cypress (invulnerable, dialogue skipped). I did not paint canvases, collect wells or finish Canvas 1; the brush interaction was never exercised ("[E] paint the front wall - yellow" is the first prompt visible in the studio).

Scores: goal clarity 6, feel 5, art 6, story/dialogue 6 (spec), fun 5.

**BUGS**
- Ground: every room's floor is a patchwork of brown and grey squares at random sizes (looks like camouflage). It is the same tile pattern in arrival, studio, fields, wind, cypress. The painted-world promise is broken exactly where the player stands. There is no visible brush stroke in any tile.
- Arrival at x~1227: the right half of the screen turns into a large black translucent rectangle (the house interior) with dark ladders; the edge is a hard vertical line, with no door frame; the "house" is a black hole, not a yellow house.
- Dev text/status: HUD shows a "07:00 - dawn" clock, "day" and canvas counter, "EXTRA: 3 canvases" stack at left; plus a hint line; plus the paint wells bottom-left. Many readouts; 6-7px type.
- Cafe at night: the dialogue label "the cafe at right. Madame Ginoux." in the objective suggests going right; the player is dropped with no cue about Paul's absence; at x~330 a "moon" light halo and a lamp are drawn as soft discs in the sky and one overlaps the NPC label.
- Cypress: the objective string includes an in-world hint in brackets "(the crows roost; violet hides.)", which is nice but is clipped at the right edge.
- Roofs: the black-blue swirling sky is so busy the platforms (small tan blocks) are hard to see; coins vs window lights vs stars are all small yellow discs.

**What is wrong**
1. Only the sky is painted. Buildings are flat brown or sand-coloured boxes with a few windows; the characters, ladders, flags, platform blocks are crisp, flat pixel art. When the player stands on the camo floor in front of a painted sky, the contrast makes both look worse (sky looks "wallpaper", floor looks "unfinished").
2. The sky swirl is a tiled bitmap at one scale; it repeats at the same size in every room (same swirl size, different hue). A painter would vary stroke size and direction and let the strokes follow forms (a cypress flame, a halo around a lamp).
3. Colour wells and the palette strip are the best UI in the game: three icons with a letter, readable. The "brush" verb needs the same quality of presentation (a streak that visibly paints).
4. It's close to a pastiche of one famous painter, its title (The Yellow House), the postman, the friend from the north, the dealer brother Isak, the cypress, the sunflowers/cafe at night, the ear-free hospital. The dream's emotional writing is strong but the borrowed iconography is so literal that Jo disappears; he is "an actor playing a painter in a painter's life".

**REMOVE**
- Camouflage ground tiles.
- At least one of the readouts (clock, day counter, canvas counter, EXTRA canvases) from the HUD: keep a single "canvas 3 of 10" token.

**CHANGE**
- Paint the world, not just the sky: tile edges with a brush-stroke mask; give grass, wheat and cobbles directional strokes; draw buildings as 3-4 colour shapes with visible daubs and outlines, not flat rectangles.
- Characters: give Jo a painter's smock and a palette in the idle animation, and render NPCs with thick outlines.
- Vary swirl scale per room and make the swirl react to the brush (when Jo paints, the nearest sky swirl brightens).
- Differentiate Jo's biography from the real painter's: make Isak a sister, shift the town, rename the objects. Tell it in Jo's voice.

**ADD**
- A large paint-the-wall moment as the first beat: the front wall changes from drab to yellow with a visible wipe.
- Light that behaves like paint: halo rings around lamps with visible strokes.

**KEEP**
- Swirling sky as a concept.
- The palette-well HUD.
- The emptied-palette act (wind): the world draining to grey while your inventory is empty is the strongest mechanical expression of the theme in the game.
- Roulin's role; Isak's letters; "ten canvases in ten days".

---

# 7. THE LAST HAND (gambler)

**Trying to be:** the darkest dream (a casino called THE MERIDIAN, 24 hrs): floor (slots), pit (dealer/21), cage (cash out), Lou's table, lounge and Mr. Favour, billiards, back rooms and the three-cups, pawning the trumpet for a marker, poker, dawn, bus stop, the last hand between two cars, a lost-and-found box. Mechanic: chips vs hearts; bet/odds printed on the room; "no horn" (no shove, no noise) for the last third. First time the player cannot use Jo's trumpet.

**Play log:** booted `?gm=arrival` and played it live; warped to floor, pit, cage, billiards, cups, poker, sal, lostfound. Pressed E at the pit with no result I could read. Did not play a bet, a reel, the wheel, the dice bridge or the marker; judgement is on look, HUD, structure and the objective strings.

Scores: goal clarity 5, feel 5, art 6, story/dialogue 6, fun 5 (not tested).

**BUGS**
- Ground is the same red damask carpet in every room, including the carpark, the bus stop at dawn, and "a table between two cars" (`?gm=sal`, `?gm=lasthand`, `?gm=lostfound`: a cardboard box at a bus stop standing on casino carpet). The pattern is a high-frequency diagonal hatch, moire-y at 1x, and dominates 60% of every screen.
- Left HUD is a wall of text by the later rooms: "JOSH-ROLLER KEY", "CHIPS pending 0 · real $0", "MARKER ||||||||| 10", "[E] BET", plus a scrolling room-caption. Five lines of 6px type, stacked over the first screen of play.
- Objective text at top right is dark grey on dark background (arrival: "the door. one chip."); virtually unreadable at the default scale; it is the only goal communication.
- Pit: the small-moment caption ("The staff corridor ... twenty years on a corner" / "Twenty years on the corner") fades in over the floor/carpet at the bottom of the screen in 30% grey: unreadable against the hatch pattern.
- Lounge / billiards: a "tiny marker" "[E] hide" prompt next to an NPC reading "!" with a spotlight cone is the only hint that the guard sees you.

**What is wrong**
1. The Meridian sign is great and then the level forgets it. The first screen (rain, neon, the door, one chip) is the most cinematic frame in the game; the interiors are smaller, flatter, and use the same hatched carpet under everything.
2. Four mechanics in a row are "numbers on a prop": bet, deal, reel, wheel, dice. If each is a different UI-on-top minigame (the cards flash above a table), it starts to feel like an arcade rather than a platformer. The real hook (the printed odds and the house wins ties; hearts as stakes) is good, but nothing in the first screen explains why Jo is betting.
3. "No horn" is where the dream earns its theme (Jo loses the instrument), and it is announced by a card ("NO HORN: no shove, no noise. checkpoints by touch"). The loss should be performed: the pawn shop, the case on the counter, an empty hand in the idle animation.

**REMOVE**
- The carpet-hatch ground outside the casino.
- At least two of the left-hand HUD lines (marker pips and chip counts should be a single icon row).

**CHANGE**
- Make each place read in one glance from its floor: casino carpet inside the casino only; wet asphalt (with puddle reflections) in the carpark, bus stop, last hand; linoleum in the back rooms.
- Raise the objective text contrast to match the HUD title.

**ADD**
- A visible "house wins ties" tell: the dealer's hand covers the tie.
- A hollow, funny first-time bet that the player cannot lose, to teach the system.

**KEEP**
- The neon arrival and rain.
- The room-by-room titles ("three rooms. no numbers.", "a cardboard box", "dawn. the cage, the bus."): these are the best objectives in the game.
- The idea that the dream is cruel in a way the others are not; the structure (pawn the trumpet, marker you cannot pay) is the strongest arc outside the finale.

---

# 8. THE LONG EVENING (finale)

**Trying to be:** "the only fully beautiful place": a nameless town at golden hour that never darkens (arch "you're here.", orchard, laundry, square, canal, steps, roofs, school, gardens, hill, station), then a road out of town where the dusk finally comes (fields, lake, stars, foothills, pines, stream, switchbacks, treeline, ridge), a dog that follows, and "her" who walks beside Jo. No objective, no HUD, no enemies; the only verb is *help*.

**Play log:** booted `?ev=begin` (start of the level) and ran 400 frames; warped to square, canal, roofs, station, lake, ridge and looked at each. I did not play the small helping moments (the laundry, the tune, the kite) or the ending sequence.

Scores: goal clarity 7 (by design), feel 6, art 8 (backdrop) / 4 (foreground), story/dialogue 7, fun 6.

**BUGS**
- The HUD is not absent as the spec says: hearts, an ink-like bar, and a "THE LONG EVENING" title are drawn faded at top-left, the "[Esc] pause" top-right and a "- -" objective glyph. They are faint but present; the spec promises "no hearts, no coins". Also the faded coin/wallet readout is visible at top centre right of the first screen.
- "[dev] roofs" caption floats in the sky at the roofs warp.
- Foreground: the ground is a flat brown (first screen, the lake, the hill) or flat sandstone block with no props (square, roofs, station): a brown rectangle that begins and ends with hard right angles in front of the best background in the game. In the first screen a brown slab hovers in the top-left as a "ledge" with a hard edge and nothing under it.
- Text above people ("lark ve: pocket a pigeon feather", "Don't panic", "It's got the whole sky in it. Show-off.") is 6-7px white-on-clear and overlaps other captions when two characters talk.
- Lake: the left half of the screen is solid brown dirt. The lake itself is a pink-mirrored pool, very pretty, in a brown cut-out.

**What is wrong**
1. It is the only place in the game where the player's eyes are asked to do nothing but look, and the foreground cheats them. Jo is 30px tall in a 600px-wide vista; with those proportions he is a speck. A "be with" level needs close faces.
2. People are drawn the same size, in the same flat pose, standing at the same height, in a row (square: seven standing figures along the baseline). There is no depth layering (no one in front, no one behind).
3. The pacing gamble: a town (~400 tiles) followed by a second 400-tile road. The first has no event-based waymarking; the "you're here." sign sets the tone but then there is nothing to tell the player to keep walking east. It must be extremely tender to avoid "is anything happening?".

**REMOVE**
- All of the HUD (really), the dev captions.
- Coin readouts.

**CHANGE**
- Replace the foreground slab with a painted foreground: cobbles with grout, grass tufts, wheel ruts, scattered leaves.
- Zoom camera in (1.4x) for conversations.

**ADD**
- Full-body portraits or close-ups for "her" and the dog.
- A visible way home: the station behind Jo at the end.

**KEEP**
- Everything about the sky: sunset, long cloud, mountains, then dusk, stars, a crescent moon, aurora. It is the single most impressive thing in the game.
- The town silhouette: warm stucco palette, red roofs, a minaret-like tower, balconies with laundry, boats on the canal.
- The "you're here." sign.

---

# CROSS-CUTTING

## A. Art direction and detail

What the owner said ("detailing is not up to mark") is true and has one dominant cause: **the ground**. In every dream except the Evening backdrop, roughly 40-60% of the screen is a single flat, autotiled slab:

| Level | What the player stands on |
|---|---|
| Hub | pale limestone block, soft, well lit (fine) |
| Chef | flat grey brick slab; same grey for alley, freezer, kitchen, roof |
| Musician | tan/brown slab |
| Astronaut | grey slab (gym, pad, moon, field) |
| Writer | brown plank slab, huge diagonal staircase "hills" |
| Painter | brown/grey random-square "camouflage" |
| Gambler | red hatched damask carpet, even outdoors |
| Evening | flat dirt/sandstone |

Tiles have no top-edge highlight, no grout/wear/dirt variation, no props growing out of them (grass, puddles, cables, trash), and no under-surface (the "inside" of the ground is the same colour as the top). Backdrops (sky, silhouettes, landmarks) are clearly better crafted than the stage Jo walks on, so the eye reads the foreground as a placeholder.

Other detail problems:
- **Scale.** Jo is ~44px tall on a 960x540 canvas (about 8%), people and foes the same. Trains, doors, pianos and rooms are drawn toy-sized next to him (hub trains: his head touches the carriage roof). Rooms are 16-20 screens of flat corridor, so there is nothing to see at eye level.
- **Silhouette/readability.** Hazards (white floor spikes, roaches, coins, lamp bulbs, cloud-puffs, windows) are all small yellow/white/brown dots. In the roof and astronaut screenshots I could not distinguish coin from window light from star.
- **Sameness of language.** Pickups, labels, signs, dialogue, hint strips all use the same 6-8px monospace type (see UI section).
- **Rooms that do not enclose.** The Chef kitchen, Blue Cellar, copy shop, cafe, library, house, casino interiors are all drawn as open sets in front of a backdrop; there is no ceiling/wall/doorway layer, so "entering" a place never occurs. A door/transition framing would fix a third of the complaints at once.
- **Lighting is the one thing that already works** (hub lamps, cafe spot, gambler neon and spotlights, Evening sunset): extend it to the foreground (rim light on tile edges, shadow under platforms, light pools that land on the ground).

### The background "snapping" problem (verified in code)

Where: `src/scenes/BaseLevel.js` `updateMusicRoom()` (line ~468) calls `this.parallax.setRoom(room)` the moment `RoomBuilder.roomAt(rooms, player.x)` changes, and `src/builders/parallax.js` `setRoom()` (line ~1067) does the swap. Why it looks like a sudden change:

1. **Triggered by the player's x, not the camera.** The room changes when Jo's centre crosses the room's column boundary, but the camera shows about +/-480px around him. So the old room is still half the screen when the *entire* backdrop (sky, far, mid, near, landmark, scenery) crossfades to the new room's set. The viewer sees the whole picture change in the middle of the screen, not at an edge that scrolls past.
2. **The fade is a 550ms tween on full-viewport layers.** Every layer is a screen-wide `tileSprite` (scrollFactor 0, `tilePositionX = scrollX*f`), not a world-anchored piece of art. There is no "seam in the world" to cross: layers are replaced wholesale. (In my screenshots: chef arrival to alley, musician cellar to corner, writer attic with half-black left, astronaut pad/station dark vertical blocks.)
3. **The vertical position snaps, not fades.** In `update()` each layer's y is set to `this.current._horizon` every frame; `_horizon` is computed per room from its own grid (`horizonOf`). Rooms with different floor heights make every layer jump vertically on the exact frame `current` changes, while only the alpha is tweened.
4. **No hysteresis.** Standing on a boundary makes it flip each frame as Jo steps over the line (and the tween restarts).
5. **Scenery and landmark are rebuilt per room** (`buildScenery`, `drawLandmark`) and retire/fade only over the same 550ms, with a `rand.between` layout seeded by room id, so props pop in at screen-relative positions.
6. **The sky is replaced per room** (`ensureSkyTexture(bg.far)`), with distinct colours (e.g. chef 'city' night to 'frost' to 'pans'), so the sky colour itself steps.
7. **Hidden tab:** tweens are time-based, so under my stepped harness they behaved but in a real session a stalled frame leaves a half-faded backdrop; not a real-world bug but fragile.

Recommended fix: cross-fade by *distance to the room edge*, not by event (blend factor = smoothstep of player.x over a 400-700px band centered on the boundary), keep per-room horizons but lerp `horizon` instead of snapping, anchor each room's far/mid art to world x with a long feather at both ends, and make the transition a physical thing (door, tunnel, fog bank, wall) in the foreground so there is a reason for the change. Also add 1-2 tiles of hysteresis.

## B. Checkpoints, saving and goal communication

- **Checkpoints are an unlabelled pale-blue pennant.** The same flag sprite appears in every dream (`flag` -> `flag-lit`), floats in front of dark and light backdrops with the same low contrast, and nothing is said when you touch it except a sting sound. In the screenshots I could only find them by hunting for a blue dot. A new player doesn't know it saves, doesn't know what it saves (coins "banked" per `coinsSinceCP`, position only; flags/inventory are separate), and doesn't know what happens if they skip one.
- **Density is arbitrary:** Painter 19, Astronaut 15, Writer 15, Musician 12, Gambler 11, Chef 7 (over 320 tiles, so about one every 45), with no relationship to difficulty or length. Chef's 7 flags + "full restart" on first-death (before any flag) make its opening harsher than the Painter's.
- **The "random places" feeling is real:** checkpoint objects are placed at room ends (CP0 at col 23 right before the gate, CP1 at col 79 before the gate), but gates only open by flags the player cannot see, so a checkpoint is often the *only* visible landmark before an invisible wall. It reads as "the save flag is here because the level ends".
- **Death flow:** "You gave everything... and it slipped away. Do you really want to pursue this dream? [X] Try again [Q] Choose another dream" interrupts (and in Chef overlaps a stale tutorial card). Retry replays the whole auto-dialogue. Dying should not offer to leave the dream in the first 3 deaths, and it should restore in <1s at the last flag.
- **Objectives are the other half of the problem.** Quality varies enormously: Astronaut/Gambler/Painter strings are short, in-voice, and update per phase ("the pad, before dawn", "three rooms. no numbers.", "the crater. her signal is one pip."); Chef and Musician strings are stale (chef never updates after the alley; musician says "get to The Blue Cellar" while you are in the corner room). Hub shows a raw id `board_any_train`. Gates (invisible walls) never announce what they need.
- **Fix:** one `GoalLine` system, written per flag; a visible gate that says what opens it ("needs: saffron"); make checkpoints big, lit, labelled once ("SAVED"), animated (flag unfurls) and placed at the *start* of a hard section, never at the end of an easy one; show a small icon in the HUD for "last saved".

## C. Character art and animation: what a frame-based multi-view set needs

Today Jo is a procedural pixel-grid texture (`src/entities/jo.js`): 8 walk frames, stand, idle-b, one `RUN` frame (= walk frame 0), one `JUMP`, one `FALL`, a "bare" (no hat) variant, flipped for left; side view only. NPCs/foes are mostly single frames or small rigs (`foes.png`, `hub.png` atlases exist, so a PNG atlas pipeline is already in place). There is no crouch, land, turn, hurt, climb, carry, push, hide, play, or death frames in Jo's set; the HUD says Jo "crouches" and "slides", and I saw those only as scale squashes.

**Jo needs (side view, plus a 3/4 front for dialogue):**
idle (breathing, blink, look-around variants x3), walk (8), run (8, distinct from walk), jog/carry, start-run/skid-stop, turn, jump (anticipation, rise, apex, fall), land (soft/hard), crouch idle, crouch-walk, slide, wall-slide, wall-jump, ledge-grab/hang/pull-up, climb ladder (up/down/idle), hurt/stagger, death/fall-asleep, interact (reach), pick up/carry (box, crate, plate), push, hide (cover), play trumpet (stand, kneel, walk-while-playing, long note), brush stroke (painter), type/strike pen (writer), tether reel/zero-g float/shove-off (astronaut), bet/slap card/hand over chips (gambler), sit on bench, sleep, look up, wave, hug/lean (evening, with "her"), walk-with-hand-held, dog-pet. Each also in 'bare' (no hat) and per-dream outfits (chef whites with apron; smock; spacesuit; suit/dealer; coat; hat-less). Also an expression/portrait strip (neutral, smile, doubt, tired, afraid, relieved) for dialogue boxes, at 64x64 or larger.

**NPCs (per character):** idle x2, talk (mouth cycle), walk x6, one gesture (point, shrug, hand over), react (startle, laugh, nod); portraits with 4-6 expressions. Recurring characters (Pemberton, Ro, Bilal, Marguerite, Aurelio, Nia, Marcus, Ray, Old Sol, Mr. Tally, Priya, Halvorsen, Osei, Roulin, Paul, Isak, Lou, Mr. Favour, Sal, "her") should keep the same face across their appearances (hub intros, dream cameo, evening).
**Foes:** two-frame idle, 6-frame move, windup (read in 0.4s), attack, stagger, die/flee; each foe family has a tell colour.
**Pipeline suggestions:** one spritesheet per character (PNG atlas + JSON animations), one source frame size (e.g. 64x64, Jo 48px tall inside), 3/4 and side, export script shared for all; frames named `char/anim/frame`. Keep the existing rig/atlas compiler if it can output hand-polished PNGs; allow artists to overwrite any character atlas without touching code.

## D. Dialogue and writing

- Tone and voice are the game's strongest asset: Priya/Halvorsen/Osei (astronaut), Aurelio's "...Next.", Marguerite, the prep cook who "wasn't crying about anything", Ray's "notes, not music", Pemberton's ledger, and the gambler's room titles. The Small Moments are consistently the best-written lines. 
- Delivery is the weakest part: every conversation is a bottom-of-screen box (a third of the screen) that blocks play, types slowly, and requires X to advance; some auto-fire on proximity and freeze Jo mid-stride (hub Pemberton, chef Marguerite d0, musician d0). On retry they replay.
- Too many first lines are "setup": Marguerite's d0 explains the plot before the player has moved; "You're the new stage?" is jargon. Open on action; deliver exposition in 6-word radio barks while the player is moving.
- The "dream is not enough" beat is the same note in every dream (empty room, lamps off, "Next."). By the fifth repetition the player knows the twist; vary it (the painter's sale; the gambler's win that costs; the writer's reading with one listener).
- Introduce "the Counter" earlier and with a face; the villain is a gate in the hub and a plot device in the design doc, not a presence the player sees.

## E. UI, HUD and typography

- All 194 text objects use `fontFamily: 'monospace'` (the browser's default mono). The project's own `dreamcatcher-ui-type` skill calls for authored bitmap fonts; none are used. The result is smooth, anti-aliased system type at 6-13px on a pixel-art game, with inconsistent weights and no shadows, so text is the roughest-looking thing in the picture. The hub's split-flap board and the platform signs are the only places a "designed" type face appears.
- HUD density rises with each dream: hearts, dream title, objective, coins and cents, tool bars (ink, paint wells, tether, chips/marker), tag lists, clocks, control hint strip. Left-column stacks of 5-6 lines in the Writer/Gambler overlap gameplay. Objective text at top right is small and in several levels low-contrast grey (gambler) or fades in/out.
- Hint strip at bottom ("[Q] play · [E] interact/case · [F] call mic") is faint grey and never goes away; the Astronaut variant overlaps railings.
- Tutorial cards pause the game with a modal; good idea, but they sometimes appear *on top of* death cards (Chef), and each is a different layout.
- World labels (6px above objects: "working", "light", "loud machine") are too small to read in motion.
- Missing: a map/inventory/journal; a pause menu with controls; a settings screen (music toggle exists as "[M] music: on"); subtitles at a fixed place for radio lines; no "continue/new game" because the game opens straight into the hub.

## F. Audio

I could not listen in the hidden pane. From code: all sound is procedural Web Audio (`src/systems/audio.js`): trumpet/accordion/bass synth notes, coin sfx, `MusicDirector` that changes bpm/state per room, stings for checkpoint/hurt. Strengths: in-fiction sounds (trumpet as verb). Risks/needs: synthesized beds will sound identical across dreams unless each has a motif; no footsteps by surface, no ambience layers per room (kitchen sizzle, casino floor, wind, canal water), no voice/mumble for characters, no distinct death/respawn feedback, and music mixing is by bpm only. A final-evening score with real instruments (even a single recorded piano/guitar loop) would help the finale a lot.

## G. Onboarding

- Start of the game: no title, no controls, no goal. The hub spawns Jo in the far left corner of a 4800px hall; the first obstacle is a stair the player must jump with no hint; the objective strip is a debug id. The first teaching happens only inside the first dream (and even then through small cards).
- Each dream re-teaches shove/hide/jump with a card. No shared "boot-camp" and the first dream a player picks is random, so chef (hurt in 10 seconds by rats) is a harsher first minute than painter or astronaut.
- Add: a 90-second tutorial street (as DESIGN.md originally specified: curb, low pipe, busker, gap) that ends at the station steps; controls shown as a sign in the world; the first platform pre-highlighted.

## H. Difficulty

- Chef: 3 hearts, roaches and rats in the first 12 tiles; I lost two hearts at ~30s. Death resets to the start of the dream if no flag touched. Spikes/hazards unforgiving without telegraphs.
- Musician: gentle platforming, gig difficulty unknown; likely the highest skill ceiling because of rhythm accuracy.
- Astronaut: stat grind (3 pips x 4 stats) is a time-gate, not a difficulty; EVA tether is the real test (unplayed).
- Writer/Painter/Gambler: new; many verbs, each with its own card; the learning load is higher than the skill load. The real spikes will be the first time each puzzle appears with no sandbox.
- Recommendation: an explicit difficulty curve per dream (hearts, checkpoint density, coin tension), plus an assist mode (more hearts, no death drop).

## I. Consistency between levels

- Shared: hearts, coins, flags, tutorial cards, dialogue box, Jo's sprite. Good.
- Inconsistent: objective quality; checkpoint treatment; floors; level length and density; HUD (gambler/writer: heavy; evening: ghost HUD); whether the hub shows the state ("caught" platform). The hub numbering ("DREAM 03" for chef) disagrees with play order.
- The dreams get "darker" per the design doc but art darkness is not monotonic: chef (dark night) > musician (night) > astronaut (grey) > writer (sepia with rain) > painter (purple, vivid) > gambler (red neon, vivid). The player-chosen order breaks the "darkens one step per dream" promise; either lock the order or tint by the number caught, not by dream.

## J. The hub as connective tissue

- It is the best-looking and best-lit place in the game, but the player experiences it three times: arrival, the walk, and the train. Walk time (~20 s) is the worst per-minute value in the game.
- Positives: the board with live status, the platform signs, the conductor lines, the caught-platform quieting idea, NPCs (Pemberton, Ro, Bilal).
- Negatives: the train is the weak link: too small, no motion; the "board" fades to a plain cut-in (the chef intro: a street with a dim shop, nothing about this dream's feeling). Replace each intro with a 4-6 second animated slice that sells the dream (kitchen clatter, a mic stand, a launch countdown).
- A "caught dream" should leave a visible object in the hub: a coin in a jar, the dream's token on Pemberton's desk, a poster changed; I saw "NOT IN SERVICE" tags but no per-dream memory.

---

# IF I WERE REDESIGNING THIS

**The shape:** a small, strongly authored game: 5 dreams (cut the gambler OR the painter; both are Van-Gogh/Casino pastiches next to stronger originals) + hub + finale. Keep: musician (Jo's own), chef (rework), astronaut (cut the gym), writer (rework), one of painter/gambler. Fewer, shorter (8-12 minutes each), finished.

1. **Fix the floor first.** Commission one tile family per dream, each with a top-edge highlight, a subsurface, 4 variants and props; rebuild rooms as enclosed spaces with a wall layer and doorways. Drive a visible transition (door/wipe) at every room boundary and delete the global crossfade.
2. **Characters to stored PNG atlases** (Section C): Jo, 20 NPCs, 8 foe families; portraits with expressions; 60px-tall Jo (a bit bigger than now), camera at 1.25x default so faces read.
3. **One goal line, one checkpoint look, one dialogue style.** Objective per flag; big readable checkpoint flags labelled once; dialogue as a slim caption bar for ambient lines and the box only for scenes; death returns you in a second.
4. **Real fonts.** Authored bitmap font (as the ui-type skill requires) in two sizes; a fixed HUD (hearts top-left, objective top-centre, tool slot top-right).
5. **Tutorial street + hub as an event.** 90-second opening, a 40-second hub (stairs, board, platform), then a train that actually moves. The hub grows quieter as dreams are caught (keep this: it is the thesis).
6. **Each dream = one verb pushed to the end**, then an ending beat that is *different*. Chef: the approval you cannot get (keep d6). Musician: listening (the basement). Astronaut: carrying someone (the rescue). Writer: the pen. Painter or gambler: pick one.
7. **Finale:** strip the HUD fully; put the camera close for the people; replace the foreground slab with the same painterly care as the sky; let the player choose to stop walking.
8. **Audio pass:** per-dream motif; surface footsteps; ambient beds; one live-instrument loop for the finale.

What to keep from today's build: the hub architecture, the split-flap board, the Evening sky, the astronaut writing, the writer's rain/press scenes, the musician's sound-as-verb, the gambler's neon opening, the painter's emptied-palette idea, the Small Moments, the objective-string voice.
