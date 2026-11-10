// ---------------------------------------------------------------------------
// actions.js — what the left panel says for each thing the user can do.
//
// Each action points at a code region (see regions.js) and has a short
// plain-English note. This is the "content" of the self-documenting panel:
// to document a new feature later, add an entry here.
// ---------------------------------------------------------------------------
export const ACTIONS = {
  boot: {
    status: 'SYSTEM ONLINE · ETERNAL RECURRENCE RUNNING',
    details: ['Rule set : B3/S23 (standard Conway)', 'Topology : 30×30 torus'],
    region: ['src/engine/life.js', 'step'],
    note:
      'Every 200 ms the engine computes the next generation. A dead cell with exactly 3 live ' +
      'neighbours is born; a live cell with 2 or 3 survives; every other cell dies or stays dead. ' +
      'The new generation is written into a separate grid so each cell is judged on the same snapshot.',
  },
  paint: {
    status: 'MANUAL SEED INJECTED',
    region: ['src/engine/layout.js', 'screenToCell'],
    note:
      'Your click arrives in screen pixels. Subtract where the grid starts, divide by the cell size, ' +
      'round down: that turns a pixel position into a (row, col) index. Drawing uses the same layout ' +
      'function, so what you click is always what lights up.',
  },
  pause: {
    status: 'CONTROLLED INTERRUPT · LOOP PAUSED',
    region: ['src/components/GridCanvas.jsx', 'loop'],
    note:
      'Two clocks run in one loop. The render clock redraws every animation frame (about 60 per second), ' +
      'even while paused, so your edits appear instantly. The simulation clock only advances when ' +
      'not paused, one generation per 200 ms.',
  },
  resume: {
    status: 'RUNTIME RESUMED',
    region: ['src/components/GridCanvas.jsx', 'loop'],
    note:
      'Resuming just flips the paused flag. The loop collects elapsed time and runs a generation each ' +
      'time 200 ms has built up, so the speed stays the same on 60 Hz and 144 Hz screens.',
  },
  step: {
    status: 'SINGLE GENERATION EXECUTED',
    region: ['src/engine/life.js', 'neighbours'],
    note:
      'Each cell looks at its 8 neighbours. The modulo (%) makes the edges wrap around: a cell on the ' +
      'right edge sees the left edge as its neighbour, so the board behaves like the surface of a donut.',
  },
  reset: {
    status: 'MATRIX PURGE COMPLETE',
    region: ['src/engine/life.js', 'clear'],
    note:
      'Purging swaps in a fresh grid of the same size. Because the engine never edits a grid in place, ' +
      'resetting is just replacing one value.',
  },
  random: {
    status: 'RANDOM SEED DISTRIBUTED',
    region: ['src/engine/life.js', 'randomize'],
    note:
      'Each cell gets an independent 25% chance of starting alive. Most random boards settle into still ' +
      'blocks and blinking oscillators within a few hundred generations.',
  },
  predict: {
    status: 'FATE PREDICTION · MODEL vs ENGINE',
    region: ['src/modules/life/fatePredictor.js', 'predict'],
    note:
      'A small neural network, trained on 80,000 boards labelled by this engine, guesses whether the board ' +
      'dies, settles or stays active within 300 generations. It sees 18 numbers, not the picture: how many ' +
      'live and dead cells have 0 to 8 neighbours. Then the real engine runs the board to check. The guess ' +
      'is often wrong: long-term fate is close to chaotic, and the model beats "always guess settles" by ' +
      'only a few points (see ml/results.json).',
  },
};
