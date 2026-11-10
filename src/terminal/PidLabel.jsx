// ---------------------------------------------------------------------------
// PidLabel — a [102] in the terminal that explains itself when hovered or focused.
//
// The scrollback clips anything that overflows it, so the box uses position: fixed,
// which places it relative to the window instead. That means working out where it
// goes ourselves, from where the label is on screen when it opens.
// ---------------------------------------------------------------------------
import { useEffect, useRef, useState } from 'react';
import { GLOSSARY } from './content/glossary.js';

const BOX_WIDTH = 580;
const EDGE = 8; // keep this far from the window's edge
const GAP = 6; // space between the label and the box
const CLOSE_DELAY_MS = 150; // long enough to move the mouse across the gap

export default function PidLabel({ pid }) {
  // Where the box goes while open, or null while closed.
  const [position, setPosition] = useState(null);
  const labelRef = useRef(null);
  const boxRef = useRef(null);
  const closeTimer = useRef(null);

  function open() {
    clearTimeout(closeTimer.current);
    const rect = labelRef.current.getBoundingClientRect();
    const width = Math.min(BOX_WIDTH, window.innerWidth - EDGE * 2);
    const roomAbove = rect.top - GAP - EDGE;
    const roomBelow = window.innerHeight - rect.bottom - GAP - EDGE;
    // Open on whichever side has more room. Past that, the box scrolls.
    setPosition({
      left: Math.max(EDGE, Math.min(rect.left, window.innerWidth - width - EDGE)),
      width,
      ...(roomAbove >= roomBelow
        ? { bottom: window.innerHeight - rect.top + GAP, maxHeight: roomAbove }
        : { top: rect.bottom + GAP, maxHeight: roomBelow }),
    });
  }

  function closeSoon() {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setPosition(null), CLOSE_DELAY_MS);
  }

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // A fixed box wouldn't move with the scrollback, so close it when that scrolls.
  // Scrolling inside the box itself is fine. `true` listens to every scrollable area.
  const isOpen = position !== null;
  useEffect(() => {
    if (!isOpen) return undefined;
    function onScroll(event) {
      if (!boxRef.current?.contains(event.target)) setPosition(null);
    }
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [isOpen]);

  return (
    <span
      ref={labelRef}
      className="pid-label"
      tabIndex={0}
      aria-label={`Process ID ${pid}. Focus to show what this means.`}
      onMouseEnter={open}
      onMouseLeave={closeSoon}
      onFocus={open}
      onBlur={closeSoon}
      onKeyDown={(event) => { if (event.key === 'Escape') setPosition(null); }}
    >
      [{pid}]
      {position && (
        // Inside the label, so moving the mouse onto the box still counts as hovering.
        <span ref={boxRef} className="pid-box" role="tooltip" style={position}>
          <span className="pid-box-title">PID {pid}: PROCESS ID</span>
          {GLOSSARY.pid.map((line) => <span key={line} className="pid-box-text">{line}</span>)}
          <span className="pid-box-text">To stop this one: kill {pid}</span>

          <span className="pid-box-title">STATUS (shown by ps)</span>
          <span className="pid-box-grid">
            {GLOSSARY.statuses.map(({ name, meaning }) => (
              <span key={name} className="pid-box-row"><b>{name}</b><span>{meaning}</span></span>
            ))}
          </span>

          <span className="pid-box-title">ERROR MESSAGES</span>
          <span className="pid-box-grid">
            {GLOSSARY.errors.map(({ message, meaning }) => (
              <span key={message} className="pid-box-row"><b>{message}</b><span>{meaning}</span></span>
            ))}
          </span>

          <span className="pid-box-text pid-box-hint">Type glossary to print this in the terminal.</span>
        </span>
      )}
    </span>
  );
}
