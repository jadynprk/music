import { useState, useRef, useCallback } from "react";

import { DEFAULT_GRID } from "../constants";
import { useSequencer } from "../hooks/useSequencer";
import { useCursor }    from "../hooks/useCursor";
import { useAudio }     from "../hooks/useAudio";

import CameraFeed  from "./CameraFeed";
import ThreeCanvas from "./ThreeCanvas";
import Grid        from "./Grid";
import PlayBar     from "./PlayBar";
import Cursor      from "./Cursor";

import "../styles/index.css";
import "../styles/sequencer.css";
import * as Tone from "tone";

export default function HandSyncSequencer() {
  const [grid, setGrid] = useState(DEFAULT_GRID);
  const gridRef         = useRef(null);
  const containerRef    = useRef(null);

  const { startContext, triggerRow } = useAudio();

  const { playing, burstCounters, togglePlay } =
    useSequencer(grid, triggerRow);

  const cursor = useCursor();

  const toggleCell = useCallback((row, step) => {
    setGrid(prev => ({
      ...prev,
      [row]: prev[row].map((v, i) => (i === step ? (v ? 0 : 1) : v)),
    }));
  }, []);

  const handlePlay = useCallback(async () => {
    // startContext loads samples and unlocks AudioContext on first press
    await Tone.start();
    await startContext();
    togglePlay();
  }, [startContext, togglePlay]);

  return (
    <div className="sequencer" ref={containerRef}>

      {/* layer 1 — live webcam */}
      <CameraFeed />

      {/* layer 1.5 — dim overlay for contrast */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        pointerEvents: "none",
      }} />

      {/* layer 2 — 2D canvas cube rendering */}
      <ThreeCanvas
        grid={grid}
        burstCounters={burstCounters}
        containerRef={containerRef}
        gridRef={gridRef}
      />

      {/* layer 3 — invisible click grid + row labels */}
      <Grid
        grid={grid}
        gridRef={gridRef}
        onToggle={toggleCell}
      />

      {/* layer 4 — play bar + cursor + controls */}
      <PlayBar playing={playing} />
      {/* <Cursor x={cursor.x} y={cursor.y} /> */}

      <button className="play-btn" onClick={handlePlay}>
        {playing ? "■" : "▶"}
      </button>

    </div>
  );
}
