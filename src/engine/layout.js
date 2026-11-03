// ---------------------------------------------------------------------------
// layout.js — where the grid sits on screen, and how a click finds its cell.
//
// The SAME layout function is used for drawing and for clicking. That way the
// two can never disagree (e.g. you click one square and a different one lights
// up) — even after the window is resized.
// ---------------------------------------------------------------------------

// #region layout
export function computeGridLayout(width, height, rows, cols, margin = 0.12) {
  // Leave a margin around the grid (room for the frame artwork).
  const usable = Math.min(width, height) * (1 - 2 * margin);
  // Whole-pixel cells keep the squares crisp instead of blurry.
  const cellSize = Math.max(1, Math.floor(usable / Math.max(rows, cols)));
  const gridWidth = cellSize * cols;
  const gridHeight = cellSize * rows;
  return {
    cellSize,
    originX: Math.floor((width - gridWidth) / 2), // centred horizontally
    originY: Math.floor((height - gridHeight) / 2), // centred vertically
    width: gridWidth,
    height: gridHeight,
  };
}
// #endregion

// #region screenToCell
export function screenToCell(x, y, layout, rows, cols) {
  // 1. Move from canvas coordinates to grid coordinates.
  const localX = x - layout.originX;
  const localY = y - layout.originY;
  // 2. Divide by the cell size and round down to get the index.
  const col = Math.floor(localX / layout.cellSize);
  const row = Math.floor(localY / layout.cellSize);
  // 3. Clicks outside the grid don't map to any cell.
  if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
  return { row, col };
}
// #endregion
