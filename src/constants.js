export const ROWS  = ["kick", "snare", "clap", "hi-hat"];
export const STEPS = 16;
export const BPM   = 120;

export const SYNTH_NOTES = ["C4","D4","E4","F4","G4","A4","B4"];

export const DEFAULT_GRID = {
  kick:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  snare:    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  clap:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  "hi-hat": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
};

export const DEFAULT_SYNTH_GRID = Object.fromEntries(
  SYNTH_NOTES.map(note => [note, Array(STEPS).fill(0)])
);
