# Audio advice: music and ambience by place

Advisor: game sound designer. Code read: `src/audio/*`, `src/systems/audio.js`, the dream and room data. Nothing was run or heard. Every number below is a starting value to tune with `?sound=1`.

## 1. Audit

**What exists**
- Buses in `AudioBus.js`: music 0.8, ambience 0.55, sfx 0.9, ui 0.8.
  - Music and ambience go through the room stage: a lowpass plus a 4-comb reverb send.
  - Presets: open / room / hall / chapel. `DreamScene.commit` sets them from `room.acoustics`.
- `StemMusic` (framework dreams): four stems, base / pulse / lead / danger. States are quiet, explore, tense, setpiece, ending.
  - Keys per room (`room.music.key`) give mode, voices (lute, recorder, organ and others) and 6/8.
  - Only the painter uses keys and voices.
- `Ambience`: looped buffers, crossfaded by room blend. 20 loops, 7 of them era recipes in `eraLoops.js`.
- Legacy `MusicDirector` (Chef, Writer, Astronaut, Gambler, Hub): one fixed jazz band (bass walk, brushes, piano, square trumpet, pad), driven by `setMix`.
- Footsteps on 6 surfaces. The station chime exists in a per-place voice. Stingers sit on the sfx bus.

**Gaps**

| Gap | Evidence |
|---|---|
| Missing loops | `pistol` (athlete) and `monitors` (doctor) are named in `dreams.js` but absent from `LOOPS`. Those dreams may be unlaunched, but the lookup returns null. |
| The Hub has no ambience | No `ambience.` call in HubScene. A station with no air, no announcements and no pigeons is the biggest hole. |
| Evening and Intro | Only one-shot `sfx`. No bed, no music identity for the finale. |
| Clockmaker and musician share one generic motif | Per-room variation is only a bpm or state. The musician has no jazz voices. Its band is the legacy sine/triangle default. |
| Legacy scenes are all the same band | Chef, Gambler, Astronaut and Writer all use the swing band. This contradicts "music appropriate to level and era". |
| No inside/outside outside the painter | `acoustics` is used only in painter rooms. Cellar, clock house, kitchen, casino and station are all dry. |
| No one-shot ambient events | Every loop is 4-20 s, fixed. Repetition shows after about three passes. |
| NPCs are silent | Only `chatter` inside the painter loops. Nothing is positional. |

**Risks**
- `square` is used for trumpet, gate, knock, woof, coin_drop and metal steps. The trumpet is square plus saw at vol 0.3, with no filter. It will be harsh on laptop speakers. Fix: put a lowpass at 2.5 kHz and an attack of 15 ms on the trumpet.
- No compressor or limiter on master (gain 0.35 into the destination). Stacked stingers over an 8-note chord plus ambience can clip. Add a `DynamicsCompressor` (threshold -14 dB, ratio 4, attack 5 ms, release 200 ms) and a -1 dBFS ceiling.
- Music is `setInterval`. It drifts and is throttled in background tabs, so beats bunch up. The 'beat' event drives hazards. Schedule against `ctx.currentTime` with a 100 ms look-ahead instead.
- Every note is a new oscillator and gain pair, with no voice cap. Four stems at 120 bpm over a rain loop is fine. Adding chatter, events and stingers is not, without a cap.
- Loops are mono, with short 4-8 s `seamless` crossfades. Each loop is a single fixed 8 s pattern with obvious clicks. Rain and clock loops repeat audibly. Use two incommensurate layers (6 s and 9 s) plus random events.
- `busNoise` uses a linear fade to zero and a fixed `Math.random` grain. Fine for one-shots.
- Dev silence is `master.gain = 0` plus `ctx.suspend()`. Keep it.

## 2. Music by place

**Rule for all places**
- Outside: dry, brighter, a bit faster.
- Inside: lowpass 4-5 kHz, a `room` send, tempo -10%, fewer stems.
- Music heard through a wall: lowpass 900 Hz, level -9 dB. The source room's key plays while Jo is in a neighbouring room.
- Each place also gets one signature voice, so the eight places can be told apart blind.

Layers:
- **calm** (quiet): base + sparse lead.
- **explore**: add pulse.
- **danger or chase** (tense): add danger throb, drop lead -6 dB, raise tempo +8%, shorten lead notes.
- **catch**: cut everything for 250 ms, then one low pad note, 2 s.
- **win** (ending): lead alone, fifth drone.

| Place | Style, era | Instruments (synth terms) | Mode / tempo | Inside vs outside |
|---|---|---|---|---|
| **Hub: Crossroads** | Night terminus, late 40s. Solo piano and distant band, slowly stripped as dreams are caught (existing HubState mix). | Piano: 3 sines (1, 2, 3x) with a 4 ms attack and 1.2 s exp decay, detune 3 cents. Bass: triangle. Pad: 2 detuned saws through a 700 Hz lowpass. | Lydian-ish on F, 72 bpm | Hall acoustics: lowpass 6 kHz, t60 1.6 s. As dreams are caught the room feels larger: raise wet 0.14 to 0.30, and quieter. |
| **Clockmaker: green** | Pastoral folk waltz, lazy. | Music-box: sine + inharmonic 2.76x, decay 1.4 s. Fiddle-ish pad: saw with 5 Hz vibrato, lowpass 1.8 kHz. Pizzicato bass: triangle, 120 ms. | Ionian G, 3/4 at 78 | Open. A held tick every beat on bass at -20 dB. |
| **Clock house** | Same tune, slowed to 54 bpm, glass-box only. | Music-box + a ticking click bus as pulse. Danger: low sine throb, amplitude-modulated at 1 Hz. | Aeolian G | `room` acoustics. Danger = the tick-tock accelerates. |
| **Musician: street / alley** | Wet-night jazz noir, 50s. | Walking upright bass (triangle + lowpass 600 Hz, 90 ms). Brush hat: noise, bandpass 6.5 kHz. Muted trumpet: saw through a bandpass at 1.1 kHz with Q 3 (not square). Rhodes: sine + 2x bell. | Dorian D, 96 bpm | Street: open. Alley: the cellar's music leaks, lowpass 900 Hz (the "through the wall" effect), -9 dB. |
| **Jazz cellar** | Slow trio, smoky. | Piano chords every bar, bass walk, brushes. | Dorian D, 86 | `room`, wet 0.18. Louder, fuller, dry-ish. |
| **Backstage / fire stairs** | Rock on the other side of a door. | Lead gets a distorted sine (waveshaper) at -12 dB. | Mixolydian E, 110 | Muffled PA bleed: lowpass 700 Hz. Fire stairs get the `hall` echo. |
| **Arena stage** | Big-room 80s rock-pop. | Saw power chord (2 detuned saws, 5th) through lowpass 3 kHz. Kick: sine 120 to 45 Hz in 80 ms. Snare: noise, bandpass 1.8 kHz. Square-lead arp only here, with an envelope. | Mixolydian E, 120, on the 'beat' event | `hall`. Setpiece: all four stems. Catch: crowd gasp (noise swell) then silence. |
| **Painter** | Done: lute / recorder / shawm / organ by place. Keep. | | | Add only the chase (below). |
| **Chef: kitchen** | Radio swing from a pass-side wireless. | Legacy band, but filtered like a radio: bandpass 400-3400 Hz, a slight 2% wow (pitch LFO). Add a tick of vinyl crackle. | Ionian C, 112 | The radio sits in the pass: lowpass is the radio. Dining room is out front (muffled and warmer). Walk-in fridge: music near zero. |
| **Writer: study** | Solo felt piano, one note at a time. | Sine with a 12 ms attack and 3 s decay, lowpass 1.4 kHz. Typewriter taps in time as the pulse. | Dorian A, 60 | `room`. Rain on the window as the bed. |
| **Astronaut: station** | Sparse electronic, 70s synth. | Pad: 2 detuned triangles, lowpass sweep over 12 s. Plink arp: sine. Heartbeat sub as danger. | Lydian, 66 | The hull is `hall` with a long comb decay (t60 2 s) and lowpass 3 kHz. Outside the station: only the drone and breathing. |
| **Gambler: casino** | Smoky lounge swing, 50s Vegas. | Walking bass, brush swing (noise with a 2:1 shuffle), vibes: sine + 4x, decay 1 s. A slow trumpet pad. | Dorian F, 124 | Floor `room`. VIP room: lowpass tighter, tempo down. The slot jingles are an ambience, not music. |
| **Evening: THE LAST STOP** | Warm small-town dusk, acoustic, then night. The finale; the loudest emotion, the quietest mix. | Nylon guitar: triangle + saw 12%, pluck, lowpass 2 kHz. Harmonica pad: saw through bandpass 1.5 kHz with vibrato. Warm felt piano. | Ionian D, 76, drifting to 56 | Houses and the station: `room`. As dusk goes to night: remove the pulse, then bass, until only the piano and the far bell. The final chime uses the Evening voice. |
| **Intro platform** | The sound of arriving: one bell, one held note. | Reuse the hub piano at 45 bpm. | | Open, wind. |

Chase (shared):
- Adds a 16th-note shaker plus the danger throb.
- Starts at `foe.state == 'alert'`. Releases over 4 s once the foe loses Jo.

## 3. Ambience by place

**Every place** gets one bed loop (kept, crossfaded) plus an **event scheduler**: `EventBed(def)` fires one-shots at random intervals, each with a `pan` (-1 to 1) and a distance level.
- The first event of a room never fires before 6 s.
- Pick from the list by weight with no immediate repeats, jitter pitch +-6%.
- Spatial pan comes from the source x relative to Jo (`ctx.createStereoPanner`), gain falls off to 0 at 900 px.

| Place | Bed | One-shots (interval) |
|---|---|---|
| **Hub** | Quiet hall: noise lowpass 400 Hz, hum at 60 Hz, -45 dBFS. Reverberant. | Announcement every 25-40 s: muffled synthetic voice (the formant babble below, 2 s, lowpass 1.2 kHz, `hall` send). Two-tone "ding-dong" before it. Departure-board flap burst on board change. Pigeons: coo = sine 380 to 300 Hz, 0.25 s, a doublet, every 10-20 s. Train in the distance: low noise swell 6 s. Door, trolley wheels, turnstile click. |
| **Clockmaker green** | Wind + crickets (kept). | Church bell (kept, 40 s apart). Birds: 2-note sine chirps, 2.8-4 kHz, glide up 600 Hz, 80 ms. Swifts, 3 short chirps. A far dog. |
| **Clock house** | Tick-tock bed, 2 clocks with a different period each (1.0 and 1.37 s, so it never phases to a click). | A cuckoo (sine 650, 520). A spring creak. Gear whirr. A mismatched striking hour. |
| **Rain street / alley** | Rain: 2 noise layers, lowpass 3 kHz + highpass 1 kHz, 6 s and 9 s. | Traffic pass-by every 8-15 s: noise lowpass swept 300 to 900 Hz, panned across 3 s, plus a tyre-hiss band. A car horn at a distance (two sines, a fourth). A drain gurgle. Footsteps splash. Distant siren, rarely. |
| **Cellar** | Murmur bed + low 60 Hz room tone. | Glass clink, chair scrape, laugh = 3 short formant bursts, applause for a solo. Door opening lets the street in. |
| **Backstage / stage** | PA hum 50 Hz + crowd. | Crowd cheer swell, soundcheck "check one-two" (babble), a feedback squeal (sine glide 2.8 kHz, 0.4 s, -30 dB, never loud). Roadie case latches. |
| **Chef kitchen** | Sizzle + fan hum (kept). | Pan clatter (metal clink, 2 inharmonic partials). The **ticket bell**: sine 2.3 kHz, decay 0.8 s, every 12-20 s. Chop rhythm, 5 taps. Order called out (babble). Steam hiss. |
| **Writer** | Typewriter (kept) at lower level + rain. | Carriage-return bell (the writer chime). Paper ruffle. Page crumple. A clock chiming the hour. |
| **Astronaut** | Engines (kept) + vent. | Console beeps: sine 1-2 kHz, 60 ms, 1 or 2 or 3 in a run. Relay thunk. Airlock hiss. A radio chirp with a carrier crackle. Life-support pump with a slow 0.2 Hz swell. |
| **Gambler** | Slots (kept). Add a murmur. | Chips: 3-6 clicks (the clink of two partials, 4 kHz). Slot jingle: 4 notes at 1-2 kHz (sine/triangle, never square). A win bell. Cards shuffle: noise bursts, 40 ms apart. Dice rattle. Cheer, 1 s. |
| **Evening** | Crickets, soft wind, a river or a fountain. Gain follows the dusk. | The church bell (existing far_bell). Birds fade out as dusk comes; crickets fade in. A bike bell. Cat or dog (meow, woof, kept; no square woof, use a saw through a 600 Hz lowpass). A screen-door slam. A neighbour's radio. Windows: a murmur at each house. |
| **Painter** | Done. | Add a church bell at the hour for the piazza. |

**NPC chatter as a murmur** (`ChatterVoice`):
- A "voice" is a saw at 90-130 Hz (male) or 170-240 Hz (female), jitter +-3% at 6 Hz, through 3 bandpass formants. Vowel targets (F1/F2): a 700/1200, e 500/1800, i 300/2200, o 500/900, u 350/700. Interpolate between vowels every 90-140 ms.
- Add a breath of noise at -20 dB. Level around 0.04.
- A burst is 4-8 syllables, 0.6-1.4 s, with a pitch contour rising on questions. No words.
- Trigger when Jo comes within 220 px of an NPC that is not talking. Cooldown 8 s per NPC.
- Stereo-pan by dx, lowpass-filter by distance (4 kHz to 1.2 kHz), attenuate to 0 at 320 px. Each NPC keeps its own base pitch (seeded by id), so the same person always sounds the same.
- Crowds (hub, cellar, piazza): 3 voices overlapping at -12 dB each is a murmur. Do not exceed 3.

## 4. Mixing rules

| Item | Target |
|---|---|
| Bus levels (dBFS pre-master) | music -18, ambience -26 (rain -22), sfx -14, ui -16, chatter -24 |
| Master | gain 0.35, then compressor and a -1 dBFS limiter |
| Loudness | integrated about -20 LUFS in play, short-term peak -3 dBFS, never above -1 |
| Music ducking | -4 dB under dialogue (attack 150 ms, release 600 ms). -6 dB under stingers (attack 50 ms, release 800 ms). Ambience ducks -3 dB under dialogue. |
| Voice limit | 24 oscillators plus 8 noise sources total. Steal the oldest low-priority voice (chatter, then ambient events, then music pulse). Never steal stingers or the catch. |
| Loop seams | Fade every seam at least 250 ms. Loops get equal-power crossfade; also fade in 400 ms on room entry and out 800 ms on exit. Never start an oscillator with a hard step; use a 5 ms ramp. |
| Anti-repetition | A bed of 8+ s, plus at least 2 events; no one-shot twice in a row; pitch jitter +-6%; level jitter +-2 dB. |
| Square waves | Only through a lowpass at 3 kHz or below, max 4 per second, vol 0.06. |
| Dev | Muted by default. `?sound=1` to listen. Tests render offline; never unmute in tests. |

**Offline verification** (no listening; extend `tests/eraAudio.test.js`):
- Render with `OfflineAudioContext(2, sr*10, 44100)`, or call `LOOPS[name](sr)` directly (they are pure).
- **RMS** per loop and per music state is within +-2 dB of the target table. Loops have the same RMS across the seam.
- **Peak** is below -3 dBFS for single sounds and below -1 for the full mix (all stems + ambience + a stinger).
- **Seam**: |buf[0] - buf[end]| below 0.01 and the derivative step below 0.02, so no click.
- **Spectrum** (FFT, 4096): the inside preset shows energy above 5 kHz at least 20 dB down. Square-based voices show no energy above 6 kHz. Chatter shows peaks near its formants. Rain shows a broad 1-6 kHz plateau with no tone above 12 dB.
- **Repetition**: autocorrelate a 60 s render, with no peak above 0.6 at lags over 1 s except the loop length. No clipping: count of samples above 0.99 is zero.
- **Timing**: with a fake clock, the scheduler's beat times are even within 2 ms. Event intervals stay in range.

## 5. Build list

| # | Item | Cost |
|---|---|---|
| 1 | Master chain: DynamicsCompressor + limiter, music/ambience/sfx duck helper, voice counter with stealing | S |
| 2 | Fix the harsh voices: filter the trumpet and gate/knock/woof squares, 15 ms attacks | S |
| 3 | Missing loops `pistol`, `monitors`; null-safe lookup | S |
| 4 | Hub ambience: bed, announcements (formant), flaps, pigeons, train | M |
| 5 | `ChatterVoice` formant babble plus NPC proximity trigger (pan, distance filter, cooldown) | M |
| 6 | `EventBed` scheduler (random one-shots with pan and distance, no repeats), used by every room via `room.events` data | M |
| 7 | Per-place event lists: street traffic, kitchen bell, casino chips, station beeps, birds, bells | M |
| 8 | Acoustics on all rooms: `room.acoustics` for cellar, clock house, kitchen, casino, hull; through-wall lowpass for neighbouring rooms | M |
| 9 | Music keys for the musician (jazz voices), clockmaker (music box), and per-room keys | M |
| 10 | Scheduler on `ctx.currentTime` instead of `setInterval` | M |
| 11 | Legacy scenes get their own bands: radio swing (chef), felt piano (writer), synth (astronaut), vibes lounge (gambler) | L |
| 12 | Evening: dusk-driven stem strip, bird-to-cricket crossfade, final chime | M |
| 13 | Chase and catch layers on all `StemMusic` dreams, plus the catch silence-then-pad | S |
| 14 | Offline audio test suite (RMS, peak, seam, spectrum, repetition) | M |
| 15 | Spatial pan (StereoPanner) for positional ambient events | S |
