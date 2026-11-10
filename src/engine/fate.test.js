// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGrid, placePattern, setCell, step, PATTERNS } from './life.js';
import {
  boardFeatures, fate, readPrediction, sameCells, FEATURE_COUNT, MODEL_COLS, MODEL_ROWS,
} from './fate.js';

const MAX_GENS = 300;
const board = () => createGrid(MODEL_ROWS, MODEL_COLS);
const withPattern = (name) => placePattern(board(), PATTERNS[name], 14, 14);

test('an empty board dies at generation 0', () => {
  assert.deepEqual(fate(board(), MAX_GENS), { fate: 'dies', generations: 0 });
});

test('a lonely cell dies after one generation (it has no neighbours)', () => {
  const lonely = setCell(board(), 5, 5, true);
  assert.deepEqual(fate(lonely, MAX_GENS), { fate: 'dies', generations: 1 });
});

test('a block settles: it matches itself one generation later', () => {
  assert.deepEqual(fate(withPattern('block'), MAX_GENS), { fate: 'settles', generations: 1 });
});

test('a blinker settles: it matches itself two generations later', () => {
  assert.deepEqual(fate(withPattern('blinker'), MAX_GENS), { fate: 'settles', generations: 2 });
});

test('a glider is still active when we stop looking', () => {
  assert.deepEqual(fate(withPattern('glider'), MAX_GENS), { fate: 'active', generations: MAX_GENS });
});

test('a smaller maxGens stops earlier', () => {
  assert.deepEqual(fate(withPattern('glider'), 10), { fate: 'active', generations: 10 });
});

test('sameCells ignores age', () => {
  const young = withPattern('block');
  const old = step(step(young)); // same cells, but each one is 2 generations older
  assert.notDeepEqual(old.age, young.age);
  assert.equal(sameCells(young, old), true);
  assert.equal(sameCells(young, setCell(young, 0, 0, true)), false);
});

test('boardFeatures counts live and dead cells by how many neighbours they have', () => {
  const features = boardFeatures(withPattern('block'));
  assert.equal(features.length, FEATURE_COUNT);
  assert.equal(features[3], 4); // all 4 block cells have 3 live neighbours
  const total = features.reduce((sum, value) => sum + value, 0);
  assert.equal(total, MODEL_ROWS * MODEL_COLS); // every cell is counted exactly once
});

test('boardFeatures does not depend on where a shape is drawn', () => {
  const here = placePattern(board(), PATTERNS.glider, 2, 2);
  const there = placePattern(board(), PATTERNS.glider, 20, 25);
  assert.deepEqual(boardFeatures(here), boardFeatures(there));
});

test('readPrediction picks the most likely fate', () => {
  const prediction = readPrediction([0.1, 0.2, 0.7]);
  assert.equal(prediction.fate, 'active');
  assert.equal(prediction.confidence, 0.7);
  assert.deepEqual(prediction.probabilities, { dies: 0.1, settles: 0.2, active: 0.7 });
});
