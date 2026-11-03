// What the code panel says when the astrolabe menu opens.
export const MENU_ACTIONS = {
  open: {
    status: 'ASTROLABE ONLINE · SELECT A NODE',
    region: ['src/engine/astrolabe.js', 'nodePositions'],
    note:
      'Each node is placed on a circle. Dividing the full circle by the number of nodes gives each ' +
      'one its angle. Then cos(angle) says how far sideways it sits and sin(angle) how far up or ' +
      'down, each scaled by the radius. Adding a module to the list spaces every node out again.',
  },
};
