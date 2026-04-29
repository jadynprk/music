export const ROWS = ["kick", "snare", "clap", "hi-hat"];
export const STEPS = 16;
export const BPM = 70;
export const STEP_MS = (60 / BPM / 4) * 1000;

export const DEFAULT_GRID = {
  kick:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  snare:    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  clap:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  "hi-hat": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
};
