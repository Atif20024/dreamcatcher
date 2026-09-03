# Placement patterns (D2 legend; `c` coin, `C` 3-coin cluster, `K` key item pedestal, `*` heart shard, `G` gate, `F` foe post, `^` spikes, `L` loose tile, `|` climbable, `=` one-way, `A` anchor)

## Risk tiers (coins per route)
| Tier | Risk | Coins | Example |
|---|---|---|---|
| 0 | none (breadcrumb) | 1 | top of the right ladder |
| 1 | a precise jump | 2–3 | line across a 4-tile gap |
| 2 | a hazard in the path | 4–5 | arc over spikes; one loose tile |
| 3 | a timed hazard | 6–8 | through a slicing gate on the open frame; between two swinging pans |
| 4 | a detour room | 10–15 + shard or secret | hang-drop into a side shaft, climb back out |
| 5 | a section-long optional route | 20–30 | the freezer ceiling pipes instead of the floor |

## P1 — Fork: safe floor vs. paid ceiling
```
..c.c.c.c.c.c..........      ← paid route along loose tiles / pipes
..L=L=L=L=L=L..........
.......................
#####.........#########      ← safe floor, empty
#####^^^^^^^^^#########
```
The safe floor has a single hazard hop and no coins; the ceiling has 6 coins on loose tiles. Player sees both from the entry.

## P2 — Arc over the hazard
```
......c.c......
....c.....c....
...c.......c...
###.........###
###^^^^^^^^^###
```
Coins trace the exact running-jump arc (4-tile gap). A standing jump misses the top coins and lands on spikes — the coins teach the run-up.

## P3 — The guarded pedestal (key item)
```
.........G.......      ← exit gate requires K
........###......
..F....K.........      ← foe posted between entry and pedestal, spikes under the approach
####.^^^.###.####
```
No way to K without passing F and the spikes. After pickup, the gate lamp goes green.

## P4 — Peek-down shaft (shard)
```
####.####
####c####      ← coin visible from the ledge → invites the peek
####.####
####c####
###*..c##      ← shard + consolation coins, exit via | wall
###|.####
```
Player hangs, drops, collects, climbs the marked wall back out. Never below a one-way.

## P5 — Timed gate run
```
....c.c.c.c....
###.[/////].###      ← slicing gate; coins only on its open frame path
```
Tier 3; coins are inside the gate's sweep so they can only be taken by committing.

## P6 — Breadcrumbs at a decision
```
...c...........
..H.....H......      ← two ladders; the coin marks the correct one
```
Worth 1. The wrong ladder leads to a dead end with a Small Moment hint, not a trap.

## P7 — Duel on a bridge with pay
```
........c.c.c.......
....=========.......
..F...........c.....      ← foe on the bridge; coins beyond him and on the ledge past the drop
###..........####...
```
Player must handle the foe (shove/slip/trip) to reach the coins; tripping him off the bridge pays a bonus cluster.

## P8 — Item as tool
```
K = stockpot lid on pedestal → three steam vents ahead → lid held up blocks them → deliver lid at the station to open G
```
The item is used, then spent. The gate requires the *delivered* flag, not the carried item.

## Anti-patterns (lint fails)
- Coins on the forced platform right after a checkpoint (free money).
- A key item on the critical path with nothing between it and the entry.
- A coin line that ends over a pit with no landing.
- Two gates requiring two items in one section.
- A secret behind an unmarked tile.
