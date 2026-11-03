// The files visitors start with. All text here is original and deliberately short.
// Edit or replace it freely: the only other thing that depends on it is the
// tutorial, whose grep mission looks for the word "Coreflame" in cycle-002.log.
export const LORE_FILES = {
  '/home/visitor/welcome.txt':
    'You are running on a simulated disk, kept in memory.\n' +
    'Nothing you create here is saved after a refresh.\n' +
    'Type missions to begin the tutorial.\n',

  '/amphoreus/logs/cycle-001.log':
    '[cycle 001] Seed accepted. The grid begins to breathe.\n' +
    '[cycle 001] Population climbing. Patterns forming along the eastern edge.\n' +
    '[cycle 001] Observer note: it has not stopped yet. It may not want to.\n',

  '/amphoreus/logs/cycle-002.log':
    '[cycle 002] Coreflame readings steady across all sectors.\n' +
    '[cycle 002] A glider crossed the boundary and returned from the other side.\n' +
    '[cycle 002] Coreflame output fell by a third before the next tick.\n' +
    '[cycle 002] Observer note: everything that leaves comes back changed.\n',

  '/amphoreus/logs/cycle-003.log':
    '[cycle 003] Black Tide detected at the edge of the map.\n' +
    '[cycle 003] Cells are going dark faster than they can be born.\n' +
    '[cycle 003] Observer note: purge the board and begin again. Remember this one.\n',

  '/amphoreus/archive/remembrance.txt':
    'Teal and gold are the colours of what survives.\n' +
    'A cell that lasts long enough stops flickering and settles.\n',

  '/amphoreus/archive/black-tide.txt':
    'Violet and black are the colours of what is lost.\n' +
    'Three neighbours can still bring something back from it.\n',
};
