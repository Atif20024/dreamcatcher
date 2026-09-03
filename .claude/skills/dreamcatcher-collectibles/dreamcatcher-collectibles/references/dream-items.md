# Coin worth and key items per dream

## Coin worth (pay)
| Dream | Coin sprite | Worth | Coins per level (budget) | Why |
|---|---|---|---|---|
| Chef (Five-Star Dream) | brass tip coin | 5 | 60–80 | steady kitchen wages |
| Musician (The Big Stage) | dropped busker coin | 1 | 120–150 | music doesn't pay; lots of tiny coins |
| Athlete (The Finish Line) | medal chip | 20 | 25–35 | rare, big |
| Founder | share token | 50 | 8–12 (plus one 500 "exit" coin behind the hardest room) | almost nothing, then a jackpot |
| Painter | paint tube cap | 2 | 100–120 | |
| Pilot | wing pin | 15 | 30–40 | |
| Actor | ticket stub | 3 | 80–100 | |
| Doctor | brass pin | 25 | 20–30 | |
Budget is total coins placed; a full-clear player earns budget × worth. Hub prices in §2 of the skill assume a full clear of two dreams buys one shard.

## Chef — key items (one per section gate)
| Section | Item | Found behind | Used as tool? | Delivered at / flag |
|---|---|---|---|---|
| Delivery Alley | Crate hook | the conveyor low-pipe run | pulls crates onto the plate | plate hatch → `chef.crates` |
| Freezer | Saffron tin | icicle climb + hook pendulums | — (story item) | risotto station → `chef.has_saffron` |
| The Line | Stockpot lid | grease floor + Pepper Mills | held up, blocks steam vents & oil spit | pass window → `chef.lid_delivered` |
| The Line (rush) | Fish / Herbs / Bread | three stations (see level spec) | — | pass → `chef.rush_done` |
| Pastry Loft | Copper whisk | sugar-bridge crossing | breaks meringue puffs in one swing | plating table → `chef.piping` unlock |
| Pastry Loft | Gold leaf | piping puzzle | — | pass (Aurelio) → `chef.has_gold_leaf` |
| The Pass | Ticket spike | under the counter, past thrown pans | pins one swinging pan per wave | — (tool only) |

## Musician — key items
| Day | Item | Found behind | Used as tool? | Delivered / flag |
|---|---|---|---|---|
| 1 Cellar | Set list | fire-escape sound-bridge + hecklers | — | Delphine's desk → opens the room |
| 2 Corner | 12 busking coins (worth 1 each, *are* the key item) | the busking rhythm + cops | — | Old Sol → `mus.valve_fixed` |
| 2 Corner | Valve spring | rooftop Metronome Walkers | — | tuning puzzle unlock |
| 3 Basement | Fuse | boiler room wisps (needs Nia) | — | breaker → `mus.rehearsal` |
| 3 Basement | Cellar key (jam night) | Ray's alley | — | Cellar door |
| 4 Road | Deposit envelope (empty) | Saltbox stealth | — | story only |
| 4 Road | Jerry can | highway guardrail bridges | carried: slows Jo | gas station → `mus.tour_done` |
| 5 Studio | Session pass | red-light silent run | — | control room → puzzle unlock |
| 6 Stage | Wristband | lighting-rig climb, moving-head beams | shows on Jo's wrist | stage door → the set |

## Hub
No coins in the station except one 1-worth coin the busker's hat drops after the Duet Small Moment. Heart shards: none. Shop: Bilal's stall, undercroft.
