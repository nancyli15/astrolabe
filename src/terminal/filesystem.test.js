import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HOME, addFile, displayPath, getNode, listDir, makeDir, makeDirNode, resolvePath, writeFile,
} from './filesystem.js';

test('resolvePath handles relative paths, absolute paths, . and ..', () => {
  assert.equal(resolvePath('/a/b', 'c'), '/a/b/c');
  assert.equal(resolvePath('/a/b', '/x/y'), '/x/y');
  assert.equal(resolvePath('/a/b', '..'), '/a');
  assert.equal(resolvePath('/a/b', '../../..'), '/');
  assert.equal(resolvePath('/a/b', './c/../d'), '/a/b/d');
  assert.equal(resolvePath('/a/b'), '/a/b');
});

test('~ means the home folder', () => {
  assert.equal(resolvePath('/a', '~'), HOME);
  assert.equal(resolvePath('/a', '~/notes'), `${HOME}/notes`);
  assert.equal(displayPath(`${HOME}/notes`), '~/notes');
  assert.equal(displayPath('/amphoreus'), '/amphoreus');
});

test('addFile creates the folders a file needs', () => {
  const root = addFile(makeDirNode(), '/a/b/c.txt', 'hi');
  assert.equal(getNode(root, '/a/b/c.txt').content, 'hi');
  assert.equal(getNode(root, '/a/b').type, 'dir');
  assert.equal(getNode(root, '/a/nope'), null);
});

test('changing the disk returns a new root and leaves the old one untouched', () => {
  const before = addFile(makeDirNode(), '/a/file.txt', 'old');
  const { root: after } = writeFile(before, '/a/file.txt', 'new');
  assert.equal(getNode(before, '/a/file.txt').content, 'old');
  assert.equal(getNode(after, '/a/file.txt').content, 'new');
});

test('writeFile can append, and reports bad paths', () => {
  const start = addFile(makeDirNode(), '/a/file.txt', 'one\n');
  const { root } = writeFile(start, '/a/file.txt', 'two\n', { append: true });
  assert.equal(getNode(root, '/a/file.txt').content, 'one\ntwo\n');
  assert.equal(writeFile(start, '/a', 'x').error, 'Is a directory');
  assert.equal(writeFile(start, '/missing/file.txt', 'x').error, 'No such file or directory');
  assert.equal(writeFile(start, '/a/file.txt/inner', 'x').error, 'No such file or directory');
});

test('makeDir creates one folder and reports problems', () => {
  const start = addFile(makeDirNode(), '/a/file.txt', '');
  assert.equal(getNode(makeDir(start, '/a/new').root, '/a/new').type, 'dir');
  assert.equal(makeDir(start, '/a').error, 'File exists');
  assert.equal(makeDir(start, '/x/y').error, 'No such file or directory');
  assert.equal(makeDir(start, '/a/file.txt/y').error, 'No such file or directory');
});

test('listDir sorts its entries and reports bad paths', () => {
  let root = addFile(makeDirNode(), '/b.txt', '');
  root = addFile(root, '/a/c.txt', '');
  assert.deepEqual(listDir(root, '/').entries, [{ name: 'a', type: 'dir' }, { name: 'b.txt', type: 'file' }]);
  assert.equal(listDir(root, '/b.txt').error, 'Not a directory');
  assert.equal(listDir(root, '/nope').error, 'No such file or directory');
});

test('names like __proto__ are treated as ordinary missing files', () => {
  assert.equal(getNode(makeDirNode(), '/__proto__'), null);
  assert.equal(getNode(makeDirNode(), '/constructor'), null);
});
