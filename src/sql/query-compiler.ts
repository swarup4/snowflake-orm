import type {
    Bind,
    BoundSql,
    ColumnDefinition,
    FindByFunctionOptions,
    FindOptions,
    FunctionSpec,
    JoinOptions,
    LimitClause,
    OrderClause,
    QueryCompiler,
    Schema,
    SubQuery,
    WhereClause,
} from '../types';
import { buildColumnConstraint } from './constraints';
import { defaultOperatorRegistry, OperatorContext, OperatorRegistry } from './operators';
import { WhereBuilder } from './where-builder';

/** Compiles the typed options into bound Snowflake SQL. Sole owner of SQL-string generation. */
export class SnowflakeQueryCompiler implements QueryCompiler, OperatorContext {
    private readonly where: WhereBuilder;

    constructor(operators: OperatorRegistry = defaultOperatorRegistry()) {
        this.where = new WhereBuilder(operators, this);
    }

    select(table: string, options: FindOptions): BoundSql {
        let sql = 'SELECT ';
        if (options.column && options.column.length > 0) {
            const columns = options.column.join(', ');
            sql += options.distinct === true ? `DISTINCT ${columns} FROM ${table}` : `${columns} FROM ${table}`;
        } else {
            sql += `* FROM ${table}`;
        }
        const where = this.where.build(options.where);
        return { sql: sql + where.sql + this.tail(options.order, options.limit), binds: where.binds };
    }

    selectById(table: string, id: Bind): BoundSql {
        return { sql: `SELECT * FROM ${table} WHERE id = ?`, binds: [id] };
    }

    functionSelect(table: string, options: FindByFunctionOptions): BoundSql {
        let sql = 'SELECT ';
        if (Array.isArray(options.functions) && options.functions.length > 0) {
            sql += `${options.functions.map((fn) => this.functionColumn(fn)).join(', ')} FROM ${table}`;
        } else {
            sql += `* FROM ${table}`;
        }
        const where = this.where.build(options.where);
        return { sql: sql + where.sql, binds: where.binds };
    }

    insert(table: string, data: Record<string, Bind>): BoundSql {
        const columns = Object.keys(data);
        const placeholders = columns.map(() => '?').join(', ');
        return {
            sql: `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
            binds: columns.map((key) => data[key]),
        };
    }

    update(table: string, data: Record<string, Bind>, where?: WhereClause): BoundSql {
        const set = this.set(data);
        const clause = this.where.build(where);
        return { sql: `UPDATE ${table} SET ${set.sql}${clause.sql}`, binds: [...set.binds, ...clause.binds] };
    }

    updateById(table: string, data: Record<string, Bind>, id: Bind): BoundSql {
        const set = this.set(data);
        return { sql: `UPDATE ${table} SET ${set.sql} WHERE id = ?`, binds: [...set.binds, id] };
    }

    delete(table: string, where?: WhereClause): BoundSql {
        const clause = this.where.build(where);
        return { sql: `DELETE FROM ${table}${clause.sql}`, binds: clause.binds };
    }

    deleteById(table: string, id: Bind): BoundSql {
        return { sql: `DELETE FROM ${table} WHERE id = ?`, binds: [id] };
    }

    join(table: string, joinType: string, options: JoinOptions): BoundSql {
        const columnList = options.column.map((col) => `${table}.${col}`);
        const tableList = [table];
        const eqList = [`${table}.${options.eqColumn}`];

        for (const inc of options.include) {
            for (const col of inc.column) columnList.push(`${inc.model.table}.${col}`);
            tableList.push(inc.model.table);
            eqList.push(`${inc.model.table}.${inc.eqColumn}`);
        }

        let sql = 'SELECT ';
        sql += options.distinct === true ? `DISTINCT ${columnList.join(', ')} FROM ` : `${columnList.join(', ')} FROM `;
        for (let t = 0; t < tableList.length - 1; t++) {
            const on = ` ON ${eqList[t]} = ${eqList[t + 1]}`;
            sql += t > 0 ? `${joinType}${tableList[t + 1]}${on}` : `${tableList[t]}${joinType}${tableList[t + 1]}${on}`;
        }

        const where = this.where.build(options.where);
        return { sql: sql + where.sql + this.tail(options.order, options.limit), binds: where.binds };
    }

    createTable(table: string, schema: Schema): string {
        const columns = Object.keys(schema).map((key) => {
            const def = schema[key];
            return typeof def === 'object' ? buildColumnConstraint(key, def as ColumnDefinition) : `${key} ${def}`;
        });
        return `CREATE TABLE ${table} (${columns.join(', ')})`;
    }

    dropTable(table: string): string {
        return `DROP TABLE ${table}`;
    }

    /** OperatorContext: inline a sub-query as a parenthesized SELECT, merging its binds. */
    compileSubQuery(sub: SubQuery): BoundSql {
        const select = this.select(sub.model.table, {
            column: sub.column,
            where: sub.where,
            order: sub.order,
            limit: sub.limit,
        });
        return { sql: `(${select.sql})`, binds: select.binds };
    }

    private set(data: Record<string, Bind>): BoundSql {
        const columns = Object.keys(data);
        return { sql: columns.map((key) => `${key} = ?`).join(', '), binds: columns.map((key) => data[key]) };
    }

    private functionColumn(spec: FunctionSpec): string {
        return spec.option
            .map((opt) => {
                let fn = opt.distinct === true ? `${spec.name}(distinct ${opt.column})` : `${spec.name}(${opt.column})`;
                if (opt.as !== undefined) fn += ` as ${opt.as}`;
                return fn;
            })
            .join(', ');
    }

    private tail(order?: OrderClause, limit?: LimitClause): string {
        let sql = '';
        if (order && Object.keys(order).length !== 0) {
            sql += order.orderBy === undefined ? ` ORDER BY ${order.field}` : ` ORDER BY ${order.field} ${order.orderBy}`;
        }
        if (typeof limit === 'number') {
            sql += ` LIMIT ${Number(limit)}`;
        } else if (Array.isArray(limit) && limit.length > 0) {
            sql += limit.length === 1 ? ` LIMIT ${Number(limit[0])}` : ` LIMIT ${Number(limit[0])} OFFSET ${Number(limit[1])}`;
        }
        return sql;
    }
}
