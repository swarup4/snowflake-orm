'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

// Install the snowflake-sdk mock BEFORE loading the library.
const control = require('./helpers/mock-snowflake');
const orm = require('../dist/index.js');

const CONFIG = { account: 'acc', username: 'u', password: 'p' };
const EVIL = "'; DROP TABLE users; --";

const lastExecuted = () => control.executed.at(-1);

test.beforeEach(async () => {
  control.reset();
  await orm.connect(CONFIG);
});

test.afterEach(async () => {
  await orm.disconnect();
});

test('connect validates the credentials with SELECT 1', () => {
  assert.equal(control.executed[0].sqlText, 'SELECT 1');
});

test('connect does not disable OCSP unless asked', async () => {
  assert.deepEqual(control.configureCalls, []);
  await orm.disconnect();
  await orm.connect(CONFIG, { disableOCSPChecks: true });
  assert.deepEqual(control.configureCalls, [{ disableOCSPChecks: true }]);
});

test('save round-trip: binds values, returns rowCount from getNumUpdatedRows + queryId', async () => {
  control.responder = () => ({ rows: [{ 'number of rows inserted': 1 }], queryId: 'q-save', numUpdatedRows: 1 });
  const User = orm.define('users', { id: { type: orm.VARCHAR(50), require: true }, name: orm.VARCHAR(50) });

  const result = await User.save({ name: 'Alice' });

  const call = lastExecuted();
  assert.match(call.sqlText, /^INSERT INTO users \(id, name\) VALUES \(\?, \?\)$/);
  assert.equal(call.binds.length, 2);
  assert.equal(typeof call.binds[0], 'string');
  assert.equal(call.binds[0].length, 36, 'auto-generated uuid');
  assert.equal(call.binds[1], 'Alice');

  assert.equal(result.rowCount, 1, 'rowCount comes from getNumUpdatedRows()');
  assert.equal(result.queryId, 'q-save', 'queryId comes from getQueryId()');
  assert.deepEqual(result.rows, [{ 'number of rows inserted': 1 }]);
});

test('save keeps a caller-provided id and binds an injection payload safely', async () => {
  const Post = orm.define('posts', { id: { type: orm.VARCHAR(50), require: true }, title: orm.VARCHAR(50) });
  await Post.save({ id: 'fixed', title: EVIL });
  const call = lastExecuted();
  assert.match(call.sqlText, /^INSERT INTO posts \(id, title\) VALUES \(\?, \?\)$/);
  assert.deepEqual(call.binds, ['fixed', EVIL]);
});

test('find round-trip returns the rows array unwrapped', async () => {
  const rows = [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }];
  control.responder = () => ({ rows, queryId: 'q-find' });
  const User = orm.define('users', { id: orm.VARCHAR(50), name: orm.VARCHAR(50) });

  const out = await User.find({ where: { condition: { name: EVIL } } });

  assert.deepEqual(out, rows);
  const call = lastExecuted();
  assert.equal(call.sqlText, 'SELECT * FROM users WHERE name = ?');
  assert.deepEqual(call.binds, [EVIL]);
});

test('findById binds the id and returns a single row', async () => {
  control.responder = () => ({ rows: [{ id: '42', name: 'Carol' }] });
  const User = orm.define('users', { id: orm.VARCHAR(50) });
  const out = await User.findById('42');
  assert.deepEqual(out, { id: '42', name: 'Carol' });
  assert.deepEqual(lastExecuted(), { sqlText: 'SELECT * FROM users WHERE id = ?', binds: ['42'] });
});

test('update round-trip binds SET then WHERE and reports affected rows', async () => {
  control.responder = () => ({ rows: [], queryId: 'q-upd', numUpdatedRows: 3 });
  const User = orm.define('users', { id: orm.VARCHAR(50), name: orm.VARCHAR(50) });

  const result = await User.update({ name: EVIL }, { where: { condition: { id: '7' } } });

  assert.equal(lastExecuted().sqlText, 'UPDATE users SET name = ? WHERE id = ?');
  assert.deepEqual(lastExecuted().binds, [EVIL, '7']);
  assert.equal(result.rowCount, 3);
});

test('updateById appends the id bind last', async () => {
  control.responder = () => ({ numUpdatedRows: 1 });
  const User = orm.define('users', { id: orm.VARCHAR(50), name: orm.VARCHAR(50) });
  await User.updateById({ name: 'Dave' }, 'id-9');
  assert.equal(lastExecuted().sqlText, 'UPDATE users SET name = ? WHERE id = ?');
  assert.deepEqual(lastExecuted().binds, ['Dave', 'id-9']);
});

test('delete and deleteById bind their values', async () => {
  const User = orm.define('users', { id: orm.VARCHAR(50) });
  await User.delete({ where: { condition: { name: EVIL } } });
  assert.deepEqual(lastExecuted().binds, [EVIL]);
  await User.deleteById('z');
  assert.deepEqual(lastExecuted(), { sqlText: 'DELETE FROM users WHERE id = ?', binds: ['z'] });
});

test('rowCount falls back to getNumRows when getNumUpdatedRows is undefined', async () => {
  control.responder = () => ({ rows: [], numRows: 7 }); // SELECT-style: no updated rows
  const User = orm.define('users', { id: orm.VARCHAR(50) });
  const result = await User.update({ name: 'x' });
  assert.equal(result.rowCount, 7);
});

test('rowCount falls back to rows.length when no count is available', async () => {
  control.responder = () => ({ rows: [{ a: 1 }, { a: 2 }] }); // neither count method returns a value
  const User = orm.define('users', { id: orm.VARCHAR(50) });
  const result = await User.update({ name: 'x' });
  assert.equal(result.rowCount, 2);
});

test('two models coexist without collision', async () => {
  const User = orm.define('users', { id: orm.VARCHAR(50) });
  const Post = orm.define('posts', { id: orm.VARCHAR(50) });
  await User.find({});
  assert.equal(lastExecuted().sqlText, 'SELECT * FROM users');
  await Post.find({});
  assert.equal(lastExecuted().sqlText, 'SELECT * FROM posts');
  assert.equal(User.table, 'users');
  assert.equal(Post.table, 'posts');
});

test('logging hook receives sql, binds, timing and queryId', async () => {
  await orm.disconnect();
  const logged = [];
  await orm.connect(CONFIG, { logging: (e) => logged.push(e) });
  control.responder = () => ({ rows: [], queryId: 'q-log' });

  await orm.query('SELECT * FROM users WHERE id = ?', ['7']);

  const entry = logged.at(-1);
  assert.equal(entry.sql, 'SELECT * FROM users WHERE id = ?');
  assert.deepEqual(entry.binds, ['7']);
  assert.equal(entry.queryId, 'q-log');
  assert.equal(typeof entry.durationMs, 'number');
  assert.ok(entry.durationMs >= 0);
});

test('errors are wrapped in QueryError carrying the sql + binds', async () => {
  control.responder = () => ({ err: new Error('boom') });
  const User = orm.define('users', { id: orm.VARCHAR(50) });

  await assert.rejects(
    () => User.find({ where: { condition: { name: EVIL } } }),
    (err) => {
      assert.equal(err.constructor.name, 'QueryError');
      assert.equal(err.message, 'boom');
      assert.equal(err.sql, 'SELECT * FROM users WHERE name = ?');
      assert.deepEqual(err.binds, [EVIL]);
      return true;
    },
  );
});

test('disconnect drains + clears the pool and blocks further queries', async () => {
  await orm.disconnect();
  assert.equal(control.drained, true);
  assert.equal(control.cleared, true);
  await assert.rejects(() => orm.query('SELECT 1'), (err) => err.constructor.name === 'ConnectionError');
});
