// Commands that control the running app.
//
// They talk to it only through `app`, a small object that App.jsx provides:
//   app.status()          what's running: { pid, label, id, paused, generation, population }, or null
//   app.controls()        the running simulation's { pause, resume, step, predict, status }, or null
//   app.start(id, seed)   starts a module and returns its process id
//   app.kill()            stops whatever is running
// Because that's the only connection, the tests can hand in a fake app and check
// these commands without a browser.
import { PATTERNS } from '../../engine/life.js';

// Must match the id of the Game of Life entry in src/modules/index.js.
const LIFE_ID = 'eternal-recurrence';
const SEEDS = [...Object.keys(PATTERNS), 'random'];
const SHELL_PID = 1;

const noSimulation = (name) => ({ stderr: `${name}: no simulation is running. Try ./life` });

// Lets people type rpentomino without matching the capital P.
const findSeed = (name) => SEEDS.find((seed) => seed.toLowerCase() === name.toLowerCase());

export const APP_COMMANDS = {
  './life': {
    usage: './life [--seed <name>]',
    summary: `run the Game of Life (seeds: ${SEEDS.join(', ')})`,
    run: ({ args, app }) => {
      const usage = { stderr: `usage: ./life [--seed <name>]\nseeds: ${SEEDS.join(', ')}` };
      if (args.length !== 0 && (args.length !== 2 || args[0] !== '--seed')) return usage;

      if (args.length === 2) {
        const seed = findSeed(args[1]);
        if (!seed) return { stderr: `./life: unknown seed '${args[1]}'\nseeds: ${SEEDS.join(', ')}` };
        const pid = app.start(LIFE_ID, seed);
        return { stdout: `[${pid}] started with seed ${seed}`, pid };
      }

      const running = app.status();
      if (running?.id === LIFE_ID) {
        return { stdout: `already running as pid ${running.pid}. Use pause, resume, or --seed to restart.` };
      }
      const pid = app.start(LIFE_ID);
      return { stdout: `[${pid}] started`, pid };
    },
  },

  pause: {
    usage: 'pause',
    summary: 'pause the simulation',
    run: ({ app }) => {
      const controls = app.controls();
      if (!controls) return noSimulation('pause');
      if (controls.status().paused) return { stdout: 'already paused' };
      controls.pause();
      return {};
    },
  },

  resume: {
    usage: 'resume',
    summary: 'resume the simulation',
    run: ({ app }) => {
      const controls = app.controls();
      if (!controls) return noSimulation('resume');
      if (!controls.status().paused) return { stdout: 'already running' };
      controls.resume();
      return {};
    },
  },

  step: {
    usage: 'step',
    summary: 'advance one generation while paused',
    run: ({ app }) => {
      const controls = app.controls();
      if (!controls) return noSimulation('step');
      if (!controls.status().paused) return { stderr: 'step: pause the simulation first' };
      controls.step();
      return {};
    },
  },

  predict: {
    usage: 'predict',
    summary: "ask the neural network for the board's fate, then check it with the engine",
    run: ({ app }) => {
      const controls = app.controls();
      if (!controls) return noSimulation('predict');
      // The model loads in the background, so the answer arrives a moment later as a
      // code entry, the same one the Predict button shows.
      controls.predict();
      return { stdout: 'asking the model… (the answer appears below)' };
    },
  },

  ps: {
    usage: 'ps',
    summary: 'list running processes',
    run: ({ app }) => {
      const running = app.status();
      const row = (pid, state, generation, population, name) => [
        String(pid).padStart(4),
        state.padEnd(8),
        String(generation).padStart(5),
        String(population).padStart(5),
        name,
      ].join('  ');

      const rows = [row('PID', 'STATE', 'GEN', 'POP', 'NAME'), row(SHELL_PID, 'RUNNING', '-', '-', 'sh')];
      if (running) {
        rows.push(row(
          running.pid,
          running.paused ? 'PAUSED' : 'RUNNING',
          running.generation ?? '-',
          running.population ?? '-',
          running.label,
        ));
      }
      return { stdout: rows.join('\n') };
    },
  },

  kill: {
    usage: 'kill <pid>',
    summary: 'stop a process (find its pid with ps)',
    run: ({ args, app }) => {
      if (args.length !== 1) return { stderr: 'usage: kill <pid>' };
      if (args[0] === String(SHELL_PID)) return { stderr: 'kill: the shell cannot stop itself' };
      const running = app.status();
      if (!running || args[0] !== String(running.pid)) return { stderr: `kill: (${args[0]}): no such process` };
      app.kill();
      return { stdout: `[${running.pid}] terminated ${running.label}`, pid: running.pid };
    },
  },
};
