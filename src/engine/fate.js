// Answers "what happens to this board?" by simply running it.
// The fate predictor learns from these answers, and the genetic algorithm
// (later) uses `generations` as its score.

import { step, population, countNeighbours, isAlive } from './life.js';

// The three possible answers, in a fixed order. The ML model will output a
// number 0, 1 or 2, and this list turns that number back into a word.
export const FATES = ['dies', 'settles', 'active'];

// True when two grids have exactly the same live cells.
// Age is ignored: a block that is 10 generations old still looks the same.
export function sameCells(gridA, gridB) {
  for (let index = 0; index < gridA.alive.length; index++) {
    if (gridA.alive[index] !== gridB.alive[index]) {
      return false;
    }
  }
  return true;
}

// #region fate
// Runs the board for up to maxGens generations and reports what happened:
//   dies     every cell is dead
//   settles  the board repeats itself every 1 generation (still shapes, like a
//            block) or every 2 (blinkers). Longer cycles are counted as active.
//   active   still changing when we stop looking
// `generations` is how long it took to reach that answer.
export function fate(grid, maxGens) {
  let twoAgo = null; // the board 2 generations before `current`
  let previous = null; // the board 1 generation before `current`
  let current = grid;

  for (let generation = 0; generation <= maxGens; generation++) {
    if (population(current) === 0) {
      return { fate: 'dies', generations: generation };
    }
    const repeatsEvery1 = previous !== null && sameCells(current, previous);
    const repeatsEvery2 = twoAgo !== null && sameCells(current, twoAgo);
    if (repeatsEvery1 || repeatsEvery2) {
      return { fate: 'settles', generations: generation };
    }
    // Slide the window forward by one generation.
    twoAgo = previous;
    previous = current;
    current = step(current);
  }
  return { fate: 'active', generations: maxGens };
}
// #endregion

// ---- Prediction helpers ------------------------------------------------------
// The model was trained on 30×30 boards with this many generations per label.
// The dataset script and the browser both read these, so they can't disagree.
export const MODEL_ROWS = 30;
export const MODEL_COLS = 30;
export const MODEL_MAX_GENS = 300;

export const FEATURE_COUNT = 18;

// #region prediction
// A neural network only understands numbers, so the board becomes 18 of them:
//   features[k]      how many LIVE cells have exactly k live neighbours (k = 0..8)
//   features[9 + k]  how many DEAD cells have exactly k live neighbours
// These say how crowded the board is, not where things are, so a shape gets the
// same prediction wherever you draw it. They also hint at what happens next:
// live cells with 2 or 3 neighbours survive, dead cells with 3 are born.
// The dataset script calls this same function, so training and the browser agree.
export function boardFeatures(grid) {
  const features = new Float32Array(FEATURE_COUNT);
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const neighbours = countNeighbours(grid, row, col);
      if (isAlive(grid, row, col)) {
        features[neighbours]++;
      } else {
        features[9 + neighbours]++;
      }
    }
  }
  return features;
}

// The model answers with three probabilities, one per fate, in FATES order.
// The highest one is its guess; its size is how confident it is.
export function readPrediction(probabilities) {
  let best = 0;
  for (let index = 1; index < FATES.length; index++) {
    if (probabilities[index] > probabilities[best]) best = index;
  }
  return {
    fate: FATES[best],
    confidence: probabilities[best],
    probabilities: Object.fromEntries(FATES.map((name, index) => [name, probabilities[index]])),
  };
}
// #endregion
