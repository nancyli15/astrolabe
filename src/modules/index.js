// The list of everything the astrolabe can open. To add a module, build its
// component and actions, then add one entry here: the menu and App pick it up.
//
// Every module has the same shape:
//   id            unique name; also names its optional art, assets/glyph_<id>.png
//   label         the name shown on the dial and in the code panel
//   Component     what to show. It receives `log` and `shortcutsEnabled`.
//   panelActions  what the code panel says for each action the module logs
import LifeModule from './life/LifeModule.jsx';
import { ACTIONS as LIFE_ACTIONS } from './life/actions.js';
import ComingSoonModule from './comingSoon/ComingSoonModule.jsx';
import { ACTIONS as COMING_SOON_ACTIONS } from './comingSoon/actions.js';

export const MODULES = [
  {
    id: 'eternal-recurrence',
    label: 'Eternal Recurrence',
    Component: LifeModule,
    panelActions: LIFE_ACTIONS,
  },
  {
    id: 'uncharted',
    label: 'Uncharted',
    Component: ComingSoonModule,
    panelActions: COMING_SOON_ACTIONS,
  },
];
