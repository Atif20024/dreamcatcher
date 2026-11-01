# THE LAST HAND (the Lantern Queen): senior designer review, round 1

Read-only review. Sources: the spec (`gambler_champion_critique.md`), `GAMBLER_REPORT.md`, `CASINO_POLISH_REPORT.md`, `src/dreams/gambler/*`, `src/engines/{showdown,faro,slate,purse}.js`, and the screenshots `gambler_*.jpg` (pre-polish) and `polish_*.jpg`. I did not run the game, so anything about feel (audio, animation timing, tell overlays in motion) is inferred from code and stills.

## Verdict

**Not converged: 3 MUST issues.** The rebuild is a large success against the spec. The walk-in rooms, the single-note rewards, the honest ledger, the "no orb for betting" finale and the era dressing all land. The remaining problems are not polish. They are the three places where the spec's *teaching* mechanics (STAND UP, the slate, TILT) exist in code but do not reach the player, so the dream's thesis is delivered by Lou's lectures and an on-screen objective rather than discovered through play.

## What works (keep)

- **Arc by place.** Warm quay, bright easy saloon, quiet focused card room, temptation office, cold deck, calm glass pilot house, silent landing. Light and music do the emotional work. The "music drops out as the stakes get quiet" choice is the best decision in the dream (`music.js`).
- **Honest numbers.** 5% rake with a visible coin, "SAVED $10" fold reward, bluff as a read with a "which tell called it" explanation (`table.js` infoLine). Nothing glamorises winning.
- **The finale's structure.** Win = one note and another hand; lose = the quay; only STAND UP ends it (`showdown.js` final mode). Lou's "I'd have stayed" plus a 1-coin orb is exactly right.
- **Environment storytelling.** Mrs Fenn's one coin, Voe's "my wife says I should stop", the pilot's "men come up here at five with their whole lives on the table", Lou's "forty-eight years I said one more" (78 - 30 checks out). The purser's plaque fix is clean.
- **Faro hook as bait.** Lou: "Remember how easy that was. It will not be." The kind box for small bets is a real casino practice, and it is told in-fiction.
- **Scale and readability.** Jo ~80 px against 101 px doors, 1.6 m tables, signs on declared backings, one HUD block. The office and card room stills read well.

## MUST (blocks "converged")

### M1. STAND UP, the dream's thesis verb, is never taught or credited where it is practised
- At tables 1-3 a pot win silently sets the table flag (`table.js` `sync`, ~l.435: `if (st.won && flag) F[flag] = true`), but nothing on screen says "table beaten". The info line only says "Your pot with a pair" (`table.js` infoLine ~l.318). The objective stays "win a pot at each table" until the encounter *ends*. Lou's "Stand up while it is yours" only plays after the player has already stood (`dream.js` `calls.tables`).
- Result: a player who wins the Judge's pot and keeps dealing is never told they can leave; the one verb the finale depends on has had zero reps before the finale, and then the finale's objective ("stand up from a table you are winning") simply tells them.
- **Fix.** When `st.won` becomes true: (a) relabel the verb `STAND UP: TABLE IS YOURS` in gold (`showdown.js` `menu()` stand entry, add `hot: s.won`) and draw it in the accent colour in `table.js`; (b) set the info line to `TABLE BEATEN. STAND UP WHILE IT IS YOURS.` for the next reveal; (c) advance the objective to `to_cards/tables`-style text on the win, not on leaving, via the existing flag. Three reps (one per table) is the spec's "teach it by habit" and makes the finale a decision rather than an instruction.

### M2. The slate is inert and mis-scaled against the faro payout
- `faro` always pays +$40 and `faroEnc.onResult` adds it to the stack, so every player enters the card room with $140. The slate's default goal is **$140** (`slate.js` `SLATE_ROWS` goal `at: 1`), so a player who accepts the defaults has *already reached the goal* before the first card is dealt. The table frame glows gold (`table.js` l.361-363) for the whole card room, so the "goal reached" signal is permanently on and means nothing. Goals of 120 and 140 are pre-hit; only 160+ are live.
- The stop-loss default ($60) is 80 under the $140 the player walks in with. With 5/10/20 stakes it is practically unreachable; a bust needs the stack under the $5 ante (`showdown.js` l.223). So the table-dims-under-stop signal never fires for anyone who is not tilt-creeping.
- Net: the spec's priority-4 mechanic, "the slate speaks", does not speak for most runs.
- **Fix.** Rescale to what the player actually carries: goal values `[150, 160, 170, 180, 200]`, default `160` (a +$20 night at the tables, close to the spec's "+$18"); stop values `[100, 110, 120, 130]`, default `110` (a $30 drawdown from the $140 walking-in stack). Or, simpler and truer to the idea: chalk the slate as profit and loss *at the tables* (`+20` / `-30`) and have `purse.js` rebase the lines at the card-room door. Add a test beside `showdown.test.js` that a default slate is not satisfied by the faro payout alone.

### M3. TILT is not explained at the moment it first bites
- TILT is a core mechanic, but its only proactive explanation is the meter label and a dimmed Lou line once ≥ 0.5 ("you can't hear him: you're steaming", `table.js` ~l.327). Lou's `lou_tilt` conversation plays only if the *player walks up and talks to him* (`cards.js` l.84 `talk: [{ conv: 'lou_tilt', if: 'tilted' }...]`). A first-time player who takes two bad beats (0.35 + 0.35) will see the tells become "· · ·" and Lou go silent, with no idea why or that the cure is the guard rail at the far east end of the room (`air` columns 44-54).
- **Fix.** On first crossing `TILTED` (in `verbs/purse.js` update, guard with `F.tilt_told`), fire a Lou caption: "Kid. Your ears are ringing. The guard, out the east door. Ten seconds." and pulse the TILT meter. Also, when the table encounter closes while tilted, fire the same line once. Keep `lou_tilt` for repeats.

## SHOULD

### S1. Lou's tips hand over the answer, so tells are optional
`LOU_TIPS` (`dialogue.js`) give the *verb* ("They're scared. Push."), the engine makes only legal verbs lit, and Lou is right 3 in 4 (`showdown.js` `lou.wrongEvery`). A player can ignore every tell and follow Lou, losing only a $10 call on the bad quarter. The "wrong tip" is not detectable without already knowing the tell table, and not costly enough to teach it.
- **Fix.** From table 2 on, Lou describes what he *sees* ("Her finger's off the glass.") and sometimes mis-reads it ("Nico's flat. He's got nothing."), rather than naming a verb. The player must map observation to verb. Keep the verb-naming tips for table 1 only. Make Lou's miss cost more: at table 3, a wrong "call" tip should be on a hand where calling loses a pair-sized pot.

### S2. "Reading people" is reading a text label; the people are tiny and half hidden
At zoom 1.25-1.35 the seated people occupy a ~50 px strip under a panel that covers about 60% of the screen (`gambler_cards.jpg`, `gambler_pilot.jpg`). The tell overlays (notes, glass, collar hand) are drawn on those sprites (`table.js` `drawTells`), so they are almost invisible, and the panel states the tell in words anyway ("HAND STILL", "TOUCHES HIS COLLAR"). That is a lookup, not a read.
- **Fix.** Draw a 2x-scale animated tell vignette *inside* the panel next to the name (hand-at-collar, pinky off glass) and drop the word label after table 1 (keep it for tilt-clear sight only if you want an accessibility mode). At the very least, move the panel to a slimmer band so the seated people are visible at zoom 1.25.

### S3. The finale has no pull, and its objective states the answer
- The objective at the pilot house is literally "stand up from a table you are winning" (`dream.js` `objectives.last`). The Last Table's CALL and RAISE are lit, STAND UP is the obvious button, and Lou is silent (`lou: null`). The player has been trained since M1's gap only by lecture. The decision is nearly free, and a pot of the night's *profit* at a coin flip is a sobering, not tempting, offer.
- Also, `showdown.js` l.220 hard-codes Voe's `tell: 'hum'` regardless of his third card. The tell is "true, never random" everywhere else; here it is always strong, which quietly breaks the rule the player just learned. Either keep it as the deliberate warm lie, and say so in a comment, or make it true.
- **Fix.** (a) Rename the objective to what is *seen*: "Judge Voe is dealing at the forward glass" (consistent with the rest of the goal text). (b) Give Lou a cracked whisper at the Last Table that is the dream's habit voice: "Take it. Just the one. I'd have taken it." (c) Let the verb cursor start on CALL and creep there even untilted, once, as the "habit" (reuse `creepMs`). Then STAND UP is a real act against pull. (d) Do not add reward; the pull is internal.

### S4. A lost last hand is a long, dull walk
`calls.lostNight` returns Jo to the quay with `bust`-style reset (`dream.js` `toQuay` and `lostNight`). The flags stay, so the player re-walks quay > saloon > card room > office > corridor > deck > pilot house (seven rooms, a platform climb) for a $20 coin flip (`finalStake` = max 20, stack - buyin, which is 0 after a reset). That is a punishment for a design-neutral event and it will feel like a chore on the second loss.
- **Fix.** Keep the quay and the slate beat, but add a one-way "back stair" door on the quay that goes straight to the pilot house once `lost_nights > 0`, with Lou: "I always found my way back up. Every time." It turns the cost into the addiction loop, which is the point, and costs seconds not minutes.

### S5. Two dollar counters on screen
The top-right HUD shows `0 $415` (the game's half-dime coin tally) directly above `STACK $100` (`gambler_quay.jpg`, `gambler_saloon.jpg`). In a dream about what money means, two unrelated "$" are confusing, and the half dimes are spec'd as worth 5 each so the player may think they feed the stack.
- **Fix.** In this dream's profile hide or relabel the coin counter (a small coin icon with no `$`, or "HALF DIMES 0"), or place the stack plate away from it. Check `hud.js` coin slot for a per-dream label.

### S6. Markers inflate the stack, the goal glow and the Last Table stake
`signMarker` adds the $50 to `p.stack` (`purse.js`), and `line()` and `finalStake()` (`showdown.js` l.197) read the stack. So borrowing $50 can lift the player over the goal line (the table glows gold on borrowed money) and makes the Last Table stake include the loan. It is arguably thematic, but the glow and the "profit" should not lie about debt.
- **Fix.** `line(p)` and `finalStake` on `stack - debt`. Let the HUD stack bar show the debt as a hatched segment. The cashOut ledger already gets this right.

### S7. Faro: decision-free grind, and the key advice is optional
- A careful run is ~13-14 bets (`CASINO_POLISH_REPORT` says 13), each ~2.4 s of animation plus input, and the rank choice (`faro.js` `card`) has no effect on odds. It is a long press-E loop in the room that should be the "easy and warm" one. And the winning move ("ten at a time") is only said in `lou_saloon`, an optional talk (`saloon.js` l.82); a player who skips Lou and bets $20 busts about 64% of the time.
- **Fix.** (a) Show a one-line hint in the faro view row: "10 AT A TIME: THE BOX IS KIND" (`table.js` faro presenter), or make the first bust's line carry it (it already does). (b) Reduce the target distance: target $70, or make the first four wins carry $15 so ~9 bets. (c) Make the rank selection mean something (a "copper" token: bet the bank to lose on a rank for a different split) or auto-skip the row after the first bet. (d) NICE: add "The box was kind for the first N bets. After 30 it would not have stayed kind." to the ending ledger (`purse.js` `ledgerLines`) so the hook is revealed.

### S8. Floating grey rectangles read as glitches
In `gambler_quay.jpg`, `gambler_deck.jpg` and `polish_office.jpg` there are horizontal runs of small grey blocks hanging in mid-air: left of the quay lamp at the sky, under the PURSER sign, left of the ladder on the deck. They look like detached window lights or dust motes rendered as squares. Check the `motes: 'dust'` backdrop config (`dream.js` `backdrops`) and the office back wall; if they are motes, draw them as soft 1-2 px points with alpha, not 4-6 px opaque squares.

## NICE

- **N1. Dim verbs explain themselves.** `menu()` already carries `why` ("a raise wants a pair"); `table.js` does not show it. Put it in the info line while the cursor rests on a dim verb.
- **N2. Quay is text-heavy.** `lou_quay` is seven nodes before the player can move; `l2` and `l3` overlap. Cut to five and let the fog do the rest.
- **N3. The deck objective implies a gate that is not there.** "Reach the pilot house with a clear head" suggests low TILT is required; nothing checks it. Either soften the text ("the pilot house, at the end of the roof") or make it true: Voe will not deal to a man who is steaming (the last room has no fail state, but a short "come back when you can hear me" is on theme).
- **N4. Table-frame signal is faint.** The gold glow and the dimming frame in `table.js` l.363 are a 0.6 alpha stroke on a dark panel; in the stills I cannot see them. Raise the alpha or wash the panel ground slightly.
- **N5. Crake appears only after a marker.** If the player never signs, the office is a plain hallway. Consider his silhouette at the far end of the corridor from the first visit, as the thing you walk toward, so the decision not to sign has presence.
- **N6. Coin placement.** The half dimes at the guard (`c_guard`) are a good lure for the TILT cooling; do the same on the deck with a small loop to make "walk it off" a place, not a timer.

## Pacing and difficulty (summary)

- **Pacing.** Quay ~0:45, saloon ~1:30 (faro grind is the risk), card room ~3:00, office ~1:15, deck ~1:15, pilot+landing ~1:30: on spec at ~9:15 for a careful player. The card room is the right length but its three tables are the same decision tree three times (see below). The deck is the best-judged pause in the dream.
- **Difficulty.** The tells are deterministic and fully mapped (`PLAYERS` in `showdown.js`): no pair + all tells fold = bluff, any strong tell = fold, else call. A player who learns it plays a near risk-free game; nothing at table 3 adds a new idea except that the Judge makes bluffing impossible. The pressure the spec wants (tilt, creep, stop-loss) currently only reaches players who lose, not players who are tempted. Hence M2, M3, S3. A cheap curve sharpener: at table 2 let Sorrel occasionally have the pinky off with only ace-high (the engine already counts "fair" as pinky, `showdown.js` l.99); show the player's loss as "she had something, but you had a pair" so the tell stays honest while the read has stakes.
- **Failure states.** A faro bust (to the saloon door with the remaining stack) is now gentle; a table bust is rare enough that it is not a real threat. That is fine for a calm dream, but then the slate and tilt must carry the tension.

## Priority order to ship round 2

1. M1 STAND UP teach and credit at the tables
2. M2 slate rescale (defaults must not be met by the faro payout)
3. M3 TILT first-crossing caption
4. S3 finale pull + objective wording, then S1 (Lou describes, not instructs)
5. S4 back stair after a lost night, S5 HUD coin label, S6 debt-aware line
6. S2 tell vignette in the panel, S7 faro hint/length, S8 floating blocks
