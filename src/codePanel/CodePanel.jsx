// The left-hand "diagnostics feed": shows what just happened, the real code
// behind it, and a plain-English explanation.
import { highlightLine } from './highlight.jsx';

export default function CodePanel({ entry, title }) {
  const { region } = entry;
  return (
    // `key` makes React treat each new entry as a new element, which replays
    // the CSS flash animation.
    <section className="code-panel" key={entry.id}>
      <header className="panel-header">EXPERIMENT PROGRESS: {title.toUpperCase()}</header>

      <pre className="log">
        <span className="log-dim">[STDOUT @ {entry.time}]</span>
        {'\n'}
        <span className="log-status">[STATUS] {entry.status}</span>
        {entry.details.map((d) => `\n${d}`)}
      </pre>

      <div className="code-file">
        {region.file} <span className="log-dim">· {region.name}()</span>
      </div>
      <pre className="code">
        {region.lines.map((line, i) => (
          <div className="code-line" key={i}>
            <span className="line-no">{region.startLine + i}</span>
            <span>{highlightLine(line)}</span>
          </div>
        ))}
      </pre>

      <p className="note">
        <span className="note-label">// WHAT THIS DOES</span>
        {'\n'}
        {entry.note}
      </p>
    </section>
  );
}
