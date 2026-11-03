import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeGridLayout, screenToCell } from './layout.js';

test('grid is centred and fits inside the canvas', () => {
  const L = computeGridLayout(800, 600, 30, 30);
  assert.ok(L.width <= 800 && L.height <= 600);
  assert.equal(L.originX, Math.floor((800 - L.width) / 2));
  assert.equal(L.originY, Math.floor((600 - L.height) / 2));
});

test('clicking the centre of a cell finds that cell', () => {
  const L = computeGridLayout(800, 600, 30, 30);
  const half = L.cellSize / 2;
  for (const [row, col] of [[0, 0], [29, 29], [12, 7]]) {
    const x = L.originX + col * L.cellSize + half;
    const y = L.originY + row * L.cellSize + half;
    assert.deepEqual(screenToCell(x, y, L, 30, 30), { row, col });
  }
});

test('clicks outside the grid return null', () => {
  const L = computeGridLayout(800, 600, 30, 30);
  assert.equal(screenToCell(L.originX - 1, L.originY + 5, L, 30, 30), null);
  assert.equal(screenToCell(L.originX + L.width, L.originY + 5, L, 30, 30), null);
});
