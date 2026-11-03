import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeNodePositions } from './astrolabe.js';

// sin and cos give tiny rounding errors, so compare with a small tolerance.
const assertClose = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not ${expected}`);

test('no nodes gives no positions', () => {
  assert.deepEqual(computeNodePositions(0), []);
});

test('the first node is at the top of the circle', () => {
  const [first] = computeNodePositions(1, 40, 50);
  assertClose(first.x, 50);
  assertClose(first.y, 10);
});

test('four nodes land at the top, right, bottom and left, in that order', () => {
  const [top, right, bottom, left] = computeNodePositions(4, 40, 50);
  assertClose(top.x, 50); assertClose(top.y, 10);
  assertClose(right.x, 90); assertClose(right.y, 50);
  assertClose(bottom.x, 50); assertClose(bottom.y, 90);
  assertClose(left.x, 10); assertClose(left.y, 50);
});

test('every node is exactly one radius from the centre', () => {
  for (const { x, y } of computeNodePositions(7, 38, 50)) {
    assertClose(Math.hypot(x - 50, y - 50), 38);
  }
});

test('neighbouring nodes are evenly spaced', () => {
  const positions = computeNodePositions(5, 38, 50);
  const gap = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const firstGap = gap(positions[0], positions[1]);
  for (let index = 1; index < positions.length; index++) {
    assertClose(gap(positions[index], positions[(index + 1) % positions.length]), firstGap);
  }
});
