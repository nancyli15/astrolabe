// One code entry in the terminal's scrollback: what just happened, the real code
// behind it, and a plain-English explanation. <details> is a built-in HTML element
// that opens and closes when its <summary> line is clicked, with no extra code.
import { highlightLine } from './highlight.jsx';

export default function CodePanel({ entry, isNewest }) {
  const { region } = entry;
  return (
    <details className="code-entry" open={isNewest}>
      <summary className="log-status">[STATUS] {entry.status}</summary>

      <pre className="log">
        <span className="log-dim">[STDOUT @ {entry.time}]</span>
        {entry.details.map((detail) => `\n${detail}`)}
      </pre>

      <div className="code-file">
        {region.file} <span className="log-dim">· {region.name}()</span>
      </div>
      <pre className="code">
        {region.lines.map((line, index) => (
          <div className="code-line" key={index}>
            <span className="line-no">{region.startLine + index}</span>
            <span>{highlightLine(line)}</span>
          </div>
        ))}
      </pre>

      <p className="note">
        <span className="note-label">// WHAT THIS DOES</span>
        {'\n'}
        {entry.note}
      </p>
    </details>
  );
}
