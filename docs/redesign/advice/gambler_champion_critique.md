# THE LAST HAND: champion's critique and a redesign

Written by a card player and platformer fan, for the owner. Read-only review. Line numbers refer to the files as they stand on the `redesign` branch.

## 1. Blunt critique of what is there now

**Story.** The logline (`docs/dream_gambler_last_hand.md` l.7) is good. The execution has no dreamer. We never learn whose dream it is or why Jo is in it. The villain, Mr. Favour, is a suit who "takes your coat". He is a ghost story, not a person who ruins people. Lou, Dede and Sal are lovely sketches, but each gets one line. The spec states a lesson ("the dream you don't earn", l.9) and then spends 20 minutes on spectacle.

**Objectives.** There are none you can read. The spec's section map (l.62-69) is a list of hands with timings, not goals. Nothing like "fix this, the door opens". Areas are slices of one long scrolling map (`src/data/gambler/rooms.js` l.5-20 cuts rooms out of `FULL`). You never walk into a building, and the scene never changes. This is the opposite of the clock-house pattern.

**Length and scope.** The spec targets **18-22 minutes** (l.3) against a bar of 6-10. It has six card games, plus slot reels (`GamblerScene.js` l.866), a roulette wheel (l.958), dice bridges (l.1005), card platforms (l.802), a billiards puzzle, a safe (l.1219), a van and a barrier (l.1303-1337), a chandelier (l.1275) and a pit boss (l.318). The scene is 1961 lines and `gamblerPuzzles.js` is 983. Five-card draw alone is about 280 lines (l.577-856). Nothing is taught well because everything is half-taught. The lead review already said this (`lead_design_review.md` l.207-211); the plan never went further than "cut".

**Difficulty curve.** It is a moral curve, not a skill curve. Early games are generous on purpose, and the hard part is the "slide", where the game takes the trumpet (spec §3.6). Losing the player's tools as punishment feels like a bug, not a lesson. The pit boss follows once Jo is "up 10 chips" (l.318-328). The chip runners snatch chips if Jo stands still at a table for 5 s (l.777; spec l.37). That punishes the one thing poker needs, which is thinking. Three tells plus a suppressible player tell (spec l.113) is a lot for someone who has never played poker.

**Mechanics that lie.** Hearts can be staked on bets (spec §3.2). That makes life itself a casino chip. It is the platformer's version of gambling, and it teaches that risk and reward are the same currency. Chips are "pending" until cashed, which is an accounting rule that no player will feel. The spec's winning path ("a player who reads tells and walks away up is possible") is a quiet footnote. The loudest thing in the design is the gold, the swelling stinger and the chip flood when Jo bets and wins the last hand (spec l.185-186). That path completes the dream. It is the most glamorous moment in the level, and it rewards the wrong choice with confetti and an orb. A critic would call it "glamorising with an asterisk".

**Environment and art.** It is a generic neon casino, any city, any decade: "THE MERIDIAN", mirror ceilings, slot banks. It has no era and no place. There are lots of ideas (a mirror Jo, a chip fountain) and no singular image. Also, rain, car park and bus stop are borrowed from other dreams' vocabulary.

**Pacing.** Four minutes on the Floor and 4.5 on the Back Rooms, with the dream's one real idea (leaving) arriving in minute 17. The ending text depends on flags (sal_chip, voided chips) that a first-time player will mostly never see.

**What is worth keeping.** Tells as the only skill. The marker as debt. Dawn after a night with no clock. Sal and the carpet. Standing up as the catch. The "always-visible button" idea, turned the other way: the always-visible *walk* option.

## 2. The redesign: THE LAST HAND, aboard the river boat

### Premise and Jo's role
The dreamer is **Lou Verrick** (matches the Evening shot where Lou deals cards for matchsticks). In waking life he is seventy-eight and a retired river gambler. He was never ruined by one terrible night. He was ground down by a thousand "one more hands". In the dream he is thirty, in the one night he almost did it right. Lou stands behind a chair and cannot sit: his hands shake. **Jo sits in Lou's chair.** Lou stands at his shoulder, whispers what he sees, and is sometimes wrong. Jo plays Lou's last stake, a hundred dollars, and the night's job is simple: go home with something, not everything.

### Era and setting
**The steamer *Lantern Queen*, on the river Verrane, autumn 1884.** The Gilded-Age river boat is the right choice for a professional card player. Packet boats carried travelling sharps because passengers were strangers, bored and carrying cash. Everything is lamplit, brass and varnished wood, with no neon and no screens. A boat is a perfect walk-in world: every area is a room with a door, it moves, and the only exit is the gangway at the next landing. That gives a natural clock (the landing at dawn) without a visible timer. The river is the "one clear direction". It stays quiet for a gambler-dream: no one can be hurried by a siren, only by habit. Invented names only: Port Merrow, the Verrane, *Lantern Queen*. No real boat, line or player.

### Cast
- **Lou Verrick**: the dreamer, at your shoulder. Warm, tired, a bit vain. Barks one tip per table, and about one in four is wrong (his habits).
- **Mr. Pell**: the purser. Pleasant, remembers names, never raises his voice. The house. Keeps the cage and the marker book. A person, not a ghost.
- **Judge Harlan Voe**: big, kindly, comped; plays too loose and is the first table.
- **Madame Sorrel**: dry, patient; never bluffs (if she raises, she has it).
- **Nico Tarn**: young, hot; always bluffing, sweats when scared.
- **Mrs Odell Fenn**: a regular who has been "up tomorrow" for eleven years. Heart of the dream. Sits at the faro table with one coin.
- **Crake**: the debt man. Walks, never runs. Appears only after the marker.
- **Dev**: a deckhand who runs the lamp ladder; he is the platforming helper and comic relief.

### The core mechanic: SHOWDOWN (three-card hands)
Readable by non-poker players. Everyone gets **three cards**. The hand strip on screen at all times: *three of a kind beats a pair beats high card*. That is the whole rule book.
- **What you do.** You see your own three cards. Each opponent shows **one card face up** and has a **tell** (an idle animation on hands, collar, or eyes). Each round you pick a verb: **CALL**, **RAISE**, **FOLD**, **BLUFF**, or **STAND UP**.
- **The tells (true, never random).** Madame Sorrel: pinky off the glass = strong, hand still = weak. Nico: collar touch = scared (he folds to a raise); hands flat = actually strong this time. The Judge: hums when happy, which is truth.
- **Fold is a skill, not a failure.** Folding a weak hand saves the stack. The screen shows what you would have lost, in small gold text: "saved $6". Good folds are the loudest sound in the room (a soft low chime).
- **Bluff** is a raise with a weak hand, and it is a *read*, not a gamble. It works only if the opponent's tell says scared. Used on Madame Sorrel it fails, and the game shows why: the tell did not allow it.
- **Odds are the real ones.** The pot is raked 5%: the house takes a small slice of every pot, shown as a brass coin dropping into a slot. Over the whole night the rake is the quiet thing that pulls you down.
- **Bankroll and the slate.** Lou's $100 is a bar. At the start Jo chalks three numbers on a slate: *buy-in*, *stop-loss* and *goal*. The slate stays on screen. When the bar crosses the stop-loss line the table dims; at the goal it brightens. The player is never told to leave; the slate speaks.
- **Tilt.** After a loss where Jo held the better hand (a bad beat) the TILT meter rises. Tilted Jo: tell animations blur, bet buttons creep upward on their own, and Lou's voice is drowned. To cool down, stand up and walk the rail for ten seconds (the verb is *take the air*). It costs real time, which is the cost of discipline.
- **No hearts, no health.** Hearts are not bets. The only thing at risk is the stack; the fail state is a bust, which sends Jo back to the landing with his own bar reset (not the dream).

### The walk-in areas (clock-house pattern: each has one goal, shown on arrival)
Every door is a short dip through dark, never a crossfade. The goal appears on the arrival card in the split-flap font before anything moves.

| # | Area | Goal (shown up front) | Verb | Fail state | What it teaches |
|---|---|---|---|---|---|
| 1 | **THE QUAY, Port Merrow** (exterior, dusk, fog, lamps) | "chalk your line on the gangway slate" | Set three numbers on the slate (stop-loss, goal, buy-in) | None. The slate is just the contract with yourself. | Bankroll discipline begins before the first card. A pro decides the exit before the entrance. |
| 2 | **THE MAIN SALOON** (interior, chandeliers, band on a small stage, long bar) | "double $40 at the faro bank: get to $80" | Bet on a rank at the bank. Take or refuse comps. | Bust at the bank: back to the quay, bar reset. | The house edge (faro is the sharp's truth-teller). Jo wins small and often early, and sees the rake. Comps (a drink, a free stake) are shown as friendly gifts that quietly tick Pell's book and nudge TILT. |
| 3 | **THE CARD ROOM** (smoky, green baize, lamp over the table, Lou at the shoulder) | "beat the table: three tables, three players, win a pot at each" | CALL / RAISE / FOLD / BLUFF using the tells | Stack to zero at the table. | Reading people. Each player is a different lesson (Sorrel: believe her; Nico: raise him; the Judge: he is happy, so relax). |
| 4 | **THE PURSER'S OFFICE** (interior, brass cage, ledger, narrow corridor with a lamp that dims) | "get through the corridor to the upper deck stairs" | Sign the marker, or walk past | The corridor narrows by one tile for each marker taken; Crake follows at a walk. | Debt. The marker is quick and kind. Taking it is the only obstacle you can *choose* to ignore. Players who stayed above the stop-loss never need it. |
| 5 | **THE HURRICANE DECK** (exterior, dawn begins, rail, coiled ropes, boiler chimneys, the first grey light) | "reach the last table with a clear head" | Platform climb: ladders, ropes, steam vents. TILT blurs the screen and makes the vents harder to time | Fall into the boiler deck: back one checkpoint. | The cost of staying up all night. Tiredness and tilt are one system: clear air is a level of the same weight as a card hand. |
| 6 | **THE LAST TABLE then THE LANDING** (a private table in the pilot house; then the gangway at Port Merrow at dawn) | "stand up from a table you are winning" | STAND UP | None. This is the only room with no fail state. | Knowing when to walk away. It is the entire career. |

Time budget at 6-10 minutes: Quay 0:45, Saloon 1:30, Card Room 3:00, Office 1:15, Hurricane Deck 1:15, Last Table and Landing 1:30. About 9:15.

### Difficulty ramp
1. **Quay**: no pressure, no skill. Setting the slate is a decision.
2. **Saloon**: pure luck, 55% player edge on the first two bets (the "beginner's run" is real and honest), then 47% to show the edge. Tells off.
3. **Card room**: three tables. Table 1 has a single, loud tell (the Judge hums). Table 2 has a subtle tell plus a decoy (Madame Sorrel and Nico together). Table 3 is all three, and Lou starts giving a wrong tip.
4. **Office**: the corridor is the only place the game adds time pressure, and only if the player chose it.
5. **Deck**: easiest platforming in the level, hardest reading. TILT is your debuff.
6. **Last table**: no difficulty at all. The only test is a button.

A first-time player who reads the tells ends the night about +$18. A player who never folds ends around -$40. The game never adds free money to make the player feel bad for leaving.

### The finale: what "catching the dream" means
Jo is up. The slate shows the goal he chalked at the start: reached. Judge Voe slides the deck across: *"One more, Jo. The Queen docks in an hour."* The cards are dealt face up. Jo's hand is a good one, Voe's is good too. The table is warm and bright. The only unlit option at the bottom is **STAND UP**.
- **Stand up**: Voe laughs and shuffles for himself. The lamp dips. Jo takes the gangway with the cash. The dawn light is the first real daylight of the level. Lou, now at the rail, says the line he never said: *"I'd have stayed."* The **orb is the cashed chips**: one small gold coin, not gold-plated glory. `dreams.gambler = true`.
- **Take the hand**: the hand plays out, and it is fair: the player is ahead or behind at random, but the stakes include the whole night's profit. If Jo wins, the stinger is the same single note as everywhere else, with no confetti, and the table slides another hand. If he loses, he is back on the quay with the slate. There is no orb in this room at all. The dream is only caught by walking out. There is no glamorous path; it simply keeps going until the player stops.
The ending text reports the honest ledger: hours played, rake paid, comps taken, the folds that saved money.

### Environment and sound per area
- **Quay**: fog, lamp haloes, creak of a hull, water against stone, a bell buoy. Band heard far off through the boat wall.
- **Saloon**: warm gold light, low ceilings with chandeliers, a four-piece (piano, banjo, brush drum, clarinet) playing a dance tune. The band never stops. Crowd chatter is sampled in gaps. A small brass *click* when the rake drops.
- **Card room**: no band. A ceiling fan, ice in a glass, the riffle of cards and chips. Music is one low string pad that drops away when Jo is on a good read.
- **Office**: close dry room, ledger scratch, a clock that never ticks. The corridor lamp dims one notch per marker.
- **Hurricane deck**: wind, rope creak, steam hiss on a timer, a far whistle. Music: the pad returns with a clarinet line.
- **Last table / landing**: only the paddlewheel, then birdsong. No music at the landing. One clarinet note when the orb is caught.
- Art is all in code: layered boat interiors, painted fog banks, brass in two tones, lamps as radial pools. Real scale, 1 m = 44 px: a card table is about 40 px high, a stair step 8 px, the saloon ceiling 3.6 m (about 158 px).

### What this teaches, honestly
Bankroll swings (the bar). Tilt (the meter). Reading people (the tells). Debt (the marker and the corridor). The house edge (the faro bank and the rake). Walking away (the last table). No path ever shows gambling as a good plan: the best night is small, and the loudest reward is leaving.

## 3. Top 10 changes in priority order

1. **Replace the long-map build with six walk-in rooms** on the clockmaker pattern (`src/dreams/gambler/`, arrival cards with goals, dark dip at doors). **L**
2. **Cut the six games to two**: faro bank and SHOWDOWN. Delete roulette, dice bridges, slots, billiards, shell game, concentration, face-up (`gamblerPuzzles.js` l.79-451, 856-983). **M**
3. **Rewrite the finale** so only STAND UP completes the dream and betting yields no glory (spec l.185-186 removed). **S**
4. **Add the slate** (stop-loss, goal, buy-in) and a bankroll bar in the HUD, in place of "pending chips". **M**
5. **Build SHOWDOWN** with the strip of hand ranks, three true tells, bluff as a read, 5% rake, and a "saved $N" fold reward. **L**
6. **Add TILT** as a meter with blur, creeping bets and a take-the-air walk. **M**
7. **Rework the setting** to the *Lantern Queen*, 1884: new palette, props, fog, lamps, band; drop neon, mirror ceilings and car park. **L**
8. **Make Lou the dreamer** and a shoulder-voice with one wrong-in-four tip; add Pell, Crake and Mrs Fenn with real lines. **M**
9. **Remove heart betting, the pit boss, chip runners, the pawned-trumpet tool loss** (`GamblerScene.js` l.318, l.350, l.777). **S**
10. **Sound pass**: band in the saloon only, silence in the card room, honest fold chime, dawn landing with no music. **M**
