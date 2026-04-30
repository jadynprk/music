import { useCallback } from "react";
import { ROWS, STEPS } from "../constants";

/**
 * Props:
 *   grid       — { [rowName]: number[] }
 *   playhead   — current step index or null
 *   gridRef    — ref attached to the grid div
 *   onToggle   — (rowName, stepIndex) => void
 *
 * Note: cube rendering is handled by ThreeCanvas — this component
 * only provides invisible click targets and floating row labels.
 */
export default function Grid({ grid, playhead, gridRef, onToggle }) {
  const handleClick = useCallback((row, step) => {
    onToggle(row, step);
  }, [onToggle]);

  return (
    <div ref={gridRef} className="grid">
      {ROWS.map((row, r) => (
        <>
          {/* floating row label — absolutely positioned so it doesn't affect cell layout */}
          <div
            key={`lbl-${row}`}
            className="row-label"
            style={{
              position: "absolute",
              top:    `${(r / ROWS.length) * 100}%`,
              height: `${(1 / ROWS.length) * 100}%`,
              left: 0, right: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            {row}
          </div>

          {/* invisible click cells */}
          {Array.from({ length: STEPS }, (_, s) => (
            <div
              key={`${row}-${s}`}
              data-cell={`${r}-${s}`}
              className={["cell", playhead === s ? "cell--playhead" : ""].filter(Boolean).join(" ")}
              style={{ gridRow: r + 1, gridColumn: s + 1 }}
              onClick={() => handleClick(row, s)}
            />
          ))}
        </>
      ))}
    </div>
  );
}
