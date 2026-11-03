// The heart of the terminal: takes the shell's state and a typed line, and returns
// the new state plus what to print. It never touches the screen, so a whole session
// can be tested without a browser, just like the Game of Life engine.
import { addFile, HOME, makeDirNode, resolvePath, writeFile } from './filesystem.js';
import { parseLine } from './parser.js';
import { advanceMission } from './missions.js';
import { LORE_FILES } from './content/lore.js';
import { FILE_COMMANDS } from './commands/fileCommands.js';
import { SHELL_COMMANDS } from './commands/shellCommands.js';
import { APP_COMMANDS } from './commands/appCommands.js';

export const COMMANDS = { ...FILE_COMMANDS, ...SHELL_COMMANDS, ...APP_COMMANDS };

// extraFiles lets the browser add the real source code, which the tests can't load.
export function createShell(extraFiles = {}) {
  let root = makeDirNode();
  for (const [path, content] of Object.entries({ ...LORE_FILES, ...extraFiles })) {
    root = addFile(root, path, content);
  }
  return { root, cwd: HOME, history: [], missionIndex: null };
}

export function runLine(state, line, app) {
  const trimmed = line.trim();
  if (trimmed === '') return { state, output: [] };

  let current = { ...state, history: [...state.history, trimmed] };
  const output = [];
  const print = (text, tone) => output.push({ text, tone });

  const plan = parseLine(trimmed);
  if (plan.error) {
    print(`sh: ${plan.error}`, 'error');
    return { state: current, output };
  }

  // Run the stages in order. Each one's stdout becomes the next one's stdin.
  let stdin = null;
  let failed = false;
  let clear = false;
  for (const { name, args } of plan.stages) {
    if (!Object.hasOwn(COMMANDS, name)) {
      print(`sh: ${name}: command not found. Type help for a list.`, 'error');
      return { state: current, output };
    }
    const result = COMMANDS[name].run({ args, stdin, state: current, app, commands: COMMANDS });
    if (result.state) current = result.state;
    if (result.stderr) { print(result.stderr, 'error'); failed = true; }
    if (result.mission) print(result.mission, 'mission');
    if (result.clear) clear = true;
    stdin = result.stdout ?? '';
  }

  // The last stage's output goes to a file if there's a redirect, or else the screen.
  if (plan.redirect) {
    const path = resolvePath(current.cwd, plan.redirect.path);
    const text = stdin === '' || stdin.endsWith('\n') ? stdin : `${stdin}\n`;
    const written = writeFile(current.root, path, text, { append: plan.redirect.append });
    if (written.error) {
      print(`sh: ${plan.redirect.path}: ${written.error}`, 'error');
      failed = true;
    } else {
      current = { ...current, root: written.root };
    }
  } else if (stdin !== '' && stdin !== null) {
    print(stdin);
  }

  const { missionIndex, message } = advanceMission(current.missionIndex, {
    stages: plan.stages,
    redirect: plan.redirect,
    after: current,
    failed,
  });
  if (message) print(message, 'mission');

  return { state: { ...current, missionIndex }, output, clear };
}
