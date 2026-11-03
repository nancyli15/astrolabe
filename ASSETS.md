# Artwork guide

The code runs without any artwork: it draws placeholder shapes. Each asset below has a slot that picks it up automatically once the file exists. Workflow: draw a rough version fast, drop it in, check it in the running app, then refine.

## Milestone 2: needed now

### `public/assets/grid_frame.png`: the frame around the grid

| | |
|---|---|
| Canvas size | **1200 × 1200 px**, transparent background, PNG |
| The window | The **centre 1000 × 1000 px** is where the grid shows through. Keep it empty (or only very faint lines). |
| The border | The outer **100 px band** on every side is yours: line-art borders, corner brackets, Greek key patterns, small glyphs, tick marks, text like `ETERNAL RECURRENCE`. |
| Palette | Background `#050508`, lines `#3a3f4b` / `#d1d5db`, accent red `#ef4444`. Living cells are coral `#ff7b72`, orange `#ffa657` and white `#e6edf3`, so keep the frame calmer than those. |
| Style | Thin, clean, high-contrast lines (like the *As I've Written* rings). Avoid heavy fills that pull focus from the grid. |

How the code uses it: `GridCanvas.jsx` → `drawFrame()` stretches the image over the grid plus a 10% border on each side. That is why the window is 1000 of 1200 px: 1000 + 2 × 100 = 1200. If the window doesn't line up with the cells, check that your drawing is exactly square and that the inner window is exactly centred.

Quick test: in Clip Studio, make a 1200×1200 canvas, draw a red rectangle outline from (100,100) to (1100,1100), export transparent PNG, drop it in `public/assets/`, and refresh. The red line should sit right at the edge of the grid.

## Milestone 3: later (don't draw yet)

Once the astrolabe node map exists, you will need roughly:

- **Centre emblem** (the book, *Saga of Heroes* style): about 512×512, transparent.
- **Module glyphs**: one per node, about 128×128, simple line icons readable at small sizes. Start with one (*Eternal Recurrence*) and add more as modules are built.
- **Character silhouette** (optional): line-art outline with solid black fill.

The exact sizes will be fixed when that code is written, so wait until then.
