/**
 * Props:
 *   ripples — array of { id, x, y } pixel positions relative to the grid container
 *
 * Renders an expanding ring at each position when a note is triggered.
 */
export default function RippleLayer({ ripples }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {ripples.map(({ id, x, y }) => (
        <div
          key={id}
          className="ripple"
          style={{ left: x, top: y }}
        />
      ))}
    </div>
  );
}
