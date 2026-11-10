// Makes the training examples for the fate predictor.
//
// The engine labels its own data: draw a random board, run it with fate(), and
// the answer is the label. No downloading, no labelling by hand.

import { createGrid, indexOf } from './life.js';
import { fate } from './fate.js';
import { randomInt } from './random.js';

// #region randomPatch
// A square patch of random cells somewhere on the board, like something a person
// might draw. Full-board noise is almost always "settles" or "active", so mixing
// patch sizes from tiny to full-board gives the model all three fates to learn.
export function randomPatchBoard(rows, cols, rng) {
  const grid = createGrid(rows, cols);
  const size = randomInt(rng, 3, Math.min(rows, cols));
  const density = 0.2 + rng() * 0.4; // 20% to 60% of the patch starts alive
  const top = randomInt(rng, 0, rows - 1);
  const left = randomInt(rng, 0, cols - 1);
  for (let rowOffset = 0; rowOffset < size; rowOffset++) {
    for (let colOffset = 0; colOffset < size; colOffset++) {
      if (rng() < density) {
        // % wraps the patch around the edges, the same way the board does.
        const row = (top + rowOffset) % rows;
        const col = (left + colOffset) % cols;
        grid.alive[indexOf(grid, row, col)] = 1;
      }
    }
  }
  return grid;
}
// #endregion

// One labelled example: the starting board, and what the engine says happens to it.
export function makeExample(rows, cols, maxGens, rng) {
  const grid = randomPatchBoard(rows, cols, rng);
  const result = fate(grid, maxGens);
  return { grid, fate: result.fate, generations: result.generations };
}
