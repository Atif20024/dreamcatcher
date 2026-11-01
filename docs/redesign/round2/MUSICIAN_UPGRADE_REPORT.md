# THE BIG STAGE upgrade

Spec: `docs/redesign/advice/deep_review_writer_musician.md`, Part 2: every MUST and SHOULD, and MAJOR item 3. Built on `redesign` with no browser and no audio. Everything claimed below as proved is proved by pure tests (`tests/musician-upgrade.test.js`, 49 tests) or by data. Anything that needs eyes, ears or hands is listed at the end and is **unverified**.

## Review item → what happened

| Item | Done | How |
|---|---|---|
| **M-M1** first two gigs are the same taps | Yes | `encounters/sets.js` writes real tunes. The neon is two short tunes (3 notes, then 4). The open mic is two songs in three tiers: even bars, then the first rests (Delphine names them in a caption as they arrive), then an eighth-note push across the beat. The engine gained `div: 0.5`, so syncopation is real and not only rests. Six bars, six different rhythms. |
| **M-M2** notes are not the notes of the call | Yes | Each bar carries `notes`, the engine's `preview` and `hit` events carry `pitch`, and the presenter's never-reset `pitch++` counter is gone. Tested for all five gig variants, on retries too. |
| **M-M2** scale against the key | Yes, verified from the data | `TRUMPET_SCALE` is C major and `MUSIC_KEYS.stage` is E Mixolydian: C, F and G are each a semitone off. The review's inference was right. Gigs now sound in `def.scale` from `music.js` via `noteHz`. The same applied to the [Q] verb, Nia's bass (`BASS_SCALE` clashed too), the phrase-landed sting and the outro chord, none of which the review named. |
| **M-M2** results read by nothing | Yes | `def.onResult` writes `<gig>_perfect`, `_froze`, `_rushed`, in `Encounters.finish`, before the win beat runs. See "What results change". |
| **M-M2** `onGigPhrase` | Removed | `onGigPhrase` and `onBassRing` were never defined anywhere. Both removed. |
| **M-M3** nine chairs | Yes, nine people | Four more seated (`ev-p-sleeper`, `bilal`, `gardener`, `bo`), each on one of the nine chairs. A clean gig turns all nine by its last bar (it used to be able to turn only six). The Moment's camera now goes to the woman at `a2`. |
| **M-M4** laminate | Yes, reworded | Marcus's first line sets it up. The review's "when a roadie shoved the sofa" does not hold: the sofa is on the floor and the catwalk is overhead. Now: "Some roadie slung your laminate up on the catwalk with the cable." "You go on in an hour" was cut too, because Jo says "the set in twenty" three lines later. The roadie bark now waits for Marcus, and `marcus_hey` is gone. |
| **M-M5** narration spoken by Marcus | Yes | `go`, `stay`, `silent` are Marcus's speech. Narration is Jo's caption after the box closes (`beats.marcus_goes`, `marcus_walks`), in the first person like "Nine people clap". Then he actually leaves the room (`marcus_gone`), where before he stayed and said "Go on". `nia_coffee` had the same fault and got the same fix. |
| **M-M5** review's `go` line | Reworded | "Tell the kid I tried the drums" has Jo passing a message to Marcus's own son. Now: "Then I'm gone, Jo. You keep the set. The kid's got the napkin." |
| **M-M5** napkin | Yes | `m3` and the ending use the review's lines. No Evening text mentions the napkin, so nothing conflicts. |
| **M-M5** Marcus skippable | Yes | `dream.onEnter.backstage` plays `marcus_calls` on every entry until `marcus_left` is set, so a resume cannot lose it either. It adds a three-line hook in `DreamScene.commit`. I did not also add him to the gate: the scene has no cancel, so he cannot be walked past. |
| **M-S1** Ray's lesson | Yes | `ray_lesson`'s first line branches three ways. A third encounter, `ray_drill`: he claps `[1,1,0,1]`, `[1,0,1,1]`, then one wholly empty bar (added to the review's two, so the blank is taught before the climax). No nerve. The gate now opens on the drill. Walking off it is safe: Ray offers it again. |
| **M-S2** third bar | Yes | Every hit stores its offset. `third: true` marks the third bar of each song. `rush` is the mean offset of those hits (playing into a third bar's rest counts as early) and `rushed` is below -35 ms. The review measured "beat 3"; I measured the third **bar**, because that is what everyone in the dream says. The plate turns teal on a third bar. On Nia's list the third bar of the last song is the blank itself, so there the rush is playing at all. |
| **M-S3** stage the climax | Yes, not lengthened | Four crowd claps count in. A 1.5 s breath between songs: lights up, roar, the camera steps closer, the next song's name on the HUD. In the blank the house goes dark, the spot moves to Nia, and her bass keeps playing through the bar Jo leaves empty (new `answer` event). The held note opens the lights up as it grows, then a shake and a roar. A clean set runs 69 s, inside the 60-90 asked for. |
| **M-S4** street | Yes | Two more things answer [Q] (shelter glass, the dumpster). Two people: a sweeper who stays for the roof, a woman reading under the awning. Both are short and have a second line. |
| **M-S5** backstage props | Yes | Marcus sits on a road case. Nia sits on the sofa with her bass beside her. The mirror is a one-line look ("Tuesday's face. Saturday's jacket."), with `record: false` so it is not counted as a Moment. The amp answers [Q] with a line from Tally. `npc-*` had no seated frames, so the bake adds `-sit`. |
| **M-S6** session players | Yes | "Click track's on. I do weddings." |
| **M-S7** stairs | Yes, stronger than the review | The review proposed a 1 s breath, but that only delays the same answer. On the sixth landing (`[22,19,29]`) the horn is drowned: nothing answers, so `wisp_s2` must be jumped or stamped. Jo says so the first time, and Q works again one landing up. `escape.roar`, `drowned()`. |
| **MAJOR 3** event shape | Yes | `tests/rhythm.test.js` passes unchanged. No other engine or presenter shares it. |
| **NICE** M-N1 to M-N4 | Not done | Not asked for. M-N3 (both dreams say "nine chairs") is still open for the owner. |
| **Roadmap** busking, road, studio, sound bridge, breath meter | Not added | The review's plan does not call for any of them. |

## What results change

Finishing is never blocked. A player pressing nothing finishes every gig (tested).

| Result | Lines | What comes next |
|---|---|---|
| Cellar perfect | "The bartender has stopped washing glasses." Ray: "You played every note right." Tally: "not one wrong note." Bartender: "I stopped." | |
| Cellar with misses | "The bartender slows down." Ray: "You played most of the notes." | |
| Cellar froze | "Politely." "Ray looked up once, when I stopped." Ray: "Best thing you played all night, and you didn't mean it." Delphine and Tally both remark. | The set starts at 24 nerve |
| Cellar rushed or not | Nia and Marcus say which | |
| Ray's drill clean | "There. Now it is a note." | Set's nerve relief 16 instead of 12 |
| Marcus stays | | Set's window 170 ms instead of 150 |
| Set: freeze | "I think they forgave me." The person beside him steps in (Marcus, Nia or the session guy) | |
| Set: rushed | "Third bar." live, again from Nia over coffee, then the ending's line | Four ending lines by rushed × Nia/Tally |

## Found on the way

- **A real engine bug.** The retry slowdown (`beatMs /= assist`) was never undone, so a struggling player's whole set kept slowing, without limit. A silent player's set outran a 1000 s test run. It now resets on the next bar.
- **Gig tempo did not match the room.** The neon was 88 and the open mic 96 over an 86 bpm trio. All are now the band's tempo, and each call lands on the band's nearest beat (`beatCorrection`, `nudge`).

## Scripted play (engine time)

| Gig | Clean | One miss a bar | Half the notes | Silent |
|---|---|---|---|---|
| Neon | 13 s | 25 s | 25 s, 0 freezes | 64 s |
| Open mic | 42 s | 87 s, 0 freezes | 89 s, 1 freeze | 161 s |
| Ray's drill | 20 s | 35 s | 35 s | 69 s |
| Set (Nia) | 69 s | 126 s, 0 freezes | 137 s, 4 freezes | 244 s |
| Set (Tally) | 70 s | 138 s, 0 freezes | 144 s, 4 freezes | 265 s |

These are bots, not people. The curve looks reasonable and needs a human.

## Checks run

vitest (all files pass, including the 49 new tests), `lint:content`, `lint:rooms` (0 failures; the warnings are in other dreams), `lint:scale` (clean), `vite build`, `npm run atlas`. No browser scenario was run. `src/dev/scenarios/musician.js` is updated for the new flow (Marcus calling, the drill, nine chairs) but **has never executed**.

## Must be rerun in a browser

1. `musician-playthrough`: the updated flow from board to hub. This is the first run of the new presenter code, so a runtime error would show here.
2. `musician-places`, `musician-set-variants`, `musician-coins`, `musician-board`: budgets with four more seated people and two more on the street.
3. `?warp=musician:backstage`: Marcus's scene opens about 0.9 s in. Any scenario or screenshot warping there will now see the box.

## Unverified: needs eyes

- Marcus on the road case and Nia on the sofa: the seat height of the `-sit` frame against those props, which were not drawn to be sat on.
- Whether the mirror, sofa, Nia and bass read well together at cols 32-37, and whether the prompts overlap.
- Notes at pitch height and eighth-note spacing (38 px) on the staff. The teal plate on third bars.
- The caption bar during a gig: legibility over the staged scene, and whether cues collide with the HUD's context line.
- The spot on Nia in the blank, the light opening on the held note, the song-camera steps.

## Unverified: needs ears

- Every tune. They are written to fit the key, not heard. They need a musician's opinion.
- Band against call: the lead stem may crowd the horn in the listen bar. I left the band's mix alone.
- Whether `beatCorrection` feels locked to the band. Engine time is frame-stepped and the band runs on the audio clock, so they are re-aligned at each new bar and can drift within one. Output latency is not accounted for.
- The levels of `clap`, `crowd_clap`, `roar`. All muted per the dev-silent rule.

## Unverified: needs hands

- The -35 ms rush threshold, a guess. If real players read as always or never rushed, this is the number to move.
- Eighth-note bars at 120 bpm on Tally's list (eight notes at 250 ms): may be too hard.
- The drowned landing: whether jumping or stamping `wisp_s2` is fair, and whether the caption arrives early enough.
- Length: the drill adds about 20 s and Marcus's scene is no longer optional, so a first run grows past the review's 11-13 minutes. Pacing curve otherwise unchanged.

# Round 2

Review: `docs/redesign/advice/musician_review_r1.md`. I checked each item against the code before changing it. All held, with one small correction under NICE. Still no browser, no audio and no human play.

## MUST

| Item | What I did |
|---|---|
| **M1** my `onResult` hook broke the Gambler | **My regression, and it would have hung that dream's first encounter.** The Gambler already owns `onResult(scene, result)`, and round 1's tests never ran one of its defs. Renamed mine to `onFlags`. A new test runs the real `slateEnc` through the real `Encounters` and expects it to exit. |
| **M2** `beatCorrection` jumped the clock forward | It now only waits for the next band beat (under 25 ms late counts as on the beat). The test that encoded the bug is corrected, and a new one proves the first interval stays on the grid after a wait. |

## SHOULD

| Item | What I did |
|---|---|
| **S1** rush measure | `rush` is now the third bars' mean minus the mean of the player's own other bars, so speaker lag or a habit no longer reads as rushing. The live judge uses the same measure. A press over a third-bar rest counts only if it came early. Tested with uniformly late players and with a laggy player who does hurry. The -35 ms number is unchanged, as the review advised. |
| **S2** Tally has no third-bar cue | The session player now says "You're a hair ahead of the click, man." Every list has a live cue before the ending's line. |
| **S3** freeze cue repeats | Said on the first two freezes only. |
| **S4** mashing gives a perfect set | The second stray press in a bar now fails that bar, on every list; one slip is forgiven. A 110 ms masher now passes fewer than half the bars on both lists, and still finishes. Tally's filled eighth bar is now a quarter-note bar, so there is no four-taps-a-second bar and his list still has no rests. |
| **S5** length | See below. |
| **S6** drowned landing | The caption shows on the first two entries, and the second one says what to do: "Can't hear the horn up here. Jump it." |
| **S7** freeze at a song boundary | The song change now runs after the freeze. Tested. |

## Length cuts

- Ray: `j2`, `jm`, and the duplicate `r2b` are gone. His lesson is 3-5 boxes, was 5-7. "Player piano" and "Play the room" remain on every path.
- Drill: bar 2 is gone (it repeated an open-mic bar), retries 3 to 2. Clean 14 s, was 20 s.
- Marcus: `m1`/`m1b` are gone. Laminate, the job, the napkin and the choice remain.
- Street: the reader NPC is gone. Sweeper and both resonant objects remain.
- Bouncer: Jo's "Round the back where?" is gone (one box).
- Open mic and set: retries 2 to 1. A clean run or a one-note miss is unchanged. A player who keeps failing moves on sooner: silent set 161 s, was 244 s; silent mic 102 s, was 161 s.
- **Not cut:** the stairs. Removing landings would mean moving rooms and entities with no way to test the jumps here, for an estimated 15-20 s.

**New first-run estimate, not measured (the review estimated 13-15 min before these cuts):**

| Part | Time |
|---|---|
| Mandatory talk, 23-26 boxes (was 28-30) at about 5 s | about 2:00 |
| Gigs played clean, plus waiting for the beat | about 2:25 |
| Scripted waits | about 0:15 |
| Walking and climbing | about 4:50 |
| **Clean run** | **about 9:30** |

With ordinary misses and one death, about **10-11 min**. That is inside the 6-10 bar only for a clean run. Getting a typical first run under 10 needs the stairs shortened, which should be done with a browser.

## NICE

| Item | Result |
|---|---|
| N2 | Done: Marcus's scene checks that Jo is still backstage. |
| N3 | Done: a new `_played` flag, so `ray_after` no longer claims a drill an old save never ran. |
| N6 | Done, unheard: song 1 opens on the tonic and song 2 now ends on it. Song 1 already ended on E; the review's "B" was off. |
| N1 | Not done: a seated talk loop needs new art and eyes. |
| N4 | Left for the owner: whether Marcus staying should make the set easier or cost something. It is a design call. |
| N5 | Not done: the atlas size was not checked separately. `npm run atlas` and `lint:scale` pass. |

## Scripted play after round 2 (engine time, without the beat wait)

| Gig | Clean | One miss a bar | Half the notes | Silent |
|---|---|---|---|---|
| Neon | 13 s | 25 s | 25 s, 0 freezes | 64 s |
| Open mic | 42 s | 87 s, 0 freezes | 89 s, 1 freeze | 102 s |
| Ray's drill | 14 s | 21 s | 21 s | 29 s |
| Set (Nia) | 69 s | 126 s, 0 freezes | 137 s, 4 freezes | 161 s |
| Set (Tally) | 70 s | 138 s, 0 freezes | 144 s, 4 freezes | 173 s |

## Still to rerun in a browser

Everything listed in round 1, plus:

- One Gambler run through the slate (the test is headless).
- Whether the wait before each call feels like the band counting or like a stall.
- Whether the two-stray rule ever catches an honest player who double-taps.
