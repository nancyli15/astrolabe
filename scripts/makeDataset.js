// Generates the fate predictor's training data with our own engine.
//
//   node scripts/makeDataset.js [count] [seed]      (defaults: 80000 boards, seed 42)
//
// This runs in Node, not the browser. It can import the engine directly because
// src/engine/ is pure JavaScript with no screen code: the same functions that
// draw the live site also label the dataset.
//
// Output, in ml/data/ (ignored by git, because it's big and can be made again):
//   boards.bin       count × 900 bytes, one byte (0 or 1) per cell, row after row
//   features.bin     count × 18 float32s, from boardFeatures(): what the model reads
//   labels.bin       count bytes, the index of the fate in FATES (0 dies, 1 settles, 2 active)
//   generations.bin  count × 2 bytes, how many generations it took to reach that fate
//   meta.json        the settings used and how many boards got each fate
import { mkdirSync, writeFileSync } from 'node:fs';
import { makeExample } from '../src/engine/dataset.js';
import {
  boardFeatures, FATES, FEATURE_COUNT, MODEL_COLS, MODEL_MAX_GENS, MODEL_ROWS,
} from '../src/engine/fate.js';
import { createRng } from '../src/engine/random.js';

const count = Number(process.argv[2] ?? 80000);
const seed = Number(process.argv[3] ?? 42);
if (!Number.isInteger(count) || count <= 0 || !Number.isInteger(seed)) {
  console.error('usage: node scripts/makeDataset.js [count] [seed]');
  process.exit(1);
}

const cells = MODEL_ROWS * MODEL_COLS;
const boards = new Uint8Array(count * cells);
const features = new Float32Array(count * FEATURE_COUNT);
const labels = new Uint8Array(count);
const generations = new Uint16Array(count);
const totals = Object.fromEntries(FATES.map((name) => [name, 0]));

const rng = createRng(seed);
const started = Date.now();
for (let example = 0; example < count; example++) {
  const { grid, fate, generations: gens } = makeExample(MODEL_ROWS, MODEL_COLS, MODEL_MAX_GENS, rng);
  boards.set(grid.alive, example * cells); // copy the 900 cells into their slot
  features.set(boardFeatures(grid), example * FEATURE_COUNT);
  labels[example] = FATES.indexOf(fate);
  generations[example] = gens;
  totals[fate]++;
  if ((example + 1) % 10000 === 0) console.log(`  ${example + 1} / ${count} boards`);
}
const seconds = (Date.now() - started) / 1000;

const outDir = new URL('../ml/data/', import.meta.url);
mkdirSync(outDir, { recursive: true });
writeFileSync(new URL('boards.bin', outDir), boards);
writeFileSync(new URL('features.bin', outDir), new Uint8Array(features.buffer));
writeFileSync(new URL('labels.bin', outDir), labels);
writeFileSync(new URL('generations.bin', outDir), new Uint8Array(generations.buffer));
writeFileSync(new URL('meta.json', outDir), JSON.stringify({
  count, seed, rows: MODEL_ROWS, cols: MODEL_COLS, maxGens: MODEL_MAX_GENS, featureCount: FEATURE_COUNT,
  fates: FATES, totals, seconds,
}, null, 2));

console.log(`Made ${count} boards in ${seconds.toFixed(1)} s`);
for (const name of FATES) {
  console.log(`  ${name.padEnd(8)} ${totals[name]}  (${((100 * totals[name]) / count).toFixed(1)}%)`);
}
