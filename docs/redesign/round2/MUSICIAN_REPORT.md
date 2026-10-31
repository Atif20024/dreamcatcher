# Phase 3b: THE BIG STAGE on the framework

The owner loved THE STOPPED HOUR because you walk into a house and the world changes, and because the job inside opens a door outside. The Musician is the first dream rebuilt to that bar: six places you walk into, each a different world, each with one clear job shown before you commit to it.

Code: `src/dreams/musician/` (rooms, dialogue, beats, encounters, the trumpet verb, props, materials). The old `MusicianScene.js` is untouched and still plays with `?legacy=1`.

## The dream, in one night
Jo's own dream. He arrives in the rain on a Tuesday and leaves through the Big Stage on Saturday. The seven "days" of the spec are folded into one night: the doors are where the time jumps.

| Place | Kind | What changes when you walk in | The one job (shown on arrival) | What it opens |
|---|---|---|---|---|
| **RAIN ON THE MARQUEE** (street) | exterior, wet setts, rain | Real-scale fronts: the Meridian's marquee (SATURDAY, THE BIG STAGE), a horn shop, the Blue Cellar's brick block with its neon | "the Blue Cellar's open mic: musicians go round the back" (the bouncer says so) | the alley mouth (a seam, no cut) |
| **THE ALLEY** | exterior canyon, fire escapes | brick backs, iron landings up the left wall, a dead neon over a steel stage door | "the stage door is dark: play the dead neon back to life" | the stage door; later the iron gate to the loading door |
| **THE BLUE CELLAR** | interior, brick, pipes, one bulb | the world closes in: a foot-high stage, a zinc bar with Ray's back to you, nine chairs, five taken | "Delphine runs the open mic: put your name down", then "take the stage: two songs for nine chairs" | Ray walks out mid-applause; outside he tells Jo to play the room, and the alley gate opens |
| **SATURDAY. BACKSTAGE** | interior, painted block, work lights | the festival: flight cases, truss, roadies, a catwalk, Marcus by the dock, Tally and Nia by the stage door | "the stage door wants your laminate and Tally's answer" | the stage door (a gate that ticks off both) |
| **THE FIRE STAIRS** | vertical exterior, rain | nine storeys of iron landings bolted to the theatre's flank; the city drops away to the right | "climb the fire stairs to the stage door at the top" | the stage |
| **THE BIG STAGE** | festival stage on a roof | PA wings, a truss throwing colour, eight thousand heads below the lip | "eleven minutes, eight thousand people: play the set" | the hard cut: work lights, the crowd gone, the crew striking, the gate to the wing, a folding chair with Jo's case and the dream over it |

**The inside-opens-outside loops:** the neon you wake outside opens the door in; the gig you play inside sends Ray out, and his lesson outside opens the gate; backstage, the laminate on the catwalk and Tally's answer open the stage door at the top of the stairs.

**Choices that carry:** Marcus at the dock ("Then go" / "Play this one. Then go" / say nothing) decides who is on drums and is written to `save.cast.marcus_left` (the Evening reads it, as before). Tally ("Deal" / "Nia plays or I don't") decides the set list: Nia keeps the rests and her bass in the blank moment; Tally's list fills every rest and the blank is played blind. The ending lines follow both.

## The verb grows (one engine, three gigs)
`src/engines/rhythm.js` is the old `systems/rhythm.js` call and response lifted out as pure logic (unit-tested in `tests/rhythm.test.js`), staged in the room by the `rhythm` presenter: the house lights drop, a spot finds Jo, the phrase hangs over the stage as brass notes on a staff, the audience turns toward the stage on every phrase he lands, NERVE is a HUD meter, and what to do now sits on the HUD's context line. The gig is patient: a missed phrase comes again a little slower (twice), a full NERVE meter freezes Jo for a moment, and the set always finishes.

| Gig | Teaches |
|---|---|
| The neon (alley) | listen, then answer: 2 phrases of 4 notes |
| The open mic (Cellar) | 6 phrases, all notes; the nine chairs turn |
| The set (Big Stage) | Ray's rests (a hollow ring: leave it empty), a phrase played by ear (no notes shown), the blank (Jo goes blank; Nia's bass comes in from the dark; play nothing for a bar), and a last note held for four beats |

**[Q] is the trumpet** everywhere else: a ring from the bell; the horn in the shop window answers it, roadies stop to listen (they walk toward the sound), and the feedback wisps fall silent.

## Pickups (collectibles skill)
- **Busker coins, worth 1:** 123 placed (budget 120–150), all on the harder way: the shelter, car and awning roofs on the street; every fire-escape landing; the Cellar's bar top and pipes; the catwalk; the brave ledge on the fire stairs; the speaker tops. One breadcrumb per decision point.
- **Key item:** the LAMINATE ("ACCESS ALL AREAS. No laminate, no stage.") on a lit pedestal at the far end of the catwalk, past a roadie and two wisps; the stage door's gate needs it.
- **Heart shard:** the top landing of the alley's fire escape.
- **Small Moment "Nine":** after the gig, sit on the edge of the stage.

## Identity and scale (WP2–WP6)
- Everything is painted in code at 1 m = 44 px. Buildings are the building kit at s = 1 (132 px a storey), the street tree is the tree kit, doors are 2.2 m, lamps 4.5 m; the city rows are ported into `src/art/backdrops/painted.js` (`city`, `rain_city`, `theatre`, `fire_escape`, plus a `crowd` band) at the depth rule, declared in `BACKDROP_ROWS`.
- People are the WP2 cast at Jo's scale (Delphine, Ray, Nia, Marcus, Mr. Tally, the bouncer, the roadies; Evening extras as the Cellar's audience), with their idle and talk loops; foes walk their motion-package gaits. Dialogue portraits are cut from the same rigs.
- WP6: the night grade per place, lamp checkpoints (seven), board titles flipping in on every room, the musician's horn chime, the passing-train wipe home.

## How to reach it
- From the hub: platform 2, [E] at the gate. Catching the dream saves `dreams.musician`, returns Jo to the station, and the bay plays its return.
- Dev: `?warp=musician:start` (or `street alley cellar backstage escape stage`). `?warp=musician_legacy` or `?warp=musician&legacy=1` plays the old scene.

## What a player should try
1. Ring the horn in the shop window with [Q] before you do anything else.
2. Take the high road on the street (shelter, car, awning) and up the alley's fire escape for the shard.
3. Play the open mic and watch the chairs; then go back and sit on the edge of the stage.
4. Hear Ray out in the alley. Then pick a side twice backstage, and play the set both ways (Nia's blank is the moment the dream is about).
5. Use [Q] on a roadie between you and the catwalk.

## Screenshots (`sheets/`)
| File | Shows |
|---|---|
| `musician-street.jpg` | Rain on the Marquee: the theatre, the horn shop, the board title |
| `musician-alley-neon.jpg` | The neon, played back: the staff beside the dead sign |
| `musician-cellar-gig.jpg` | The open mic in the room: spot, staff, NERVE, the audience |
| `musician-backstage.jpg` | The catwalk, the wisps, the laminate on its pedestal, a roadie |
| `musician-fire-stairs.jpg` | Halfway up the fire stairs in the rain |
| `musician-big-stage.jpg` | The set with a rest; Nia on bass, Marcus on drums, the crowd |
| `musician-after.jpg` | After: work lights, the crew, the chair and the dream |
| `musician-ending.jpg` | ELEVEN MINUTES: THE BIG STAGE CAUGHT |

## Verification
| Check | Result |
|---|---|
| `npm test` | 119/119 (new: `tests/rhythm.test.js`, 8; `tests/warp.test.js` updated) |
| `npm run lint:content` | 0 failures; framework dreams `clockmaker, musician` clean (graph, reach, headroom, refs, objectives, perf) |
| `npm run lint:rooms` / `lint:scale` | 0 failures / clean (233 measured; the four new rows declared) |
| `npx vite build` | OK |
| Scenarios, one full run (98, port 5196, dev silent) | 74 passed, 24 failed. All 24 threw `DreamScene: no framework dream "null"`: the run was started from a `?warp=musician:stage` page, and the boot-time first scene (Dream) restarted with no data after the first warp had removed `?warp=`, then threw on every step until a later scenario warped to the Musician. Fixed in `DreamScene` (it stands down instead of throwing). The 24 were re-run from a neutral page: all pass. Every other scenario passed in the full run, including `musician-playthrough`, `clockmaker-playthrough`, `board-train`, `last-stop-board`, every `slope-*`, `scale-*`, `readability-*` and `jo-contrast`. |
| `musician-playthrough` | board-less run, real inputs: horn, seam, locked door, neon (8 presses), sign-up, open mic (27 presses, chairs turn), Ray, the gate, Marcus (stays, saved), catwalk jump, laminate, Tally (Nia), the stairs' first landing, the set (37 presses, 13 phrases), crowd gone, the wing, the orb, CAUGHT, back at the hub with `returnedFrom`. 3.3 min of game time with the platforming stretches placed; a first play should take 7–9 min. |
| `musician-board` | platform 2 row BOARDING, conductor line, Intro, DreamScene on the street with the title, the busker-coin HUD and the trumpet |
| `musician-places` | every place under budget: street 351 objects / ~82 draw calls, alley 493 / ~137, cellar 318 / ~86, backstage 474 / ~105, stairs and stage similar; rooms paint in 30–160 ms |


## Files touched outside `src/dreams/musician/`
- Framework: `src/scenes/DreamScene.js` (adapters, door locks, tool, coin culling, restart reset), new `src/play/dreamAdapters.js`, `src/play/Encounters.js` (params function, release, abort), `src/play/encounterPresenters.js` (the rhythm presenter), `src/play/EndingSequence.js` (lines function), `src/actors/Npc.js` (cast people), `src/world/Enclosure.js` (brick/blocks/curtain walls), `src/world/BackdropDirector.js` (rain), `src/art/backdrops/painted.js` (city rows, crowd), `src/audio/synthLoops.js` (three loops), new `src/engines/rhythm.js`, `src/dreams/index.js`.
- Wiring: `src/data/dreams.js` (scene 'Dream', `?legacy=1`, conductor line), `src/dev/warp.js`, `src/scenes/IntroScene.js` (scene and sub-line), `src/data/scale.js` (four `BACKDROP_ROWS`), `scripts/lib/dream-checks.js` (cast NPCs).
- Scenarios: new `src/dev/scenarios/musician.js`; `phase14.js`, `round2.js` and `backgroundSnap.js` now point their legacy-geometry checks at `musician_legacy`; `round2.js` gains `slope-musician-kerb`.
- Tests: new `tests/rhythm.test.js`; `tests/warp.test.js`.
- Docs: `docs/redesign/FRAMEWORK.md` §17–18.

## Known gaps
- **Cut from the spec to fit 6–10 minutes:** the busking corner and Old Sol's valve repair, the road tour and the van, the studio and the mix; the sound bridge (staff anchors) and the breath meter; the hecklers' bottles and the Static. Nia is a companion only in story, not a callable follower.
- **Marcus stands at the kit** rather than sitting behind it (the cast has no drumming pose); the roadies are the shared grab-and-throw foe, not case carriers.
- **The fire stairs' backdrop is pinned to one horizon:** the skyline shows low in the climb, sky above.
- **In short interiors the caption bar sits over the floor line** while a bark is up (the framework's camera framing).
- **Audio was not heard** (dev silent): the three new loops, the trumpet and Nia's bass are code only.
- **The old `MusicianScene.js`** stays as the brief asked; its legacy-geometry scenarios now run through `musician_legacy`.
- **The full scenario run's boot race** (above) is fixed in `DreamScene`, but the harness still lets a boot-time first scene start after a warp (WP6 noted the same race).
