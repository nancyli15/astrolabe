# Astrolabe: Eternal Recurrence

**Live site:** https://nancyli15.github.io/astrolabe/

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
| Inspect a cell | Hover over it | |
| Open / close the astrolabe menu | ◎ Astrolabe | `M` (`Esc` also closes) |
| Move between menu nodes | | `Tab`, then `Enter` to choose |

## How it works

```
src/
  engine/
    life.js          Game of Life rules: pure functions, no DOM (unit-tested)
    layout.js        where the grid sits on screen + pixel → (row, col)
    astrolabe.js     where nodes sit on the menu's circle, using sin/cos
    *.test.js        tests: still lifes, oscillators, glider wraparound, click mapping, node positions
  components/
    GridCanvas.jsx   canvas drawing, animation loop, mouse painting, hover box
    AstrolabeMenu.jsx  the circular menu that switches modules
    menuActions.js   what the code panel says when the menu opens
  modules/
    index.js         the list of modules the astrolabe can open
    life/            Eternal Recurrence: controls, shortcuts, stats, panel text
    comingSoon/      placeholder module, so switching can be seen
  codePanel/
    regions.js       pulls `// #region` snippets out of the source files
    entries.js       joins an action's description with its real code snippet
    CodePanel.jsx    the left-hand panel
    highlight.jsx    small syntax highlighter
  App.jsx            page layout, which module is active, opening the menu
public/assets/       drop artwork here (see ASSETS.md)
```

- **Rules:** standard Conway B3/S23. A dead cell with exactly 3 live neighbours is born; a live cell with 2 or 3 survives. The board wraps at the edges (a torus).
- **Engine/renderer split:** `life.js` takes a grid and returns a new one. It never touches the screen, so it can be tested on its own with `npm test`.
- **Two clocks, one loop:** `requestAnimationFrame` redraws every frame (even while paused, so edits show instantly). A time accumulator advances the simulation one generation every 200 ms when not paused.
- **Self-documenting panel:** Vite's `?raw` import loads the source files as text. `regions.js` cuts out the part between `// #region name` and `// #endregion`, so the panel always matches the running code.
- **Modules:** every entry in `modules/index.js` has the same shape: `{ id, label, Component, panelActions }`. `App.jsx` only remembers the active module's id. Choosing a node changes that id, and React removes the old module and starts the new one, so the board restarts when you come back to it.
- **Astrolabe menu:** `computeNodePositions` places `count` nodes evenly on a circle using `cos` and `sin`. It's pure maths, so it's tested without a browser. The nodes are ordinary HTML buttons.

## Run it locally

Requires [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev      # open the printed http://localhost:5173/astrolabe/ link
npm test         # run the engine tests
npm run build    # production build into dist/
```

## Deployment

The site is hosted on GitHub Pages. Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which installs dependencies, runs the tests and builds the site, then publishes `dist/`. If the tests or build fail, nothing is published.

To deploy your own copy:

1. Push this folder to a GitHub repository.
2. In `vite.config.js`, set `base` to `/<your-repo-name>/`.
3. In the repository, go to **Settings → Pages → Source** and choose **GitHub Actions**.
4. Push to `main`. The site appears at `https://<your-username>.github.io/<your-repo-name>/`.

## Roadmap

- [x] **Milestone 1:** 30×30 Game of Life on canvas, split code/canvas layout
- [x] **Milestone 2:** click/drag editing, pause/step/purge controls, frame artwork slot
- [x] **Milestone 3:** astrolabe node map: a circular menu (sin/cos layout) whose nodes switch between modules, with Eternal Recurrence as the first module
- [ ] **Milestone 4:** a typeable terminal, written from scratch, that can control the app
