// The `// #region name` / `// #endregion` comments mark the snippets that the
// code panel displays. If you edit a function, the panel updates by itself.

// Standard Conway rules (B3/S23): born with 3 neighbours, survives with 2 or 3.
export const RULES = { birth: [3], survive: [2, 3] };

const MAX_AGE = 65535; // the largest number a Uint16Array can hold

// A grid stores its cells in two long arrays, one row after another.
// alive[index] is 1 or 0. age[index] is how many generations the cell survived.
export function createGrid(rows, cols) {
  return {
    rows: rows,
    cols: cols,
    alive: new Uint8Array(rows * cols),
    age: new Uint16Array(rows * cols),
  };
}

// Finds where a cell sits in the long arrays.
export function indexOf(grid, row, col) {
  return row * grid.cols + col;
}

export function isAlive(grid, row, col) {
  return grid.alive[indexOf(grid, row, col)] === 1;
}

// Returns a copy of the grid with one cell changed. Its age resets to 0.
export function setCell(grid, row, col, alive) {
  const nextGrid = copyGrid(grid);
  const index = indexOf(nextGrid, row, col);
  if (alive) {
    nextGrid.alive[index] = 1;
  } else {
    nextGrid.alive[index] = 0;
  }
  nextGrid.age[index] = 0;
  return nextGrid;
}

export function copyGrid(grid) {
  return {
    rows: grid.rows,
    cols: grid.cols,
    alive: grid.alive.slice(),
    age: grid.age.slice(),
  };
}

// Counts the live cells on the whole board.
export function population(grid) {
  let total = 0;
  for (let index = 0; index < grid.alive.length; index++) {
    total = total + grid.alive[index];
  }
  return total;
}

// #region neighbours
export function countNeighbours(grid, row, col) {
  let count = 0;
  for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
    for (let colOffset = -1; colOffset <= 1; colOffset++) {
      const isSameCell = rowOffset === 0 && colOffset === 0;
      if (!isSameCell) {
        // % wraps around the edges: row -1 becomes the last row.
        const neighbourRow = (row + rowOffset + grid.rows) % grid.rows;
        const neighbourCol = (col + colOffset + grid.cols) % grid.cols;
        if (isAlive(grid, neighbourRow, neighbourCol)) {
          count++;
        }
      }
    }
  }
  return count;
}
// #endregion

// #region step
export function step(grid) {
  // Write into a new grid, so every cell is judged on the same snapshot.
  const nextGrid = createGrid(grid.rows, grid.cols);
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const index = indexOf(grid, row, col);
      const count = countNeighbours(grid, row, col);
      if (isAlive(grid, row, col)) {
        if (RULES.survive.includes(count)) {
          nextGrid.alive[index] = 1;
          nextGrid.age[index] = Math.min(grid.age[index] + 1, MAX_AGE);
        }
      } else {
        if (RULES.birth.includes(count)) {
          nextGrid.alive[index] = 1; // a newborn keeps age 0
        }
      }
    }
  }
  return nextGrid;
}
// #endregion

// #region clear
export function clearGrid(grid) {
  // "Purge": a brand-new grid of the same size, every cell dead, age 0.
  return createGrid(grid.rows, grid.cols);
}
// #endregion

// #region randomize
export function randomize(rows, cols, density) {
  const grid = createGrid(rows, cols);
  for (let index = 0; index < grid.alive.length; index++) {
    // Each cell has a `density` chance of starting alive (0.25 means 25%).
    if (Math.random() < density) {
      grid.alive[index] = 1;
    }
  }
  return grid;
}
// #endregion

// Stamps a shape onto a copy of the grid, with its corner at (top, left).
export function placePattern(grid, pattern, top, left) {
  const nextGrid = copyGrid(grid);
  for (let cell = 0; cell < pattern.length; cell++) {
    const rowOffset = pattern[cell][0];
    const colOffset = pattern[cell][1];
    const row = (top + rowOffset + grid.rows) % grid.rows;
    const col = (left + colOffset + grid.cols) % grid.cols;
    nextGrid.alive[indexOf(grid, row, col)] = 1;
  }
  return nextGrid;
}

// Well-known shapes, each a list of [row, col] positions from its corner.
export const PATTERNS = {
  glider: [[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
  rPentomino: [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]],
  blinker: [[0, 0], [0, 1], [0, 2]],
  block: [[0, 0], [0, 1], [1, 0], [1, 1]],
};
