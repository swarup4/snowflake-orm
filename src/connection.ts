import snowflake from 'snowflake-sdk';

import { ConnectionError, QueryError } from './errors';
import type {
    Bind,
    ConnectionConfig,
    ConnectOptions,
    Logger,
    QueryResult,
} from './types';

type ConnectionPool = ReturnType<typeof snowflake.createPool>;

export class Connection {
    private pool: ConnectionPool | null = null;
    private readonly logging?: Logger;

    constructor(
        private readonly config: ConnectionConfig,
        private readonly options: ConnectOptions = {},
    ) {
        this.logging = options.logging;
    }

    async connect(): Promise<void> {
        if (this.pool) return;

        if (this.options.disableOCSPChecks) {
            snowflake.configure({ disableOCSPChecks: true });
        }

        try {
            this.pool = snowflake.createPool(this.config, {
                min: this.options.pool?.min ?? 1,
                max: this.options.pool?.max ?? 10,
            });
        } catch (err) {
            throw new ConnectionError('Unable to create connection pool', err);
        }

        // Validate credentials eagerly so connect() rejects on bad config.
        try {
            await this.execute('SELECT 1', []);
        } catch (err) {
            throw new ConnectionError(
                `Unable to connect: ${err instanceof Error ? err.message : String(err)}`,
                err,
            );
        }
    }

    async execute<T = Record<string, unknown>>(
        sql: string,
        binds: Bind[] = [],
    ): Promise<QueryResult<T>> {
        if (!this.pool) {
            throw new ConnectionError('Not connected. Call connect() first.');
        }

        const start = Date.now();
        return this.pool.use(
            (connection) =>
                new Promise<QueryResult<T>>((resolve, reject) => {
                    connection.execute({
                        sqlText: sql,
                        binds: binds as unknown as snowflake.Binds,
                        complete: (err, stmt, rows) => {
                            const durationMs = Date.now() - start;

                            if (err) {
                                reject(new QueryError(err.message, sql, binds, err));
                                return;
                            }

                            // getQueryId() replaces the deprecated getStatementId() in snowflake-sdk 2.x.
                            const queryId = stmt?.getQueryId?.();
                            this.logging?.({ sql, binds, durationMs, queryId });

                            const resolvedRows = (rows ?? []) as T[];
                            // getNumUpdatedRows() is the accurate count for DML; it is undefined for SELECT.
                            const rowCount = stmt?.getNumUpdatedRows?.() ?? stmt?.getNumRows?.() ?? resolvedRows.length;
                            resolve({
                                rows: resolvedRows,
                                rowCount,
                                queryId,
                            });
                        },
                    });
                }),
        );
    }

    async disconnect(): Promise<void> {
        if (!this.pool) return;
        try {
            await this.pool.drain();
            await this.pool.clear();
        } finally {
            this.pool = null;
        }
    }
}
