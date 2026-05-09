import { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";
import { ROWS, SYNTH_NOTES, STEPS, BPM } from "../constants";

Tone.getTransport().bpm.value = BPM;
Tone.getTransport().loop      = true;
Tone.getTransport().loopStart = 0;
Tone.getTransport().loopEnd   = "1m";

/**
 * Manages sequencer playback for both drum and synth grids.
 * Both grids play simultaneously on the same Transport clock.
 *
 * Props:
 *   drumGrid   — { [rowName]: number[] }
 *   synthGrid  — { [note]: number[] }
 *   triggerRow — (row, time) => void
 *   triggerNote — (note, time) => void
 */
export function useSequencer(drumGrid, synthGrid, triggerRow, triggerNote) {
  const [playing,            setPlaying]            = useState(false);
  const [drumBurstCounters,  setDrumBurstCounters]  = useState(new Map());
  const [synthBurstCounters, setSynthBurstCounters] = useState(new Map());

  const drumGridRef  = useRef(drumGrid);
  const synthGridRef = useRef(synthGrid);
  const sequenceRef  = useRef(null);
  const stepRef      = useRef(0);

  useEffect(() => { drumGridRef.current  = drumGrid;  }, [drumGrid]);
  useEffect(() => { synthGridRef.current = synthGrid; }, [synthGrid]);

  useEffect(() => {
    const steps = Array.from({ length: STEPS }, (_, i) => i);

    const sequence = new Tone.Sequence(
      (time, step) => {
        stepRef.current = step;
        const dGrid = drumGridRef.current;
        const sGrid = synthGridRef.current;

        const drumHits  = [];
        const synthHits = [];

        // fire drums
        ROWS.forEach((row, r) => {
          if (dGrid[row]?.[step]) {
            triggerRow(row, time);
            drumHits.push(`${r}-${step}`);
          }
        });

        // fire synth notes
        SYNTH_NOTES.forEach((note, n) => {
          if (sGrid[note]?.[step]) {
            triggerNote(note, time);
            synthHits.push(`${n}-${step}`);
          }
        });

        Tone.getDraw().schedule(() => {
          if (drumHits.length) {
            setDrumBurstCounters(prev => {
              const next = new Map(prev);
              drumHits.forEach(k => next.set(k, (next.get(k) ?? 0) + 1));
              return next;
            });
          }
          if (synthHits.length) {
            setSynthBurstCounters(prev => {
              const next = new Map(prev);
              synthHits.forEach(k => next.set(k, (next.get(k) ?? 0) + 1));
              return next;
            });
          }
        }, time);
      },
      steps,
      "16n"
    );

    sequenceRef.current = sequence;

    return () => {
      sequence.dispose();
      Tone.getTransport().stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = useCallback(async () => {
    await Tone.start();

    if (Tone.getTransport().state === "started") {
      Tone.getTransport().stop();
      sequenceRef.current?.stop(0);
      stepRef.current = 0;
      setPlaying(false);
    } else {
      sequenceRef.current?.start(0);
      Tone.getTransport().start();
      setPlaying(true);
    }
  }, []);

  return { playing, drumBurstCounters, synthBurstCounters, togglePlay };
}
