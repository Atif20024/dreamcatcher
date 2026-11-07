# Dreamcatcher, round 2: gamer critique

Method: fresh save, title, New game, Continue; played in a 980x560 viewport with the harness (stepped clock; cutscenes in real time), music muted. All sizes are measured from live sprite bounds (`getBounds()`), not eyeballed. Jo = body 22x76 + hat 24x12 (about 82 px with hat). Coverage honesty: I played Title, Hub (steps, hall, platforms, boarded Chef), Chef (arrival, dock, freezer) and the first screens of Musician; Astronaut, Writer, Painter, Gambler and Evening were warped to their start rooms (`?warp=`) and measured, screenshotted and judged on the first screen only, not played through. I could not climb the Chef chimney with scripted inputs (see Chef). Per-place scores for the unplayed places are therefore first-impression scores.

# 1. Verdict

Round 2 feels like a different game from round 1 in one way: Jo. He is now a real character (hat, coat, run, skid, land, push, crouch, mantle) with a legible silhouette, and the UI layer is real (bitmap fonts, a handsome dialogue box with portraits, tutorial cards, a gold objective line, a flag banner). The hub hall, the title emblem and the Evening square are genuinely good-looking. But the world around Jo did not move with him: it is the same half-scale world. Jo is 76 px; people are 48, travellers 38, trains 32, doors 40, lamps 45, trees 57-121, fountains 40. He reads as a giant in a model village, and that is now the loudest thing about the game. Second: text. The in-world sign font is 7 px caps and the HUD/prompt text is the same font at scale 1-2, over busy painted art. Third: identity. There is a lot of good ingredients (warm Evening, wry writing) but no rule that ties title, hub, dreams and finale together.

Ranked top problems:
1. Scale: everything but Jo is at the old scale (table in section 2). Trains (128x32), doors (48x40), lamps (21x45), trees (49x64 to 145x121), foes (rats 30x21, crawlers 30x18), props (typewriter 36x24, fountain 40x32).
2. Slopes and stair joins are not continuous: measured per-frame y pops of +13/-27 px and +9/-26 px at slope ends (section 6).
3. Small text: 7 px caps for signs, labels and prompts; vista title over a black board; HUD collisions top right.
4. No identity system: each dream has its own tinted flat tile and a different mood; UI frame, type and colour rules are not shared with the world (section 4).
5. Jo's ground shadow: hub hides it in the air (pops), Evening lifts it with him, and the five dreams have no Jo shadow at all (section 5).
6. Jo carries a tool (ladle, trumpet) in the hub and in the wrong dream (trumpet in Gambler); Astronaut gym reuses Chef crates.
7. Cutscene control lock: hub opening locks Jo for ~12 s plus a camera away from him, with no skip; boarding is another long lock.
8. Steps in the hub give no cue (Jo pushes the wall in a "push" pose until the player jumps).
9. Boot/loading: bare bar, sometimes 20+ s on the dev server.

Hat verdict: fixed. See section 7.

# 2. Owner complaint 1: scale and proportion (measured)

Jo = 76 px body (82 with hat). Real-world proportion targets assume Jo = 1.75 m, so 1 m = 43 px.

| Entity (where) | Measured | Ratio to Jo | Target |
|---|---|---|---|
| Hub NPCs: ro, sleeper, sweeper, pemberton, bilal, flower (`hub-ro` etc.) | 32x48 | 0.63 | 72-76 tall, 28-34 wide at body, new atlases like Jo |
| Hub travellers (`hub-traveler#n`) | 25-30 x 37-45 | 0.5-0.6 | 68-80 tall, mixed (children 50-55) |
| Hub street doors (`hub-door`) | 48x40 | 0.53 of Jo; Jo cannot stand in them | 64-72 wide, 112-120 tall |
| Hub ticket booths | 32x36 | 0.47 | 100+ tall counter windows |
| Hub kiosk 48x32, shoeshine 40x28, bench 48x20, fountain 40x32, cart 40x16, phone 24x32, desk 56x28, pigeons 10x10 | as listed | 0.2-0.4 | kiosk 130x110, bench 80x38, fountain 90x70, phone booth 40x100, desk 96x44, pigeon 14x12 |
| Hub trains (`hub-train-*`) | 128x32 | Jo is 2.4x taller than a train | see train proposal below |
| Platform signboards (`hub-signboard-196x42`) | 196x42 with 7 px text | text unreadable | 280x64 with 10-14 px body text |
| Hub lamps | 24x33 | 0.43 | 20x150 |
| Chef rat 30x21, crawler 30x18, cart foe 48x36, crates 32x32 / 32x64 / 32x96 | | 0.25-0.6 | rat 36x20 is fine as a rat, but crawlers/carts need 1.0 Jo height for a "threat" read; crates 48-56 cube |
| Chef arrival building (Le Reve) door | about Jo's shoulder | 0.6-0.7 | 64x120 |
| Chef coins 21x18, heart-shard 21x21 | | OK but read as Jo-hand sized | keep, +4 px outline |
| Musician lamp 32x20, staff-door signs, cellar | | | signs 160 wide, 10 px type |
| Writer typewriter 36x24, desk 48x15, ink 24x18 | | knee height | desk 110x60, typewriter 50x36 |
| Painter plane tree 73x57, sleeper 36x21, dog 36x16, clerk 32x48, tube 12x24 | | tree shorter than Jo | tree 300-420 tall; clerk 76 |
| Gambler lamp post 21x45, valet 30x30, sign 360x120 | | valet is a stool-height person | post 140 tall, valet 74 |
| Astronaut NPC adaeze 32x44; gym crates are Chef crates (`chef-crate` 32x32, 26x26, 29x29) | | | NPC 74; own props |
| Evening NPCs 32x48, fountain 72x40, lamp 20x84, postbox 20x40, bench 48x20, cat 27x21 | | NPCs 0.63; lamp barely above Jo | NPC 72; lamp 150; postbox 64 |
| Evening trees `ev-tree` 129x105, `ev-hilltree` 145x121, `ev-pine` 49x64 | | pine is shorter than Jo | foreground trees 300-450 tall, pines 250-400 |
| Evening/hub backdrop buildings | four-storey blocks are about 150 px | ~2 Jo | 4 storeys = 10-12 m = 430-520 px, windows 40x64 |

Trains (owner: rethink the presentation). Today: a 128x32 toy, no door Jo can enter, Jo stands beside it like Gulliver. Proposal: draw one real carriage at the platform, 360-400 px long and 130-150 px tall (Jo 76 + roof clearance), foreground at ground level with an open door 56x112 that Jo walks into (the boarding prompt over the door). The carriage is cropped by the screen edge or a pillar so the rest of the train is implied: a second carriage fading into steam, a locomotive visible only as a headlamp glow or a chimney plume beyond the viewport. Platform edge gets a yellow line, a lit window strip, a destination roll above the door in 10 px type. Each dream's train keeps its colour (red chef, navy musician, yellow painter, white astronaut) but with a shared silhouette, a shared door, so the eight read as one railway. Keep the Departure board rows in the hub at 10+ px.

# 3. Owner complaint 2: readability (measured and seen)

Fonts (`src/ui/BitmapFonts.js`): small = 7 px cell, line 10; body = ~9 px lowercase, line 13; display = 16 px. Signs, prompts and labels use small at scale 1; HUD uses small at scale 2.
- In-world signs: "PLATFORM 4 / THE SECOND DRAFT" (hub, 7 px on a 196x42 board), "HOTEL ..." on the Chef arrival awning, "THE BIG STAGE" and "MERIDIAN JAZZ FESTIVAL - SAT" (Musician d0, the second line is overlapped by a second print of "THE BIG STAGE": two texts stacked), Chef "STAFF DOOR - KNOCK" and "HATCH - TWO CRATES ON THE PLATE", ticket window labels TICKETS/ENQUIRIES (hub, partly hidden by crossfading backdrops). 7 px caps over painted noise are not legible at 960x540, worse at window scale 0.8.
- Floating prompts: "Sir? A word, at the desk. [E]" (hub), "[E]" gold bracket over doors: 7 px, no backing plate.
- Hub vista: title "DREAMCATCHER" and subtitle "Crossroads Station. Everyone here is going somewhere else." are cream on a black departure board and cream stone: subtitle crosses the board edge and the ladder; no scrim.
- HUD collisions: hub top right, coin counter "0 $0" sits on the departure board rows; Chef freezer "COLD" meter sits under the coin row; Writer "INK", "DRAFT 0 PP." stack on the coin row; Astronaut LUNGS/GRIP/LEGS/NERVE pips are tiny.
- Banner: "THE KERB / SAVED HERE. FALL, AND YOU WAKE AT THIS FLAG." is readable but lingers over the action for many seconds and pulls the eye into the play area.
- Title menu and tagline: 7 px, dim; footer hints are smudges.
- Good: dialogue box (body font, name in gold, 24 px portraits for Jo/Marguerite/Pemberton), tutorial cards (display title, body hint), gold objective line (display-ish, top centre), pause menu per owner.
Fixes: min 10 px (body font) for everything a player must read; 14 px for objective, prompts; every sign gets a flat plate (cream or dark, 1 px frame) with 10+ px type, and signs scale with the world (they get bigger when the world does); prompts get a 3-slice plate and a keycap glyph; vista text gets a 60 % dark scrim; HUD becomes one right-aligned stack with fixed slots (the HudGrid exists but dream-specific meters sit outside it); banner fades after 2.5 s and sits in the top third; title menu 12 px, panel opacity 0.85.

# 4. Owner complaint 3: character and identity

Today: Title (night blue, gold wordmark, dome) -> Hub (warm sepia stone, green wainscot) -> Chef (grey brick, purple night) -> Musician (maroon/brown) -> Astronaut (flat grey) -> Writer (brown) -> Painter -> Gambler -> Evening (golden hour; the only place with light direction, rim light, shadows, weather). Each dream is one tinted ground tile. The UI frame (dark panel, gold border) is consistent and nice but belongs to no world object. The writing voice is consistent and wry (Pemberton, the conductor) and is the strongest identity asset. Music was muted per brief; I did not judge it.
Where it feels generic: ground and walls (grey/brown tiles), HUD (plain pips), tutorial copy ("SLOPES / walk, do not jump" as a first card in Chef arrival), the dream trains (toy), the departure board (monospace-ish list), dream titles ("DREAM - FIVE-STAR DREAM" label is the same in every dream).
Proposed identity: "THE LAST TRAIN HOME, lit by one lamp".
- Signature look: night-station warmth. Every place is lit by a small number of warm practical lights (lamp, window, stove, spotlight, stage) against a cool blue-violet shadow field; Evening is the payoff where the lights finally merge into golden hour. Rule: 70 % cool shadow, 25 % warm practicals, 5 % one accent (the dream's colour: chef red, musician teal-blue, astronaut white-cyan, writer ink-blue, painter yellow, gambler green felt).
- Motif: the dreamcatcher web and the single feather. The web is the frame of every panel corner, the stitch of the pause menu, the shape of the checkpoint flag's finial; the feather is the collectible/save mark and the transition wipe. Every dream's end card pins one more feather to the hub's web (a visible progress object in the hall).
- UI frame: a rounded-corner panel with a 2 px gold line, a thin inner web pattern in the corners, a paper-dark fill; plates for signs use the same frame in the dream's accent colour so signs belong to both world and UI. One frame, five uses (dialogue, cards, signs, HUD slots, menus).
- Type: display (16 px slab) only for titles and places; body (9 px lowercase) for all speech and signs at 10+ px; no small caps below 10 px. Names in gold, objective in cream, warnings in red, never more than two colours per panel.
- Colour rules: no pure black (darkest = deep indigo 0x14122a), no pure white (cream 0xf2e6cc), shadow colour is always the dream's indigo variant; skin and Jo's blue coat are the only constants across places (Jo is the anchor, so he must stay the highest-contrast object on screen; today he blends with the navy/maroon backgrounds of Musician and Gambler).
- Shapes: arches (station windows, doors, sign tops, panel tops) everywhere; rounded, no hard rectangles in UI.
- Moments to carry it: (1) every dream starts with the train pulling away behind Jo and one lamp coming on; (2) every checkpoint is a lamp, not a flag, and lighting it floods the room's practical light and plays the same two-note motif; (3) every dream ends with Jo handing a feather to the hub web; (4) transitions are one wipe: the dream's accent colour sweeping over like a train passing; (5) the loading screen shows the dreamcatcher web filling in as the bar.
- Sound: one shared motif (two notes) re-orchestrated per dream; surface footsteps in every dream (tile, wood, carpet, snow).

# 5. Shadow (owner point 5): confirmed

- Hub: `src/scenes/HubScene.js:170`: `joShadow.setPosition(p.x - 4, p.body.bottom - 1).setVisible(p.shown && p.body.blocked.down)`. Measured on a jump (frame y of body vs shadow): body 716->709->779 and shadow 737->730->800 in lockstep (it is bound to `body.bottom`, which is the airborne bottom) but `visible` is 0 the whole time: the shadow vanishes when Jo leaves the ground and pops back on landing.
- Evening: `src/scenes/EveningScene.js:711`: `feet = p.feet().y` (the airborne feet) so the shadow rises with Jo; this is the owner's observed bug. It also keeps the shadow at the player's feet on any ledge.
- All five dreams, Chef, Musician, Astronaut, Writer, Painter, Gambler: no Jo shadow object exists (searched scene children, none with `shadow` texture). Jo floats with no contact cue; that is why the world feels pasted.
Fix: one `PlayerShadow` component on Jo: each frame raycast down the solid grid (and slope surface) from the feet to find ground y; place the shadow there, scale and alpha = f(height above ground: 1.0 at 0, 0.4 at 160 px), hide if no ground within 400 px, follow slopes (rotate to the surface).

# 6. Slopes and stairs (owner point 6): confirmed with numbers

Test: Musician d0 (`mus_sl_slope_r_2` at x 576, `mus_sl_slope_l_0` at x 704), Jo running right at 280 px/s (4.7 px/frame), y delta per frame, one-frame stepping.
- Up-ramp (x 569-606): dy = -7.3, -2.4, -7.0, -2.3, -7.0, -2.3, -3.0, -0.7: a 3-step stutter (alternating 7 and 2.4 px), not a straight line.
- Ramp top (x 606-611): dy = +13.3 then -27.0: Jo sinks 13 px into the crest and is then popped 27 px up. This is the hop the owner sees.
- Ramp bottom to flat on the far side (x 695-704): dy = +3.3, +9.4, then -25.7 at the join; then a gentle +0.3..+5 curve (the downward surface accelerates instead of being linear).
Cause: `src/entities/slopes.js` `resolveSlope()` snaps `sprite.y += best - footY` once the surface is within -8..+32 px and picks the highest of three samples (left, centre, right), so crossing a tile seam jumps between samples (`best` changes by up to 32 px in one frame); the crest "solid block step" branch (`top = ty*T`, within T/2+4) adds another discrete step; velocity is zeroed each frame (`body.velocity.y = 0`). Fix: compute the ground height from one sample under the foot centre via continuous interpolation (surface y is piecewise-linear across the join), smooth with `y = approach(y, surfaceY, maxStep = |vx|*dt*slope + 2)`, keep `blocked.down` true across the seam, treat join tiles (flat-to-ramp) as part of the ramp; for stairs, use a step-up of height <= 12 px with a short ease (3-4 frames), not a mantle. Also the hub steps: Jo walks into the second block and plays "push" until the player jumps (the stair is three solid blocks, no step-up). Add an auto step-up for blocks <= 0.5 tile.
Scenes with slopes that need the same test: every dream arrival has a `slope_r/slope_l` pair (Chef x 576-704, Musician, Astronaut gym, etc.).

# 7. Owner complaint 4: Jo's hat (commit 92737f5)

Method: for each pose, a strip of per-frame crops (every 4-6 frames, 2x scaled) of Jo with the hat, in three dreams. Result: the hat stays on the head, above the body, with no visible lag or behind-the-head placement in any frame I captured.
Frames checked and found aligned: idle (Chef, Astronaut), walk and run (Astronaut run 01-03, 05-07), skid (Astronaut), push (Chef, vs the pillar), crouch 00-02 (Astronaut; hat drops with the head), turn (left/right reversal: no frame of flipped hat on the wrong side), jump apex 00-02, fall 00-02, land 00-03 (Chef and Astronaut; hat compresses with the squash, still on top), mantle/climb of the Hub step (one frame: hat on top, arms forward). Measured bounds: hat image 24x12 at body.x+2, body.y-4 in idle (hub, chef, musician: 25x12 on Musician), constant relative offset across idle poses.
Not verified: ladder climb and wall-slide poses (I could not get Jo onto a ladder and the Chef wall-jump with my scripted inputs), and Evening sit/sleep/laugh poses. The hat is also tinted correctly under the Evening light (code at `EveningScene.js:707`).
One note: the hat sprite is a separate image per frame (`jo/.../hat` frames), so hat tilt follows the head only through baked frames; fine as is.

# 8. Cross-cutting

Scale and proportion: see section 2. Rule for the redesign: one metre = 43 px; Jo 76; doors 112+; ceilings 190 (2.5 m); trees 300+; houses 430+; people 70-80; dogs 30; cars 190x70.
Readability and typography: section 3.
Identity: section 4.
Character art and animation: Jo's set is the best-looking thing in the game (silhouette, hat, coat); his 76 px body fits poorly next to 48 px NPCs and 20-30 px foes; the cast needs the same rig treatment (phase 2 report says placeholders only). Foes read as sprites from a different game (rats 30x21, crawlers 30x18).
Backgrounds and buildings: hub hall and facade are strong, the vista is the best shot in the game; the backdrops crossfade on room change so signs ghost (seen twice in the hub opening: translucent "CROSSROADS STATION" board and TICKETS labels overlapping their next-room versions). Dream grounds are one flat tinted tile (Chef grey slab, Astronaut grey), with grey monolith "pillars" that read as placeholders.
Interactables and affordance: gold "[E]" bracket works when near; the conductor's talk then "[E]" to board is clear; the hub steps have no affordance; the Chef chimney (32 px shaft with ribbed sides) is a hard read; I could not climb it with scripted wall-jump inputs (three attempts; best apex y 975 vs the 960 girder) so I cannot call it fair or unfair, it needs a human test.
Dialogue and writing: consistent, dry, human (Pemberton, the conductor, Marguerite's "we're drowning. Grab a ladle"). Typewriter reveal is good. The dialog box asks for [X] on the last line while [E] advanced earlier lines: unify to one key.
Sound: muted by brief.
Onboarding and the title/new-game flow: title is good; the first 20 seconds in the hub are unguided (no objective, steps unmarked); then a 12-20 s opening that is beautiful but takes control and re-titles the game. First tutorial card in Chef arrival is "SLOPES / walk, do not jump" which is the least important thing to teach there.
Pause/save/continue: Continue exists on the title with "0 CAUGHT" subtext; a hub run is saved even with nothing earned. Not tested further: pause menu per owner works.
Difficulty: Chef arrival to dock: I got hit by the cart foe (cart 48x36 in a 76 px world) and lost 1 of 3 hearts within the first minute; the hit feels fair (knockback, i-frames blink) and non-punishing (no teleport).

# PER-PLACE DIARIES
## Title and New game
Diary: Boot shows a thin loading bar on a flat navy screen (it took 20+ s on a cold dev server; the bar never says what it is waiting for). Title: night skyline, dreamcatcher emblem over a gold DREAMCATCHER wordmark (a real logo, good), a glass-dome ribwork, a red train, a lone figure under a lamp. Tagline "NINE O'CLOCK. EVERY TRAIN LEAVES NOW." and the menu (New game / Settings, plus Continue and "0 CAUGHT" once a save exists) are tiny (about 7 px type, 0.8 scale on screen) and dim on a dark panel: the tagline and footer hints ("[arrows] choose, [enter]/[z] go, [m] music") read as smudges at a normal window size. The wordmark is the only text at a size a player reads. Pressing Continue with 0 dreams caught and no flag resumes Jo at the top of the steps with objective "BOARD ANY TRAIN - OR THE LAST STOP" (hub run saves); fine.
Scores: clarity 7, feel 6, art 7, readability 4, identity 7, fun n/a.
BUGS: loading screen can sit for 20 s with only a bar (dev server, but there is no label or tip).
CHANGE: menu type to at least 12 px display size with a lighter panel; tagline to 10 px bright.
KEEP: logo, emblem and dome, the tagline voice.

## Hub: Crossroads Station
Diary: New game drops Jo on the pavement at the left (x 112) with no objective and no prompt. Walking right the facade is gorgeous: arched windows, a lit "CROSSROADS STATION" board, brick and stone. The steps up to the forecourt are a stair of three solid blocks; Jo walks into the second one and stands in a "push" pose until the player works out that he must jump (he mantles the ledge on the first jump). Nothing tells him. At the top (x about 850) the opening cutscene fires and takes the controls: camera pulls back to the vista at 0.62 zoom, the board clacks through the destinations, the gold wordmark DREAMCATCHER and the line "Crossroads Station. Everyone here is going somewhere else." fade over the busy board and the ladder (cream text on a black board, partly unreadable), then the camera returns. About 20 s of locked control, no skip. It is a nice beat but it re-shows the title right after the title screen, and Jo is not visible during it (the camera is far to the right of him).
Into the hall: tall green-wainscot ticket hall, TICKETS windows, a great clock, pigeons, a fountain, a footbridge with a worker, Mr. Pemberton at a desk. Talk to Pemberton: the prompt floats over his head as 7 px text "Sir? A word, at the desk. [E]" and the dialogue panel is large and very readable. His lines are dry and good ("Any platform, sir. They all leave now. The ledger has you at $0."). The dialog box wants [X] on the last line while [E] advanced the earlier lines: mixed keys.
Platforms: eight trains under a green iron shed. The signs ("PLATFORM 1 / FIVE-STAR DREAM / BOARDING") are placards with 6-7 px text; the objective is the only thing at a readable size. Jo (76 px) is more than twice as tall as each train (32 px): the cars are toy models next to him. Boarding: stand at the door, [E] prompt shown as a gold bracket near him, conductor talks ("Five-Star Dream, sir."), Jo vanishes and a long train cutscene plays.
Feelings: charmed by the facade and the hall, a little lost in the first 20 seconds (steps), impressed by the vista, then disappointed by the toy trains and the doors that come to Jo's shoulder.
Scores: clarity 6, feel 7, art 7, readability 5, identity 7, fun 6.
BUGS: (1) HUD coin counter "0 $0" overlaps the departure-board rows while the vista shows (top right). (2) Jo is already holding the chef's ladle (sprite `tool-ladle`, 24x18) at the station, before any dream (visible in every hub screenshot). (3) On Continue from the title the opening may replay or not; on New game it fires only after climbing the steps.
REMOVE: the second DREAMCATCHER title in the vista (or drop the title screen's).
CHANGE: steps need a visible mantle cue or a ramp; vista text needs a scrim; trains and doors per the scale table.
ADD: a "Jo can read the board" moment (the board is only seen in the vista).
KEEP: Pemberton, the vista, the hall.

## Chef: Five-Star Dream (played: arrival, dock, freezer)
Diary: Boarding fades to a very dark arrival (the first seconds are almost black), then Marguerite's auto dialogue (portrait, "You're the new stage? Good, we're drowning. Grab a ladle - Chef wants saffron risotto on the pass by the time the critic sits.") reads well. Card "SLOPES / walk, do not jump" fires on the first slope. Objective "FIND THE SERVICE ENTRANCE", then at the first flag the banner "THE KERB / SAVED HERE. FALL, AND YOU WAKE AT THIS FLAG." (the flag is labelled now: good). Ran into the cart foe in the alley and lost a heart with knockback and blinking i-frames: fair. The dock has crates (32-96 px, knee to head height), a plate, a hatch and a ribbed chimney. The freezer is a good change of mood: blue-grey tiles, icicles, a COLD meter, a valve panel with [E]. 
Feel: curious, then flat: ground is one grey slab, the grey monolith pillars look like missing art.
Scores (clarity/feel/art/readability/identity/fun): 7 / 7 / 5 / 5 / 5 / 6.
BUGS: Jo holds a ladle before the dream (also in the hub). Chimney: 32 px shaft (`chef_climb` tiles at x 1248 and 1312, Jo 22 wide); a ground-level jump apexes at y 975-990, the girder is at 960; scripted wall-jump attempts (alternating inputs) did not climb it; needs human verification (finding: either too strict or poorly signposted). Banner lingers.
REMOVE: grey monolith pillars at the dock.
CHANGE: scale (crawlers, carts, crates, rat), sign sizes, the first card.
ADD: a floor of kitchen tile and stainless instead of one slab; steam and lamps for the warm/cool rule.
KEEP: Marguerite's line, the COLD meter, flag labels, the freezer.

## Musician: The Big Stage (played: first two rooms)
Diary: Jo's own line in the dialogue ("Saturd...") with his glasses portrait, a nice self-portrait. Streets of maroon/brown, a rain-city feel, a chain-link fence, "THE BIG STAGE" signs. The HUD adds a BREATH bar, bottom hints "[Q] PLAY - [E] INTERACT/CASE - [F] CALL NIA" (7 px, readable only because it is on a dark strip). Cellar room: scaffolds with tiny NPC musicians (48 px) on balconies; Jo is half again their size.
Scores: 6 / 6 / 5 / 4 / 6 / ?.
BUGS: Musician d0 painted sign shows two overlapping texts ("MERIDIAN JAZZ FESTIVAL - SAT" with a second "THE BIG STAGE" over it). Jo carries a trumpet from the start (24x15) before the dream gives it.
Slopes: measured pops (+13/-27 and +9.4/-25.7 px) here, section 6.
CHANGE: sign type, NPC scale. KEEP: Jo's portrait lines; the breath bar.

## Astronaut, Writer, Painter, Gambler, Evening (warped to the start room; first screen only)
Astronaut (gym): grey flat floor, wall signs, gym props (crates are Chef crates), Adaeze 32x44; HUD stat pips LUNGS/GRIP/LEGS/NERVE at the top right are tiny; the bottom hint line "[E] INTERACT - [TAB] VISOR - [F] TETHER / PRIYA" is fine. Scores 5/5/4/4/4/?.
Writer (attic): brown attic, glow around the typewriter, a ladder, hint "WRITE CHAPTER ONE (12 PAGES)"; HUD INK/DRAFT collide with coin row; desk 48x15 and typewriter 36x24 are toy scale. Scores 6/6/5/4/5/?. Jo holds a pen (16x16): the right tool.
Painter (arrival): yellow tones, a plane tree 73x57 (shorter than Jo), a dog 36x16, a sleeper 36x21, a clerk 32x48, a yellow tube 12x24 (too small to be a puzzle item). Scores 6/6/6/5/6/?. Jo holds a brush: right.
Gambler (arrival): sign 360x120, lamp post 21x45, valet 30x30 (a child-sized valet), Jo holds a trumpet (wrong tool, from the Musician). Scores 5/5/5/4/5/?.
Evening (square, ridge): the best picture in the game: golden-hour square with warm light, a fountain, benches, sitting NPCs, buildings against hills; the ridge at night is a flat dark ground with a few stars, a bench and a far hill. Shadows exist, rim light exists. Scale is wrong though: pine 49x64, tree 129x105, fountain 72x40, NPCs 32x48; the camera at the ridge zooms to 0.79 which makes everything smaller and text smaller. Scores 7/7/8/5/9/?.
BUGS/CHANGE per section 2.
