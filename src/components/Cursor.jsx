/**
 * Props:
 *   x, y — cursor position as fractions 0–1 of the container
 *
 * Renders the hand-tracking crosshair (outer ring + inner dot).
 * In production, x and y come from MediaPipe landmark coordinates.
 */
export default function Cursor({ x, y }) {
  const style = {
    left: `${x * 100}%`,
    top:  `${y * 100}%`,
  };

  return (
    <>
      <div className="cursor-ring" style={style} />
      <div className="cursor-dot"  style={style} />
    </>
  );
}
