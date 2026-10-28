// The proof dream's beats (plan 2.1 BeatRunner): data, run on events.
export default {
  // the dream opens on action: a line on the caption bar, no box
  start: [{ wait: 400 }, { music: 'quiet' }],
  // the clock wound: the camera holds on the dial, then the green lights up
  clock_done: [
    { set: 'clock_wound' },
    { camera: { push: 1.2, to: 'anchor:clockwork', ms: 500 } },
    { say: { who: 'jo', text: 'Three gears, seated. Listen to it go.' } },
    { wait: 1400 },
    { camera: 'pop' },
    { objective: 'back_out' },
    { sting: 'gate' },
  ],
};
