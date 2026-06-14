'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const orm = require('../dist/index.js');

const env = process.env;
const HAS_CREDS = Boolean(env.SNOWFLAKE_ACCOUNT && env.SNOWFLAKE_USERNAME && env.SNOWFLAKE_PASSWORD);
const skip = HAS_CREDS ? false : 'set SNOWFLAKE_ACCOUNT / SNOWFLAKE_USERNAME / SNOWFLAKE_PASSWORD to run';

// A real round-trip against Snowflake on a throwaway TRANSIENT table.
test('live CRUD round-trip against Snowflake', { skip }, async () => {
  await orm.connect(
    {
      account: env.SNOWFLAKE_ACCOUNT,
      username: env.SNOWFLAKE_USERNAME,
      password: env.SNOWFLAKE_PASSWORD,
      warehouse: env.SNOWFLAKE_WAREHOUSE,
      database: env.SNOWFLAKE_DATABASE,
      schema: env.SNOWFLAKE_SCHEMA,
      role: env.SNOWFLAKE_ROLE,
    },
    { logging: (e) => console.log(`[sql ${e.durationMs}ms] ${e.sql} -- ${JSON.stringify(e.binds)}`) },
  );

  const table = `orm_test_${Date.now()}`;
  const User = orm.define(table, {
    id: { type: orm.VARCHAR(50), require: true },
    name: orm.VARCHAR(100),
    age: orm.INT,
  });

  try {
    await orm.query(`CREATE TRANSIENT TABLE ${table} (id VARCHAR(50), name VARCHAR(100), age INT)`);

    const saved = await User.save({ name: "O'Brien; DROP TABLE x", age: 30 });
    assert.equal(saved.rowCount, 1);

    const all = await User.find({});
    assert.equal(all.length, 1);
    assert.equal(all[0].NAME, "O'Brien; DROP TABLE x", 'injection payload stored verbatim, not executed');
    const id = all[0].ID;

    const byId = await User.findById(id);
    assert.equal(byId.AGE, 30);

    const updated = await User.update({ age: 31 }, { where: { condition: { id } } });
    assert.equal(updated.rowCount, 1);
    assert.equal((await User.findById(id)).AGE, 31);

    const del = await User.deleteById(id);
    assert.equal(del.rowCount, 1);
    assert.equal((await User.find({})).length, 0);
  } finally {
    await orm.query(`DROP TABLE IF EXISTS ${table}`).catch(() => {});
    await orm.disconnect();
  }
});
