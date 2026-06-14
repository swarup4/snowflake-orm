'use strict';

// Intercepts `require('snowflake-sdk')` so the real connection.ts code path
// (createPool -> pool.use -> connection.execute -> statement.getQueryId/...) runs
// against a controllable fake. Must be required BEFORE requiring the library.

const Module = require('module');

const control = {
  configureCalls: [],
  executed: [],
  drained: false,
  cleared: false,
  // Per-call response. Tests override before invoking.
  responder: () => ({ rows: [], queryId: 'q-default' }),
  reset() {
    this.configureCalls.length = 0;
    this.executed.length = 0;
    this.drained = false;
    this.cleared = false;
    this.responder = () => ({ rows: [], queryId: 'q-default' });
  },
};

function makeStatement(resp) {
  return {
    getQueryId: () => resp.queryId,
    getNumUpdatedRows: () => resp.numUpdatedRows, // undefined for SELECT, like the real SDK
    getNumRows: () => resp.numRows,
    getSqlText: () => resp.sqlText,
  };
}

const fakeSdk = {
  configure(options) {
    control.configureCalls.push(options);
  },
  createPool(config, poolOptions) {
    control.config = config;
    control.poolOptions = poolOptions;
    return {
      async use(fn) {
        const connection = {
          execute(options) {
            control.executed.push({ sqlText: options.sqlText, binds: options.binds });
            const resp = control.responder(options) || {};
            const stmt = makeStatement({ ...resp, sqlText: options.sqlText });
            // The real SDK invokes `complete` asynchronously.
            process.nextTick(() => {
              options.complete(resp.err || undefined, stmt, resp.err ? undefined : resp.rows || []);
            });
            return stmt;
          },
        };
        return fn(connection);
      },
      async drain() {
        control.drained = true;
      },
      async clear() {
        control.cleared = true;
      },
    };
  },
};

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'snowflake-sdk') return fakeSdk;
  return originalLoad.call(this, request, parent, isMain);
};

module.exports = control;
