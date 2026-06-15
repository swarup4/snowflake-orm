import { v4 as uuidv4 } from 'uuid';

import { ConnectionError } from './errors';
import type {
    Bind,
    BoundSql,
    ColumnDefinition,
    Executor,
    FindByFunctionOptions,
    FindOptions,
    JoinOptions,
    QueryCompiler,
    QueryResult,
    Schema,
    WhereClause,
} from './types';

/**
 * Orchestrates compile -> execute -> shape. It holds no SQL strings of its own:
 * SQL generation is delegated to an injected QueryCompiler (Dependency Inversion),
 * and execution to an injected Executor.
 */
export class Model {
    constructor(
        readonly table: string,
        readonly schema: Schema,
        private connection: Executor,
        private readonly compiler: QueryCompiler,
    ) {}

    /** Inject/replace the connection backing this model. */
    useConnection(connection: Executor): this {
        this.connection = connection;
        return this;
    }

    private run<T = Record<string, unknown>>({ sql, binds }: BoundSql): Promise<QueryResult<T>> {
        if (!this.connection) {
            throw new ConnectionError('Model has no connection. Call connect() or pass a connection.');
        }
        return this.connection.execute<T>(sql, binds);
    }

    async create(): Promise<QueryResult> {
        return this.run({ sql: this.compiler.createTable(this.table, this.schema), binds: [] });
    }

    async drop(): Promise<QueryResult> {
        return this.run({ sql: this.compiler.dropTable(this.table), binds: [] });
    }

    async save(data: Record<string, Bind>): Promise<QueryResult> {
        const idDef = this.schema.id;
        if (
            typeof idDef === 'object' &&
            (idDef as ColumnDefinition & { require?: boolean }).require === true &&
            data.id === undefined
        ) {
            data = { id: uuidv4(), ...data };
        }
        return this.run(this.compiler.insert(this.table, data));
    }

    async find<T = Record<string, unknown>>(options: FindOptions = {}): Promise<T[]> {
        return (await this.run<T>(this.compiler.select(this.table, options))).rows;
    }

    async findById<T = Record<string, unknown>>(id: Bind): Promise<T | undefined> {
        return (await this.run<T>(this.compiler.selectById(this.table, id))).rows[0];
    }

    async findByFunction<T = Record<string, unknown>>(options: FindByFunctionOptions): Promise<T | undefined> {
        return (await this.run<T>(this.compiler.functionSelect(this.table, options))).rows[0];
    }

    async update(data: Record<string, Bind>, options: { where?: WhereClause } = {}): Promise<QueryResult> {
        return this.run(this.compiler.update(this.table, data, options.where));
    }

    async updateById(data: Record<string, Bind>, id: Bind): Promise<QueryResult> {
        return this.run(this.compiler.updateById(this.table, data, id));
    }

    async delete(options: { where?: WhereClause } = {}): Promise<QueryResult> {
        return this.run(this.compiler.delete(this.table, options.where));
    }

    async deleteById(id: Bind): Promise<QueryResult> {
        return this.run(this.compiler.deleteById(this.table, id));
    }

    async innerJoin<T = Record<string, unknown>>(options: JoinOptions): Promise<T[]> {
        return (await this.run<T>(this.compiler.join(this.table, ' INNER JOIN ', options))).rows;
    }

    async leftJoin<T = Record<string, unknown>>(options: JoinOptions): Promise<T[]> {
        return (await this.run<T>(this.compiler.join(this.table, ' LEFT JOIN ', options))).rows;
    }

    async rightJoin<T = Record<string, unknown>>(options: JoinOptions): Promise<T[]> {
        return (await this.run<T>(this.compiler.join(this.table, ' RIGHT JOIN ', options))).rows;
    }

    async fullJoin<T = Record<string, unknown>>(options: JoinOptions): Promise<T[]> {
        return (await this.run<T>(this.compiler.join(this.table, ' FULL OUTER JOIN ', options))).rows;
    }
}
