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
