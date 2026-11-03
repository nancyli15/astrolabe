# Astrolabe: Eternal Recurrence

An interactive Conway's Game of Life with a "self-documenting" code panel. Click or drag on the grid to draw cells and watch them evolve. Every action you take (painting, pausing, stepping, purging) makes the left panel show the **actual source code** that handled it, plus a plain-English explanation.

Themed after the debugging-terminal. Unofficial fan project. All code and artwork are original.

## Controls

| Action | Mouse / button | Key |
|---|---|---|
| Draw / erase cells | Click or drag on the grid | |
| Play / pause | ▶ / ❚❚ | `Space` |
| Advance one generation (while paused) | Step | `N` |
| Random board | Random | `G` |
| Clear the board | Purge | `R` |

## How it works

```
src/
  engine/
    life.js          Game of Life rules: pure functions, no DOM (unit-tested)
    layout.js        where the grid sits on screen + pixel → (row, col)
    *.test.js        tests: still lifes, oscillators, glider wraparound, click mapping
  components/
    GridCanvas.jsx   canvas drawing, animation loop, mouse painting
  codePanel/
    regions.js       pulls `// #region` snippets out of the source files
    actions.js       which snippet + explanation to show for each action
    CodePanel.jsx    the left-hand panel
    highlight.jsx    small syntax highlighter
  App.jsx            layout, buttons, keyboard shortcuts
public/assets/       drop artwork here (see ASSETS.md)
```

- **Rules:** standard Conway B3/S23. A dead cell with exactly 3 live neighbours is born; a live cell with 2 or 3 survives. The board wraps at the edges (a torus).
- **Engine/renderer split:** `life.js` takes a grid and returns a new one. It never touches the screen, so it can be tested on its own with `npm test`.
- **Two clocks, one loop:** `requestAnimationFrame` redraws every frame (even while paused, so edits show instantly). A time accumulator advances the simulation one generation every 200 ms when not paused.
- **Self-documenting panel:** Vite's `?raw` import loads the source files as text. `regions.js` cuts out the part between `// #region name` and `// #endregion`, so the panel always matches the running code.

## Run it locally

Requires [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev      # open the printed http://localhost:5173 link
npm test         # run the engine tests
npm run build    # production build into dist/
```

## Deploy (free) on Vercel

1. Push this folder to a new GitHub repository.
2. Sign in at vercel.com with GitHub → **Add New → Project** → import the repo.
3. Vercel detects Vite. Keep the defaults (build `npm run build`, output `dist`) and click **Deploy**.
4. Every later `git push` redeploys automatically.

## Roadmap

- [x] **Milestone 1:** 30×30 Game of Life on canvas, split code/canvas layout
- [x] **Milestone 2:** click/drag editing, pause/step/purge controls, frame artwork slot
- [ ] **Milestone 3:** astrolabe node map: a circular menu (sin/cos layout) whose nodes switch between modules, with Eternal Recurrence as the first module
