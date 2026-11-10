// ---------------------------------------------------------------------------
// AstrolabeMenu — the circular menu that switches between modules.
//
// computeNodePositions (pure maths, tested on its own) decides where nodes go;
// this component only draws them. Nodes are real <button>s rather than shapes on
// a canvas, so clicking, hovering and keyboard focus all work without extra code.
// ---------------------------------------------------------------------------
import { useEffect, useRef, useState } from 'react';
import { computeNodePositions } from '../engine/astrolabe.js';

const ASSET_URL = `${import.meta.env.BASE_URL}assets/`;
const TICK_COUNT = 24; // decorative marks around the outer ring

// Shows your artwork if the file exists, and the fallback drawing if it doesn't.
function OptionalArt({ file, className, fallback }) {
  const [missing, setMissing] = useState(false);
  if (missing) return fallback;
  return <img className={className} src={ASSET_URL + file} alt="" onError={() => setMissing(true)} />;
}

function PlaceholderEmblem() {
  // A simple open book, until your emblem is drawn.
  return (
    <svg className="dial-art" viewBox="0 0 100 100" aria-hidden="true">
      <path d="M50 30 C40 22 24 22 14 27 V74 C24 69 40 69 50 77 C60 69 76 69 86 74 V27 C76 22 60 22 50 30 Z" />
      <path d="M50 30 V77" />
      <path d="M23 38 C30 35.5 36 35.5 42 38 M23 49 C30 46.5 36 46.5 42 49 M23 60 C30 57.5 36 57.5 42 60" />
      <path d="M58 38 C64 35.5 70 35.5 77 38 M58 49 C64 46.5 70 46.5 77 49 M58 60 C64 57.5 70 57.5 77 60" />
    </svg>
  );
}

export default function AstrolabeMenu({ modules, activeId, onSelect, onClose }) {
  const positions = computeNodePositions(modules.length);
  const ticks = computeNodePositions(TICK_COUNT, 47);
  const activeNodeRef = useRef(null);

  // Move keyboard focus onto the current node, so Tab and Enter work right away.
  // After `kill` nothing is running, so the first node takes focus instead.
  useEffect(() => {
    activeNodeRef.current?.focus();
  }, []);

  // Tab cycles around the nodes, so focus can't reach the hidden controls behind
  // the menu. The % wraps around the ends, just like the Game of Life board edges.
  function handleKeyDown(event) {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const nodes = [...event.currentTarget.querySelectorAll('.dial-node')];
    const current = nodes.indexOf(document.activeElement);
    const direction = event.shiftKey ? -1 : 1;
    nodes[(current + direction + nodes.length) % nodes.length].focus();
  }

  return (
    // A click on the dark background closes the menu. Clicks on nodes don't count,
    // because event.target is then the node, not the background itself.
    <div
      className="astrolabe-overlay"
      role="dialog"
      aria-label="Astrolabe module menu"
      onKeyDown={handleKeyDown}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="astrolabe-dial">
        <svg className="dial-lines" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="47" />
          <circle cx="50" cy="50" r="38" />
          <circle cx="50" cy="50" r="17" />
          {positions.map((position, index) => (
            <line key={modules[index].id} x1="50" y1="50" x2={position.x} y2={position.y} />
          ))}
          {ticks.map((tick, index) => (
            <circle key={index} className="dial-tick" cx={tick.x} cy={tick.y} r="0.5" />
          ))}
        </svg>

        <div className="dial-emblem">
          <OptionalArt file="emblem.png" className="dial-art" fallback={<PlaceholderEmblem />} />
        </div>

        {modules.map((module, index) => {
          const isActive = module.id === activeId;
          return (
            <button
              key={module.id}
              ref={isActive || (!activeId && index === 0) ? activeNodeRef : null}
              className={isActive ? 'dial-node active' : 'dial-node'}
              style={{ left: `${positions[index].x}%`, top: `${positions[index].y}%` }}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => onSelect(module.id)}
            >
              <span className="node-glyph">
                <OptionalArt
                  file={`glyph_${module.id}.png`}
                  className="node-art"
                  fallback={<span className="node-letter">{module.label[0]}</span>}
                />
              </span>
              <span className="node-label">{module.label}</span>
            </button>
          );
        })}
      </div>

      <p className="astrolabe-hint">Choose a node · <kbd>M</kbd> or <kbd>Esc</kbd> to close</p>
    </div>
  );
}
