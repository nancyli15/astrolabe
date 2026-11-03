# CLAUDE.md: project context for Claude Code

Claude reads this file automatically at the start of every session in this folder. Keep it up to date when decisions change.

## Who I am and how to help me

- University student (Western/UWO) learning software engineering. I'm still a **beginner** at React, canvas and project structure, so don't assume background knowledge.
- I'm building this as a **resume portfolio project**. I need to be able to explain every part in an interview, so:
  - When you add or change something, explain **why** it works and how it connects to the rest of the app, using intuition or a short story, not just definitions.
  - Prefer small steps I can follow over big rewrites. After each step, tell me how to run or see it.
  - Don't inflate resume claims. Every README/resume bullet must be true and checkable in the code (no "60 FPS benchmark" unless measured, no buzzwords for simple operations).
- I took CS2211 (C, Unix/Linux shell basics). I'm comfortable with Linux commands conceptually.

## What the project is

**Amphoreus Astrolabe**: an interactive, self-documenting developer-dashboard web app themed around Amphoreus (Honkai: Star Rail). Left pane: a terminal-style panel that shows the **real source code** behind whatever the user just did. Right pane: an interactive canvas.

Currently live: Conway's Game of Life ("Eternal Recurrence" module).

## Tech stack

- React 19 + Vite 7, plain JavaScript (no TypeScript yet)
- HTML5 Canvas 2D for graphics (no game engine, no Three.js)
- Tests: Node's built-in test runner (`npm test`, files `*.test.js`)
- Hosting: Vercel (free), auto-deploys from GitHub

## Architecture rules (keep these)

1. **Engine/renderer split.** Logic lives in `src/engine/` as pure functions (data in, new data out, no DOM). Rendering lives in components. New modules follow the same pattern, so their logic is unit-testable.
2. **Grid in a ref, not React state.** Fast-changing simulation data lives in `useRef`; React state is only for UI (buttons, stats, panel entry).
3. **One loop, two clocks** (`GridCanvas.jsx`): `requestAnimationFrame` redraws every frame; a time accumulator advances the simulation every `TICK_MS` only when not paused (capped at 5 ticks so backgrounded tabs don't burst).
4. **Shared layout function.** Drawing and click-mapping both use `computeGridLayout()`, so they can't disagree.
5. **Self-documenting panel.** Code shown in the left panel is extracted at build time from the real source using `// #region name` … `// #endregion` markers (`src/codePanel/regions.js`, via Vite `?raw` imports). To document a new action: add a region marker in the source and an entry in `src/codePanel/actions.js`. **Never paste copies of code into the panel content.**
6. Optional artwork loads from `public/assets/`; code must always work without it (draw placeholders in code). See `ASSETS.md`.

## Important constraints

- **Academic integrity:** this began from a CS2211 C assignment (Game of Life). The web version must NOT reuse the assignment's specifics: no B36/S23 "birth on 3 or 6" rule, no assignment starting pattern, no copied structure. Use standard Conway **B3/S23**. Never paste assignment code into this repo.
- **HoYoverse fan-content rules:** non-commercial only (no ads, donation links, paywalls); keep the footer disclaimer; no ripped/datamined game assets or official API data; all art is my own (Clip Studio Paint line art). Lore text should be short and original, not copied from the game.

## Roadmap (ship and deploy after EACH milestone; the live site must always work)

- [x] **M1** Game of Life on canvas, split code/canvas layout
- [x] **M2** Click/drag painting, pause/step/purge/random, keyboard (Space/N/G/R), frame artwork slot, FPS counter
- [ ] **M3 Astrolabe menu:** circular node map (nodes placed with sin/cos around a centre emblem). Clicking a node switches the active module on the canvas. "Eternal Recurrence" (Game of Life) is the first node. Modules should share an interface (e.g. `{ id, label, Component, panelActions }`).
- [ ] **M4 Terminal:** turn the left panel into a typeable shell written by us (NOT an embedded Linux emulator: it must be able to control the app and be explainable). Pieces: virtual filesystem as a tree, command parser (later pipes `|`), commands `ls cd pwd cat mkdir touch echo grep history clear help`, app commands (`./life --seed glider`, `pause`, `step`, `ps`, `kill`), `cat` on real source files, a tutorial "missions" mode teaching Linux basics with lore files (e.g. `/amphoreus/logs`). The code panel becomes output of the terminal. Optional later: a separate "Real Linux" node that lazy-loads an emulator (v86/WebVM) for practice.
- [ ] **M5 Genetic algorithm:** evolve small seed patterns that live longest; fitness = run our engine. Pure JS, runs live in the browser.
- [ ] **M6 Fate Predictor (main ML piece):** generate a labelled dataset with our engine (dies out / stabilizes / still active after N gens), train in Python (scikit-learn baseline → small neural net), report accuracy vs a baseline, export to the browser (TensorFlow.js or ONNX Runtime Web). UI predicts a board's fate before it runs.
- [ ] **M7 (optional)** Small CNN that learns the rules (neighbour count = 3×3 convolution); show prediction vs real engine with wrong cells highlighted.
- [ ] **M8 (optional)** `ask "..."` AI command in the terminal. Needs a Vercel serverless function to hide the API key, a spending cap and per-visitor rate limit. Never put API keys in frontend code.

Each module becomes a node on the astrolabe; the terminal is the main way to control everything.

## Artwork plan

- Now (M2): `public/assets/grid_frame.png`, 1200×1200 transparent, centre 1000×1000 empty window, art in the 100 px border.
- M3: centre book emblem (~512×512), one line-art glyph per module node (~128×128). Sizes get finalized when M3 code exists.
- Workflow: code with placeholders first → verify → drop in rough art → refine.

## Commands

```bash
npm install
npm run dev     # local dev server
npm test        # engine tests
npm run build   # production build → dist/
```
