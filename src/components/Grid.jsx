import { useCallback } from "react";
import { ROWS, STEPS } from "../constants";

const CUBE_DEPTH = 40;

/**
 * Props:
 *   grid          — { [rowName]: number[] }
 *   playhead      — current step index or null
 *   burstCounters — Map of "rowIdx-stepIdx" → number (increments each hit)
 *   gridRef       — ref attached to the grid div
 *   onToggle      — (rowName, stepIndex) => void
 */
export default function Grid({ grid, playhead, burstCounters, gridRef, onToggle }) {
  const handleClick = useCallback((row, step) => {
    onToggle(row, step);
  }, [onToggle]);

  return (
    <div ref={gridRef} className="grid">
      {ROWS.map((row, r) => (
        <>
          {/* floating row label — spans all columns, centered, clicks pass through */}
          <div
            key={`lbl-${row}`}
            className="row-label"
            style={{ gridRow: r + 1, gridColumn: `1 / ${STEPS + 2}` }}
          >
            {row}
          </div>

          {Array.from({ length: STEPS }, (_, s) => {
            const active      = grid[row][s] === 1;
            const isHead      = playhead === s;
            const cellKey     = `${r}-${s}`;
            const burstCount  = burstCounters.get(cellKey) ?? 0;

            return (
              <div
                key={`${row}-${s}`}
                data-cell={cellKey}
                className={["cell", isHead ? "cell--playhead" : ""].filter(Boolean).join(" ")}
                style={{ gridRow: r + 1, gridColumn: s + 1 }}
                onClick={() => handleClick(row, s)}
              >
                {active && (
                  // burstCount as key forces a full remount on every hit,
                  // so the animation always starts from 0
                  <div
                    key={burstCount}
                    className={`cube${burstCount > 0 ? " cube--burst" : ""}`}
                    style={{ "--d": `${CUBE_DEPTH}px` }}
                  >
                    <div className="cube__face cube__face--back" />
                    <div className="cube__face cube__face--top" />
                    <div className="cube__face cube__face--bottom" />
                    <div className="cube__face cube__face--left" />
                    <div className="cube__face cube__face--right" />
                    <div className={`cube__face cube__face--front${burstCount > 0 ? " cube__face--burst" : ""}`}>
                      <div className="cube__dot" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      ))}
    </div>
  );
}
