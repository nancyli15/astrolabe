// The terminal's scrollback is a list of items, each drawn by Terminal.jsx:
//   input  a line the user typed, with the prompt it was typed at
//   text   output from a command. tone can be 'error' or 'mission'. If it has a pid,
//          the text starts with [pid], and that part is drawn as a hoverable label.
//   code  a code panel entry: what just happened, plus the real source behind it
let nextItemId = 0;

export const inputItem = (prompt, text) => ({ id: nextItemId++, kind: 'input', prompt, text });
export const textItem = (text, tone, pid) => ({ id: nextItemId++, kind: 'text', text, tone, pid });
export const codeItem = (entry) => ({ id: nextItemId++, kind: 'code', entry });

// Old lines are dropped past this point, so a long session can't slow the page.
export const MAX_ITEMS = 300;
