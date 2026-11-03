// ---------------------------------------------------------------------------
// Terminal — the left pane: scrollback above, a prompt to type at below.
//
// This component only deals with the screen and the keyboard. Working out what a
// line means is shell.js's job: this hands it the state and the line, then shows
// what comes back. The scrollback itself lives in App, because the running module
// also adds to it when you use its buttons or shortcuts.
// ---------------------------------------------------------------------------
import { useEffect, useRef, useState } from 'react';
import CodePanel from '../codePanel/CodePanel.jsx';
import { SOURCE_FILES } from './content/sourceFiles.js';
import { displayPath } from './filesystem.js';
import { createShell, runLine } from './shell.js';
import { inputItem, textItem } from './transcript.js';

const promptFor = (shell) => `visitor@astrolabe:${displayPath(shell.cwd)}$`;

export default function Terminal({ title, items, app, onAppend, onClear }) {
  // The shell's state only matters when a line runs, so a ref is enough. The prompt
  // text is drawn from it, and typing always re-renders, so it stays current.
  const shellRef = useRef(null);
  if (shellRef.current === null) shellRef.current = createShell(SOURCE_FILES);

  const [line, setLine] = useState('');
  // Which earlier command Up/Down is showing, counted back from the newest. 0 means
  // none: the user is on the line they were typing, which `draftRef` keeps safe.
  const [historyOffset, setHistoryOffset] = useState(0);
  const draftRef = useRef('');

  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // Keep the newest output in view.
  useEffect(() => {
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [items]);

  function submit() {
    // Show the typed line first, so anything a command logs appears below it.
    onAppend([inputItem(promptFor(shellRef.current), line)]);
    const result = runLine(shellRef.current, line, app);
    shellRef.current = result.state;
    if (result.clear) onClear();
    else onAppend(result.output.map(({ text, tone }) => textItem(text, tone)));
    setLine('');
    setHistoryOffset(0);
  }

  function moveThroughHistory(direction) {
    const { history } = shellRef.current;
    const next = historyOffset + direction;
    if (next < 0 || next > history.length) return;
    if (historyOffset === 0) draftRef.current = line;
    setHistoryOffset(next);
    setLine(next === 0 ? draftRef.current : history[history.length - next]);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      submit();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault(); // stop the cursor jumping to the start of the line
      moveThroughHistory(1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveThroughHistory(-1);
    } else if (event.key === 'Escape') {
      inputRef.current.blur(); // leave the terminal, so the shortcuts work again
    }
  }

  // Clicking anywhere in the pane starts typing, unless the click is selecting text
  // to copy or opening an older code entry.
  function handleClick(event) {
    if (window.getSelection().toString() !== '' || event.target.closest('summary')) return;
    inputRef.current.focus();
  }

  // The most recent code entry starts open. Older ones collapse to a single line.
  const newestCodeId = items.findLast((item) => item.kind === 'code')?.id;

  return (
    <section className="terminal" onClick={handleClick}>
      <header className="panel-header">EXPERIMENT PROGRESS: {title.toUpperCase()}</header>

      <div className="scrollback" ref={scrollRef}>
        {items.map((item) => {
          if (item.kind === 'code') {
            return <CodePanel key={item.id} entry={item.entry} isNewest={item.id === newestCodeId} />;
          }
          if (item.kind === 'input') {
            return (
              <pre key={item.id} className="term-line">
                <span className="term-prompt">{item.prompt}</span> {item.text}
              </pre>
            );
          }
          return <pre key={item.id} className={`term-line ${item.tone ? `tone-${item.tone}` : ''}`}>{item.text}</pre>;
        })}
      </div>

      <label className="prompt-row">
        <span className="term-prompt">{promptFor(shellRef.current)}</span>
        <input
          ref={inputRef}
          className="prompt-input"
          value={line}
          onChange={(event) => setLine(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="click here and type help"
          aria-label="Terminal command"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
        />
      </label>
    </section>
  );
}
