// ---------------------------------------------------------------------------
// App — the page around whichever module is active.
//
//   ┌──────────────── code panel ───────────┬──────────── module ─────────────┐
//   │ what just happened + the real code    │ the active module's controls    │
//   │                                       │ and canvas, or the astrolabe    │
//   └───────────────────────────────────────┴─────────────────────────────────┘
//
// App knows nothing about the Game of Life. It looks modules up in MODULES, and
// the active one reports its actions through `log`, which App turns into a
// code panel entry using that module's panelActions.
// ---------------------------------------------------------------------------
import { useCallback, useEffect, useState } from 'react';
import CodePanel from './codePanel/CodePanel.jsx';
import { makeEntry } from './codePanel/entries.js';
import AstrolabeMenu from './components/AstrolabeMenu.jsx';
import { MENU_ACTIONS } from './components/menuActions.js';
import { MODULES } from './modules/index.js';

export default function App() {
  const [activeId, setActiveId] = useState(MODULES[0].id);
  const [menuOpen, setMenuOpen] = useState(false);
  // Empty until the module sends its first entry, just after the first render.
  const [entry, setEntry] = useState(null);

  const activeModule = MODULES.find((module) => module.id === activeId);
  const ActiveComponent = activeModule.Component;

  const log = useCallback((name, details) => {
    setEntry(makeEntry(activeModule.panelActions, name, details));
  }, [activeModule]);

  const openMenu = useCallback(() => {
    setMenuOpen(true);
    setEntry(makeEntry(MENU_ACTIONS, 'open', [`Nodes on dial : ${MODULES.length}`]));
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // #region selectNode
  function selectNode(id) {
    setMenuOpen(false);
    // This one change is the whole switch. The `key` on the module below is its
    // id, so a new id makes React remove the old module and start the new one.
    setActiveId(id);
  }
  // #endregion

  // M opens or closes the astrolabe from any module. Esc closes it.
  useEffect(() => {
    function onKey(event) {
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

  return (
    <div className="app">
      {entry
        ? <CodePanel entry={entry} title={activeModule.label} />
        : <section className="code-panel" />}

      <main className="stage">
        <div className="module-bar">
          <span className="module-name">{activeModule.label}</span>
          <button onClick={menuOpen ? closeMenu : openMenu}>◎ Astrolabe <kbd>M</kbd></button>
        </div>

        <div className="module-area">
          <ActiveComponent key={activeModule.id} log={log} shortcutsEnabled={!menuOpen} />
          {menuOpen && (
            <AstrolabeMenu
              modules={MODULES}
              activeId={activeId}
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
