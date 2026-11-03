// What the code panel says for the placeholder module.
export const ACTIONS = {
  boot: {
    status: 'NODE SWITCHED · NO MODULE INSTALLED',
    details: ['Module : none installed'],
    region: ['src/App.jsx', 'launchModule'],
    note:
      'Starting a module gives it a new process id and stores that in App. The module\'s `key` is ' +
      'that id, so React removes the old module from the page and starts the new one, and the old ' +
      'module\'s animation loop and keyboard shortcuts are cleaned up with it. This placeholder ' +
      'exists to prove switching works.',
  },
};
