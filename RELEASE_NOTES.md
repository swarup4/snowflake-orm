# Release Notes

## v2.0.0 — Foundation rewrite

A full rewrite of the core. The library is now written in **TypeScript**, ships
its own type definitions, and closes a critical SQL-injection hole — while keeping
the public API (`connect`, `Init`, `save`, `find`, `update`, …) working.

> **Heads-up:** this is a major release. The API names are unchanged, but a few
> behaviours changed (see [Breaking changes](#breaking-changes)). Requires
> **Node.js 18+**.

---

### 🔒 Security — SQL injection fixed (most important change)

In 1.x almost every read/write path built SQL by string concatenation
(`key + "='" + value + "'"`), so any method except the `*ById` ones and raw
`query()` was injectable.

Every value now flows through Snowflake **bind parameters**: the SQL builder emits
`?` placeholders and a parallel `binds` array. Input like
`"'; DROP TABLE users; --"` is stored as a literal string, never executed. This
covers `save`, `find`, `update`, `delete`, all `where` operators, sub-queries and
joins. `LIMIT`/`OFFSET` are coerced to numbers.

### 🧱 Real `Model` class (multi-model support)

1.x mutated a single shared `snowflakeObj` singleton, so defining a second model
overwrote the first. `define(table, schema)` (and the legacy `new Init(...)`) now
return **independent `Model` instances** that can be used together without
collision.

### 🔌 Connection pooling & lifecycle

- Wraps the Snowflake SDK connection pool (`createPool`) instead of a single
  global connection.
- `connect()` is now **async** and validates credentials before resolving.
- New `createConnection(config, options)` for **multiple warehouses/databases**,
  injectable per-model.
- New `disconnect()` to drain the pool gracefully.
- Configurable pool sizing via `{ pool: { min, max } }`.

### 🧰 TypeScript, async/await, single execute path

- Source migrated to TypeScript; compiles to `dist/` with `.d.ts` — one package
  serves both JS and TS consumers.
- All methods are `async/await`.
- The ~15 copy-pasted `dbConnection.execute({...})` blocks are replaced by one
  private execute helper.

### ⚠️ Typed errors

New exported error classes for `instanceof` branching:

- `ConnectionError` — connect failures, or querying before `connect()`.
- `QueryError` — statement failures; carries the failing `sql` and `binds`.
- `ValidationError` — reserved for schema validation (Phase 1).

### 📊 Normalized results & logging

- Writes (`save`/`update`/`delete`/`create`/`drop`) resolve to
  `{ rows, rowCount, queryId }`. Finders still resolve to data
  (`find` → array, `findById`/`findByFunction` → single row).
- Optional `logging` hook fires after each query with
  `{ sql, binds, durationMs, queryId }`.

### ⬆️ Dependency upgrades

- `snowflake-sdk` `^1.6.0` → **`^2.4.3`**
- `uuid` `^8.3.2` → **`^14.0.0`**
- Added dev deps: `typescript@^6`, `@types/node@^25`.

Adapted to the SDK 2.x API: `insecureConnect` → `disableOCSPChecks` (now opt-in,
not forced on), real `Pool<Connection>` type, deprecated `getStatementId()` →
`getQueryId()`, and accurate DML row counts via `getNumUpdatedRows()`.

### ✅ Tests

A `node:test` harness (zero extra runtime deps):

- SQL-builder unit tests asserting exact SQL + binds.
- Mocked-SDK integration tests covering CRUD round-trips, bind verification,
  result shape, logging and error wrapping.
- An optional live round-trip against Snowflake (`SNOWFLAKE_*` env vars).

---

### Breaking changes

- **`connect()` is async** — `await` it (or chain `.then`) before running queries.
  Querying before connecting now throws/rejects a `ConnectionError`.
- **Result shapes:** writes resolve to `{ rows, rowCount, queryId }` instead of the
  raw driver rows.
- **`findByFunction`** takes a `functions` **array** (`[{ name, option }]`).
- **Operators** use the array form `LIKE: ['fname', 'A%']`; the 1.x object form
  `[{ filed, value }]` is no longer accepted.
- **Node 18+** required (driven by `snowflake-sdk` 2.x).
- `insecureConnect` is gone; use `disableOCSPChecks: true` (local/dev only).

### Migration

For valid input, behaviour is unchanged apart from the async `connect()` and the
write result shape. See the **Migrating from 1.x** section in the README.

```js
// 1.x
snowflakeOrm.connect(cfg);
const User = new snowflakeOrm.Init('users', schema);

// 2.0
await snowflakeOrm.connect(cfg);
const User = snowflakeOrm.define('users', schema); // or: new snowflakeOrm.Init(...)
```

### Still backward compatible

`require('snowflake-orm')` still exposes `connect`, `query`, `Init`, and the data
types (`VARCHAR(50)`, `INT`, `NOW()`, …) exactly as before.
