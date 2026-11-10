// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { population } from './life.js';
import { fate, FATES } from './fate.js';
import { makeExample, randomPatchBoard } from './dataset.js';
import { createRng, randomInt } from './random.js';

test('the same seed gives the same random numbers', () => {
  const a = createRng(42);
  const b = createRng(42);
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
  assert.notEqual(createRng(1)(), createRng(2)());
});

test('random numbers stay in range', () => {
  const rng = createRng(7);
  for (let i = 0; i < 1000; i++) {
    const value = rng();
    assert.ok(value >= 0 && value < 1);
    const whole = randomInt(rng, 3, 5);
    assert.ok(Number.isInteger(whole) && whole >= 3 && whole <= 5);
  }
});

test('the same seed gives the same boards, so the dataset can be made again', () => {
  const a = randomPatchBoard(30, 30, createRng(42));
  const b = randomPatchBoard(30, 30, createRng(42));
  assert.deepEqual(a.alive, b.alive);
});

test('a random patch never fills more than the board', () => {
  const rng = createRng(3);
  for (let i = 0; i < 50; i++) {
    const grid = randomPatchBoard(30, 30, rng);
    assert.ok(population(grid) <= 900);
  }
});

test("an example's label is what the engine says", () => {
  const example = makeExample(30, 30, 100, createRng(5));
  assert.ok(FATES.includes(example.fate));
  assert.deepEqual(fate(example.grid, 100), { fate: example.fate, generations: example.generations });
});
