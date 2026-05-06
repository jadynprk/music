import { useEffect, useRef } from "react";
import * as Tone from "tone";

export default function PlayBar({ playing }) {
  const barRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current);
      if (barRef.current) barRef.current.style.left = "0%";
      return;
    }

    const update = () => {
      if (barRef.current) {
        const progress = Tone.getTransport().progress;
        barRef.current.style.left = `${progress * 100}%`;
      }
      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing]);

  if (!playing) return null;

  return <div ref={barRef} className="play-bar" />;
}
