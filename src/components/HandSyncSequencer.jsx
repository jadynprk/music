import { useState, useRef, useCallback, useEffect } from "react";
import * as Tone from "tone";

import { DEFAULT_GRID, DEFAULT_SYNTH_GRID, ROWS, SYNTH_NOTES, STEPS } from "../constants";
import { useSequencer }    from "../hooks/useSequencer";
import { useAudio }        from "../hooks/useAudio";
import { useCamera }       from "../hooks/useCamera";
import { useHandTracking } from "../hooks/useHandTracking";

import CameraFeed  from "./CameraFeed";
import ThreeCanvas from "./ThreeCanvas";
import Grid        from "./Grid";
import PlayBar     from "./PlayBar";
import Cursor      from "./Cursor";

import "../styles/index.css";
import "../styles/sequencer.css";

const GESTURE_COOLDOWN_MS = 600;

export default function HandSyncSequencer() {
  const [drumGrid,  setDrumGrid]  = useState(DEFAULT_GRID);
  const [synthGrid, setSynthGrid] = useState(DEFAULT_SYNTH_GRID);
  const [mode,      setMode]      = useState("drums");
  const [cursor,    setCursor]    = useState({ x: 0.5, y: 0.5 });
  const [gesture,   setGesture]   = useState(null);

  const gridRef        = useRef(null);
  const containerRef   = useRef(null);
  const cursorRef      = useRef({ x: 0.5, y: 0.5 });
  const lastGestureRef = useRef(0);

  const { startContext, triggerRow, triggerNote } = useAudio();

  const { playing, drumBurstCounters, synthBurstCounters, togglePlay } =
    useSequencer(drumGrid, synthGrid, triggerRow, triggerNote);

  const videoRef = useCamera();

  const activeGrid          = mode === "drums" ? drumGrid  : synthGrid;
  const activeRows          = mode === "drums" ? ROWS      : SYNTH_NOTES;
  const activeBurstCounters = mode === "drums" ? drumBurstCounters : synthBurstCounters;

  const toggleCell = useCallback((row, step) => {
    if (mode === "drums") {
      setDrumGrid(prev => ({
        ...prev,
        [row]: prev[row].map((v, i) => (i === step ? (v ? 0 : 1) : v)),
      }));
    } else {
      setSynthGrid(prev => ({
        ...prev,
        [row]: prev[row].map((v, i) => (i === step ? (v ? 0 : 1) : v)),
      }));
    }
  }, [mode]);

  const placeNote = useCallback((x, y, currentMode) => {
    const rows   = currentMode === "drums" ? ROWS : SYNTH_NOTES;
    const step   = Math.floor(x * STEPS);
    const rowIdx = Math.floor(y * rows.length);

    if (step < 0 || step >= STEPS || rowIdx < 0 || rowIdx >= rows.length) return;

    const row = rows[rowIdx];
    if (currentMode === "drums") {
      setDrumGrid(prev => ({
        ...prev,
        [row]: prev[row].map((v, i) => (i === step ? (v ? 0 : 1) : v)),
      }));
    } else {
      setSynthGrid(prev => ({
        ...prev,
        [row]: prev[row].map((v, i) => (i === step ? (v ? 0 : 1) : v)),
      }));
    }
  }, []);

  const handleHandResult = useCallback(({ rightFingertip, gesture: g }) => {
    if (rightFingertip) {
      const pos = { x: 1 - rightFingertip.x, y: rightFingertip.y };
      setCursor(pos);
      cursorRef.current = pos;
    }
    setGesture(g);

    // point — place / remove note
    if (g === "point") {
      const now = Date.now();
      if (now - lastGestureRef.current < GESTURE_COOLDOWN_MS) return;
      lastGestureRef.current = now;
      placeNote(cursorRef.current.x, cursorRef.current.y, mode);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, placeNote]);

  useHandTracking(videoRef, handleHandResult);

  // stop (both palms) → play / pause
  useEffect(() => {
    if (gesture !== "stop") return;
    Tone.start().then(() => {
      startContext().then(() => togglePlay());
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gesture]);

  // pinky → switch mode, with cooldown
  useEffect(() => {
    if (gesture !== "pinky") return;
    const now = Date.now();
    if (now - lastGestureRef.current < GESTURE_COOLDOWN_MS) return;
    lastGestureRef.current = now;
    setMode(m => m === "drums" ? "synth" : "drums");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gesture]);

  const handlePlay = useCallback(async () => {
    await Tone.start();
    await startContext();
    togglePlay();
  }, [startContext, togglePlay]);

  return (
    <div className="sequencer" ref={containerRef}>

      <CameraFeed ref={videoRef} />

      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(0,0,0,0.35)",
        pointerEvents: "none",
      }} />

      <ThreeCanvas
        grid={activeGrid}
        rows={activeRows}
        burstCounters={activeBurstCounters}
        containerRef={containerRef}
        gridRef={gridRef}
      />

      <Grid
        grid={activeGrid}
        rows={activeRows}
        gridRef={gridRef}
        onToggle={toggleCell}
      />

      <PlayBar playing={playing} />
      <Cursor x={cursor.x} y={cursor.y} />

      {/* mode indicator */}
      <div style={{
        position: "absolute", top: 16, right: 16,
        fontFamily: "monospace", fontSize: 10,
        letterSpacing: "2px",
        color: "rgba(255,255,255,0.4)",
        pointerEvents: "none",
      }}>
        {mode.toUpperCase()}
      </div>

      {/* mode toggle button */}
      <button
        className="mode-btn"
        onClick={() => setMode(m => m === "drums" ? "synth" : "drums")}
      >
        {mode === "drums" ? "SYNTH" : "DRUMS"}
      </button>

      {/* play button */}
      <button className="play-btn" onClick={handlePlay}>
        {playing ? "■" : "▶"}
      </button>

      {/* gesture debug label */}
      {gesture && (
        <div style={{
          position: "absolute", bottom: 56, left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(255,255,255,0.45)",
          fontFamily: "monospace", fontSize: 11,
          pointerEvents: "none", letterSpacing: "2px",
        }}>
          {gesture}
        </div>
      )}

    </div>
  );
}
