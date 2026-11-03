import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createShell, runLine, COMMANDS } from './shell.js';
import { GLOSSARY } from './content/glossary.js';
import { MISSIONS } from './missions.js';
import { getNode, HOME } from './filesystem.js';

// A pretend app, so app commands can be tested without a browser.
function fakeApp() {
  const sim = { paused: false, generation: 3, population: 7, steps: 0 };
  const app = {
    running: { pid: 100, id: 'eternal-recurrence', label: 'Eternal Recurrence' },
    nextPid: 101,
    started: [],
    sim,
    status: () => app.running && { ...app.running, paused: sim.paused, generation: sim.generation, population: sim.population },
    controls: () => (app.running ? {
      status: () => ({ paused: sim.paused }),
      pause: () => { sim.paused = true; },
      resume: () => { sim.paused = false; },
      step: () => { sim.steps++; },
    } : null),
    start: (id, seed) => {
      app.started.push({ id, seed });
      app.running = { pid: app.nextPid++, id, label: 'Eternal Recurrence' };
      return app.running.pid;
    },
    kill: () => { app.running = null; },
  };
  return app;
}

// Runs several lines in a row and returns the last one's text, plus the final state.
function session(lines, app = fakeApp()) {
  let state = createShell({ '/src/engine/life.js': 'export const REAL = 1;\n' });
  let last;
  for (const line of lines) {
    last = runLine(state, line, app);
    state = last.state;
  }
  const text = (tone) => last.output.filter((o) => o.tone === tone).map((o) => o.text).join('\n');
  return { state, stdout: text(undefined), error: text('error'), mission: text('mission'), clear: last.clear, app };
}

test('starts in the home folder, and pwd reports it', () => {
  assert.equal(session(['pwd']).stdout, HOME);
});

test('blank lines do nothing and are not added to history', () => {
  const { state } = session(['   ']);
  assert.deepEqual(state.history, []);
});

test('cd moves around and refuses bad targets', () => {
  assert.equal(session(['cd /amphoreus/logs', 'pwd']).stdout, '/amphoreus/logs');
  assert.equal(session(['cd /amphoreus/logs', 'cd ..', 'pwd']).stdout, '/amphoreus');
  assert.equal(session(['cd /amphoreus', 'cd', 'pwd']).stdout, HOME);
  assert.match(session(['cd /nope']).error, /No such file/);
  assert.match(session(['cd ~/welcome.txt']).error, /Not a directory/);
});

test('ls marks folders with a slash', () => {
  assert.equal(session(['ls /amphoreus']).stdout, 'archive/\nlogs/');
  assert.match(session(['ls /nope']).error, /No such file/);
});

test('cat prints files, and can read real source files added by the browser', () => {
  assert.match(session(['cat /amphoreus/logs/cycle-001.log']).stdout, /^\[cycle 001\] Seed accepted/);
  assert.equal(session(['cat /src/engine/life.js']).stdout, 'export const REAL = 1;');
  assert.match(session(['cat /amphoreus']).error, /Is a directory/);
  assert.match(session(['cat nope.txt']).error, /No such file/);
});

test('mkdir and touch create things', () => {
  const made = session(['mkdir ~/a', 'touch ~/a/b.txt', 'ls ~/a']);
  assert.equal(made.stdout, 'b.txt');
  assert.match(session(['mkdir ~/a', 'mkdir ~/a']).error, /File exists/);
  assert.match(session(['mkdir']).error, /usage/);
});

test('touch keeps an existing file\'s contents', () => {
  assert.equal(session(['echo hi > ~/a.txt', 'touch ~/a.txt', 'cat ~/a.txt']).stdout, 'hi');
});

test('redirects write to a file instead of the screen', () => {
  const written = session(['echo one > ~/a.txt']);
  assert.equal(written.stdout, '');
  assert.equal(getNode(written.state.root, `${HOME}/a.txt`).content, 'one\n');
  assert.equal(session(['echo one > ~/a.txt', 'echo two >> ~/a.txt', 'cat ~/a.txt']).stdout, 'one\ntwo');
  assert.equal(session(['echo one > ~/a.txt', 'echo two > ~/a.txt', 'cat ~/a.txt']).stdout, 'two');
  assert.match(session(['echo x > /nope/a.txt']).error, /No such file/);
});

test('grep searches files or piped text', () => {
  const log = '/amphoreus/logs/cycle-002.log';
  assert.equal(session([`grep Coreflame ${log}`]).stdout.split('\n').length, 2);
  assert.equal(session([`grep coreflame ${log}`]).stdout, '');
  assert.equal(session([`grep -i coreflame ${log}`]).stdout.split('\n').length, 2);
  assert.match(session([`grep -n Coreflame ${log}`]).stdout, /^1:\[cycle 002\]/);
  assert.equal(session([`cat ${log} | grep glider`]).stdout, '[cycle 002] A glider crossed the boundary and returned from the other side.');
  assert.match(session(['grep']).error, /usage/);
  assert.match(session(['grep x']).error, /usage/);
  assert.match(session(['grep -z x ~/welcome.txt']).error, /unknown option/);
  assert.match(session(['grep x nope.txt']).error, /No such file/);
});

test('grep names the file when searching several', () => {
  const { stdout } = session(['cd /amphoreus/logs', 'grep Observer cycle-001.log cycle-002.log']);
  assert.match(stdout, /^cycle-001\.log:.*\ncycle-002\.log:/);
});

test('pipes can be chained and sent to a file', () => {
  const { stdout } = session(['cat /amphoreus/logs/cycle-002.log | grep Coreflame | grep third > ~/f.txt', 'cat ~/f.txt']);
  assert.equal(stdout, '[cycle 002] Coreflame output fell by a third before the next tick.');
  assert.equal(session(['echo hi | cat']).stdout, 'hi');
});

test('unknown commands and syntax errors are reported, including names like constructor', () => {
  assert.match(session(['nope']).error, /command not found/);
  assert.match(session(['constructor']).error, /command not found/);
  assert.match(session(['__proto__']).error, /command not found/);
  assert.match(session(['ls |']).error, /syntax error/);
  assert.match(session(['echo "oops']).error, /unterminated/);
});

test('history lists everything typed, and clear asks the screen to clear', () => {
  assert.match(session(['pwd', 'ls', 'history']).stdout, /1 {2}pwd\n\s+2 {2}ls\n\s+3 {2}history/);
  assert.equal(session(['clear']).clear, true);
});

test('help lists every command', () => {
  const { stdout } = session(['help']);
  for (const command of Object.values(COMMANDS)) assert.ok(stdout.includes(command.usage), command.usage);
});

test('pause, resume and step control the simulation and report bad timing', () => {
  const app = fakeApp();
  assert.match(session(['step'], app).error, /pause the simulation first/);
  session(['pause'], app);
  assert.equal(app.sim.paused, true);
  assert.equal(session(['pause'], app).stdout, 'already paused');
  session(['step'], app);
  assert.equal(app.sim.steps, 1);
  session(['resume'], app);
  assert.equal(app.sim.paused, false);
  assert.equal(session(['resume'], app).stdout, 'already running');
});

test('./life starts with a seed, restarts when given one, and rejects bad input', () => {
  const app = fakeApp();
  assert.match(session(['./life --seed glider'], app).stdout, /\[101\] started with seed glider/);
  assert.deepEqual(app.started[0], { id: 'eternal-recurrence', seed: 'glider' });
  assert.match(session(['./life --seed RPENTOMINO'], app).stdout, /seed rPentomino/);
  assert.match(session(['./life --seed random'], app).stdout, /seed random/);
  assert.match(session(['./life'], app).stdout, /already running as pid 103/);
  assert.match(session(['./life --seed nope'], app).error, /unknown seed/);
  assert.match(session(['./life --bad'], app).error, /usage/);
  assert.match(session(['./life --seed'], app).error, /usage/);
});

test('ps lists the shell and the running module', () => {
  const { stdout } = session(['ps']);
  assert.match(stdout, /PID.*STATE.*GEN.*POP.*NAME/);
  assert.match(stdout, /1 {2}RUNNING.*sh/);
  assert.match(stdout, /100 {2}RUNNING.*3.*7.*Eternal Recurrence/);
});

test('kill stops the right process and nothing else', () => {
  const app = fakeApp();
  assert.match(session(['kill'], app).error, /usage/);
  assert.match(session(['kill 1'], app).error, /cannot stop itself/);
  assert.match(session(['kill 999'], app).error, /no such process/);
  assert.ok(app.running);
  assert.match(session(['kill 100'], app).stdout, /terminated Eternal Recurrence/);
  assert.equal(app.running, null);
  assert.doesNotMatch(session(['ps'], app).stdout, /Eternal/);
});

test('with nothing running, app commands say so and ./life starts again', () => {
  const app = fakeApp();
  app.kill();
  for (const command of ['pause', 'resume', 'step']) {
    assert.match(session([command], app).error, /no simulation is running/);
  }
  assert.match(session(['./life'], app).stdout, /\[101\] started/);
});

test('glossary prints every status and error message', () => {
  const { stdout } = session(['glossary']);
  assert.match(stdout, /process ID/);
  for (const { name } of GLOSSARY.statuses) assert.ok(stdout.includes(name), name);
  for (const { message } of GLOSSARY.errors) assert.ok(stdout.includes(message), message);
});

test('every error in the glossary is one the terminal really prints', () => {
  // One line that triggers each message, set up in the session before it if needed.
  const triggers = {
    'command not found': ['nope'],
    'No such file or directory': ['cat nope.txt'],
    'Not a directory': ['cd ~/welcome.txt'],
    'Is a directory': ['cat /amphoreus'],
    'File exists': ['mkdir ~/a', 'mkdir ~/a'],
    'syntax error': ['ls |'],
    unterminated: ['echo "oops'],
    'usage:': ['mkdir'],
    'unknown option': ['grep -z x ~/welcome.txt'],
    'unknown seed': ['./life --seed nope'],
    'no simulation is running': ['kill 100', 'pause'],
    'pause the simulation first': ['step'],
    'no such process': ['kill 999'],
    'cannot stop itself': ['kill 1'],
    'no mission is active': ['missions hint'],
  };
  assert.deepEqual(Object.keys(triggers).sort(), GLOSSARY.errors.map((e) => e.message).sort());
  for (const [message, lines] of Object.entries(triggers)) {
    assert.ok(session(lines).error.includes(message), `${lines.at(-1)} did not print "${message}"`);
  }
});

test('output starting with a process id is marked, and only when shown directly', () => {
  const pidOf = (lines, app = fakeApp()) => {
    let state = createShell();
    let last;
    for (const line of lines) { last = runLine(state, line, app); state = last.state; }
    return last.output.at(-1)?.pid;
  };
  assert.equal(pidOf(['./life --seed glider']), 101);
  assert.equal(pidOf(['kill 100']), 100);
  assert.equal(pidOf(['ps']), null);
  assert.equal(pidOf(['./life --seed glider | cat']), null, 'piped output is ordinary text');
  // Text that merely looks like a process id stays ordinary text.
  assert.equal(pidOf(['echo "[102] started" > ~/fake.txt', 'cat ~/fake.txt']), null);
});

test('every mission can be finished in order using its own example', () => {
  const app = fakeApp();
  let state = createShell({ '/src/engine/life.js': 'x\n' });
  state = runLine(state, 'missions', app).state;
  assert.equal(state.missionIndex, 0);
  MISSIONS.forEach((mission, index) => {
    const result = runLine(state, mission.example, app);
    state = result.state;
    assert.equal(state.missionIndex, index + 1, `mission ${index + 1} (${mission.title}) did not complete`);
    assert.ok(result.output.some((o) => o.tone === 'mission'), `mission ${index + 1} printed no message`);
  });
  assert.match(runLine(state, 'missions', app).output[0].text, /All missions finished/);
});

test('a failed command does not complete a mission, and no missions run until started', () => {
  assert.equal(session(['pwd']).state.missionIndex, null);
  const stuck = session(['missions', 'pwd', 'ls', 'cd /amphoreus/logs', 'cat nope.log']);
  assert.equal(stuck.state.missionIndex, 3);
});

test('missions can give a hint, stop, and restart', () => {
  assert.match(session(['missions', 'missions hint']).mission, /Hint: pwd/);
  assert.equal(session(['missions', 'missions stop']).state.missionIndex, null);
  assert.equal(session(['missions', 'pwd', 'missions restart']).state.missionIndex, 0);
  assert.match(session(['missions hint']).error, /no mission is active/);
  assert.match(session(['missions nonsense']).error, /usage/);
});
