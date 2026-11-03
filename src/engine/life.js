// ---------------------------------------------------------------------------
// life.js — the "Eternal Recurrence" engine.
//
// This file is pure logic: no canvas, no React, no DOM. Data goes in, data
// comes out. Keeping it separate means:
//   1. we can unit-test it with `npm test` (see life.test.js), and
//   2. the code panel on the left can show these exact functions to visitors.
//
// The `// #region name` / `// #endregion` comments mark the snippets that the
// code panel displays. If you edit a function, the panel updates by itself.
// ---------------------------------------------------------------------------

/** Standard Conway rules (B3/S23): born with 3 neighbours, survives with 2 or 3. */
export const CONWAY = { birth: [3], survive: [2, 3] };

/**
 * A grid is stored as two flat typed arrays instead of an array of objects.
 * Cell (row, col) lives at index row * cols + col.
 *   alive[i] → 1 or 0
 *   age[i]   → how many generations the cell has survived (used for colour)
 */
export function createGrid(rows, cols) {
  return {
    rows,
    cols,
    alive: new Uint8Array(rows * cols),
    age: new Uint16Array(rows * cols),
  };
}

export function indexOf(grid, row, col) {
  return row * grid.cols + col;
}

export function isAlive(grid, row, col) {
  return grid.alive[indexOf(grid, row, col)] === 1;
}

/** Returns a copy of the grid with one cell set alive/dead (age reset to 0). */
export function setCell(grid, row, col, alive) {
  const next = copyGrid(grid);
  const i = indexOf(next, row, col);
  next.alive[i] = alive ? 1 : 0;
  next.age[i] = 0;
  return next;
}

export function copyGrid(grid) {
  return {
    rows: grid.rows,
    cols: grid.cols,
    alive: grid.alive.slice(),
    age: grid.age.slice(),
  };
}

export function population(grid) {
  let total = 0;
  for (let i = 0; i < grid.alive.length; i++) total += grid.alive[i];
  return total;
}

// #region neighbours
export function countNeighbours(grid, row, col) {
  const { rows, cols, alive } = grid;
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue; // skip the cell itself
      // Wrap around the edges: row -1 becomes the last row, and a row
      // past the bottom becomes row 0. The board behaves like a donut (torus).
      const r = (row + dr + rows) % rows;
      const c = (col + dc + cols) % cols;
      count += alive[r * cols + c];
    }
  }
  return count;
}
// #endregion

// #region step
export function step(grid, rule = CONWAY) {
  // Build the next generation in a NEW grid, so every cell is judged
  // against the same snapshot of the current one.
  const next = createGrid(grid.rows, grid.cols);
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const i = row * grid.cols + col;
      const n = countNeighbours(grid, row, col);
      if (grid.alive[i]) {
        if (rule.survive.includes(n)) {
          next.alive[i] = 1;
          next.age[i] = Math.min(grid.age[i] + 1, 65535); // survived: one gen older
        }
      } else if (rule.birth.includes(n)) {
        next.alive[i] = 1; // newborn, age 0
      }
    }
  }
  return next;
}
// #endregion

// #region clear
export function clearGrid(grid) {
  // "Purge": a brand-new grid of the same size, every cell dead, age 0.
  return createGrid(grid.rows, grid.cols);
}
// #endregion

// #region randomize
export function randomize(rows, cols, density = 0.25, random = Math.random) {
  const grid = createGrid(rows, cols);
  for (let i = 0; i < grid.alive.length; i++) {
    // Each cell independently has a `density` chance of starting alive.
    grid.alive[i] = random() < density ? 1 : 0;
  }
  return grid;
}
// #endregion

/** Stamp a pattern (list of [row, col] offsets) onto a copy of the grid. */
export function placePattern(grid, pattern, top, left) {
  const next = copyGrid(grid);
  for (const [dr, dc] of pattern) {
    const r = (top + dr + grid.rows) % grid.rows;
    const c = (left + dc + grid.cols) % grid.cols;
    next.alive[r * grid.cols + c] = 1;
  }
  return next;
}

// A few classic, public-domain patterns.
export const PATTERNS = {
  glider: [[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
  rPentomino: [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]],
  blinker: [[0, 0], [0, 1], [0, 2]],
  block: [[0, 0], [0, 1], [1, 0], [1, 1]],
};
