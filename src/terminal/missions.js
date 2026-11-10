// The tutorial: a list of small goals that teach Linux basics using this terminal.
//
// Each mission has a `check` that receives the result of the command just run:
//   stages   the parsed commands, like [{ name: 'cat', args: ['a.log'] }]
//   redirect the > or >> target, or null
//   after    the shell's state after the command
//   failed   true if the command printed an error
// `example` is one command that solves it, and the tests run them all in order.
export const MISSIONS = [
  {
    title: 'Where am I?',
    instruction: 'Print the folder you are in. The command is pwd, short for "print working directory".',
    example: 'pwd',
    check: ({ stages }) => stages[0].name === 'pwd',
  },
  {
    title: 'Look around',
    instruction: 'List what is in this folder with ls.',
    example: 'ls',
    check: ({ stages }) => stages[0].name === 'ls',
  },
  {
    title: 'Move',
    instruction: 'Go to the observation logs with: cd /amphoreus/logs',
    example: 'cd /amphoreus/logs',
    check: ({ after }) => after.cwd === '/amphoreus/logs',
  },
  {
    title: 'Read a file',
    instruction: 'Use ls to see the logs here, then read one with cat. Try: cat cycle-001.log',
    example: 'cat cycle-001.log',
    check: ({ stages, failed }) => stages[0].name === 'cat' && stages[0].args.length > 0 && !failed,
  },
  {
    title: 'Search with a pipe',
    instruction: 'A pipe (|) feeds one command\'s output into the next. Find the Coreflame readings: cat cycle-002.log | grep Coreflame',
    example: 'cat cycle-002.log | grep Coreflame',
    check: ({ stages, failed }) => stages.length >= 2 && stages.at(-1).name === 'grep' && !failed,
  },
  {
    title: 'Make a folder',
    instruction: 'Create your own folder at home. ~ is short for your home folder: mkdir ~/notes',
    example: 'mkdir ~/notes',
    check: ({ stages, failed }) => stages[0].name === 'mkdir' && !failed,
  },
  {
    title: 'Write a file',
    instruction: 'The > symbol sends output into a file instead of the screen: echo "first entry" > ~/notes/log.txt',
    example: 'echo "first entry" > ~/notes/log.txt',
    check: ({ redirect, failed }) => redirect !== null && !failed,
  },
  {
    title: 'Read the real code',
    instruction: 'The /src folder holds this app\'s actual source. Read the rules of the simulation: cat /src/engine/life.js',
    example: 'cat /src/engine/life.js',
    check: ({ stages, failed }) => stages[0].name === 'cat' && stages[0].args.some((arg) => arg.includes('src/')) && !failed,
  },
  {
    title: 'Start a program',
    instruction: 'This terminal can control the board on the right. Start it with a seed: ./life --seed glider',
    example: './life --seed glider',
    check: ({ stages, failed }) => stages[0].name === './life' && stages[0].args.includes('--seed') && !failed,
  },
  {
    title: 'See what is running',
    instruction: 'List running programs and their process ids with ps.',
    example: 'ps',
    check: ({ stages }) => stages[0].name === 'ps',
  },
  {
    title: 'Interrupt it',
    instruction: 'Freeze the simulation with pause. Afterward, step moves one generation and resume continues.',
    example: 'pause',
    check: ({ stages, failed }) => stages[0].name === 'pause' && !failed,
  },
];

const describeMission = (index) => {
  const mission = MISSIONS[index];
  return `Mission ${index + 1}/${MISSIONS.length}: ${mission.title}\n${mission.instruction}`;
};

// Called by the shell after every command. Returns the new mission position, plus
// a message if the current mission was just completed.
export function advanceMission(missionIndex, result) {
  if (missionIndex === null || missionIndex >= MISSIONS.length) return { missionIndex };
  if (!MISSIONS[missionIndex].check(result)) return { missionIndex };

  const next = missionIndex + 1;
  const done = `✓ Mission ${next} complete.`;
  const message = next === MISSIONS.length
    ? `${done}\nAll missions finished. You just used the basics of a real Linux shell. Type help to see everything else.`
    : `${done}\n\n${describeMission(next)}`;
  return { missionIndex: next, message };
}

export const missionsCommand = {
  usage: 'missions [hint|stop|restart]',
  summary: 'start or check the Linux tutorial',
  run: ({ args, state }) => {
    const [action] = args;
    const index = state.missionIndex;
    const finished = index !== null && index >= MISSIONS.length;

    if (action === 'stop') {
      return { stdout: 'Tutorial stopped. Type missions to pick it up from the start.', state: { ...state, missionIndex: null } };
    }
    if (action === 'restart') {
      return { mission: describeMission(0), state: { ...state, missionIndex: 0 } };
    }
    if (action === 'hint') {
      if (index === null || finished) return { stderr: 'missions: no mission is active. Type missions to start.' };
      return { mission: `Hint: ${MISSIONS[index].example}` };
    }
    if (action !== undefined) return { stderr: 'usage: missions [hint|stop|restart]' };

    if (finished) return { mission: 'All missions finished. Type missions restart to go again.' };
    if (index !== null) return { mission: describeMission(index) };
    return { mission: describeMission(0), state: { ...state, missionIndex: 0 } };
  },
};
