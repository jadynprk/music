import { useState, useEffect, useRef } from "react";

/**
 * Provides cursor { x, y } as fractions of the container (0–1).
 *
 * Right now this runs a demo sine-wave animation.
 * To wire up MediaPipe, replace the rAF loop with:
 *
 *   const onResults = (results) => {
 *     const landmark = results.multiHandLandmarks?.[0]?.[8]; // index fingertip
 *     if (landmark) setCursor({ x: landmark.x, y: landmark.y });
 *   };
 *
 * and call setCursor from your MediaPipe onResults callback instead.
 */
export function useCursor() {
  const [cursor, setCursor] = useState({ x: 0.5, y: 0.5 });
  const animRef = useRef(null);
  const tRef    = useRef(0);

  useEffect(() => {
    const loop = () => {
      tRef.current += 0.007;
      const t = tRef.current;
      setCursor({
        x: 0.34 + Math.sin(t * 0.65) * 0.19,
        y: 0.42 + Math.cos(t * 0.48) * 0.13,
      });
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return cursor;
}
