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
    { say: { who: 'jo', text: 'Three marks. By day they will look like nothing. Whether I lift at the last one is for Sunday.', ms: 3600 } },
    { sting: 'gate' },
  ],
  // (from the encounter: more than one miss and it is again; none, and the Coppa's stop is 2 s, not 3)
  pit_done: [
    {
      if: 'pit_ok',
      then: [
        {
          if: 'pit_clean',
          then: [{ say: { who: 'tullio', text: 'Wheel, wheel, fuel, flag. Two seconds. That is a crew. That is all a crew is.', ms: 3200 } }],
          else: [{ say: { who: 'tullio', text: 'One late. Three seconds on the night, not two. It will do, and I will mention it.', ms: 3200 } }],
        },
        { set: 'pit_drilled' },
        { sting: 'gate' },
      ],
      else: [{ say: { who: 'tullio', text: 'On the night that is five seconds, and the road does not wait. Again, on her call.', ms: 3200 } }],
    },
  ],
  // the Coppa is home, and the shutter is up: the orb is the note (rooms/garage.js)
  coppa_note: [{ sting: 'gate' }],
  // twelve on the table, for the chemist
  med_left: [
    { sfx: 'click' },
    { say: { who: 'signora', text: 'I did not see that. I do not see anything. Put your cap on.', ms: 2800 } },
  ],
  // Small Moments
  moment_tide: [{ say: { who: 'jo', text: 'The third step. The weed is wet. Coming in. There is nobody to say it to.', ms: 3400 } }],
  moment_radio: [{ say: { who: 'jo', text: 'The wireless on the shelf has a swing band on it, and Ottavia is frowning at the trumpet.', ms: 3600 } }],
  moment_sea: [{ say: { who: 'jo', text: 'A white road along the cliff, and the Coppa posters already going yellow in the salt.', ms: 3600 } }],
  moment_gull: [
    { say: { who: 'jo', text: 'They have raked the gravel and put out new straw. You would not know.', ms: 3200 } },
    {
      if: 'held_aldo',
      then: [{ say: { who: 'jo', text: 'Two lengths back, I was. I could have read his number.', ms: 3200 } }],
      else: [{ say: { who: 'jo', text: 'I was a long way back. I have tried being sorry about that, and glad.', ms: 3400 } }],
    },
  ],
  moment_letter: [{ say: { who: 'jo', text: 'A letter from a bus company on the mainland, wanting a fitter. Not answered. Not thrown away.', ms: 3800 } }],
};
