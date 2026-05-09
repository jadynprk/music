import { useEffect, useRef } from "react";
import { STEPS } from "../constants";

const BURST_FRAMES = 25;
const PAD = 1.0;

export default function ThreeCanvas({ grid, rows, burstCounters, containerRef, gridRef }) {
  const canvasRef  = useRef(null);
  const rafRef     = useRef(null);
  const burstRef   = useRef({});
  const gridRef2   = useRef(grid);
  const rowsRef    = useRef(rows);
  const prevBurst  = useRef(new Map());
  const cellRects  = useRef({});

  useEffect(() => { gridRef2.current = grid; }, [grid]);
  useEffect(() => { rowsRef.current  = rows; }, [rows]);

  useEffect(() => {
    burstCounters.forEach((count, key) => {
      const prev = prevBurst.current.get(key) ?? 0;
      const [r, s] = key.split("-").map(Number);
      if (count !== prev && gridRef2.current[rowsRef.current[r]]?.[s] === 1) {
        burstRef.current[key] = BURST_FRAMES;
      }
    });
    prevBurst.current = new Map(burstCounters);
  }, [burstCounters, grid]);

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio;

    const resize = () => {
      canvas.width  = container.clientWidth  * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width  = container.clientWidth  + "px";
      canvas.style.height = container.clientHeight + "px";
      cacheCellRects();
    };

    const cacheCellRects = () => {
      const gridEl     = gridRef.current;
      const currentRows = rowsRef.current;
      if (!gridEl) return;
      const canvasRect = canvas.getBoundingClientRect();

      currentRows.forEach((_, r) => {
        for (let s = 0; s < STEPS; s++) {
          const key    = `${r}-${s}`;
          const cellEl = gridEl.querySelector(`[data-cell="${key}"]`);
          if (!cellEl) continue;
          const cr = cellEl.getBoundingClientRect();
          cellRects.current[key] = {
            x: (cr.left - canvasRect.left) * dpr,
            y: (cr.top  - canvasRect.top)  * dpr,
            w: cr.width  * dpr,
            h: cr.height * dpr,
          };
        }
      });
    };

    const tryCache = () => {
      const gridEl = gridRef.current;
      if (gridEl && gridEl.querySelector("[data-cell]")) {
        resize();
      } else {
        setTimeout(tryCache, 50);
      }
    };
    tryCache();

    const ro = new ResizeObserver(() => {
      resize();
      cacheCellRects();
    });
    ro.observe(container);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const ctx         = canvas.getContext("2d");
      const W           = canvas.width;
      const H           = canvas.height;
      const currentGrid = gridRef2.current;
      const currentRows = rowsRef.current;

      ctx.clearRect(0, 0, W, H);

      currentRows.forEach((row, r) => {
        for (let s = 0; s < STEPS; s++) {
          if (currentGrid[row]?.[s] !== 1) continue;

          const key  = `${r}-${s}`;
          const rect = cellRects.current[key];
          if (!rect) continue;

          const { x, y, w, h } = rect;

          const bf       = burstRef.current[key] ?? 0;
          const progress = bf > 0 ? Math.sin((1 - bf / BURST_FRAMES) * Math.PI) : 0;
          if (bf > 0) burstRef.current[key] = bf - 1;

          const depth  = Math.min(w, h) * 0.18;
          const lift   = progress * depth * 4;
          const offset = depth + lift;

          const px = x + (w - w * PAD) / 2;
          const py = y + (h - h * PAD) / 2;
          const pw = w * PAD;
          const ph = h * PAD;

          const ox = -offset * 0.6;
          const oy = -offset * 0.5;

          // back face
          ctx.beginPath();
          ctx.rect(px + ox, py + oy, pw, ph);
          ctx.fillStyle   = "rgba(255,255,255,0.03)";
          ctx.strokeStyle = `rgba(255,255,255,${0.10 + progress * 0.2})`;
          ctx.lineWidth   = 0.8;
          ctx.fill();
          ctx.stroke();

          // top face
          ctx.beginPath();
          ctx.moveTo(px,           py);
          ctx.lineTo(px + ox,      py + oy);
          ctx.lineTo(px + ox + pw, py + oy);
          ctx.lineTo(px + pw,      py);
          ctx.closePath();
          ctx.fillStyle   = `rgba(255,255,255,${0.05 + progress * 0.08})`;
          ctx.strokeStyle = `rgba(255,255,255,${0.12 + progress * 0.22})`;
          ctx.fill();
          ctx.stroke();

          // left face
          ctx.beginPath();
          ctx.moveTo(px,      py);
          ctx.lineTo(px + ox, py + oy);
          ctx.lineTo(px + ox, py + oy + ph);
          ctx.lineTo(px,      py + ph);
          ctx.closePath();
          ctx.fillStyle   = `rgba(255,255,255,${0.04 + progress * 0.06})`;
          ctx.strokeStyle = `rgba(255,255,255,${0.12 + progress * 0.22})`;
          ctx.fill();
          ctx.stroke();

          // front face
          ctx.beginPath();
          ctx.rect(px, py, pw, ph);
          ctx.fillStyle   = `rgba(255,255,255,${0.07 + progress * 0.15})`;
          ctx.strokeStyle = `rgba(255,255,255,${0.25 + progress * 0.45})`;
          ctx.lineWidth   = progress > 0.1 ? 1.2 : 0.8;
          ctx.fill();
          ctx.stroke();

          // dot
          const dotR = Math.min(pw, ph) * 0.22;
          ctx.beginPath();
          ctx.arc(px + pw / 2, py + ph / 2, dotR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${0.82 + progress * 0.18})`;
          ctx.fill();
        }
      });
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    />
  );
}

