// THE LONG STRAIGHT's beats: data, run on events.
export default {
  // she stops beating: Ottavia heard it from across the room
  tuned: [
    { set: 'tuned' },
    { sting: 'gate' },
    { say: { who: 'ottavia', text: 'There. Hear it stop? Now she sings. Take her out.' } },
  ],
  // he walked away from the bench with her still beating
  tune_left: [{ say: { who: 'ottavia', text: 'She is still beating. Drive her like that and she runs hot.' } }],
  got_gloves: [{ say: { who: 'jo', text: 'They keep the shape of him. Up the quay to the hospital. Walk.' } }],
  // Jo drops the iron stairs: the whole corridor hears. Nothing is lost but the climb
  loud: [
    { sfx: 'clang' },
    { wait: 300 },
    { say: { who: 'agnese', text: 'Quietly, or not at all. From the bottom, please.', ms: 2800 } },
  ],
  gloves_set: [
    { sfx: 'click' },
    { say: { who: 'jo', text: 'On the chair, fingers together. They look like something left out for the morning.', ms: 3600 } },
    { sting: 'gate' },
  ],
  // (jars_done, signed and chalked are set by the verb, before its save)
  jars_settled: [{ talk: 'jars_said' }, { sting: 'gate' }],
  sable_signed: [
    { sfx: 'buy' },
    { talk: 'sable_done' },
    { sting: 'gate' },
  ],
  chalk_done: [
    { say: { who: 'jo', text: 'Three marks. By day they will look like nothing. Back along the road.', ms: 3200 } },
    { sting: 'gate' },
  ],
  // (F.pit_clean comes from the encounter: more than one miss and it is again)
  pit_done: [
    {
      if: 'pit_clean',
      then: [
        { say: { who: 'tullio', text: 'Wheel, wheel, fuel, flag. That is a crew. That is all a crew is.', ms: 3200 } },
        { set: 'pit_drilled' },
        { sting: 'gate' },
      ],
      else: [{ say: { who: 'tullio', text: 'Three seconds a miss, and the road does not wait. Again, on her call.', ms: 3200 } }],
    },
  ],
  // Small Moments
  moment_radio: [{ say: { who: 'jo', text: 'The wireless on the shelf has a swing band on it, and Ottavia is frowning at the trumpet.', ms: 3600 } }],
  moment_sea: [{ say: { who: 'jo', text: 'A white road along the cliff, and the Coppa posters already going yellow in the salt.', ms: 3600 } }],
  moment_letter: [{ say: { who: 'jo', text: 'A letter from a bus company on the mainland, wanting a fitter. Not answered. Not thrown away.', ms: 3800 } }],
};
