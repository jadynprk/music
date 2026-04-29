import { useState, useRef, useCallback } from "react";

import { DEFAULT_GRID } from "../constants";
import { useSequencer } from "../hooks/useSequencer";
import { useCursor }    from "../hooks/useCursor";

import Grid     from "./Grid";
import PlayBar  from "./PlayBar";
import Cursor   from "./Cursor";

import "../styles/index.css";
import "../styles/sequencer.css";

export default function HandSyncSequencer() {
  const [grid, setGrid] = useState(DEFAULT_GRID);
  const gridRef = useRef(null);

  const { playhead, playing, burstCounters, togglePlay } =
    useSequencer(grid, gridRef);

  const cursor = useCursor();

  const toggleCell = useCallback((row, step) => {
    setGrid(prev => ({
      ...prev,
      [row]: prev[row].map((v, i) => (i === step ? (v ? 0 : 1) : v)),
    }));
  }, []);

  return (
    <div className="sequencer">

      {/* camera stand-in — replace with <video> for live feed */}
      <div className="silhouette-wrap">
        <div className="silhouette-body">
          <div className="silhouette-head" />
        </div>
      </div>

      <Grid
        grid={grid}
        playhead={playhead}
        burstCounters={burstCounters}
        gridRef={gridRef}
        onToggle={toggleCell}
      />

      <PlayBar playing={playing} />

      <Cursor x={cursor.x} y={cursor.y} />

      {/* minimal floating play button — bottom left */}
      <button className="play-btn" onClick={togglePlay}>
        {playing ? "■" : "▶"}
      </button>

    </div>
  );
}
