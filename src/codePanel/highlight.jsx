// A tiny syntax highlighter: turns one line of JS into coloured <span>s.
// It builds React elements (never raw HTML), so it's safe from injection.
const TOKEN = new RegExp(
  [
    '(\\/\\/.*$)', // 1: comment
    "('(?:\\\\.|[^'\\\\])*'|\"(?:\\\\.|[^\"\\\\])*\"|`(?:\\\\.|[^`\\\\])*`)", // 2: string
    '\\b(const|let|var|function|return|if|else|for|while|of|new|export|import|from|continue|break|true|false|null)\\b', // 3: keyword
    '\\b(\\d+(?:\\.\\d+)?)\\b', // 4: number
    '\\b([A-Za-z_$][\\w$]*)(?=\\()', // 5: function call
  ].join('|'),
  'g',
);

const CLASS = { 1: 'tok-comment', 2: 'tok-string', 3: 'tok-keyword', 4: 'tok-number', 5: 'tok-fn' };

export function highlightLine(line) {
  const parts = [];
  let last = 0;
  for (const match of line.matchAll(TOKEN)) {
    if (match.index > last) parts.push(line.slice(last, match.index));
    const group = [1, 2, 3, 4, 5].find((g) => match[g] !== undefined);
    parts.push(<span key={match.index} className={CLASS[group]}>{match[0]}</span>);
    last = match.index + match[0].length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts;
}
