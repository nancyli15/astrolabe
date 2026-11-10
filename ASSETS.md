# Artwork guide

The code runs without any artwork: it draws placeholder shapes. Each asset below has a slot that picks it up automatically once the file exists. Workflow: draw a rough version fast, drop it in, check it in the running app, then refine.

## Milestone 2: needed now

### `public/assets/grid_frame.png`: the frame around the grid

| | |
|---|---|
| Canvas size | **1200 × 1200 px**, transparent background, PNG |
| The window | The **centre 1000 × 1000 px** is where the grid shows through. Keep it empty (or only very faint lines). |
| The border | The outer **100 px band** on every side is yours: line-art borders, corner brackets, Greek key patterns, small glyphs, tick marks, text like `ETERNAL RECURRENCE`. |
| Palette | Background `#0b0614`, lines `#4a3b6b` / `#d1d5db`, accent gold `#e9c46a`. Living cells are gold `#ffd166`, light teal `#5eead4` and deep teal `#14b8a6`, so keep the frame calmer than those. |
| Style | Thin, clean, high-contrast lines (like the *As I've Written* rings). Avoid heavy fills that pull focus from the grid. |

How the code uses it: `GridCanvas.jsx` → `drawFrame()` stretches the image over the grid plus a 10% border on each side. That is why the window is 1000 of 1200 px: 1000 + 2 × 100 = 1200. If the window doesn't line up with the cells, check that your drawing is exactly square and that the inner window is exactly centred.

Quick test: in Clip Studio, make a 1200×1200 canvas, draw a red rectangle outline from (100,100) to (1100,1100), export transparent PNG, drop it in `public/assets/`, and refresh. The red line should sit right at the edge of the grid.

## Milestone 3: the astrolabe menu

The menu draws placeholders until these files exist, then picks them up automatically: a line-art book for the emblem and the module's first letter for each glyph.

### `public/assets/emblem.png`: the centre emblem

| | |
|---|---|
| Canvas size | **512 × 512 px**, transparent background, PNG |
| Shown at | 26% of the dial's width, inside its inner ring. Keep the art within the centre of the square, and away from the corners. |
| Style | The book, *Saga of Heroes* style, in thin gold or light lines |

### `public/assets/glyph_<module id>.png`: one per node

| | |
|---|---|
| Canvas size | **128 × 128 px**, transparent background, PNG |
| Shown at | 30–56 px, depending on window size, inside a circle. Corners get cut off, so keep the art inside the circle. |
| Style | A simple line icon that stays readable when small |
| File names | `glyph_eternal-recurrence.png` and `glyph_uncharted.png`. The ids come from `src/modules/index.js`. |

Optional: a character silhouette in line art with a solid black fill. There is no slot for this in the code yet.
