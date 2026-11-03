// The first thing visitors read in the terminal. Keep each line to 44 characters or
// fewer: that's what fits the pane at its narrowest, so the columns stay lined up.
export const WELCOME_TEXT = [
  'Welcome! This is a simulated shell.',
  'Nothing here touches your computer.',
  '',
  'Click here, type a command, press Enter:',
  '',
  '  help                  list every command',
  '  missions              Linux tutorial',
  '  ls                    list files',
  '  cat /src/App.jsx      read the real code',
  '  ./life --seed glider  start a new board',
  '  pause                 freeze the board',
  '  resume                unfreeze it',
  '  ps                    see what\'s running',
].join('\n');
