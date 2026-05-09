import { useCallback } from "react";
import { STEPS } from "../constants";

/**
 * Props:
 *   grid     — { [rowName]: number[] }
 *   rows     — string[] — row names (ROWS for drums, SYNTH_NOTES for synth)
 *   gridRef  — ref attached to the grid div
 *   onToggle — (rowName, stepIndex) => void
 */
export default function Grid({ grid, rows, gridRef, onToggle }) {
  const handleClick = useCallback((row, step) => {
    onToggle(row, step);
  }, [onToggle]);

  return (
    <div
      ref={gridRef}
      className="grid"
      style={{ gridTemplateRows: `repeat(${rows.length}, 1fr)` }}
    >
      {rows.map((row, r) => (
        <>
          <div
            key={`lbl-${row}`}
            className="row-label"
            style={{
              position:      "absolute",
              top:           `${(r / rows.length) * 100}%`,
              height:        `${(1 / rows.length) * 100}%`,
              left: 0, right: 0,
              display:       "flex",
              alignItems:    "center",
              justifyContent:"center",
              pointerEvents: "none",
              zIndex:        2,
              fontSize:      rows.length > 4 ? 9 : 11,
            }}
          >
            {row}
          </div>

          {Array.from({ length: STEPS }, (_, s) => (
            <div
              key={`${row}-${s}`}
              data-cell={`${r}-${s}`}
              className="cell"
              style={{ gridRow: r + 1, gridColumn: s + 1 }}
              onClick={() => handleClick(row, s)}
            />
          ))}
        </>
      ))}
    </div>
  );
}
