// Explains the terminal's process ids, statuses and error messages. The hover box on
// a PID and the `glossary` command both read from here, so they can't disagree.
//
// shell.test.js triggers every error listed below and checks the terminal really
// prints it, so this list can't quietly drift away from the code.
export const GLOSSARY = {
  pid: [
    'A process ID (PID) is a number given to each program when it starts.',
    'It counts up, and it isn\'t a status or an error code.',
    'Use it to stop a program with kill. PID 1 is the shell itself.',
  ],
  statuses: [
    { name: 'RUNNING', meaning: 'the program is active; the simulation is advancing' },
    { name: 'PAUSED', meaning: 'the simulation is frozen; try step or resume' },
  ],
  errors: [
    { message: 'command not found', meaning: 'no command has that name; type help' },
    { message: 'No such file or directory', meaning: 'nothing exists at that path' },
    { message: 'Not a directory', meaning: 'that path is a file, but a folder is needed' },
    { message: 'Is a directory', meaning: 'that path is a folder, but a file is needed' },
    { message: 'File exists', meaning: 'something already has that name' },
    { message: 'syntax error', meaning: 'a | or > is in the wrong place' },
    { message: 'unterminated', meaning: 'a quote was opened but never closed' },
    { message: 'usage:', meaning: 'wrong arguments; it shows the right form' },
    { message: 'unknown option', meaning: 'that command has no such - flag' },
    { message: 'unknown seed', meaning: 'not a seed ./life knows; it lists the valid ones' },
    { message: 'no simulation is running', meaning: 'start one first with ./life' },
    { message: 'pause the simulation first', meaning: 'step only works while paused' },
    { message: 'no such process', meaning: 'no program has that PID; check ps' },
    { message: 'cannot stop itself', meaning: 'kill can\'t stop the shell, PID 1' },
    { message: 'no mission is active', meaning: 'type missions to start the tutorial' },
  ],
};

// The same information as plain text, for the `glossary` command. Each meaning goes
// on its own line, because the terminal pane is too narrow for neat columns.
export function formatGlossary() {
  const entry = (label, meaning) => `${label}\n    ${meaning}`;
  return [
    'PROCESS IDS (like the [102] after ./life)',
    ...GLOSSARY.pid,
    '',
    'STATUSES (shown by ps)',
    ...GLOSSARY.statuses.map(({ name, meaning }) => entry(name, meaning)),
    '',
    'ERROR MESSAGES',
    ...GLOSSARY.errors.map(({ message, meaning }) => entry(message, meaning)),
  ].join('\n');
}
