import { useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";
import { ROWS } from "../constants";

/**
 * Full Tone.js audio pipeline:
 *
 *   Tone.Players (samples)
 *     → per-track Tone.Volume (individual gain)
 *       → Tone.Limiter (prevents clipping when multiple drums hit)
 *         → Tone.Destination (output)
 *
 * Samples go in public/samples/:
 *   kick.wav  snare.wav  clap.wav  hihat.wav
 */

const SAMPLE_PATHS = {
  kick:     "/samples/kick.wav",
  snare:    "/samples/snare.wav",
  clap:     "/samples/clap.wav",
  "hi-hat": "/samples/hihat.wav",
};

// per-track volume in dB — tweak these to balance the kit
const TRACK_VOLUMES = {
  kick:     0,
  snare:    -2,
  clap:     -4,
  "hi-hat": -6,
};

export function useAudio() {
  const playersRef = useRef(null);
  const volumesRef = useRef({});
  const limiterRef = useRef(null);
  const readyRef   = useRef(false);

  const startContext = useCallback(async () => {
    if (readyRef.current) return;

    await Tone.start();
    console.log("Tone started ✓");

    const limiter = new Tone.Limiter(-2).toDestination();
    limiterRef.current = limiter;

    // load samples and wait until fully decoded
    const players = new Tone.Players(SAMPLE_PATHS).connect(limiter);
    await Tone.loaded();

    playersRef.current = players;
    readyRef.current = true;
    console.log("samples loaded ✓");
  }, []);

  /**
   * triggerRow — called from Tone.Sequence with a scheduled time.
   * time is a Tone AudioContext timestamp — fires sample-accurately.
   */
  const triggerRow = useCallback((row, time) => {
    if (!readyRef.current || !playersRef.current) return;
    try {
      playersRef.current.player(row).start(time);
    } catch (err) {
      console.warn(`Could not trigger "${row}":`, err);
    }
  }, []);

  /**
   * setTrackVolume — adjust per-track gain in dB at runtime.
   * e.g. setTrackVolume("kick", -6)
   */
  const setTrackVolume = useCallback((row, db) => {
    const vol = volumesRef.current[row];
    if (vol) vol.volume.rampTo(db, 0.05);
  }, []);

  /**
   * setMasterVolume — adjust overall output in dB.
   * e.g. setMasterVolume(-12)
   */
  const setMasterVolume = useCallback((db) => {
    Tone.getDestination().volume.rampTo(db, 0.05);
  }, []);

  useEffect(() => {
    return () => {
      playersRef.current?.dispose();
      Object.values(volumesRef.current).forEach(v => v.dispose());
      limiterRef.current?.dispose();
    };
  }, []);

  return { startContext, triggerRow, setTrackVolume, setMasterVolume };
}
