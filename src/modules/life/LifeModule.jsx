// ---------------------------------------------------------------------------
// LifeModule — the "Eternal Recurrence" module: Conway's Game of Life.
//
// Everything specific to this one module lives here: its board, buttons,
// keyboard shortcuts and stats. App.jsx only provides the page around it, and
// that separation is what lets the astrolabe switch between modules.
//
// Data flow: the grid lives in `gridRef`. Buttons/keys replace it; GridCanvas
// reads it every frame and reports back (generation ticks, paint strokes, FPS).
// Each user action also calls `log`, which App turns into a code panel entry.
// It also hands App a set of controls, which is how terminal commands reach it.
// ---------------------------------------------------------------------------
import { useCallback, useEffect, useRef, useState } from 'react';
import GridCanvas from '../../components/GridCanvas.jsx';
import { createGrid, placePattern, population, step, clearGrid, randomize, PATTERNS } from '../../engine/life.js';

const ROWS = 30;
const COLS = 30;
const TICK_MS = 200;

function startingGrid(seed) {
  if (seed === 'random') return randomize(ROWS, COLS, 0.25);
  // A seed from `./life --seed <name>` goes in the middle of an empty board.
  if (seed) return placePattern(createGrid(ROWS, COLS), PATTERNS[seed], ROWS / 2 - 1, COLS / 2 - 1);

  // By default: an R-pentomino (5 cells that grow chaotically for a long time) plus a glider.
  let grid = createGrid(ROWS, COLS);
  grid = placePattern(grid, PATTERNS.rPentomino, 13, 14);
  grid = placePattern(grid, PATTERNS.glider, 3, 3);
  return grid;
}

export default function LifeModule({ log, shortcutsEnabled, registerControls, seed }) {
  const gridRef = useRef(null);
  if (gridRef.current === null) gridRef.current = startingGrid(seed);
  const pausedRef = useRef(false);
  const generationRef = useRef(0);

  const [paused, setPaused] = useState(false);
  const [stats, setStats] = useState({ generation: 0, population: population(gridRef.current), fps: 0 });

  const refreshStats = useCallback(() => {
    setStats((s) => ({ ...s, generation: generationRef.current, population: population(gridRef.current) }));
  }, []);

  // ---- Actions (used by both buttons and keyboard) --------------------------
  const togglePause = useCallback(() => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    log(next ? 'pause' : 'resume', [`Loop state : ${next ? 'PAUSED' : 'RUNNING'}`]);
  }, [log]);

  const stepOnce = useCallback(() => {
    if (!pausedRef.current) return; // stepping only makes sense while paused
    gridRef.current = step(gridRef.current);
    generationRef.current++;
    refreshStats();
    log('step', [`Generation : ${generationRef.current}`]);
  }, [refreshStats, log]);

  const reset = useCallback(() => {
    gridRef.current = clearGrid(gridRef.current);
    generationRef.current = 0;
    refreshStats();
    log('reset', ['Live cells : 0', 'Tip        : click or drag on the grid to draw']);
  }, [refreshStats, log]);

  const seedRandom = useCallback(() => {
    gridRef.current = randomize(ROWS, COLS, 0.25);
    generationRef.current = 0;
    refreshStats();
    log('random', [`Live cells : ${population(gridRef.current)} / ${ROWS * COLS}`]);
  }, [refreshStats, log]);

  // ---- Controls for terminal commands ---------------------------------------
  // #region registerControls
  // Hand App the same actions the buttons use, so `pause` in the terminal and the
  // Pause button run identical code. They're taken back when this module stops.
  useEffect(() => {
    registerControls({
      status: () => ({
        paused: pausedRef.current,
        generation: generationRef.current,
        population: population(gridRef.current),
      }),
      pause: () => { if (!pausedRef.current) togglePause(); },
      resume: () => { if (pausedRef.current) togglePause(); },
      step: stepOnce,
    });
    return () => registerControls(null);
  }, [registerControls, togglePause, stepOnce]);
  // #endregion

  // ---- Keyboard shortcuts ----------------------------------------------------
  useEffect(() => {
    // Off while the astrolabe menu covers this module.
    if (!shortcutsEnabled) return undefined;

    function onKey(event) {
      // Letters typed into the terminal are just letters, not shortcuts.
      if (event.target.tagName === 'INPUT') return;
      // Leave browser shortcuts like Cmd+R alone.
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
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
  }, [shortcutsEnabled, togglePause, stepOnce, reset, seedRandom]);

  // ---- Callbacks from the canvas --------------------------------------------
  const handleGeneration = useCallback(() => {
    generationRef.current++;
    refreshStats();
  }, [refreshStats]);

  const handlePaint = useCallback((stroke) => {
    refreshStats();
    log('paint', [
      `Target cell : (row ${stroke.first.row}, col ${stroke.first.col})`,
      `Brush       : ${stroke.value ? 'ALIVE' : 'ERASE'} · ${stroke.count} cell${stroke.count === 1 ? '' : 's'}`,
    ]);
  }, [refreshStats, log]);

  const handleFps = useCallback((fps) => setStats((s) => ({ ...s, fps })), []);

  // <> ... </> groups these without adding a wrapper element to the page, so
  // the toolbar and canvas are laid out directly inside App's .module-area.
  return (
    <>
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
    </>
  );
}
