export class SnowflakeOrmError extends Error {
    constructor(message: string) {
        super(message);
        this.name = new.target.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class ConnectionError extends SnowflakeOrmError {
    readonly cause?: unknown;

    constructor(message: string, cause?: unknown) {
        super(message);
        this.cause = cause;
    }
}

export class QueryError extends SnowflakeOrmError {
    readonly sql: string;
    readonly binds: unknown[];
    readonly cause?: unknown;

    constructor(message: string, sql: string, binds: unknown[], cause?: unknown) {
        super(message);
        this.sql = sql;
        this.binds = binds;
        this.cause = cause;
    }
}

export class ValidationError extends SnowflakeOrmError {
    readonly field?: string;

    constructor(message: string, field?: string) {
        super(message);
        this.field = field;
    }
}
