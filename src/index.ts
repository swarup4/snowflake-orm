import { Connection } from './connection';
import { DataType } from './data-types';
import { ConnectionError } from './errors';
import { Model } from './model';
import { SnowflakeQueryCompiler } from './sql/query-compiler';
import type {
    Bind,
    ConnectionConfig,
    ConnectOptions,
    Executor,
    QueryCompiler,
    QueryResult,
    Schema,
} from './types';

export { Connection } from './connection';
export { Model } from './model';
export { DataType } from './data-types';
export {
    SnowflakeOrmError,
    ConnectionError,
    QueryError,
    ValidationError,
} from './errors';
export { SnowflakeQueryCompiler } from './sql/query-compiler';
export { WhereBuilder } from './sql/where-builder';
export {
    OperatorRegistry,
    defaultOperatorRegistry,
    ComparisonOperator,
    LikeOperator,
    BetweenOperator,
    InOperator,
} from './sql/operators';
export type { SqlOperator, OperatorContext } from './sql/operators';
export * from './types';

/** Default compiler shared by models created through the module-level API. */
const defaultCompiler = new SnowflakeQueryCompiler();

/** Module-level default connection, set by connect() for the backward-compatible API. */
let defaultConnection: Connection | null = null;

/**
 * Late-bound executor: models defined before connect() resolve the live default
 * connection at execution time, not at definition time.
 */
const defaultExecutor: Executor = {
    async execute<T = Record<string, unknown>>(sql: string, binds: Bind[] = []): Promise<QueryResult<T>> {
        if (!defaultConnection) {
            throw new ConnectionError('Not connected. Call connect() first.');
        }
        return defaultConnection.execute<T>(sql, binds);
    },
};

/** Modern API: create an explicit, injectable connection (multiple warehouses/databases). */
export function createConnection(config: ConnectionConfig, options?: ConnectOptions): Connection {
    return new Connection(config, options);
}

/** Backward-compatible connect: establishes the module-level default connection. */
export async function connect(config: ConnectionConfig, options?: ConnectOptions): Promise<string> {
    const connection = new Connection(config, options);
    await connection.connect();
    defaultConnection = connection;
    return 'Successfully connected to Snowflake.';
}

export async function disconnect(): Promise<void> {
    if (defaultConnection) {
        await defaultConnection.disconnect();
        defaultConnection = null;
    }
}

/** Raw parameterized query against the default connection. */
export function query<T = Record<string, unknown>>(sql: string, values?: Bind[]): Promise<T[]> {
    return defaultExecutor.execute<T>(sql, values).then((result) => result.rows);
}

/** Modern API: define a model on an explicit connection (defaults to the module connection). */
export function define(
    table: string,
    schema: Schema,
    connection?: Executor,
    compiler: QueryCompiler = defaultCompiler,
): Model {
    return new Model(table, schema, connection ?? defaultExecutor, compiler);
}

/**
 * Backward-compatible constructor form: `new Init(table, schema)`.
 * Returns a Model bound to the late-bound default connection.
 */
export const Init = function (this: unknown, table: string, schema: Schema): Model {
    return new Model(table, schema, defaultExecutor, defaultCompiler);
} as unknown as { new(table: string, schema: Schema): Model };

// Re-export DataType helpers as top-level names so `require('snowflake-orm').VARCHAR(50)`
// and `SnowflakeOrm.NOW()` keep working exactly as before.
export const {
    BINARY,
    BOOLEAN,
    FLOAT,
    DOUBLE,
    DATE,
    DATETIME,
    ARRAY,
    NUMBER,
    INT,
    INTEGER,
    STRING,
    VARCHAR,
    CHAR,
    TIMESTAMP,
    NOW,
} = DataType;

const snowflakeOrm = {
    ...DataType,
    connect,
    disconnect,
    createConnection,
    query,
    define,
    Init,
    Connection,
    Model,
};

export default snowflakeOrm;
