# Design fixes round 2: second-round review (designer and pro gamer)

Read-only. Worked from code and arithmetic: nothing run, no browser, no sound, nothing played. Read both round-1 reviews, `DESIGN_FIXES_R2_REPORT.md`, and commit 39975b4 (`git show`), then the live code around each change. Items the report lists as open are not repeated.

Verdict: the fixes do what they say, and I found no hole the fixes opened. One older hole of the same shape (hold Down = immunity) was never in scope and is still live in the Astronaut's boxing. That is the one MUST. Everything else is small.

## MUST

### M1. The Astronaut's boxing still has "hold Down, immune" (the round-1 M1 hole, a second copy)
- `src/scenes/AstronautScene.js:759`: a swing lands only if `!p.crouching`, checked once, at the instant the wind-up ends. Nothing records whether Jo ducked in response to the tell. `Foe.js` got `duckedAtTell`; the bout did not.
- Scenario: Jo holds Down from the bell and walks (crouch-walk is 140 px/s, the opponent backs off at only 30 px/s, `:725`, so Jo closes). In reach, `X` swings `p.swingLadle()` (`Player.js:418`): nothing stops a jab from a crouch except the old pro's `blocksDuck` (`:781`). Every swing check sees `crouching` true, so the bout is a free 5 jabs at 0.4 s cooldown. Bouts 1, 2 and 4 (Priya) have no `blocksDuck`. Only bout 3 forces Jo to stand.
- Why it matters: Nerve is one of the four stats the Board checks (`astronautData.js:280`), so a gate is reachable without ever reading a tell. The southpaw's feint (`:729`, "the real one comes while Jo is still down") is dead code for the same reason: a Jo who stays down is safe against the real swing too. Priya's lesson ("opens up only when Jo stops swinging", `:735`) is skipped by someone who never stops.
- Fix (about 4 lines, same pattern as Foe): at `b.state = 'windup'` (`:727`) set `b.duckedAtTell = p.crouching`; in the windup branch clear it whenever `!p.crouching`; at `:759` use `!p.crouching || b.duckedAtTell` for "caught". Keep `blocksDuck` as is. Add a check next to `foe-grab-fair` that a held-Down Jo takes the swing.

## SHOULD

### S1. A Continue doesn't calm foes, so the two named walk-past lamps are exposed on exactly that path
- `BaseLevel.js:338` (throw-out) and `:753` (respawn) call `calmFoes()`. `applyResume` (`:868`, `placePlayer(pos)` at `:900`) does not. A Continue is a fresh scene with Jo placed at a lamp and every foe at his spawn, with no `lastTick` gap to trigger any grace.
- Scenario: Continue at `astronaut/p1_track CP1a` (cleaner) or `painter/via cp_via` (rival). Those are the two lamps the new lint lists as patrol-past. The foe can start a wind-up on frame one while the fade-in is still running. The report calls the respawn calm "covers" them; a reload does not get it.
- Fix: `this.calmFoes()` once in `applyResume` after `placePlayer`. One line, same 1.5 s.

### S2. Hearts versus the curve: improved, not closed (playtest item, no code fix proposed yet)
- Numbers: 3, 4, 5 hearts at 0, 1, 2+ catches (`wallet.js:13`, `CAUGHT_HEARTS_CAP`). Tier reaches its top at the same count (`tuning.js:4`), so they now flatten together, which was the briefed fix and is right. Shards then add up to 3 (cap 8 at 9 shards at tier 2).
- What's left: the hit budget goes 3 to 5 (+67 %) while the tier-2 table moves pace by +5 to 16 % and timing windows by 10 to 20 %. No table touches damage, hazard count or foe density. So dream 3 plays more forgiving than dream 1 for the same player. That's defensible (later dreams are chosen by someone who's learned the game) but it is not a rising curve. The report doesn't say whether this is intended. If it is, say so in DESIGN.md §4; if not, the lever is one more tier column on hazards, not fewer hearts.
- Not checked by play.

### S3. The `slide_under` card now teaches the old rule
- `data/teach.js:20`: "duck through the grab, key Down". After the fix, a player already holding Down gets thrown with no explanation, and that is the player the card is for if they crouch-walk by habit (crouch is 140 px/s now, so people will still sneak). The only way out (let go, press again) is taught nowhere.
- Fix: hint "tap ↓ when he flashes". Optionally, when `duckedAtTell` is why a duck failed, floatText "get up, then down" at the throw-out.

## NICE

- N1. Pulsed-crouch macro. Mashing Down is not dominant; I checked. A duck needs one non-crouch frame during the 400 ms tell and then continuous crouch from reach (about 150 ms into the grab at gap 65, lunge 150) to the end of the 250 ms grab, so about 100 ms held. A 5 Hz press/release with 50 % duty succeeds about 2 % of the time; a 90 % duty pulse (20 ms release) about 40 %. A person can't do the 90 % pulse; a turbo or macro can. If anyone cares: count a release only after 60 ms up (`Foe.js:357`).
- N2. Shards past the cap read as a reward. At tier 2 with 9 shards the row is full; the 10th and 11th world shards still float "heart shard 1/3". `BaseLevel.js:491`: when `heartsFull`, say "the row is full" and give a coin or two. It also makes Bilal's "You're full" consistent.
- N3. Gap-triggered grace is spent by non-conversations. `Foe.js:292`: any >150 ms stall (a GC hitch, a tab blur) uses the foe's one grace, so a real conversation within the next 4 s resumes the wind-up where it stopped. Harmless in practice (the resume gives the remaining wind-up plus about 150 ms of step-in before reach), but only auto-opened modals could hurt and nothing auto-opens twice in 4 s. Leave.
- N4. Coin reconcile, a narrow edge. `wallet.js:43`: `deductWorth` takes `min(worth, total)`. If the player hard-closes the tab with unsaved coins, spends at Bilal, then Continues, the spent portion isn't deducted and those coins are back in the world. "Back to station" saves first (`BaseLevel.js:986`), so only a hard close reaches it. Cost: a few coins. Leave unless it shows up.

## Each fix, checked

| Fix | Closed? | Evidence |
|---|---|---|
| Duck must be a reaction | Yes for Foe | `Foe.js:163, 357, 366`. Up-and-down inside 400 ms works. After a missed grab Jo is still down when the next tell comes (miss: alert 600 ms, calm 450 ms, then a new wind-up), so each cycle needs a fresh release and press: a rhythm, not a hold. A jump while holding Down also resets it, but a jump already beat the grab (dy over 50), so nothing is new. Boxing is the exception (M1). |
| Mashing Down beats every grab? | No | See N1: about 2 % at 50 % duty. Not dominant. |
| Crouch at 140 px/s | Yes | `Player.js:735`, grounded only. Air speed unchanged. 140 is above the fastest chase: runner 130 x 1.1 x 0.9 = 129, proofreader 95 x 1.16 x 0.9 = 99. Crouching still outwalks every foe. |
| Astronaut `p3_survival` | No timer exists | `rooms.js:173-198`: rain and dark are decoration (`AstronautScene.js:2184-2195`), the gate is a flag (`survival`). Jo carries Priya there, clamped to 140 (`:2120`), the same as crouch. Crouch costs nothing. The security guard (patrol 218-226, sight 120) is the only grab, and the duck answers it. |
| Astronaut `p5_crevasse` | No timer, no crouch | `rooms.js:283-297`: moon bounds of 6, 8 and 10 tiles, air speed capped at 185 (`:2098`), run-up on the ground at the normal 280. Crouch isn't in the arc. |
| Other crouch consumers | Fine | Writer glass: `:1669` exempts any crouch regardless of speed (8 tiles at 140 = 1.8 s, no timer). Talker: crouch passes at any speed. Hide spots: Down held, no motion. Hub benches: no motion. |
| Pause is no dodge | Yes | `BaseLevel.js:916`: shifts `stateUntil`, `calmUntil`, `seenPlayerAt`, `alertAt` and resets `lastTick`, so the gap trigger doesn't fire. Death-card path goes through the same function. |
| Grace once per foe per 4 s | Yes | `Foe.js:292-299`. A card or conversation inside the window acts like a pause. A busy Jo is already immune to the grab (`!player.busy`, `:367`), so a looping NPC can stall but cannot gain. Worst case after a second modal: remaining wind-up plus about 150 ms step-in. |
| 1.5 s calm after respawn / throw-out | Yes, no exploit | Only reachable by losing a heart or all of them; Jo is also invulnerable for 1.5 s on respawn (`:751`), so the calm matches. Control returns 0.5 s after a throw-out teleport, leaving 1 s of calm. A foe standing at the lamp gets 1.5 s to be walked away from at 280 px/s. Gap: a Continue (S1). |
| 5-heart cap | Yes, see S2 | `heartsMax` is the single source: `BaseLevel.js:105, 493`, `HubScene.js:1597`. |
| Bilal at full | Yes | `heartsFull` needs `5 + floor(shards/3) >= 8`, so 9 shards at 2+ catches. At 8 shards the next one is useful and is sold; at 9 it refuses. Never reachable at 0 catches (needs 15). Order is right: `shardsBought >= 3` is checked first. |
| Coin reconcile on Continue | Yes | `BaseLevel.js:894-899` + `walletAtSave` in `saveRun`. `spend()` takes from `total` only, so `byDream` is untouched by shopping and `over` is exact. Shard save banks coins taken since the lamp for a Continue (and not for an in-session death); consistent and harmless. |
| Shard saves on pickup | Yes | `BaseLevel.js:499`; the shard is destroyed first, so `shardsTaken` includes it. |
| Pipes | Yes | `tuning.js:61-68`. Pipes 1 and 2 (period 2600, on 1100) at tier 2 tilted: 1782 on, 818 off. Pipe 3 (period 2200): 1500 on, 700 off. Warning 200 ms when tilted. |
| Foe pace curve | Yes | Chef, Astronaut, Writer rows [1, 1.08, 1.16]; pace only moves the starting gap. `lunge.test.js` runs the top tier for every kind. |

## Converged?

Nearly. Fix M1 (the boxing) and S1 (one line), then re-run `foe-grab-fair`. After that I have nothing else that needs a round. S2 and S3 are decisions and a card line, not holes. The things nobody has done are playing it: crouch speed, the 4 s grace and the 8-heart row are numbers only.

Not checked: Astronaut and Writer room crossings at the top pace, anything visual or audible, and whether a person finds the release-and-press duck natural (N1 and S3 turn on that).
