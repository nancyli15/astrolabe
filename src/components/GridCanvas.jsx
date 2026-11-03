// ---------------------------------------------------------------------------
// GridCanvas — draws the grid on an HTML5 canvas and runs the simulation clock.
//
// Why the grid lives in a ref (not React state): the grid changes 5 times a
// second and is redrawn ~60 times a second. Putting it in React state would make
// React re-render the whole component tree that often for no benefit. Instead,
// React handles the UI around the canvas (buttons, stats, code panel) and this
// component draws pixels directly.
// ---------------------------------------------------------------------------
import { useEffect, useRef } from 'react';
import { step, setCell, isAlive } from '../engine/life.js';
import { computeGridLayout, screenToCell } from '../engine/layout.js';

const COLORS = {
  background: '#050508',
  deadDot: '#1f2430',
  newborn: '#ff7b72', // age 0
  young: '#ffa657', // age 1
  stable: '#e6edf3', // age 2+
  frame: '#3a3f4b',
  accent: '#ef4444',
};

// Optional artwork. Drop your PNG at public/assets/grid_frame.png and it is
// drawn automatically; until then a simple vector frame is drawn in code.
const FRAME_URL = `${import.meta.env.BASE_URL}assets/grid_frame.png`;

export default function GridCanvas({ gridRef, pausedRef, tickMs, onGeneration, onPaint, onFps }) {
  const canvasRef = useRef(null);
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });
  const hoverRef = useRef(null); // { row, col } under the mouse, or null
  const frameImageRef = useRef(null);
  // Keep the latest callbacks in a ref so the animation loop never restarts.
  const callbacks = useRef({});
  callbacks.current = { onGeneration, onPaint, onFps };

  // --- Load the optional frame artwork --------------------------------------
  useEffect(() => {
    const img = new Image();
    img.onload = () => { frameImageRef.current = img; };
    img.src = FRAME_URL; // if the file doesn't exist, onload never fires: fine
  }, []);

  // --- Keep the canvas buffer matched to its on-screen size (sharp on Retina) --
  useEffect(() => {
    const canvas = canvasRef.current;
    const observer = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      sizeRef.current = { width, height, dpr };
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // --- Drawing ----------------------------------------------------------------
  function draw(ctx) {
    const { width, height, dpr } = sizeRef.current;
    // setTransform (not scale) so the DPR scaling never stacks up across frames.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);

    const grid = gridRef.current;
    const L = computeGridLayout(width, height, grid.rows, grid.cols);
    const s = L.cellSize;

    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        const i = row * grid.cols + col;
        const x = L.originX + col * s;
        const y = L.originY + row * s;
        if (grid.alive[i]) {
          const age = grid.age[i];
          ctx.fillStyle = age === 0 ? COLORS.newborn : age === 1 ? COLORS.young : COLORS.stable;
          ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
        } else {
          ctx.fillStyle = COLORS.deadDot;
          const dot = Math.max(1, Math.floor(s / 6));
          ctx.fillRect(x + (s - dot) / 2, y + (s - dot) / 2, dot, dot);
        }
      }
    }

    // Hover highlight
    const hover = hoverRef.current;
    if (hover) {
      ctx.strokeStyle = COLORS.accent;
      ctx.lineWidth = 1;
      ctx.strokeRect(L.originX + hover.col * s + 0.5, L.originY + hover.row * s + 0.5, s - 1, s - 1);
    }

    drawFrame(ctx, L);
  }

  function drawFrame(ctx, L) {
    // The frame artwork covers the grid plus a border of 10% on every side.
    const pad = Math.round(L.width * 0.1);
    const fx = L.originX - pad;
    const fy = L.originY - pad;
    const fw = L.width + pad * 2;
    const fh = L.height + pad * 2;
    if (frameImageRef.current) {
      ctx.drawImage(frameImageRef.current, fx, fy, fw, fh);
      return;
    }
    // Placeholder: thin outline + corner brackets.
    ctx.strokeStyle = COLORS.frame;
    ctx.lineWidth = 1;
    ctx.strokeRect(L.originX - 6.5, L.originY - 6.5, L.width + 13, L.height + 13);
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 2;
    const k = 18;
    const corners = [
      [fx + pad / 2, fy + pad / 2, 1, 1],
      [fx + fw - pad / 2, fy + pad / 2, -1, 1],
      [fx + pad / 2, fy + fh - pad / 2, 1, -1],
      [fx + fw - pad / 2, fy + fh - pad / 2, -1, -1],
    ];
    for (const [x, y, dx, dy] of corners) {
      ctx.beginPath();
      ctx.moveTo(x + k * dx, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + k * dy);
      ctx.stroke();
    }
    ctx.fillStyle = COLORS.frame;
    ctx.font = '11px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillText(`MATRIX ${gridRef.current.rows}×${gridRef.current.cols} · TORUS`, fx + pad / 2, fy + pad / 2 - 8);
  }

  // --- The animation loop -----------------------------------------------------
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    let frameId;
    let last = performance.now();
    let pending = 0; // milliseconds of simulation time waiting to be run
    let frames = 0;
    let fpsStart = last;

    // #region loop
    function frame(now) {
      const elapsed = now - last;
      last = now;

      // Simulation clock: advances only while running, one generation per tickMs.
      // (Capped so a backgrounded tab doesn't come back and run 500 steps at once.)
      if (!pausedRef.current) {
        pending = Math.min(pending + elapsed, tickMs * 5);
        while (pending >= tickMs) {
          gridRef.current = step(gridRef.current);
          pending -= tickMs;
          callbacks.current.onGeneration();
        }
      }

      // Render clock: redraw on EVERY frame, paused or not, so hover and
      // edits show up instantly.
      draw(ctx);

      frames++;
      if (now - fpsStart >= 1000) {
        callbacks.current.onFps(Math.round((frames * 1000) / (now - fpsStart)));
        frames = 0;
        fpsStart = now;
      }
      frameId = requestAnimationFrame(frame);
    }
    // #endregion

    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickMs]);

  // --- Mouse / touch: click or drag to paint cells ------------------------------
  const paint = useRef(null); // { value: true|false, count, first } while dragging

  function cellAt(event) {
    const rect = canvasRef.current.getBoundingClientRect();
    const { width, height } = sizeRef.current;
    const grid = gridRef.current;
    const L = computeGridLayout(width, height, grid.rows, grid.cols);
    return screenToCell(event.clientX - rect.left, event.clientY - rect.top, L, grid.rows, grid.cols);
  }

  function handlePointerDown(event) {
    const cell = cellAt(event);
    if (!cell) return;
    canvasRef.current.setPointerCapture(event.pointerId);
    // First cell decides the brush: clicking a dead cell paints life, a live one erases.
    const value = !isAlive(gridRef.current, cell.row, cell.col);
    gridRef.current = setCell(gridRef.current, cell.row, cell.col, value);
    paint.current = { value, count: 1, first: cell, last: cell };
  }

  function handlePointerMove(event) {
    const cell = cellAt(event);
    hoverRef.current = cell;
    const p = paint.current;
    if (!p || !cell) return;
    if (cell.row === p.last.row && cell.col === p.last.col) return;
    p.last = cell;
    if (isAlive(gridRef.current, cell.row, cell.col) !== p.value) {
      gridRef.current = setCell(gridRef.current, cell.row, cell.col, p.value);
      p.count++;
    }
  }

  function handlePointerUp() {
    if (paint.current) callbacks.current.onPaint(paint.current);
    paint.current = null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="grid-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={() => { hoverRef.current = null; }}
    />
  );
}
