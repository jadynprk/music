import { useState, useRef, useCallback, useEffect } from "react";

import { DEFAULT_GRID } from "../constants";
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

export default function HandSyncSequencer() {
  const [grid, setGrid]       = useState(DEFAULT_GRID);
  const [cursor, setCursor]   = useState({ x: 0.5, y: 0.5 });
  const [gesture, setGesture] = useState(null);

  const gridRef      = useRef(null);
  const containerRef = useRef(null);

  const { startContext, triggerRow } = useAudio();
  const { playing, burstCounters, togglePlay } = useSequencer(grid, triggerRow);

  // shared video ref — passed to both CameraFeed (renders it) and
  // useHandTracking (reads frames from it)
  const videoRef = useCamera();

  const handleHandResult = useCallback(({ rightFingertip, gesture: g }) => {
    if (rightFingertip) {
      // MediaPipe x is already 0-1; mirror it to match the flipped video
      setCursor({ x: 1 - rightFingertip.x, y: rightFingertip.y });
    }
    setGesture(g);
  }, []);

  useHandTracking(videoRef, handleHandResult);

  // gesture → action mapping
  useEffect(() => {
    if (!gesture) return;

    if (gesture === "stop") {
      // both palms out = play/pause
      Tone.start().then(() => {
        startContext().then(() => togglePlay());
      });
    }

    if (gesture === "thumbs_up") {
      console.log("thumbs up detected — wire to an action here");
    }

    if (gesture === "peace") {
      console.log("peace detected — wire to an action here");
    }
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

      {/* layer 1 — live webcam */}
      <CameraFeed ref={videoRef} />

      {/* layer 1.5 — dim overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        pointerEvents: "none",
      }} />

      {/* layer 2 — 3D cube rendering */}
      <ThreeCanvas
        grid={grid}
        burstCounters={burstCounters}
        containerRef={containerRef}
        gridRef={gridRef}
      />

      {/* layer 3 — click grid + row labels */}
      <Grid grid={grid} gridRef={gridRef} onToggle={toggleCell} />

      {/* layer 4 — play bar, cursor, controls */}
      <PlayBar playing={playing} />
      <Cursor x={cursor.x} y={cursor.y} />

      {/* gesture indicator */}
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