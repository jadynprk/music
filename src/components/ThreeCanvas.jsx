import { useEffect, useRef } from "react";
import { STEPS } from "../constants";

const BURST_FRAMES = 25;

export default function ThreeCanvas({ grid, rows, burstCounters, containerRef, gridRef }) {
  const canvasRef      = useRef(null);
  const rafRef         = useRef(null);
  const burstRef       = useRef({});
  const gridRef2       = useRef(grid);
  const rowsRef        = useRef(rows);
  const prevBurst      = useRef(new Map());
  const cellRects      = useRef({});
  const cacheFnRef     = useRef(null); // exposed so rows-change effect can call it

  useEffect(() => { gridRef2.current = grid; }, [grid]);

  // when rows change (mode switch), clear stale rects and recache
  useEffect(() => {
    rowsRef.current = rows;
    cellRects.current = {};
    burstRef.current  = {};
    // wait one frame for the new DOM cells to render before measuring
    const t = setTimeout(() => cacheFnRef.current?.(), 60);
    return () => clearTimeout(t);
  }, [rows]);

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

    const setCanvasSize = () => {
      canvas.width        = container.clientWidth  * dpr;
      canvas.height       = container.clientHeight * dpr;
      canvas.style.width  = container.clientWidth  + "px";
      canvas.style.height = container.clientHeight + "px";
    };

    const cacheCellRects = () => {
      const gridEl      = gridRef.current;
      const currentRows = rowsRef.current;
      if (!gridEl) return;
      const canvasRect = canvas.getBoundingClientRect();

      // clear old rects first
      cellRects.current = {};

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

    // expose so the rows-change effect can call it
    cacheFnRef.current = cacheCellRects;

    const tryCache = () => {
      const gridEl = gridRef.current;
      if (gridEl && gridEl.querySelector("[data-cell]")) {
        setCanvasSize();
        cacheCellRects();
      } else {
        setTimeout(tryCache, 50);
      }
    };
    tryCache();

    const ro = new ResizeObserver(() => {
      setCanvasSize();
      cacheCellRects();
    });
    ro.observe(container);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const ctx         = canvas.getContext("2d");
      const currentGrid = gridRef2.current;
      const currentRows = rowsRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      currentRows.forEach((row, r) => {
        for (let s = 0; s < STEPS; s++) {
          if (currentGrid[row]?.[s] !== 1) continue;

          const key  = `${r}-${s}`;
          const rect = cellRects.current[key];
          if (!rect) continue;

          // draw exactly at the cell rect — no padding, no offset
          const { x, y, w, h } = rect;

          const bf       = burstRef.current[key] ?? 0;
          const progress = bf > 0 ? Math.sin((1 - bf / BURST_FRAMES) * Math.PI) : 0;
          if (bf > 0) burstRef.current[key] = bf - 1;

          // depth: constant at rest, grows during burst
          const depth = Math.min(w, h) * 0.18;
          const lift  = progress * depth * 3.5;
          const d     = depth + lift;

          // isometric offset — goes up-left
          const ox = -d * 0.55;
          const oy = -d * 0.45;

          // back face
          ctx.beginPath();
          ctx.rect(x + ox, y + oy, w, h);
          ctx.fillStyle   = "rgba(255,255,255,0.03)";
          ctx.strokeStyle = `rgba(255,255,255,${0.10 + progress * 0.18})`;
          ctx.lineWidth   = 0.6;
          ctx.fill();
          ctx.stroke();

          // top connecting face
          ctx.beginPath();
          ctx.moveTo(x,        y);
          ctx.lineTo(x + ox,   y + oy);
          ctx.lineTo(x + ox + w, y + oy);
          ctx.lineTo(x + w,    y);
          ctx.closePath();
          ctx.fillStyle   = `rgba(255,255,255,${0.05 + progress * 0.07})`;
          ctx.strokeStyle = `rgba(255,255,255,${0.12 + progress * 0.20})`;
          ctx.lineWidth   = 0.6;
          ctx.fill();
          ctx.stroke();

          // left connecting face
          ctx.beginPath();
          ctx.moveTo(x,      y);
          ctx.lineTo(x + ox, y + oy);
          ctx.lineTo(x + ox, y + oy + h);
          ctx.lineTo(x,      y + h);
          ctx.closePath();
          ctx.fillStyle   = `rgba(255,255,255,${0.04 + progress * 0.05})`;
          ctx.strokeStyle = `rgba(255,255,255,${0.12 + progress * 0.20})`;
          ctx.lineWidth   = 0.6;
          ctx.fill();
          ctx.stroke();

          // front face — always at exact cell position, no offset
          ctx.beginPath();
          ctx.rect(x, y, w, h);
          ctx.fillStyle   = `rgba(255,255,255,${0.07 + progress * 0.18})`;
          ctx.strokeStyle = `rgba(255,255,255,${0.28 + progress * 0.45})`;
          ctx.lineWidth   = 0.8 + progress * 0.6;
          ctx.fill();
          ctx.stroke();

          // dot — stays centered on front face, never moves
          const dotR = Math.min(w, h) * 0.22;
          ctx.beginPath();
          ctx.arc(x + w / 2, y + h / 2, dotR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${0.85 + progress * 0.15})`;
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
