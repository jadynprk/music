import { useState, useEffect, useRef, useCallback } from "react";
import { ROWS, STEPS, STEP_MS } from "../constants";

/**
 * Manages sequencer playback state.
 *
 * Returns:
 *   playhead      — current step index (null when stopped)
 *   playing       — boolean
 *   burstCounters — Map of "rowIdx-stepIdx" → incrementing number
 *                   Each hit increments the counter, which is used as the
 *                   React key on the cube div to force a full remount and
 *                   guarantee the animation restarts from 0 every time.
 *   togglePlay    — start / stop
 */
export function useSequencer(grid, gridRef) {
  const [playhead,      setPlayhead]      = useState(null);
  const [playing,       setPlaying]       = useState(false);
  const [burstCounters, setBurstCounters] = useState(new Map());

  const stepRef      = useRef(0);
  const intervalRef  = useRef(null);
  const gridStateRef = useRef(grid);

  useEffect(() => {
    gridStateRef.current = grid;
  }, [grid]);

  const advanceStep = useCallback(() => {
    const next = (stepRef.current + 1) % STEPS;
    stepRef.current = next;
    setPlayhead(next);

    const currentGrid = gridStateRef.current;
    const hitting = [];

    ROWS.forEach((row, r) => {
      if (currentGrid[row][next]) {
        hitting.push(`${r}-${next}`);
      }
    });

    if (hitting.length) {
      setBurstCounters(prev => {
        const next = new Map(prev);
        hitting.forEach(k => next.set(k, (next.get(k) ?? 0) + 1));
        return next;
      });
    }
  }, []);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(advanceStep, STEP_MS);
    } else {
      clearInterval(intervalRef.current);
      setPlayhead(null);
      stepRef.current = 0;
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, advanceStep]);

  const togglePlay = useCallback(() => setPlaying(p => !p), []);

  return { playhead, playing, burstCounters, togglePlay };
}
