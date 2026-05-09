import { useState, useRef, useCallback, useEffect } from "react";

import { DEFAULT_GRID, ROWS, STEPS } from "../constants";
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
import * as Tone from "tone";

// how many ms must pass before the same gesture can fire again
const GESTURE_COOLDOWN_MS = 600;

export default function HandSyncSequencer() {
  const [grid, setGrid]       = useState(DEFAULT_GRID);
  const [cursor, setCursor]   = useState({ x: 0.5, y: 0.5 });
  const [gesture, setGesture] = useState(null);

  const gridRef        = useRef(null);
  const containerRef   = useRef(null);
  const cursorRef      = useRef({ x: 0.5, y: 0.5 });  // always-fresh cursor for gesture handler
  const lastGestureRef = useRef(0);                     // timestamp of last fired gesture

  const { startContext, triggerRow } = useAudio();
  const { playing, burstCounters, togglePlay } = useSequencer(grid, triggerRow);
  const videoRef = useCamera();

  const handleHandResult = useCallback(({ rightFingertip, gesture: g }) => {
    if (rightFingertip) {
      const pos = { x: 1 - rightFingertip.x, y: rightFingertip.y };
      setCursor(pos);
      cursorRef.current = pos;
    }
    setGesture(g);

    // --- thumbs up: place/remove note at cursor position ---
    if (g === "peace") {
      const now = Date.now();
      if (now - lastGestureRef.current < GESTURE_COOLDOWN_MS) return;
      lastGestureRef.current = now;

      const { x, y } = cursorRef.current;

      // map 0-1 cursor fractions to grid row + step
      const step = Math.floor(x * STEPS);
      const rowIdx = Math.floor(y * ROWS.length);

      // clamp to valid range
      if (step < 0 || step >= STEPS || rowIdx < 0 || rowIdx >= ROWS.length) return;

      const row = ROWS[rowIdx];
      setGrid(prev => ({
        ...prev,
        [row]: prev[row].map((v, i) => (i === step ? (v ? 0 : 1) : v)),
      }));
    }

  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useHandTracking(videoRef, handleHandResult);

  // stop gesture → play/pause
  useEffect(() => {
    if (gesture !== "stop") return;
    Tone.start().then(() => {
      startContext().then(() => togglePlay());
    });
  }, [gesture]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCell = useCallback((row, step) => {
    setGrid(prev => ({
      ...prev,
      [row]: prev[row].map((v, i) => (i === step ? (v ? 0 : 1) : v)),
    }));
  }, []);

  const handlePlay = useCallback(async () => {
    await Tone.start();
    await startContext();
    togglePlay();
  }, [startContext, togglePlay]);

  return (
    <div className="sequencer" ref={containerRef}>

      <CameraFeed ref={videoRef} />

      <div style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        pointerEvents: "none",
      }} />

      <ThreeCanvas
        grid={grid}
        burstCounters={burstCounters}
        containerRef={containerRef}
        gridRef={gridRef}
      />

      <Grid grid={grid} gridRef={gridRef} onToggle={toggleCell} />

      <PlayBar playing={playing} />
      <Cursor x={cursor.x} y={cursor.y} />

      {gesture && (
        <div style={{
          position: "absolute",
          bottom: 56,
          left: "50%",
          transform: "translateX(-50%)",
          color: "cyan",
          fontFamily: "monospace",
          fontSize: 18,
          pointerEvents: "none",
          opacity: 0.85,
        }}>
          {gesture}
        </div>
      )}

      <button className="play-btn" onClick={handlePlay}>
        {playing ? "■" : "▶"}
      </button>

    </div>
  );
}