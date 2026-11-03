// Run with: npm test   (uses Node's built-in test runner — no extra installs)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGrid, step, placePattern, population, isAlive, setCell,
  clearGrid, randomize, countNeighbours, inspectCell, PATTERNS,
} from './life.js';

const aliveCells = (grid) => {
  const cells = [];
  for (let r = 0; r < grid.rows; r++)
    for (let c = 0; c < grid.cols; c++) if (isAlive(grid, r, c)) cells.push(`${r},${c}`);
  return cells.sort();
};

test('a block is a still life (never changes)', () => {
  const g = placePattern(createGrid(10, 10), PATTERNS.block, 4, 4);
  assert.deepEqual(aliveCells(step(g)), aliveCells(g));
});

test('a blinker flips between horizontal and vertical (period 2)', () => {
  const g0 = placePattern(createGrid(10, 10), PATTERNS.blinker, 5, 4); // horizontal
  const g1 = step(g0);
  assert.deepEqual(aliveCells(g1), ['4,5', '5,5', '6,5']); // vertical
  assert.deepEqual(aliveCells(step(g1)), aliveCells(g0)); // back again
});

test('neighbours wrap around the edges (torus)', () => {
  let g = createGrid(5, 5);
  g = setCell(g, 4, 4, true); // bottom-right corner
  assert.equal(countNeighbours(g, 0, 0), 1); // top-left sees it diagonally
});

test('a glider travels across the edge and returns home after 4 * size generations', () => {
  const size = 30;
  const start = placePattern(createGrid(size, size), PATTERNS.glider, 2, 2);
  let g = start;
  for (let i = 0; i < 4 * size; i++) g = step(g);
  assert.deepEqual(aliveCells(g), aliveCells(start));
});

test('surviving cells age, newborn cells start at 0', () => {
  const g1 = step(placePattern(createGrid(10, 10), PATTERNS.blinker, 5, 4));
  assert.equal(g1.age[5 * 10 + 5], 1); // centre cell survived
  assert.equal(g1.age[4 * 10 + 5], 0); // newborn
});

test('clearGrid empties everything; randomize respects density', () => {
  const full = randomize(30, 30, 1);
  assert.equal(population(full), 900);
  assert.equal(population(clearGrid(full)), 0);
  assert.equal(population(randomize(30, 30, 0)), 0);
});

test('step does not modify the grid it was given', () => {
  const g = placePattern(createGrid(10, 10), PATTERNS.blinker, 5, 4);
  const before = aliveCells(g);
  step(g);
  assert.deepEqual(aliveCells(g), before);
});

test('inspectCell reports a dead cell about to be born', () => {
  const g = placePattern(createGrid(10, 10), PATTERNS.blinker, 5, 4); // cells (5,4) (5,5) (5,6)
  const info = inspectCell(g, 4, 5); // dead, directly above the middle
  assert.equal(info.alive, false);
  assert.equal(info.neighbours, 3);
  assert.equal(info.aliveNext, true);
});

test('inspectCell reports a live cell about to die, and its age', () => {
  const g = step(placePattern(createGrid(10, 10), PATTERNS.blinker, 5, 4)); // now vertical
  const middle = inspectCell(g, 5, 5); // survived once, 2 neighbours
  assert.deepEqual([middle.alive, middle.age, middle.neighbours, middle.aliveNext], [true, 1, 2, true]);
  const end = inspectCell(g, 4, 5); // newborn, only 1 neighbour
  assert.deepEqual([end.alive, end.age, end.neighbours, end.aliveNext], [true, 0, 1, false]);
});

test('inspectCell always agrees with what step actually does', () => {
  const g = randomize(20, 20, 0.3);
  const next = step(g);
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 20; col++) {
      assert.equal(inspectCell(g, row, col).aliveNext, isAlive(next, row, col));
    }
  }
});
