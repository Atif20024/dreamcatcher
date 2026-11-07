# THE LAST HAND: gamer review, round 1

Read-only review by the card player and platformer fan. Sources: my earlier spec (`gambler_champion_critique.md`), `GAMBLER_REPORT.md`, `CASINO_POLISH_REPORT.md`, `src/dreams/gambler/`, `src/engines/{showdown,faro,slate,purse}.js`, the two test files and the screenshots (`gambler_*.jpg`, `polish_*.jpg`). I did not run the game. Every number below is worked out by hand from the engine code, so treat the EVs as close estimates, not simulations.

## Verdict

**Converged: yes. No MUST left.** The spine of the spec is built and it holds: the tells are real, bluff is a read, the fold shows its saving, the rake is visible, and only STAND UP catches the dream. Nothing in what I read breaks the dream or lets the player skip its point.

There are 7 SHOULDs. Four of them are small ones that would otherwise be reported as bugs on a first playtest (the negative stack, the $0 final hand, the missing key legend, the tiny touch targets). Three are about teaching and temptation.

The one thing I would not call a defect but want you to see: **SHOWDOWN is a solved lookup table, and the dream has almost no temptation in it.** Both are in section 1.

---

## 1. Feel, skill and degenerate play

### Can you farm SHOWDOWN? Not in a way that matters.
- Each table is one sitting (`unless: 't1_won'` and so on in `rooms/cards.js`). Within a sitting there is no cap, and best play has positive EV by my estimate.
  - Example: Judge quiet and Jo holds a pair. RAISE nets +$22. A pot of $50 is raked $3.
  - Example: at table 2, Sorrel "HAND STILL" and Nico "COLLAR" with Jo holding nothing. A bluff is deterministic. Pot $35, rake $2, Jo puts in $25, so +$8 every time.
- Money buys nothing. It feeds only the ledger and the final hand's stake, so farming is harmless. It is just a way to inflate "up $N".
- The only real risk of this strategy is that a sharp player reaches the last table with a big stack. Then RAISE $stack is a bigger coin flip than the dream wants, which is fine.

### Is bluffing ever right?
Only at table 2, and only for +$8.
- Table 1 and table 3 both seat the Judge, who calls everything (`PLAYERS.judge.calls`). BLUFF is a trap there.
- That is good teaching. The failed-bluff line names the tell that called it, and Lou never recommends a bluff next to the Judge.

### Is the faro "70% newcomer luck" exploitable?
- At $10 a bet, EV per bet is roughly +$2.8 by my arithmetic (win 0.66 at +9, lose 0.28 at -10, split 0.06 at -5). That is the design intent: a kind box for the careful.
- The 30-bet cap resets on every sitting, because `bets` lives inside the engine instance. But the bank ends at $80 and the table is gone (`unless: 'faro_done'`), and 14 bets reach $80, so there is nothing to farm.
- The real exploit is the **dealer's comp** (see S3 below). It is strictly dominant.
- The card you pick on the layout never changes the odds. `other` is drawn only for the display. It is pure ceremony, which is fine for a period feel, but a player who thinks about it will notice.

### Skill: the game is solved once Lou's talk is read
- The tells are printed in words (`TELLS[...].word`), so there is nothing to "observe". The skill is knowing the mapping. Lou's lines in `lou_cards` hand over the whole mapping.
- `bestVerb` is the whole solution: pair means RAISE; all tells fold-type means BLUFF; any strong tell means FOLD; else CALL. Lou tells you this 3 hands in 4. The honest uncertainty left is:
  - what a "fair" hand (ace or king high) really is;
  - Lou's wrong tip.
- That uncertainty is thin. See S4 for the cheap sharpening.

### Temptation is nearly absent
- **Bust is free.** `purse.bust()` resets the stack to the buy-in with no cost beyond a walk. The faro does the same once the stack falls under $40.
- **The marker has no payoff.** The loan is money-neutral (it is paid off the top at the landing), and in return it lowers the corridor ceiling, adds tilt, and brings Crake.
- **The whisky buys nothing** (`comp_drink` is +0.08 tilt and a ledger line).
- So nobody has a reason to sign a marker, drink, or "chase". The dream says "the best night is small", but nothing pulls the other way, so the moral has nothing to push against. This is the main design gap. See S3 and S5.

---

## 2. MUST

None.

---

## 3. SHOULD

**S1. A stack that cannot cover the bet goes negative.**
`menu()` in `src/engines/showdown.js` enables CALL and RAISE with no affordability check, and the deal only requires `stack >= ante (5)`. At a stack of 8, the ante leaves 3 and a CALL leaves -7. `sync()` in `table.js` then writes the negative into `P.stack`, and the HUD plate shows it.
- Fix: in `menu()`, set `enabled: live && s.stack >= cost` for call, raise and bluff. When the stack is short but positive, say "ALL IN $n" (put in whatever is left).
- Add a test beside the "rake and settle" ones.

**S2. A lost final hand can leave Jo at $0 with nonsense labels.**
In `lasthand`, a lost RAISE all (`RAISE $152` in `gambler_pilot.jpg`) leaves `p.stack` at 0. The `lostNight` call in `dream.js` never resets it (only `bust()` does). Back at the table, `finalStake` is `min(0, ...)`, so the panel reads "CALL $0 / RAISE $0", "plays the profit" is false, and the ledger ends "down $100".
- Fix: in the `lostNight` call, set the stack to at least the buy-in minus the lost profit, or simply `p.stack = Math.max(p.stack, p.buyin)`, and clear tilt.
- Also: when profit is 0, `finalStake` is still $20 (`Math.max(20, ...)`), so "CALL plays the profit" is also false at $100. Reword the line to "CALL plays $N" when profit < 20.

**S3. The comps cost nothing, so the dealer's comp is strictly dominant.**
`comp_stake` (`beats.js`, `calls.compStake` in `dream.js`) only adds a ledger count. A free first bet at $20 has about +$10 EV with no downside, and the dealer line says it is "only a courtesy". Taking it is simply right, which undoes the lesson that "on the house" is never free.
- Fix: make the free stake a real debt, `p.debt += 10`, and print it. The debt already comes off the top at the landing (`cashOut` in `purse.js`), so it costs nothing extra to build.
- Same for the whisky: tie it to something the player might actually want. Right now it buys nothing, so only a fool would take it, and nobody is tempted. If you keep it as a pure lure, accept it as the dream's joke.

**S4. Lou's wrong tips follow a fixed pattern, and one of his "right" tips is weak.**
- **The pattern.** `(s.hand + seed) % lou.wrongEvery === 0` in `showdown.js` makes his error exactly every fourth hand. A player who counts it can skip the reading entirely. Use the seeded `r()` with the same rate, or randomise the phase per table.
- **The weak tip.** `bestVerb` says RAISE with any pair, even when the Judge hums. A hum means pair or better, so the raise is a coin flip at $20 more. A loss there is always `bad_beat + big_loss`, which is 0.5. That is TILTED from one hand. Make `bestVerb` return `call` for a pair against a strong tell (not for trips).

**S5. Tilt barely appears in a normal run, and when it does it is hair-trigger.**
- Normal play rarely loses a pair-raise. A player who never raises never tilts and never sees the pipes get harder or the cursor creep.
- A lost pair-raise is always `bad_beat` 0.35 plus `big_loss` 0.15 (the pot is always over $40), which equals `TILTED` (0.5) exactly. One hand tilts you.
- Cooling is also trivial: from 0.5, any brief walk in the air takes it under 0.5. The "ten seconds" rule only matters for the vignette. A 33-column walk to the guard (`AIR = [43, 53]` in `rooms/cards.js`) is the real cost, which is fine.
- Fix: make `big_loss` 0.10 so one lost raise sits at 0.45, and the second loss in a row tips it. Or leave it, but make the first tilt a shown moment, not a silent threshold. Lou has `lou_tilt` for that, so he should speak the first time it trips.

**S6. Teach STAND UP at the tables, and put a key legend on the SHOWDOWN panel.**
- **STAND UP.** Nothing tells Jo to stand once a pot is won. The objective line stays "win a pot at each table" (see `gambler_cards.jpg`), and Lou's "Stand up while it is yours" only plays after the standing is done (`calls.tables`). A first-time player keeps playing until they bust. The thesis of the dream is the verb, so it should be seeded earlier.
  - Fix: when `st.won` is true and the phase is `decide`, make the line under the verbs gold, "A POT WON. STAND UP WHILE IT IS YOURS", and gild the STAND UP label. `infoLine` in `table.js` already branches on `won`.
- **Keys.** The slate and faro panels print their keys. The SHOWDOWN panel does not, and the HUD context line is cleared (`hud.set('context', '')`). I did not find a key legend anywhere in `table.js`. Add a dim bottom row "[LEFT][RIGHT] choose  [E] play". On touch, the taps cover it.

**S7. Touch targets for the verbs are small on a phone.**
`optionRects` in `table.js` makes each verb a 36-unit-tall strip (UI space is 960x540). On a 667x375 phone that scales to about 25 CSS px. A miss is harmless (taps outside the verbs are ignored), but it is fiddly with the two-tap select.
- Fix: grow the hit band to about 60 UI units tall, from `y - 20` to `y + 40`, and keep the visible plates as they are.
- Also: after a final-hand loss the backtrack is long. Quay to pilot house passes six rooms, a hatch and the timed pipes again. See N4.

---

## 4. NICE

- **N1. The final hand's Judge hums with kings and nines.** `deal()` hard-codes `tell: 'hum'` for the final hand, and the panel shows "HUMS" (`gambler_pilot.jpg`). The spec promised "tells are true every time". The hum means nothing here. Make the final-hand tell `quiet`, or drop it.
- **N2. The up-card is real information that nothing mentions.** An opponent's visible card is one of their three, so a high up-card means "fair" (ace or king) at least. `tier()` uses it, but no line, tip or sign says so. One Lou line at table 2 would turn it into a real reading skill: "Watch the card they show too."
- **N3. The faro card pick does nothing.** If you keep it for the period feel, say so in Lou's third saloon line ("any rank, the box doesn't care"). The faro is 14 coin flips of a minute. A short flavour exchange on the first rank might make it less of a chore.
- **N4. Quick return after a lost final.** The backtrack is the price, and that is the spec. But 2 to 3 minutes through the corridor (with Crake, if markers were signed) and the pipes again is heavy for one greedy tap. Option: land Jo at `cp_deck` and let Lou say "the quay is behind you now". Keep the quay for busts.
- **N5. Tell sprites sit under the panel.** In `gambler_cards.jpg` the seated players are 40 px tall below a 212 px panel, so the pinky and collar sprites are nearly unreadable. The words carry the tell, so this is only a loss of atmosphere. A tilt-blurred tell still shows as a faint sprite, which is a nice touch to keep.
- **N6. Fold accounting is flattering.** "Kept $70" counts every correct fold as saving a full $10 call. It ignores the $5 ante that was lost and the pots won by folding nothing. It is a good-feeling number rather than an honest one. If it is meant as the ending's tone, that is fine.

---

## 5. Controls

### Keyboard
- **Menu.** Left and right move the verb, up and down do the same, and the cursor wraps and skips the dark verbs. E plays.
  - The cursor starts on CALL, the safest verb. An E-masher plays safe until tilt creeps the cursor, which is good design.
  - Wrap-around lets left from CALL land on STAND UP. At the last table that is the catch itself, so it is fine.
- **Reveal.** E skips after 700 ms, and the hand auto-deals at 2.6 s. Good pace: a hand is 4 to 5 seconds.
- **Faro.** Starting on row 1 (the bets) with the seven selected means E, E is a bet. The two-row model (card, then bet) is fiddly for a game whose card does not matter. Consider making UP and DOWN unnecessary by default (N3).
- **Esc** opens the pause menu during a hand. STAND UP and Backspace step away. The last table cannot be left by Esc. That is intended.

### Touch
- The two-tap verb (pick, then play) is the right call for a game where a mis-tap costs money.
- Verb strips are small (S7).
- Tilt creep still runs between the two taps. A cursor that jumps from your first tap to RAISE could be tapped by accident. Consider pausing the creep for 500 ms after a tap, as `move()` already does for keys via `creepT = 0`.
- Context buttons are not used by this dream, so there is no clutter.

---

## 6. The timed steam pipes and the deck

- Two pipes, period 2600 ms, 1100 ms on, 1500 ms off, 450 ms of warning wisp, 8 tiles apart. The pockets between and beside the pipes are wide, so crossing one at a time is always possible. That is a gentle test, not a gauntlet.
- When tilted, the warning goes and the blow lasts about 1485 ms, which leaves a window of roughly 1100 ms. Still passable. Good: tilt makes it harder without making it unfair.
- A steam hit costs a heart and knocks back. `cp_texas` sits on the near side of the roof, so a fall back to the last lamp is short.
- Because tilt rarely appears (S5), most players will see only the plain, easy version.

## 7. Is the stand-up catch discoverable?

Yes, and arguably too much so.
- The HUD objective at the last room reads "stand up from a table you are winning". The panel line says "CALL plays the profit. RAISE plays it all. STAND UP takes it home." Voe and Lou both say it.
- That is stated outright, not discovered. A player must choose it over a gleaming "bet it all", which is the dream's point, so I would keep it. But it means the catch is a test of will rather than of insight. Fine.
- The real risk is the opposite one, at the earlier tables (S6): the verb is never shown to be the way out.
- Fail state at the last table: a lost hand costs the night's profit and a long walk back. A won hand slides another across with one note and no fanfare. Both are honest. **Greed is capped only by a coin flip at about -5% EV (the rake)**, so a reckless streak is fun, not exploitable.

## 8. Readability

- The panel is clear: tells in words, cards with ranks in the corner, "HIGH CARD" or "A PAIR" under the hand, the rule strip as the default line. A new player can read it without a tutorial (`gambler_cards.jpg`).
- The HUD block works as one plate: stack bar with the red and gold posts, slate numbers, TILT (`polish_hud.jpg`). It is small but legible.
- The disabled verbs (RAISE with no pair) are dimmed but not explained until hovered or pressed. The `why` text in `menu()` ("a raise wants a pair") is never printed. Show it under the dimmed verb or in the info line when the cursor tries to land there.
- Fold chime: "the loudest sound in the room" is correct and teaches well. I cannot judge the audio (dev is silent).

---

## 9. Summary

| Priority | Count | Items |
|---|---|---|
| MUST | 0 | none |
| SHOULD | 7 | S1 negative stack, S2 $0 final hand and wording, S3 free comps, S4 Lou's pattern and weak tip, S5 tilt sensitivity, S6 STAND UP teaching and key legend, S7 touch targets |
| NICE | 6 | N1 to N6 |

Converged: **yes**. Fix S1, S2 and S6 before the next playtest. S3 and S5 decide whether the dream pushes back on the player at all, and those are the design calls for the owner.
