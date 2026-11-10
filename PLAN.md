# Astrolabe: the plan (plain English)

*My working copy. Edit freely in Notion, then paste it back here.*

## What it is, in one sentence

Learn how software works by poking it and watching the real code respond.

## Who it's for

Beginner programmers, like me a few months ago. People who have heard words like "simulation loop", "pipe" or "AI agent" but have never watched one actually run.

## How it works

- On the right is something you can play with: a simulation, an algorithm, an AI idea.
- On the left is a terminal. Whenever you do something, it shows the real code that just ran. It isn't a copy; it's pulled from the actual source files, so it can never be out of date.
- In the middle is the astrolabe: a circle of nodes. Each node is one concept you can open.

## The rule every new module has to pass

You do something, real code runs, and the terminal shows you that exact code. If an idea can't pass that test, it's decoration, not a module.

## How it connects to my portfolio

My portfolio has an Articles tab where I explain things I've learned in simple words (the Feynman technique). Astrolabe is the hands-on half of that.

- For every milestone, I write an article on my portfolio explaining the concept.
- The article links to the live module, or shows it inside the page, so readers can try it right there.
- That way the portfolio is the record of what I learned, and Astrolabe is where you can play with it.

Article ideas so far:

- How a simulation loop works (Game of Life)
- Navigating the terminal (the terminal and its missions)
- Evolution in code: genetic algorithms
- How sorting really works
- How AI agents actually work
- Can a computer predict the future of a pattern? (the fate predictor)

## When a milestone counts as "done"

1. It's merged and live on the site.
2. The resume bullet for it is true, and someone could check it in the code.
3. I've written the article for it.
4. The article links to or embeds the module.

## Roadmap

Done:

- Game of Life on a canvas, with painting, pause/step, and keyboard controls
- The astrolabe menu (the circle of nodes)
- The terminal: files, folders, pipes, commands that control the app, guided missions

Next, in order. Resume first: these make the third resume bullet true.

1. **Fate predictor (the main machine learning piece).** Train a small neural network on boards my engine generates, so it can guess whether a pattern dies, settles, or keeps going. It runs in the browser with ONNX Runtime Web.
2. **`ask` command.** Ask the terminal to explain the code on screen using a real AI model. It needs a small server to keep the API key secret, with a spending cap and a limit per visitor.

Then the learning modules:

3. **Deep links.** Open the site straight into one module from a link, so the portfolio articles can point to it.
4. **Genetic algorithm.** Evolve small starting patterns that stay busy the longest, scored by my own Game of Life engine.
5. **Sorting visualizer.** Step through a sort and watch the array change while the matching code shows.
6. **Agent loop.** Show how an AI agent works: think, use a tool, read the result, think again.
7. **(Optional)** A small network that learns the Game of Life rules by itself.

Side quest, anytime: a `diagram` command that draws a flowchart of how the code is connected, generated from the real code.

Maybe later: recursion and call-stack visualizer, a toy tokenizer, live neural network training, a personal learning map.

Theming (Amphoreus look and art) comes after the functionality is finished.

## Resume bullets (only true ones go on the resume)

- Built an interactive React and HTML5 Canvas simulation platform linking user actions to live source code for developer learning. **True now.**
- Engineered a Unix-style shell with command parsing, pipelines, and a virtual filesystem, supporting interactive exercises and guided missions. **True now.**
- Developed a neural network prediction pipeline using ONNX Runtime Web and integrated an LLM assistant through a rate-limited serverless API. **Not true yet.** It becomes true after the next two milestones (fate predictor and `ask` command).

## Open questions (fill in when I decide)

- What is my portfolio built with? This decides how the embed gets written.
