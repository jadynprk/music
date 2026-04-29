import { STEPS, STEP_MS } from "../constants";

// total duration of one full loop in ms
const LOOP_MS = STEPS * STEP_MS;

/**
 * Props:
 *   playing — boolean
 *
 * Sweeps continuously across the screen using a CSS animation
 * synced to the sequencer loop duration. No per-step React updates.
 */
export default function PlayBar({ playing }) {
  if (!playing) return null;

  return (
    <div
      className="play-bar"
      style={{
        animation: `bar-sweep ${LOOP_MS}ms linear infinite`,
      }}
    />
  );
}
