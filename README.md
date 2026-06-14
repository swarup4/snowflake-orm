# SNOWFLAKE-ORM

A lightweight ORM for **Node.js + Snowflake**, written in TypeScript and shipping
its own type definitions. Define models, run CRUD, joins, sub-queries and
aggregates with a small, Sequelize-/Mongoose-flavoured API.

> **v2.0 — full rewrite.** TypeScript core, connection pooling, typed errors and
> **every value is parameter-bound** (no more string-concatenated SQL). The public
> API (`connect`, `Init`, `save`, `find`, `update`, …) is preserved; see
> [Migrating from 1.x](#migrating-from-1x).

## Requirements

- **Node.js 18 or newer** (Node 20 / 22 LTS recommended)
- `snowflake-sdk` **2.x** and `uuid` **14.x** (installed automatically)

The minimum is set by `snowflake-sdk` 2.x, which declares `engines: node >= 18`.

| Node version | Supported |
|--------------|:---------:|
| 18 / 20 / 22 | ✅ |
| 16 and older | ❌ — `snowflake-sdk` 2.x will warn on install (`EBADENGINE`) and may fail at runtime |

This only concerns the Node runtime your application **runs on** — your own code
can be written in any style. If you must stay on Node 16 or older (both past
end-of-life), either upgrade Node, or pin to `snowflake-orm@1.x` (older
`snowflake-sdk` 1.6 + `uuid` 8), which forgoes the 2.0 TypeScript, parameter-binding
and pooling work.

## Installation

```sh
npm i snowflake-orm
```

---

## Quick start

```javascript
const orm = require('snowflake-orm');

async function main() {
  await orm.connect({
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USERNAME,
    password: process.env.SNOWFLAKE_PASSWORD,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    database: process.env.SNOWFLAKE_DATABASE,
    schema: process.env.SNOWFLAKE_SCHEMA,
    role: process.env.SNOWFLAKE_ROLE,
  });

  const User = orm.define('users', {
    id: { type: orm.VARCHAR(50), require: true },
    name: orm.VARCHAR(100),
    age: orm.INT,
  });

  await User.save({ name: 'Alice', age: 30 }); // id auto-generated (uuid)
  const users = await User.find({ where: { condition: { name: 'Alice' } } });
  console.log(users);

  await orm.disconnect();
}

main().catch(console.error);
```

TypeScript:

```typescript
import orm, { Model, QueryError } from 'snowflake-orm';

await orm.connect({ account, username, password });
const User: Model = orm.define('users', { id: orm.VARCHAR(50), name: orm.VARCHAR(100) });
```

---

## Connecting

### Default connection (backward compatible)

`connect()` is **async** and resolves once the credentials are validated.

```javascript
await orm.connect(dbConfig, options); // options is optional
```

`dbConfig` accepts any [snowflake-sdk connection option](https://docs.snowflake.com/en/developer-guide/node-js/nodejs-driver-options)
(`account`, `username`, `password`, `warehouse`, `database`, `schema`, `role`, …).

`options`:

| Option | Type | Description |
|--------|------|-------------|
| `pool` | `{ min?, max? }` | Connection-pool sizing (defaults `min: 1`, `max: 10`). |
| `logging` | `(entry) => void` | Called after each query with `{ sql, binds, durationMs, queryId }`. |
| `disableOCSPChecks` | `boolean` | Turns off OCSP certificate-revocation checks. Local/dev only. |

```javascript
await orm.disconnect(); // drains the pool
```

### Explicit / multiple connections

Use `createConnection` when you need more than one warehouse/database, or want to
inject the connection into specific models.

```javascript
const analytics = orm.createConnection(analyticsConfig, { pool: { max: 20 } });
await analytics.connect();

const Event = orm.define('events', { id: orm.VARCHAR(50) }, analytics);

await analytics.disconnect();
```

---

## Defining models

`define(tableName, schema, connection?)` returns a distinct `Model` instance — you
can define as many models as you like and they never collide. The `connection`
argument is optional and defaults to the connection created by `orm.connect()`.

```javascript
const User = orm.define('users', {
  id: { type: orm.VARCHAR(50), require: true },
  fname: orm.VARCHAR(50),
  lname: orm.VARCHAR(50),
  username: { type: orm.VARCHAR(70), unique: true, allowNull: true },
  email: orm.VARCHAR(70),
  age: orm.INT,
  status: { type: orm.INT, defaultValue: 1 },
  createdAt: { type: orm.TIMESTAMP('LTZ'), defaultValue: orm.NOW() },
});
```

> The legacy `new orm.Init(table, schema)` constructor still works and is
> equivalent to `orm.define(table, schema)`.

**`id` auto-generation:** if the `id` column is defined as an object with
`require: true`, `save()` generates a UUID for you when you don't supply one —
similar to Mongoose. Pass your own `id` to override it.

### Column definition options

| Key | Description |
|-----|-------------|
| `type` | A data type (see below). |
| `require` | On `id` only — auto-generate a UUID on `save()`. |
| `allowNull` | `true` → `NULL`, `false` → `NOT NULL`. |
| `defaultValue` | Column default (e.g. `1`, `orm.NOW()`). |
| `primaryKey` | Adds `PRIMARY KEY`. |
| `unique` | Adds `UNIQUE`. |
| `autoIncrement` | Adds `AUTOINCREMENT`. |
| `references` | `{ model, column }` → `FOREIGN KEY`. |

> Snowflake does not enforce `PRIMARY KEY` / `FOREIGN KEY` / `UNIQUE` constraints —
> they are accepted but informational. Prefer the `id` + `require: true` pattern.

### Data types

```javascript
// Numbers
orm.NUMBER, orm.INT, orm.INTEGER, orm.FLOAT, orm.DOUBLE
// Text
orm.STRING(length), orm.VARCHAR(length), orm.CHAR(length)
// Date / time
orm.DATE, orm.DATETIME, orm.TIMESTAMP(), orm.TIMESTAMP('LTZ'), orm.TIMESTAMP('NTZ'), orm.NOW()
// Other
orm.BINARY, orm.BOOLEAN, orm.ARRAY
```

### Create / drop the table

```javascript
await User.create(); // CREATE TABLE
await User.drop();   // DROP TABLE
```

---

## CRUD

All methods are `async`. **Finders** resolve to data; **writes** resolve to a
normalized result object `{ rows, rowCount, queryId }`.

| Method | Resolves to |
|--------|-------------|
| `find(options)` | `Row[]` |
| `findById(id)` | `Row \| undefined` |
| `findByFunction(options)` | `Row \| undefined` |
| `save(data)` | `{ rows, rowCount, queryId }` |
| `update(data, options)` | `{ rows, rowCount, queryId }` |
| `updateById(data, id)` | `{ rows, rowCount, queryId }` |
| `delete(options)` | `{ rows, rowCount, queryId }` |
| `deleteById(id)` | `{ rows, rowCount, queryId }` |

> **Security:** every value you pass is sent as a bound parameter — never
> concatenated into SQL — so input like `"'; DROP TABLE users; --"` is stored as a
> literal string, not executed.

### Insert

```javascript
const result = await User.save(req.body);
console.log(result.rowCount, result.queryId);
```

### Update

```javascript
await User.update(req.body, {
  where: { condition: { fname: 'Swarup', lname: 'Saha' } },
});
```

### Update by id

```javascript
await User.updateById(req.body, id);
```

### Delete

```javascript
await User.delete({
  where: { condition: { fname: 'Swarup', lname: 'Saha' } },
});
```

### Delete by id

```javascript
await User.deleteById(id);
```

---

## Querying with `find`

`find(options)` accepts `column`, `distinct`, `where`, `order` and `limit`.

```javascript
await User.find({});                                  // all rows
await User.find({ column: ['fname', 'lname'] });      // selected columns
await User.find({ column: ['fname'], distinct: true });
```

### Where — equality

```javascript
await User.find({
  where: { condition: { fname: 'Swarup', lname: 'Saha' } },
});
```

### Where — operators

Operators take an **array** of `[field, ...values]`. Keys are case-insensitive.

```javascript
where: {
  operator: {
    LIKE:       ['fname', 'A%'],      // fname LIKE 'A%'
    NOTLIKE:    ['fname', 'A%'],      // fname NOT LIKE 'A%'
    BETWEEN:    ['age', 25, 28],      // age BETWEEN 25 AND 28
    NOTBETWEEN: ['age', 25, 28],
    IN:         ['age', 24, 26, 28],  // age IN (24, 26, 28)
    NOTIN:      ['age', 24, 26, 28],
    GT:         ['age', 25],          // age > 25
    GTE:        ['age', 25],          // age >= 25
    LT:         ['age', 27],          // age < 27
    LTE:        ['age', 27],          // age <= 27
  },
}
```

`condition` and `operator` can be combined; clauses are joined with `AND`.

### Order by

```javascript
await User.find({
  order: { field: 'age', orderBy: 'DESC' }, // ASC (default) or DESC
});
```

### Limit & offset

```javascript
await User.find({ limit: 4 });        // LIMIT 4
await User.find({ limit: [4, 1] });   // LIMIT 4 OFFSET 1
```

---

## Aggregate functions

`findByFunction` takes a `functions` **array**; each entry is `{ name, option }`,
and `option` is an array of `{ column, as?, distinct? }`. Resolves to a single row.

```javascript
await User.findByFunction({
  functions: [
    { name: 'COUNT', option: [{ column: 'id', as: 'count', distinct: true }] },
  ],
  where: { condition: { status: 1 } }, // optional
});
```

Multiple functions / columns:

```javascript
await Order.findByFunction({
  functions: [
    { name: 'SUM', option: [{ column: 'total', as: 'sumTotal' }, { column: 'tax', as: 'sumTax' }] },
    { name: 'AVG', option: [{ column: 'total', as: 'avgTotal' }] },
    { name: 'MAX', option: [{ column: 'total', as: 'maxTotal', distinct: true }] },
    { name: 'MIN', option: [{ column: 'total', as: 'minTotal' }] },
  ],
});
```

---

## Joins

Join methods: `innerJoin`, `leftJoin`, `rightJoin`, `fullJoin`. `eqColumn` is the
join key on the base table; each `include` supplies its own `column` list and
`eqColumn`. `where`, `order`, `limit` and `distinct` are supported.

```javascript
const obj = {
  column: ['fname'],
  eqColumn: 'id',
  include: [
    { model: UserDetails, column: ['homeTown'], eqColumn: 'userId' },
    { model: UserImage,   column: ['image'],    eqColumn: 'userId' },
  ],
  where: { operator: { GT: ['age', 26] } },
};

await User.innerJoin(obj);
await User.leftJoin(obj);
await User.rightJoin(obj);
await User.fullJoin(obj);
```

---

## Sub-queries

A `condition` (or operator) value can be a sub-query. The inner query is inlined
and its bound values are merged into the parent statement.

```javascript
await User.find({
  column: ['fname', 'lname'],
  where: {
    condition: {
      id: {
        subQuery: {
          model: UserImage,
          column: ['userId'],
          where: { condition: { image: 'profile.jpg' } },
        },
      },
    },
  },
});
```

---

## Raw queries

```javascript
const { query } = require('snowflake-orm');

// With binds (recommended)
await query('SELECT * FROM users WHERE fname = ?', ['Swarup']);

// Without binds
await query('SELECT * FROM users');
```

`query` resolves to the rows array.

---

## Errors

Typed errors are exported so you can branch on failure type:

```javascript
const { ConnectionError, QueryError, ValidationError } = require('snowflake-orm');

try {
  await User.find({ where: { condition: { name: 'x' } } });
} catch (err) {
  if (err instanceof QueryError) {
    console.error(err.message, err.sql, err.binds);
  }
}
```

| Error | Thrown when |
|-------|-------------|
| `ConnectionError` | Connect fails, or a query runs before `connect()`. |
| `QueryError` | A statement fails. Carries `sql` and `binds`. |
| `ValidationError` | Reserved for schema validation (Phase 1). |

---

## Logging

```javascript
await orm.connect(dbConfig, {
  logging: ({ sql, binds, durationMs, queryId }) =>
    console.log(`[${durationMs}ms] ${sql} -- ${JSON.stringify(binds)}`),
});
```

---

## Migrating from 1.x

The public API is preserved, but a few behaviours changed:

- **`connect()` is async** — `await` it (or chain `.then`) before running queries.
- **Result shapes:** `find` resolves to a rows array; `findById`/`findByFunction`
  resolve to a single row; writes resolve to `{ rows, rowCount, queryId }`.
- **`findByFunction`** takes a `functions` **array** (was sometimes shown as an
  object in 1.x docs).
- **Operators** use the array form `LIKE: ['fname', 'A%']` (the 1.x object form
  `[{ filed, value }]` is no longer accepted).
- **All values are bound** — behaviour is identical for valid input, but injection
  payloads are now neutralized.
- New: `createConnection`, `disconnect`, connection pooling, `logging`, typed errors.

---

## License

ISC
