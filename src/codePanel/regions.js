// ---------------------------------------------------------------------------
// regions.js — pulls real snippets out of our own source files.
//
// SOURCE_FILES holds every source file as text. We cut out the part between
// `// #region name` and `// #endregion`. So the code panel always shows the code
// that is actually running — no copy-pasted text to keep in sync.
// ---------------------------------------------------------------------------
import { SOURCE_FILES } from '../terminal/content/sourceFiles.js';

export function getRegion(file, name) {
  const lines = SOURCE_FILES[`/${file}`].split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `// #region ${name}`);
  if (start === -1) return { file, name, startLine: 1, lines: [`// region "${name}" not found`] };
  let end = start + 1;
  while (end < lines.length && lines[end].trim() !== '// #endregion') end++;
  return { file, name, startLine: start + 2, lines: dedent(lines.slice(start + 1, end)) };
}

// Remove the shared leading indentation so nested code doesn't drift right.
function dedent(lines) {
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min));
}
