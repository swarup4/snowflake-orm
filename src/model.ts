import { v4 as uuidv4 } from 'uuid';

import { ConnectionError } from './errors';
import {
    buildCreateTable,
    buildDelete,
    buildFunctionSelect,
    buildInsert,
    buildJoin,
    buildSelect,
    buildUpdate,
} from './sql/builder';
import type {
    Bind,
    BoundSql,
    ColumnDefinition,
    Executor,
    FindByFunctionOptions,
    FindOptions,
    JoinOptions,
    QueryResult,
    Schema,
} from './types';

export class Model {
    constructor(
        readonly table: string,
        readonly schema: Schema,
        private connection: Executor,
    ) { }

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
        return this.run({ sql: buildCreateTable(this.table, this.schema), binds: [] });
    }

    async drop(): Promise<QueryResult> {
        return this.run({ sql: `DROP TABLE ${this.table}`, binds: [] });
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
        return this.run(buildInsert(this.table, data));
    }

    async find<T = Record<string, unknown>>(options: FindOptions = {}): Promise<T[]> {
        const result = await this.run<T>(buildSelect(this.table, options));
        return result.rows;
    }

    async findById<T = Record<string, unknown>>(id: Bind): Promise<T | undefined> {
        const result = await this.run<T>({
            sql: `SELECT * FROM ${this.table} WHERE id = ?`,
            binds: [id],
        });
        return result.rows[0];
    }

    async findByFunction<T = Record<string, unknown>>(options: FindByFunctionOptions): Promise<T | undefined> {
        const result = await this.run<T>(buildFunctionSelect(this.table, options));
        return result.rows[0];
    }

    async update(data: Record<string, Bind>, options: { where?: FindOptions['where'] } = {}): Promise<QueryResult> {
        return this.run(buildUpdate(this.table, data, options.where));
    }

    async updateById(data: Record<string, Bind>, id: Bind): Promise<QueryResult> {
        const set = buildUpdate(this.table, data, undefined);
        return this.run({
            sql: `${set.sql} WHERE id = ?`,
            binds: [...set.binds, id],
        });
    }

    async delete(options: { where?: FindOptions['where'] } = {}): Promise<QueryResult> {
        return this.run(buildDelete(this.table, options.where));
    }

    async deleteById(id: Bind): Promise<QueryResult> {
        return this.run({ sql: `DELETE FROM ${this.table} WHERE id = ?`, binds: [id] });
    }

    async innerJoin<T = Record<string, unknown>>(options: JoinOptions): Promise<T[]> {
        return (await this.run<T>(buildJoin(this.table, ' INNER JOIN ', options))).rows;
    }

    async leftJoin<T = Record<string, unknown>>(options: JoinOptions): Promise<T[]> {
        return (await this.run<T>(buildJoin(this.table, ' LEFT JOIN ', options))).rows;
    }

    async rightJoin<T = Record<string, unknown>>(options: JoinOptions): Promise<T[]> {
        return (await this.run<T>(buildJoin(this.table, ' RIGHT JOIN ', options))).rows;
    }

    async fullJoin<T = Record<string, unknown>>(options: JoinOptions): Promise<T[]> {
        return (await this.run<T>(buildJoin(this.table, ' FULL OUTER JOIN ', options))).rows;
    }
}
