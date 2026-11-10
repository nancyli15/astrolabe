// A tiny random number generator you can seed.
//
// Math.random() gives different numbers every run, so a dataset made with it can
// never be made again exactly. createRng(42) always produces the same sequence,
// so `node scripts/makeDataset.js` gives the same boards every time, and tests
// that use randomness get the same answer every run.
//
// The algorithm is "mulberry32": a few multiplications and bit shifts that scramble
// a 32-bit number. It's not good enough for passwords, but fine for simulations.
export function createRng(seed) {
  let state = seed >>> 0; // >>> 0 keeps it a whole number from 0 to 2^32 - 1
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // a number from 0 up to (not including) 1
  };
}

// A whole number from min to max, both included.
export function randomInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}
