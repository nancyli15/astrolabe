// Commands about the shell itself rather than files or the app.
import { missionsCommand } from '../missions.js';

export const SHELL_COMMANDS = {
  help: {
    usage: 'help',
    summary: 'list every command',
    run: ({ commands }) => {
      // Two lines per command, because the pane is too narrow for neat columns.
      const rows = Object.values(commands).map((command) => `${command.usage}\n    ${command.summary}`);
      return {
        stdout: [
          ...rows,
          '',
          'Join commands with | to pipe output, and use > or >> to write it to a file.',
          'Up and Down arrows recall earlier commands.',
          'Esc leaves the terminal, so the keyboard shortcuts work again.',
        ].join('\n'),
      };
    },
  },

  history: {
    usage: 'history',
    summary: 'list the commands you have typed',
    run: ({ state }) => ({
      stdout: state.history
        .map((line, index) => `${String(index + 1).padStart(4)}  ${line}`)
        .join('\n'),
    }),
  },

  clear: {
    usage: 'clear',
    summary: 'clear the screen',
    run: () => ({ clear: true }),
  },

  missions: missionsCommand,
};
