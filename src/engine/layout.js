// Where the grid sits on screen, and how a click finds its cell.
// Drawing and clicking both use this layout, so they can never disagree.

const MARGIN = 0.12; // leave 12% empty on each side, for the frame artwork

// #region layout
export function computeGridLayout(width, height, rows, cols) {
  const shorterSide = Math.min(width, height);
  const usableSize = shorterSide * (1 - 2 * MARGIN);
  const largerGridSide = Math.max(rows, cols);

  // Whole-pixel cells keep the squares crisp. A cell is never under 1 pixel.
  const cellSize = Math.max(1, Math.floor(usableSize / largerGridSide));

  const gridWidth = cellSize * cols;
  const gridHeight = cellSize * rows;

  // Split the leftover space evenly on both sides, which centres the grid.
  const originX = Math.floor((width - gridWidth) / 2);
  const originY = Math.floor((height - gridHeight) / 2);

  return {
    cellSize: cellSize,
    originX: originX,
    originY: originY,
    width: gridWidth,
    height: gridHeight,
  };
}
// #endregion

// #region screenToCell
export function screenToCell(x, y, layout, rows, cols) {
  // Measure the click from the grid's top-left corner, not the canvas's.
  const xInsideGrid = x - layout.originX;
  const yInsideGrid = y - layout.originY;

  // Divide by the cell size and round down to get the row and column.
  const col = Math.floor(xInsideGrid / layout.cellSize);
  const row = Math.floor(yInsideGrid / layout.cellSize);

  // A click outside the grid doesn't match any cell.
  if (row < 0 || row >= rows || col < 0 || col >= cols) {
    return null;
  }
  return { row: row, col: col };
}
// #endregion
