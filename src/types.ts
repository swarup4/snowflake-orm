export type Bind = string | number | boolean | null | Date;

export interface BoundSql {
    sql: string;
    binds: Bind[];
}

export interface QueryResult<T = Record<string, unknown>> {
    rows: T[];
    rowCount: number;
    queryId?: string;
}

export interface Executor {
    execute<T = Record<string, unknown>>(sql: string, binds?: Bind[]): Promise<QueryResult<T>>;
}

export type Logger = (entry: {
    sql: string;
    binds: Bind[];
    durationMs: number;
    queryId?: string;
}) => void;

export interface ConnectionConfig {
    account: string;
    username: string;
    password?: string;
    warehouse?: string;
    database?: string;
    schema?: string;
    role?: string;
    [key: string]: unknown;
}

export interface PoolOptions {
    min?: number;
    max?: number;
}

export interface ConnectOptions {
    pool?: PoolOptions;
    logging?: Logger;
    /** Turns off OCSP certificate-revocation checks (snowflake-sdk 2.x). Use only for local/dev. */
    disableOCSPChecks?: boolean;
}

export type ColumnType = string;

export interface ReferenceDefinition {
    model: string;
    column: string;
}

export interface ColumnDefinition {
    type: ColumnType;
    require?: boolean;
    primaryKey?: boolean;
    unique?: boolean;
    allowNull?: boolean;
    autoIncrement?: boolean;
    defaultValue?: string | number | boolean;
    references?: ReferenceDefinition;
}

export type Schema = Record<string, ColumnType | ColumnDefinition>;

export interface OrderClause {
    field: string;
    orderBy?: 'ASC' | 'DESC';
}

export type LimitClause = number | [number] | [number, number];

export interface SubQuery {
    model: { table: string };
    column?: string[];
    where?: WhereClause;
    order?: OrderClause;
    limit?: LimitClause;
}

export type ConditionValue = Bind | { subQuery: SubQuery };

export interface WhereClause {
    condition?: Record<string, ConditionValue>;
    operator?: Record<string, unknown[]>;
}

export interface FindOptions {
    column?: string[];
    distinct?: boolean;
    where?: WhereClause;
    order?: OrderClause;
    limit?: LimitClause;
}

export interface FunctionOption {
    column: string;
    as?: string;
    distinct?: boolean;
}

export interface FunctionSpec {
    name: string;
    option: FunctionOption[];
}

export interface FindByFunctionOptions {
    functions: FunctionSpec[];
    where?: WhereClause;
}

export interface IncludeSpec {
    model: { table: string };
    column: string[];
    eqColumn: string;
}

export interface JoinOptions {
    column: string[];
    eqColumn: string;
    include: IncludeSpec[];
    distinct?: boolean;
    where?: WhereClause;
    order?: OrderClause;
    limit?: LimitClause;
}
