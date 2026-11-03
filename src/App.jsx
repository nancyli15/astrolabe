// ---------------------------------------------------------------------------
// App — the two-pane layout and the controls.
//
//   ┌──────────────── code panel ───────────┬──────────── canvas ─────────────┐
//   │ what just happened + the real code    │ the 30×30 Game of Life grid     │
//   └───────────────────────────────────────┴─────────────────────────────────┘
//
// Data flow: the grid lives in `gridRef`. Buttons/keys replace it; GridCanvas
// reads it every frame and reports back (generation ticks, paint strokes, FPS).
// Each user action also produces a "log entry" that the code panel displays.
// ---------------------------------------------------------------------------
import { useCallback, useEffect, useRef, useState } from 'react';
import GridCanvas from './components/GridCanvas.jsx';
import CodePanel from './codePanel/CodePanel.jsx';
import { ACTIONS } from './codePanel/actions.js';
import { getRegion } from './codePanel/regions.js';
import { createGrid, placePattern, population, step, clearGrid, randomize, PATTERNS } from './engine/life.js';

const ROWS = 30;
const COLS = 30;
const TICK_MS = 200;

function startingGrid() {
  // An R-pentomino (5 cells that grow chaotically for a long time) plus a glider.
  let grid = createGrid(ROWS, COLS);
  grid = placePattern(grid, PATTERNS.rPentomino, 13, 14);
  grid = placePattern(grid, PATTERNS.glider, 3, 3);
  return grid;
}

let nextEntryId = 0;
function makeEntry(action, details = []) {
  const def = ACTIONS[action];
  return {
    id: nextEntryId++,
    time: new Date().toISOString(),
    status: def.status,
    details,
    note: def.note,
    region: getRegion(...def.region),
  };
}

export default function App() {
  const gridRef = useRef(null);
  if (gridRef.current === null) gridRef.current = startingGrid();
  const pausedRef = useRef(false);
  const generationRef = useRef(0);

  const [paused, setPaused] = useState(false);
  const [stats, setStats] = useState({ generation: 0, population: population(gridRef.current), fps: 0 });
  const [entry, setEntry] = useState(() => makeEntry('boot', ['Rule set : B3/S23 (standard Conway)', 'Topology : 30×30 torus']));

  const refreshStats = useCallback(() => {
    setStats((s) => ({ ...s, generation: generationRef.current, population: population(gridRef.current) }));
  }, []);

  // ---- Actions (used by both buttons and keyboard) --------------------------
  const togglePause = useCallback(() => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    setEntry(makeEntry(next ? 'pause' : 'resume', [`Loop state : ${next ? 'PAUSED' : 'RUNNING'}`]));
  }, []);

  const stepOnce = useCallback(() => {
    if (!pausedRef.current) return; // stepping only makes sense while paused
    gridRef.current = step(gridRef.current);
    generationRef.current++;
    refreshStats();
    setEntry(makeEntry('step', [`Generation : ${generationRef.current}`]));
  }, [refreshStats]);

  const reset = useCallback(() => {
    gridRef.current = clearGrid(gridRef.current);
    generationRef.current = 0;
    refreshStats();
    setEntry(makeEntry('reset', ['Live cells : 0', 'Tip        : click or drag on the grid to draw']));
  }, [refreshStats]);

  const seedRandom = useCallback(() => {
    gridRef.current = randomize(ROWS, COLS, 0.25);
    generationRef.current = 0;
    refreshStats();
    setEntry(makeEntry('random', [`Live cells : ${population(gridRef.current)} / ${ROWS * COLS}`]));
  }, [refreshStats]);

  // ---- Keyboard shortcuts ----------------------------------------------------
  useEffect(() => {
    function onKey(event) {
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      if (key === ' ') {
        event.preventDefault(); // stop the page from scrolling
        document.activeElement?.blur?.(); // stop a focused button from also firing
        togglePause();
      } else if (key === 'n') stepOnce();
      else if (key === 'r') reset();
      else if (key === 'g') seedRandom();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePause, stepOnce, reset, seedRandom]);

  // ---- Callbacks from the canvas --------------------------------------------
  const handleGeneration = useCallback(() => {
    generationRef.current++;
    refreshStats();
  }, [refreshStats]);

  const handlePaint = useCallback((stroke) => {
    refreshStats();
    setEntry(makeEntry('paint', [
      `Target cell : (row ${stroke.first.row}, col ${stroke.first.col})`,
      `Brush       : ${stroke.value ? 'ALIVE' : 'ERASE'} · ${stroke.count} cell${stroke.count === 1 ? '' : 's'}`,
    ]));
  }, [refreshStats]);

  const handleFps = useCallback((fps) => setStats((s) => ({ ...s, fps })), []);

  return (
    <div className="app">
      <CodePanel entry={entry} />

      <main className="stage">
        <div className="toolbar">
          <div className="buttons">
            <button onClick={togglePause}>{paused ? '▶ Play' : '❚❚ Pause'} <kbd>Space</kbd></button>
            <button onClick={stepOnce} disabled={!paused}>Step <kbd>N</kbd></button>
            <button onClick={seedRandom}>Random <kbd>G</kbd></button>
            <button onClick={reset} className="danger">Purge <kbd>R</kbd></button>
          </div>
          <div className="stats">
            <span>GEN <b>{stats.generation}</b></span>
            <span>POP <b>{stats.population}</b></span>
            <span>FPS <b>{stats.fps}</b></span>
            <span className={paused ? 'state paused' : 'state running'}>{paused ? 'PAUSED' : 'RUNNING'}</span>
          </div>
        </div>

        <GridCanvas
          gridRef={gridRef}
          pausedRef={pausedRef}
          tickMs={TICK_MS}
          onGeneration={handleGeneration}
          onPaint={handlePaint}
          onFps={handleFps}
        />

        <footer className="disclaimer">
          Unofficial fan-made project, not affiliated with or endorsed by HoYoverse. Honkai: Star Rail,
          Amphoreus and related names belong to HoYoverse. All artwork and code are original.
        </footer>
      </main>
    </div>
  );
}
