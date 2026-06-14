'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const b = require('../dist/sql/builder.js');

const EVIL = "'; DROP TABLE users; --";

test('buildInsert emits placeholders and binds values in column order', () => {
  const { sql, binds } = b.buildInsert('users', { name: EVIL, age: 30 });
  assert.equal(sql, 'INSERT INTO users (name, age) VALUES (?, ?)');
  assert.deepEqual(binds, [EVIL, 30]);
});

test('buildUpdate emits SET placeholders followed by WHERE binds', () => {
  const { sql, binds } = b.buildUpdate('users', { name: EVIL }, { condition: { id: 'x' } });
  assert.equal(sql, 'UPDATE users SET name = ? WHERE id = ?');
  assert.deepEqual(binds, [EVIL, 'x']);
});

test('buildDelete binds the value', () => {
  const { sql, binds } = b.buildDelete('users', { condition: { name: EVIL } });
  assert.equal(sql, 'DELETE FROM users WHERE name = ?');
  assert.deepEqual(binds, [EVIL]);
});

test('buildSelect binds every operator value in order', () => {
  const { sql, binds } = b.buildSelect('users', {
    where: {
      condition: { name: EVIL },
      operator: {
        GT: ['age', 21],
        IN: ['status', 1, 2, 3],
        LIKE: ['email', '%@x.com'],
        BETWEEN: ['age', 10, 20],
      },
    },
  });
  assert.equal(
    sql,
    'SELECT * FROM users WHERE name = ? AND age > ? AND status IN (?, ?, ?) AND email LIKE ? AND age BETWEEN ? AND ?',
  );
  assert.deepEqual(binds, [EVIL, 21, 1, 2, 3, '%@x.com', 10, 20]);
});

test('buildSelect supports column list, distinct, order, limit/offset', () => {
  const { sql, binds } = b.buildSelect('users', {
    column: ['id', 'name'],
    distinct: true,
    order: { field: 'name', orderBy: 'DESC' },
    limit: [10, 5],
  });
  assert.equal(sql, 'SELECT DISTINCT id, name FROM users ORDER BY name DESC LIMIT 10 OFFSET 5');
  assert.deepEqual(binds, []);
});

test('limit coerces to numbers (no injection through limit/offset)', () => {
  const { sql } = b.buildSelect('users', { limit: ['5; DROP TABLE users', '0'] });
  assert.equal(sql, 'SELECT * FROM users LIMIT NaN OFFSET 0');
});

test('subquery is inlined and its bind merged into the parent', () => {
  const { sql, binds } = b.buildSelect('users', {
    column: ['id'],
    where: {
      condition: {
        id: {
          subQuery: {
            model: { table: 'posts' },
            column: ['userId'],
            where: { condition: { title: EVIL } },
          },
        },
      },
    },
  });
  assert.equal(sql, 'SELECT id FROM users WHERE id = (SELECT userId FROM posts WHERE title = ?)');
  assert.deepEqual(binds, [EVIL]);
});

test('buildJoin builds qualified columns + ON clause with bound where', () => {
  const { sql, binds } = b.buildJoin('users', ' INNER JOIN ', {
    column: ['fname'],
    eqColumn: 'id',
    include: [{ model: { table: 'details' }, column: ['phone'], eqColumn: 'userId' }],
    where: { operator: { GT: ['age', 26] } },
  });
  assert.equal(
    sql,
    'SELECT users.fname, details.phone FROM users INNER JOIN details ON users.id = details.userId WHERE age > ?',
  );
  assert.deepEqual(binds, [26]);
});

test('buildCreateTable renders constraints (DDL is structural)', () => {
  const sql = b.buildCreateTable('users', {
    id: { type: 'VARCHAR(50)', primaryKey: true },
    name: 'VARCHAR(50)',
    age: { type: 'INT', defaultValue: 0, allowNull: false },
  });
  assert.equal(
    sql,
    'CREATE TABLE users (id VARCHAR(50) PRIMARY KEY NOT NULL, name VARCHAR(50), age INT NOT NULL DEFAULT 0)',
  );
});

test('unsupported operator throws QueryError', () => {
  const { QueryError } = require('../dist/index.js');
  assert.throws(() => b.buildWhere({ operator: { BOGUS: ['x', 1] } }), QueryError);
});
