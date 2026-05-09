import { useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";
import { ROWS } from "../constants";

const SAMPLE_PATHS = {
  kick:     "/samples/kick.wav",
  snare:    "/samples/snare.wav",
  clap:     "/samples/clap.wav",
  "hi-hat": "/samples/hihat.wav",
};

export function useAudio() {
  const playersRef = useRef(null);
  const limiterRef = useRef(null);
  const synthRef   = useRef(null);
  const readyRef   = useRef(false);

  const startContext = useCallback(async () => {
    if (readyRef.current) return;

    await Tone.start();

    const limiter = new Tone.Limiter(-2).toDestination();
    limiterRef.current = limiter;

    // load samples — connect after loaded to avoid race condition
    const players = new Tone.Players(SAMPLE_PATHS);
    await Tone.loaded();
    players.connect(limiter);
    playersRef.current = players;

    // PolySynth for note grid
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.8 },
      volume: -6,
    }).connect(limiter);
    synthRef.current = synth;

    readyRef.current = true;
  }, []);

  // trigger a drum sample
  const triggerRow = useCallback((row, time) => {
    if (!readyRef.current || !playersRef.current) return;
    try {
      playersRef.current.player(row).start(time);
    } catch (err) {
      console.warn(`Could not trigger "${row}":`, err);
    }
  }, []);

  // trigger a synth note — note is e.g. "C4", "F#4"
  const triggerNote = useCallback((note, time) => {
    if (!readyRef.current || !synthRef.current) return;
    try {
      synthRef.current.triggerAttackRelease(note, "16n", time);
    } catch (err) {
      console.warn(`Could not trigger note "${note}":`, err);
    }
  }, []);

  const setMasterVolume = useCallback((db) => {
    Tone.getDestination().volume.rampTo(db, 0.05);
  }, []);

  useEffect(() => {
    return () => {
      playersRef.current?.dispose();
      limiterRef.current?.dispose();
      synthRef.current?.dispose();
    };
  }, []);

  return { startContext, triggerRow, triggerNote, setMasterVolume };
}
