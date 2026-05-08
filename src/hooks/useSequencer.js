import { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";
import { ROWS, STEPS, BPM } from "../constants";

Tone.getTransport().bpm.value = BPM;
Tone.getTransport().loop      = true;
Tone.getTransport().loopStart = 0;
Tone.getTransport().loopEnd   = "1m"; // 1 bar = 16 sixteenth notes at 4/4

/**
 * Manages sequencer playback using Tone.Transport for sample-accurate timing.
 *
 * Tone.Sequence fires every 16th note exactly on the hardware clock.
 * triggerRow is called from inside the sequence — audio fires first,
 * then React state updates for visuals, keeping them locked together.
 *
 * Returns:
 *   playing       — boolean
 *   burstCounters — Map of "rowIdx-stepIdx" → incrementing number
 *   togglePlay    — async fn — calls Tone.start() then starts Transport
 */
export function useSequencer(grid, triggerRow) {
  const [playing,       setPlaying]       = useState(false);
  const [burstCounters, setBurstCounters] = useState(new Map());

  const gridStateRef = useRef(grid);
  const sequenceRef  = useRef(null);
  const stepRef      = useRef(0);

  // keep grid ref fresh so Tone callback always reads latest notes
  useEffect(() => {
    gridStateRef.current = grid;
  }, [grid]);

  // build the Tone.Sequence once on mount
  useEffect(() => {
    Tone.getTransport().bpm.value = BPM;

    const steps = Array.from({ length: STEPS }, (_, i) => i);

    const sequence = new Tone.Sequence(
      (time, step) => {
        stepRef.current = step;
        const currentGrid = gridStateRef.current;
        const hitting     = [];

        ROWS.forEach((row, r) => {
          if (currentGrid[row][step]) {
            // trigger audio at exact Tone time — sample-accurate
            triggerRow(row, time);
            hitting.push(`${r}-${step}`);
          }
        });

        // schedule visual updates to fire as close to the audio as possible
        // Tone.Draw syncs callbacks to the next animation frame after `time`
        Tone.getDraw().schedule(() => {
          if (hitting.length) {
            setBurstCounters(prev => {
              const next = new Map(prev);
              hitting.forEach(k => next.set(k, (next.get(k) ?? 0) + 1));
              return next;
            });
          }
        }, time);
      },
      steps,
      "16n" // one step = one 16th note
    );
 
    sequenceRef.current = sequence;

    return () => {
      sequence.dispose();
      Tone.getTransport().stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = useCallback(async () => {
    // Tone.start() must be called from a user gesture — unlocks AudioContext
    await Tone.start();

    if (Tone.getTransport().state === "started") {
      Tone.getTransport().stop();
      sequenceRef.current?.stop();
      stepRef.current = 0;
      setPlaying(false);
    } else {
      sequenceRef.current?.start(0);
      Tone.getTransport().start();
      setPlaying(true);
    }
  }, []);

  return { playing, burstCounters, togglePlay };
}
