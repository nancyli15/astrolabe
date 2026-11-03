// ---------------------------------------------------------------------------
// App — the page around whichever module is running.
//
//   ┌────────────────── terminal ───────────┬──────────── module ─────────────┐
//   │ commands, their output, and the real  │ the running module's controls   │
//   │ code behind each action               │ and canvas, or the astrolabe    │
//   └───────────────────────────────────────┴─────────────────────────────────┘
//
// App knows nothing about the Game of Life. It connects three things:
//   - modules report actions through `log`, which adds entries to the scrollback
//   - modules hand over their controls through `registerControls`
//   - the terminal reaches those controls through the `app` bridge object below
// ---------------------------------------------------------------------------
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { makeEntry } from './codePanel/entries.js';
import AstrolabeMenu from './components/AstrolabeMenu.jsx';
import { MENU_ACTIONS } from './components/menuActions.js';
import { MODULES } from './modules/index.js';
import { WELCOME_TEXT } from './terminal/content/welcome.js';
import Terminal from './terminal/Terminal.jsx';
import { codeItem, MAX_ITEMS, textItem } from './terminal/transcript.js';

const FIRST_PID = 100;
const findModule = (id) => MODULES.find((module) => module.id === id);

function bootEntry(module, seed) {
  const { boot } = module.panelActions;
  return makeEntry(module.panelActions, 'boot', seed ? [...(boot.details ?? []), `Seed     : ${seed}`] : undefined);
}

export default function App() {
  // What's running: { id, seed, pid }, or null after `kill`.
  const [running, setRunning] = useState({ id: MODULES[0].id, seed: null, pid: FIRST_PID });
  const [menuOpen, setMenuOpen] = useState(false);
  const [items, setItems] = useState(() => [
    codeItem(bootEntry(MODULES[0])),
    // Last, because the terminal opens scrolled to its newest line. The startup code
    // entry is tall, so a list printed before it would start out of view.
    textItem(WELCOME_TEXT, 'mission'),
  ]);

  // Refs hold the latest values for the terminal bridge. A command may start a module
  // and then ask about it before React has had a chance to re-render.
  const runningRef = useRef(running);
  const nextPidRef = useRef(FIRST_PID + 1);
  const controlsRef = useRef(null);

  const runningModule = running ? findModule(running.id) : null;
  const RunningComponent = runningModule?.Component;

  const append = useCallback((newItems) => {
    setItems((current) => [...current, ...newItems].slice(-MAX_ITEMS));
  }, []);
  const clearItems = useCallback(() => setItems([]), []);

  const log = useCallback((name, details) => {
    const module = findModule(runningRef.current?.id);
    if (module) append([codeItem(makeEntry(module.panelActions, name, details))]);
  }, [append]);

  const registerControls = useCallback((controls) => {
    controlsRef.current = controls;
  }, []);

  // #region launchModule
  const launchModule = useCallback((id, seed = null) => {
    const next = { id, seed, pid: nextPidRef.current++ };
    runningRef.current = next;
    // The running module's `key` below is its pid. A new pid makes React remove the
    // old module, along with its animation loop, and start this one from scratch.
    setRunning(next);
    append([codeItem(bootEntry(findModule(id), seed))]);
    return next.pid;
  }, [append]);
  // #endregion

  const openMenu = useCallback(() => {
    setMenuOpen(true);
    append([codeItem(makeEntry(MENU_ACTIONS, 'open', [`Nodes on dial : ${MODULES.length}`]))]);
  }, [append]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  function selectNode(id) {
    setMenuOpen(false);
    if (id !== running?.id) launchModule(id);
  }

  // #region appBridge
  // Everything the terminal is allowed to do to the app. Commands only ever see
  // this object, which is why the tests can swap in a fake one.
  const app = useMemo(() => ({
    status() {
      const current = runningRef.current;
      if (!current) return null;
      const details = controlsRef.current?.status() ?? {};
      return { ...details, pid: current.pid, id: current.id, label: findModule(current.id).label };
    },
    controls: () => controlsRef.current,
    start: launchModule,
    kill() {
      runningRef.current = null;
      setRunning(null);
    },
  }), [launchModule]);
  // #endregion

  // M opens or closes the astrolabe from any module. Esc closes it.
  useEffect(() => {
    function onKey(event) {
      if (event.target.tagName === 'INPUT') return; // the terminal is using this key
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() === 'm') {
        if (menuOpen) closeMenu();
        else openMenu();
      } else if (event.key === 'Escape') {
        closeMenu();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, openMenu, closeMenu]);

  const label = runningModule?.label ?? 'No module running';

  return (
    <div className="app">
      <Terminal title={label} items={items} app={app} onAppend={append} onClear={clearItems} />

      <main className="stage">
        <div className="module-bar">
          <span className="module-name">{label}</span>
          <button onClick={menuOpen ? closeMenu : openMenu}>◎ Astrolabe <kbd>M</kbd></button>
        </div>

        <div className="module-area">
          {running ? (
            <RunningComponent
              key={running.pid}
              log={log}
              shortcutsEnabled={!menuOpen}
              registerControls={registerControls}
              seed={running.seed}
            />
          ) : (
            <div className="coming-soon">
              <p className="coming-soon-title">NO PROCESS RUNNING</p>
              <p>Type ./life in the terminal, or open the astrolabe.</p>
            </div>
          )}
          {menuOpen && (
            <AstrolabeMenu
              modules={MODULES}
              activeId={running?.id}
              onSelect={selectNode}
              onClose={closeMenu}
            />
          )}
        </div>

        <footer className="disclaimer">
          Unofficial fan-made project, not affiliated with or endorsed by HoYoverse. Honkai: Star Rail,
          Amphoreus and related names belong to HoYoverse. All artwork and code are original.
        </footer>
      </main>
    </div>
  );
}
