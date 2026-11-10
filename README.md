# Astrolabe: Eternal Recurrence

**Live site:** https://nancyli15.github.io/astrolabe/

An interactive Conway's Game of Life with a self-documenting terminal. Click or drag on the grid to draw cells and watch them evolve. Every action you take (painting, pausing, stepping, purging) prints the **actual source code** that handled it, plus a plain-English explanation. You can also control everything by typing commands, read the app's real source with `cat`, and learn Linux basics through a short tutorial.

Themed after the debugging-terminal. Unofficial fan project. All code and artwork are original.

## Controls

| Action | Mouse / button | Key |
|---|---|---|
| Draw / erase cells | Click or drag on the grid | |
| Play / pause | ▶ / ❚❚ | `Space` |
| Advance one generation (while paused) | Step | `N` |
| Random board | Random | `G` |
| Clear the board | Purge | `R` |
| Ask the neural network for the board's fate, then check it with the engine | Predict fate | `F` |
| Inspect a cell | Hover over it | |
| Open / close the astrolabe menu | ◎ Astrolabe | `M` (`Esc` also closes) |
| Move between menu nodes | | `Tab`, then `Enter` to choose |
| Type in the terminal | Click the left pane | `Esc` leaves it, so the shortcuts work again |

## Terminal

Type `help` for the full list, or `missions` for an 11-step Linux tutorial. It's a simulated shell written for this site, not a real Linux system: files live in memory and reset when you refresh.

| Commands | What they do |
|---|---|
| `pwd` `ls` `cd` `cat` `mkdir` `touch` `echo` `grep` | Work with the pretend disk. `/src` holds the app's real source code. |
| `\|` `>` `>>` | Pipe output into another command, or write it to a file |
| `help` `history` `clear` `missions` `glossary` | Shell helpers, the tutorial, and an explanation of process IDs, statuses and error messages. Up and Down recall earlier commands. |
| `./life --seed glider` `pause` `resume` `step` `ps` `kill <pid>` | Control the running simulation. Hover over a process ID like `[102]` to see what it means. |
| `predict` | Same as the Predict fate button |

## How it works

```
src/
  engine/
    life.js          Game of Life rules: pure functions, no DOM (unit-tested)
    fate.js          runs a board to see if it dies, settles or stays active; the model's 18 input numbers
    dataset.js       random training boards, labelled by fate.js
    random.js        a seedable random number generator, so the dataset can be made again exactly
    layout.js        where the grid sits on screen + pixel → (row, col)
    astrolabe.js     where nodes sit on the menu's circle, using sin/cos
    *.test.js        tests: still lifes, oscillators, glider wraparound, click mapping, node positions
  components/
    GridCanvas.jsx   canvas drawing, animation loop, mouse painting, hover box
    AstrolabeMenu.jsx  the circular menu that switches modules
    menuActions.js   what the code panel says when the menu opens
  modules/
    index.js         the list of modules the astrolabe can open
    life/            Eternal Recurrence: controls, shortcuts, stats, panel text, fate predictor
    comingSoon/      placeholder module, so switching can be seen
  terminal/
    Terminal.jsx     the left pane: scrollback, typing, command history
    shell.js         runs a typed line and returns the output (no screen code)
    parser.js        splits a line into commands, pipes and redirects
    filesystem.js    the pretend disk, a tree kept in memory
    missions.js      the tutorial's steps and how each one is checked
    transcript.js    the kinds of item shown in the scrollback
    commands/        file, shell and app commands
    content/         starting files, plus the app's real source as text
    *.test.js        tests: paths, parsing, every command, the whole tutorial
  codePanel/
    regions.js       pulls `// #region` snippets out of the source files
    entries.js       joins an action's description with its real code snippet
    CodePanel.jsx    one code entry in the terminal's scrollback
    highlight.jsx    small syntax highlighter
  App.jsx            page layout, what's running, the bridge from terminal to app
scripts/
  makeDataset.js     generates the training data with the engine (Node)
ml/
  train.py           trains and compares the models, exports the network to ONNX
  results.json       the measured accuracies
public/assets/       drop artwork here (see ASSETS.md)
public/models/       fate.onnx, the trained network the browser runs
```

- **Rules:** standard Conway B3/S23. A dead cell with exactly 3 live neighbours is born; a live cell with 2 or 3 survives. The board wraps at the edges (a torus).
- **Engine/renderer split:** `life.js` takes a grid and returns a new one. It never touches the screen, so it can be tested on its own with `npm test`.
- **Two clocks, one loop:** `requestAnimationFrame` redraws every frame (even while paused, so edits show instantly). A time accumulator advances the simulation one generation every 200 ms when not paused.
- **Self-documenting code:** Vite's `import.meta.glob` with `?raw` loads the source files as text when the site is built. `regions.js` cuts out the part between `// #region name` and `// #endregion`, and `cat` reads the same files, so what's shown always matches the running code.
- **Shell/screen split:** `shell.js` takes the shell's state and a typed line, and returns the new state and the output. It never touches the screen, so whole terminal sessions are tested without a browser.
- **Terminal to app:** commands reach the app only through a small `app` object provided by `App.jsx`. The Life module registers its pause, resume and step functions there, so `pause` and the Pause button run the same code. The tests swap in a fake `app`.
- **Modules:** every entry in `modules/index.js` has the same shape: `{ id, label, Component, panelActions }`. `App.jsx` only remembers what's running and its process id. Starting a module gives it a new id, and React removes the old module and starts the new one, so the board restarts when you come back to it.
- **Astrolabe menu:** `computeNodePositions` places `count` nodes evenly on a circle using `cos` and `sin`. It's pure maths, so it's tested without a browser. The nodes are ordinary HTML buttons.

## Fate predictor

Press **Predict fate** (or type `predict`). A small neural network guesses whether the board will **die** (every cell dead), **settle** (repeat itself every 1 or 2 generations, like blocks and blinkers) or still be **active** after 300 generations. Then the real engine runs the board and shows whether the guess was right.

**Pipeline**

1. **Label:** `fate()` in `src/engine/fate.js` runs a board with the engine and reports what happens. The engine labels its own data.
2. **Generate:** `node scripts/makeDataset.js` makes 80,000 random 30×30 boards (square patches of 3×3 up to 30×30 at 20–60% density, from seed 42, so the same boards come out every time) and labels each one. This takes about 6 minutes.
3. **Features:** the model doesn't see the 900 cells. It sees 18 numbers from `boardFeatures()`: how many live cells, and how many dead cells, have 0 to 8 live neighbours. The browser calls the same function, so training and prediction can't disagree.
4. **Train:** `ml/train.py` trains with scikit-learn on 64,000 boards and tests on the other 16,000.
5. **Export and run:** the network is saved as `public/models/fate.onnx` (15 KB). ONNX Runtime Web runs it in the browser. It loads only when you first press Predict, so it doesn't slow down the page.

**Results** (16,000 test boards the models never saw; from `ml/results.json`)

| Model | Accuracy | Dies | Settles | Active |
|---|---|---|---|---|
| Always guess "settles" (baseline) | 55.4% | 0% | 100% | 0% |
| Logistic regression, 18 features | 60.0% | 50% | 76% | 37% |
| Neural network, 900 raw cells | 58.5% | 53% | 77% | 32% |
| **Neural network, 18 features (shipped)** | **60.1%** | 42% | 66% | 56% |

The last three columns show what share of the boards with that fate each model got right.

**What this shows.** The network beats the baseline by about 5 points, and is no better overall than logistic regression. It is more balanced, though: it catches 56% of active boards instead of 37%. Long-term fate in the Game of Life is close to chaotic, so a small change to the board can change what happens 300 generations later. Simulating a few generations ahead before predicting only raised accuracy to about 62% in my tests. Feeding raw cells did worse than the 18 counts, because a shape's fate doesn't depend on where it is, and raw cells make the network learn every position separately. Labels are for a 30×30 board that wraps at the edges: the R-pentomino, which stays busy for 1103 generations on an endless board, settles after 145 here.

**Reproduce it**

```bash
node scripts/makeDataset.js                   # writes ml/data/ (git-ignored)
python3 -m venv ml/.venv
ml/.venv/bin/pip install -r ml/requirements.txt
ml/.venv/bin/python ml/train.py               # prints the table above, writes fate.onnx and results.json
```

## Run it locally

Requires [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev      # open the printed http://localhost:5173/astrolabe/ link
npm test         # run the tests
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
- [x] **Milestone 4:** terminal: turn the left panel into a typeable shell written by us (NOT an embedded Linux emulator: it must be able to control the app and be explainable). Pieces: virtual filesystem as a tree, command parser (later pipes `|`), commands `ls cd pwd cat mkdir touch echo grep history clear help`, app commands (`./life --seed glider`, `pause`, `step`, `ps`, `kill`), `cat` on real source files, a tutorial "missions" mode teaching Linux basics with lore files (e.g. `/amphoreus/logs`). The code panel becomes output of the terminal. Optional later: a separate "Real Linux" node that lazy-loads an emulator (v86/WebVM) for practice.
- [x] **Milestone 5:** fate predictor: a neural network trained on boards labelled by the engine guesses whether a board dies, settles or stays active, running in the browser with ONNX Runtime Web (see [Fate predictor](#fate-predictor))
- [ ] **Milestone 6:** `ask "..."` AI command in the terminal, may need serverless function to hide the API key, a spending cap and per-visitor rate limit.
- [ ] **Milestone 7:** deep links, so a link can open one module directly (for embedding in articles)
- [ ] **Milestone 8:** genetic algorithm: evolve small seed patterns that stay busy longest; fitness = run our engine
- [ ] **Milestone 9:** sorting visualizer
- [ ] **Milestone 10:** agent loop: how an AI agent thinks, calls tools and reads results
- [ ] **Milestone 11:** small CNN that learns the rules (neighbour count = 3×3 convolution); show prediction vs real engine with wrong cells highlighted.