// Turns a typed line into a plan the shell can run, in two stages:
//   1. tokenize: cut the line into words and operators, respecting quotes
//   2. parseLine: arrange those into commands joined by pipes, plus any redirect
//
//   cat log.txt | grep -i flame > out.txt
//   → stages:   [{ name: 'cat',  args: ['log.txt'] },
//                { name: 'grep', args: ['-i', 'flame'] }]
//     redirect: { path: 'out.txt', append: false }

export function tokenize(line) {
  const tokens = [];
  let word = null; // null means we aren't inside a word right now
  let quote = null; // the quote character we're inside, if any

  const finishWord = () => {
    if (word !== null) tokens.push({ type: 'word', value: word });
    word = null;
  };

  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (quote) {
      // Inside quotes, everything is plain text until the closing quote.
      if (char === quote) quote = null;
      else word += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      word = word ?? ''; // so that "" still counts as an (empty) word
    } else if (char === ' ' || char === '\t') {
      finishWord();
    } else if (char === '|') {
      finishWord();
      tokens.push({ type: 'op', value: '|' });
    } else if (char === '>') {
      finishWord();
      const isAppend = line[index + 1] === '>';
      if (isAppend) index++; // >> is two characters, so skip the second one
      tokens.push({ type: 'op', value: isAppend ? '>>' : '>' });
    } else {
      word = (word ?? '') + char;
    }
  }

  if (quote) return { error: `unterminated ${quote} quote` };
  finishWord();
  return { tokens };
}

export function parseLine(line) {
  const { tokens, error } = tokenize(line);
  if (error) return { error };

  const stages = [];
  let words = [];
  let redirect = null;

  const finishStage = () => {
    stages.push({ name: words[0], args: words.slice(1) });
    words = [];
  };

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token.type === 'word') {
      if (redirect) return { error: `syntax error near '${token.value}'` };
      words.push(token.value);
    } else if (token.value === '|') {
      if (words.length === 0 || redirect) return { error: "syntax error near '|'" };
      finishStage();
    } else {
      // A redirect must follow a command and be followed by exactly one file name.
      const next = tokens[index + 1];
      if (words.length === 0 || redirect || next?.type !== 'word') {
        return { error: `syntax error near '${token.value}'` };
      }
      redirect = { path: next.value, append: token.value === '>>' };
      index++; // the file name has been used, so skip past it
    }
  }

  if (words.length > 0) finishStage();
  else if (stages.length > 0) return { error: "syntax error near '|'" };
  return { stages, redirect };
}
