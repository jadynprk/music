const HINTS = [
  ["POINT",  "place note"],
  ["PEACE",  "move cursor"],
  ["FIST",   "clear row"],
  ["PALM",   "play / pause"],
];

/**
 * Props:
 *   playing    — boolean
 *   onToggle   — () => void
 */
export default function BottomBar({ playing, onToggle }) {
  return (
    <div className="bottom-bar">
      <button className="play-btn" onClick={onToggle}>
        {playing ? "■ STOP" : "▶ PLAY"}
      </button>

      <div className="gesture-hints">
        {HINTS.map(([key, action]) => (
          <div key={key} className="gesture-hint">
            <span className="gesture-hint__key">{key}</span>
            {" — "}{action}
          </div>
        ))}
      </div>
    </div>
  );
}
