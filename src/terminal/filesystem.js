// The terminal's pretend disk: a tree of folders and files kept in memory.
//
// A folder is { type: 'dir', children: { name: node } }.
// A file is { type: 'file', content: 'text' }.
//
// These are pure functions, like the Game of Life engine. Changing something
// returns a NEW root and leaves the old one alone. Anything that can fail returns
// either { root } or { error }, so the commands decide how to report it.

export const HOME = '/home/visitor';

export const makeDirNode = (children = {}) => ({ type: 'dir', children });
export const makeFileNode = (content = '') => ({ type: 'file', content });

// Turns what the user typed into one clean absolute path, the way a real shell does.
export function resolvePath(cwd, path = '.') {
  let full = path;
  if (path === '~' || path.startsWith('~/')) {
    full = HOME + path.slice(1); // ~ is a nickname for the home folder
  } else if (!path.startsWith('/')) {
    full = `${cwd}/${path}`; // relative paths start from the current folder
  }

  const parts = [];
  for (const part of full.split('/')) {
    if (part === '..') parts.pop(); // go up one level (at the root, this does nothing)
    else if (part !== '' && part !== '.') parts.push(part);
  }
  return `/${parts.join('/')}`;
}

const pathParts = (path) => path.split('/').filter(Boolean);

// Shows the home folder as ~ in the prompt.
export function displayPath(path) {
  if (path === HOME) return '~';
  return path.startsWith(`${HOME}/`) ? `~${path.slice(HOME.length)}` : path;
}

// Walks down the tree one name at a time, like following a path through folders.
export function getNode(root, path) {
  let node = root;
  for (const name of pathParts(path)) {
    if (node.type !== 'dir' || !Object.hasOwn(node.children, name)) return null;
    node = node.children[name];
  }
  return node;
}

// Rebuilds only the folders along the path. Every other folder is shared with the
// old tree, so a change never has to copy the whole disk.
function setNode(node, names, newNode) {
  if (names.length === 0) return newNode;
  const [name, ...rest] = names;
  return makeDirNode({ ...node.children, [name]: setNode(node.children[name], rest, newNode) });
}

// Finds the folder that should hold a new entry at this path.
function parentOf(path) {
  const names = pathParts(path);
  return `/${names.slice(0, -1).join('/')}`;
}

export function listDir(root, path) {
  const node = getNode(root, path);
  if (!node) return { error: 'No such file or directory' };
  if (node.type !== 'dir') return { error: 'Not a directory' };
  const names = Object.keys(node.children).sort();
  return { entries: names.map((name) => ({ name, type: node.children[name].type })) };
}

export function makeDir(root, path) {
  if (getNode(root, path)) return { error: 'File exists' };
  const parent = getNode(root, parentOf(path));
  if (!parent || parent.type !== 'dir') return { error: 'No such file or directory' };
  return { root: setNode(root, pathParts(path), makeDirNode()) };
}

export function writeFile(root, path, content, { append = false } = {}) {
  const existing = getNode(root, path);
  if (existing?.type === 'dir' || path === '/') return { error: 'Is a directory' };
  const parent = getNode(root, parentOf(path));
  if (!parent || parent.type !== 'dir') return { error: 'No such file or directory' };
  const text = append && existing ? existing.content + content : content;
  return { root: setNode(root, pathParts(path), makeFileNode(text)) };
}

// Creates a file, along with any folders it needs. Used to build the starting disk.
export function addFile(root, path, content) {
  const names = pathParts(path);
  let next = root;
  for (let depth = 1; depth < names.length; depth++) {
    const folder = `/${names.slice(0, depth).join('/')}`;
    if (!getNode(next, folder)) next = setNode(next, pathParts(folder), makeDirNode());
  }
  return setNode(next, names, makeFileNode(content));
}
