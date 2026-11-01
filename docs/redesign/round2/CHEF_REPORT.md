# FIVE-STAR DREAM rebuilt (platform 1)

Design: `docs/dream_chef.md`, committed before the build. Code: `src/dreams/chef/`, `src/engines/tickets.js`.

## What it is now

One night at Le Rêve, Hôtel Vauclerc, Saint-Orvain, October 1957. Seven rooms in six places, one verb: the ticket rail. Tickets hang on screen; each lists its stops in order. Jo walks to a station and does the next stop with his body. Every room runs the same engine.

| Place | Goal | Who is there, doing what |
|---|---|---|
| Service yard, then the pit | Clear the rail, earn an apron | Marguerite smokes at the back door, later brings the apron. Bastien sprays and sings |
| Cold store | Saffron, top shelf; COLD runs out, hands let go | The cat on the one warm pipe, which is also Jo's only warm spot |
| Prep kitchen | Stock the line before the doors | Tomé chops, cries, laughs at the wireless, tells you what the room will order. Brann walks the floor |
| The line | Three sittings of tickets, then Table One | Aurelio behind the hot window says "Next." to every plate. Marguerite at the sauce takes your strays. Luc: "Behind!" |
| The pass | Finish the plate, hold it out | "Stage. Hands." Jo's hands on screen, painted from the run; Aurelio reads them |
| Dining room | Carry it out, walking | Nobody. Every plate sent tonight sits at its table, untouched. The lamps click off behind him |

## The review's list

| Item | Done how |
|---|---|
| C-M1 gold leaf blocks the service | Gone by design: hands only hold a finished plate; the pocket can't block. Scenario `chef-pocket` |
| C-M2 hands payoff | Plays. Lines and painting come from `readHands(F)`: burns, frost, flour, onion, Marguerite's bails, clean hands read differently |
| C-M3 nobody there | Marguerite, Aurelio, Brann, Bastien, Tomé, Luc, the porter and two commis are drawn cast with costumes, on the floor, working |
| C-M4 moments have no subject | Tomé, the cat, Bastien, each at a verb prompt. Ids `m1 m2 m3` kept |
| C-S1, C-S7 | Rewritten d0 and d6; the kitchen drops out at the dining room door; one click per lamp |
| C-S2 rail causes the rush | The rail is the rush. The prep choice sets the rush's stock |
| C-S3 prompts | Every station says what [E] will do, or why not |
| C-S8 identical sprites | Each dish has its own plate |
| Keep list | Beat-synced burners, cold-store climb and lit pedestal, "Chef never says good", "...Next.", the grab you duck under. Not kept: grease blobs (see `docs/dream_chef.md`) |
| F7 unseeded orders | Tickets are authored, in teaching order |

Choices that matter: which mise tickets to do (rush stock); gold, Tomé's onions (only if you stopped for him) or plain, which changes Aurelio's line and the ending image; asking "Is it good?" or not, which changes Marguerite's line.

Soft failure: a late ticket is called back with its progress; a second lateness and Marguerite takes it. Hearts run out: the shared card, back to the lamp, rail still running.

## Balance (seeded bots, `tests/tickets.test.js`, line at difficulty 0)

| Bot | Rush | Served / Marguerite took | Late | Burnt |
|---|---|---|---|---|
| Expert | 2:39 | 14 / 0 | 0 | 1 |
| Ordinary | 3:35 | 14 / 0 | 5 | 2 |
| Slow | 6:30 | 9 / 5 | 15 | 6 |

At difficulty 2 the same bots: expert 2:36, 2 late; ordinary 3:39, 9 late, 1 taken; slow 5:46, 21 late, 9 taken. Every bot finishes at every difficulty on every seed tried.

The bots do not jump, and their burner cost is an estimate, so these show relative difficulty, not real times. Difficulty 1 and 2: dues x0.9 and x0.8, burners every 3 and 2 beats, Luc faster, one more ticket at 2. Estimated total 7 to 10 minutes. **Nobody has played it by hand**, so the feel of the burners, Luc, the climb and the prep clock is untested.

## Checks

- vitest (333), lint:content, lint:rooms, lint:scale and vite build all pass.
- 45 scenarios run in the browser (every one with chef in its id, plus those that used the chef as a test bed): 44 pass. `jo-contrast` fails, listing gambler and evening, which this work didn't touch.
- `chef-playthrough` passes on its own: yard to CAUGHT by real inputs in about 24 s of stepped time. The bot is invulnerable, so hazards are not in it; `chef-pressures` covers burn, spill and cold. It did all three mise tickets, and sent 13 plates in 166 s of rush with none late.
- `__dc.readability()` was empty in each place checked with the rail up, and in the dining room.

## Changed outside the dream

- `ending.variant`, F passed to `ending.paint` (`EndingSequence.js`).
- Silent NPCs no longer offer [E] talk (`DreamScene.js`). Affects every dream, for the better.
- The `shove` card no longer shows in framework dreams, which have no shove key (`Foe.js`).
- `SaveStore.run()` drops an old saved Chef run; the board then offers a fresh boarding.
- `IntroScene.js`: the missing `dreamById` import (also fixed on `redesign`, same line).

Deleted: `ChefScene.js`, `data/chefMap.js`, `data/chef/`, `themes/chef.js`, chef-only foes and their art, the chef audio room table, teach zones. Kept on purpose: the `chef` band in `audio/bands.js` (a test uses it), the `sizzle` loop, `Foe.js` split and spray behaviour (generic).

Scenarios moved: `shadow-slope` and `slope-*` to the writer's ramp; `gate-hint-visible`, `lamp-checkpoint`, `panel-frame` to the astronaut; `objective-room-entry` to the writer; `chef-chimney-walljump` deleted with the chimney. `wall_jump` now has no staged room.

## Known, not fixed

- `jo-contrast` reports the chef's candle at 2.17:1 local in the service yard, under the 3:1 bar. It is listed as a dark room, not a failure, and Jo reads fine in the screenshots, but the number is what it is.
- `panel-frame` passed in the last batch only as the astronaut's; it found 0 panels when run by itself earlier, so treat it as order-dependent. `chime-events` needs an earlier boarding when run alone. I did not check either against the base.
- `checkpoint-label` skips its "Esc closes" check in framework dreams: under the stepped clock the menu doesn't close, on the gambler too. By hand, real Esc opens and closes the menu in the chef.
- `BaseLevel.js` still names a `chef-crate` texture that no longer exists; it falls through. Left alone because the feel job owns that file.
- Audio has never been heard (dev is silent): the new beds, the band keys and the drop at the dining room door need a listening check with the owner.
- `redesign` moved ahead while this ran. `ChefScene.js` got a one-line change there, so the merge has a delete/modify conflict: take the delete. `src/scenes/DreamScene.js`, `HubScene.js` also changed; not test-merged.

Screenshots: `chef_<place>.jpg` in the session scratchpad.
