// Commands that look at or change the pretend disk.
//
// Every command is { usage, summary, run }. run receives what it needs in `ctx`:
//   args    the words typed after the command name
//   stdin   text piped in from the previous command, or null if there is none
//   state   the shell's current state (disk, current folder, history...)
//   app     the bridge to the running app (see appCommands.js)
// It returns any of { stdout, stderr, state }. A command never prints directly, and
// that is what lets the shell send its output into a pipe or a file instead.
// App commands can also return `pid`, when their stdout starts with that [pid].
import { getNode, HOME, listDir, makeDir, resolvePath, writeFile } from '../filesystem.js';

const splitLines = (text) => text.replace(/\n$/, '').split('\n');

// Runs one step for each named path, collecting output, errors and disk changes.
function forEachPath(ctx, commandName, paths, handlePath) {
  const stdout = [];
  const stderr = [];
  let { root } = ctx.state;
  for (const path of paths) {
    const result = handlePath(root, resolvePath(ctx.state.cwd, path), path);
    if (result.error) stderr.push(`${commandName}: ${path}: ${result.error}`);
    if (result.root) root = result.root;
    if (result.stdout !== undefined) stdout.push(result.stdout);
  }
  return {
    stdout: stdout.length ? stdout.join('\n') : undefined,
    stderr: stderr.length ? stderr.join('\n') : undefined,
    state: { ...ctx.state, root },
  };
}

export const FILE_COMMANDS = {
  pwd: {
    usage: 'pwd',
    summary: 'show the current folder',
    run: ({ state }) => ({ stdout: state.cwd }),
  },

  ls: {
    usage: 'ls [folder]',
    summary: 'list what is in a folder',
    run: ({ args, state }) => {
      const path = args[0] ?? '.';
      const { entries, error } = listDir(state.root, resolvePath(state.cwd, path));
      if (error) return { stderr: `ls: ${path}: ${error}` };
      return { stdout: entries.map(({ name, type }) => (type === 'dir' ? `${name}/` : name)).join('\n') };
    },
  },

  cd: {
    usage: 'cd [folder]',
    summary: 'move to a folder (no folder means home)',
    run: ({ args, state }) => {
      const target = args[0] ?? HOME;
      const path = resolvePath(state.cwd, target);
      const node = getNode(state.root, path);
      if (!node) return { stderr: `cd: ${target}: No such file or directory` };
      if (node.type !== 'dir') return { stderr: `cd: ${target}: Not a directory` };
      return { state: { ...state, cwd: path } };
    },
  },

  cat: {
    usage: 'cat [file...]',
    summary: 'print files, including real source like /src/App.jsx',
    run: (ctx) => {
      if (ctx.args.length === 0) {
        if (ctx.stdin !== null) return { stdout: ctx.stdin };
        return { stderr: 'usage: cat [file...]' };
      }
      return forEachPath(ctx, 'cat', ctx.args, (root, path) => {
        const node = getNode(root, path);
        if (!node) return { error: 'No such file or directory' };
        if (node.type === 'dir') return { error: 'Is a directory' };
        return { stdout: node.content.replace(/\n$/, '') };
      });
    },
  },

  mkdir: {
    usage: 'mkdir <folder...>',
    summary: 'create folders',
    run: (ctx) => {
      if (ctx.args.length === 0) return { stderr: 'usage: mkdir <folder...>' };
      return forEachPath(ctx, 'mkdir', ctx.args, (root, path) => makeDir(root, path));
    },
  },

  touch: {
    usage: 'touch <file...>',
    summary: 'create empty files',
    run: (ctx) => {
      if (ctx.args.length === 0) return { stderr: 'usage: touch <file...>' };
      return forEachPath(ctx, 'touch', ctx.args, (root, path) => {
        // Unlike a real disk there are no timestamps, so an existing file stays as it is.
        return getNode(root, path) ? {} : writeFile(root, path, '');
      });
    },
  },

  echo: {
    usage: 'echo [text...]',
    summary: 'print text (send it to a file with > or >>)',
    run: ({ args }) => ({ stdout: args.join(' ') }),
  },

  grep: {
    usage: 'grep [-i] [-n] <text> [file...]',
    summary: 'show lines containing some text (-i ignores case, -n adds line numbers)',
    run: (ctx) => {
      const flags = ctx.args.filter((arg) => arg.startsWith('-'));
      const [pattern, ...files] = ctx.args.filter((arg) => !arg.startsWith('-'));
      const unknown = flags.find((flag) => flag !== '-i' && flag !== '-n');
      if (unknown) return { stderr: `grep: unknown option ${unknown}` };
      if (pattern === undefined || (files.length === 0 && ctx.stdin === null)) {
        return { stderr: 'usage: grep [-i] [-n] <text> [file...]' };
      }

      const ignoreCase = flags.includes('-i');
      const wanted = ignoreCase ? pattern.toLowerCase() : pattern;
      const matches = (line) => (ignoreCase ? line.toLowerCase() : line).includes(wanted);

      // Keep the lines that match. With several files, say which file each came from.
      const search = (text, prefix) => splitLines(text).flatMap((line, index) => {
        if (!matches(line)) return [];
        const number = flags.includes('-n') ? `${index + 1}:` : '';
        return [`${prefix}${number}${line}`];
      });

      if (files.length === 0) {
        const found = search(ctx.stdin, '');
        return { stdout: found.length ? found.join('\n') : undefined };
      }
      return forEachPath(ctx, 'grep', files, (root, path, typed) => {
        const node = getNode(root, path);
        if (!node) return { error: 'No such file or directory' };
        if (node.type === 'dir') return { error: 'Is a directory' };
        const found = search(node.content, files.length > 1 ? `${typed}:` : '');
        return found.length ? { stdout: found.join('\n') } : {};
      });
    },
  },
};
