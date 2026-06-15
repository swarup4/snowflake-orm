'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { SnowflakeQueryCompiler, OperatorRegistry, defaultOperatorRegistry, QueryError } = require('../dist/index.js');

const EVIL = "'; DROP TABLE users; --";
const c = new SnowflakeQueryCompiler();

test('insert emits placeholders and binds values in column order', () => {
    const { sql, binds } = c.insert('users', { name: EVIL, age: 30 });
    assert.equal(sql, 'INSERT INTO users (name, age) VALUES (?, ?)');
    assert.deepEqual(binds, [EVIL, 30]);
});

test('update emits SET placeholders followed by WHERE binds', () => {
    const { sql, binds } = c.update('users', { name: EVIL }, { condition: { id: 'x' } });
    assert.equal(sql, 'UPDATE users SET name = ? WHERE id = ?');
    assert.deepEqual(binds, [EVIL, 'x']);
});

test('updateById appends the id bind last', () => {
    const { sql, binds } = c.updateById('users', { name: 'Dave' }, 'id-9');
    assert.equal(sql, 'UPDATE users SET name = ? WHERE id = ?');
    assert.deepEqual(binds, ['Dave', 'id-9']);
});

test('delete / deleteById bind their values', () => {
    assert.deepEqual(c.delete('users', { condition: { name: EVIL } }).binds, [EVIL]);
    assert.deepEqual(c.deleteById('users', 'z'), { sql: 'DELETE FROM users WHERE id = ?', binds: ['z'] });
});

test('select binds every operator value in order', () => {
    const { sql, binds } = c.select('users', {
        where: {
            condition: { name: EVIL },
            operator: { GT: ['age', 21], IN: ['status', 1, 2, 3], LIKE: ['email', '%@x.com'], BETWEEN: ['age', 10, 20] },
        },
    });
    assert.equal(
        sql,
        'SELECT * FROM users WHERE name = ? AND age > ? AND status IN (?, ?, ?) AND email LIKE ? AND age BETWEEN ? AND ?',
    );
    assert.deepEqual(binds, [EVIL, 21, 1, 2, 3, '%@x.com', 10, 20]);
});

test('select supports column list, distinct, order, limit/offset', () => {
    const { sql } = c.select('users', {
        column: ['id', 'name'],
        distinct: true,
        order: { field: 'name', orderBy: 'DESC' },
        limit: [10, 5],
    });
    assert.equal(sql, 'SELECT DISTINCT id, name FROM users ORDER BY name DESC LIMIT 10 OFFSET 5');
});

test('limit coerces to numbers (no injection through limit/offset)', () => {
    assert.equal(c.select('users', { limit: ['5; DROP TABLE users', '0'] }).sql, 'SELECT * FROM users LIMIT NaN OFFSET 0');
});

test('sub-query is inlined and its bind merged into the parent', () => {
    const { sql, binds } = c.select('users', {
        column: ['id'],
        where: {
            condition: {
                id: { subQuery: { model: { table: 'posts' }, column: ['userId'], where: { condition: { title: EVIL } } } },
            },
        },
    });
    assert.equal(sql, 'SELECT id FROM users WHERE id = (SELECT userId FROM posts WHERE title = ?)');
    assert.deepEqual(binds, [EVIL]);
});

test('join builds qualified columns + ON clause with bound where', () => {
    const { sql, binds } = c.join('users', ' INNER JOIN ', {
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

test('createTable renders constraints (DDL is structural)', () => {
    const sql = c.createTable('users', {
        id: { type: 'VARCHAR(50)', primaryKey: true },
        name: 'VARCHAR(50)',
        age: { type: 'INT', defaultValue: 0, allowNull: false },
    });
    assert.equal(sql, 'CREATE TABLE users (id VARCHAR(50) PRIMARY KEY NOT NULL, name VARCHAR(50), age INT NOT NULL DEFAULT 0)');
});

test('unsupported operator throws QueryError', () => {
    assert.throws(() => c.select('users', { where: { operator: { BOGUS: ['x', 1] } } }), QueryError);
});

test('Open/Closed: a custom operator can be registered without touching core', () => {
    const registry = defaultOperatorRegistry().register('ne', {
        build: ([field, value]) => ({ sql: `${field} != ?`, binds: [value] }),
    });
    const compiler = new SnowflakeQueryCompiler(registry);
    const { sql, binds } = compiler.select('users', { where: { operator: { NE: ['age', 5] } } });
    assert.equal(sql, 'SELECT * FROM users WHERE age != ?');
    assert.deepEqual(binds, [5]);
    // The default registry is untouched — core has no 'ne' operator.
    assert.equal(new OperatorRegistry().has('ne'), false);
});
