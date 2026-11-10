import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLine } from './parser.js';

test('splits a command from its arguments, ignoring extra spaces', () => {
  assert.deepEqual(parseLine('  ls   -a  /tmp ').stages, [{ name: 'ls', args: ['-a', '/tmp'] }]);
});

test('an empty line has no stages', () => {
  assert.deepEqual(parseLine('   ').stages, []);
});

test('quotes keep spaces and operators together as one word', () => {
  assert.deepEqual(parseLine('echo "a b | c" \'d > e\'').stages[0].args, ['a b | c', 'd > e']);
  assert.deepEqual(parseLine('echo ""').stages[0].args, ['']);
  assert.deepEqual(parseLine('echo pre"mid"post').stages[0].args, ['premidpost']);
});

test('an unterminated quote is an error', () => {
  assert.match(parseLine('echo "oops').error, /unterminated/);
});

test('pipes split a line into stages, with or without spaces', () => {
  const { stages } = parseLine('cat a|grep b | grep c');
  assert.deepEqual(stages.map((stage) => stage.name), ['cat', 'grep', 'grep']);
});

test('redirects are recognised, for overwriting and appending', () => {
  assert.deepEqual(parseLine('echo hi > a.txt').redirect, { path: 'a.txt', append: false });
  assert.deepEqual(parseLine('echo hi>>a.txt').redirect, { path: 'a.txt', append: true });
  assert.deepEqual(parseLine('echo hi > a.txt').stages[0].args, ['hi']);
  assert.equal(parseLine('echo hi').redirect, null);
});

test('misplaced operators are syntax errors', () => {
  for (const line of ['| ls', 'ls |', 'ls | | ls', '> a', 'ls >', 'ls > a b', 'ls > a > b', 'ls > a | ls']) {
    assert.match(parseLine(line).error ?? '', /syntax error/, line);
  }
});
