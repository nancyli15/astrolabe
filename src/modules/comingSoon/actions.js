// What the code panel says for the placeholder module.
export const ACTIONS = {
  boot: {
    status: 'NODE SWITCHED · NO MODULE INSTALLED',
    region: ['src/App.jsx', 'selectNode'],
    note:
      'Clicking a node only changes which module id App remembers. React then removes the old ' +
      'module from the page and shows the new one, and the old module\'s animation loop and ' +
      'keyboard shortcuts are cleaned up with it. This placeholder exists to prove switching works.',
  },
};
