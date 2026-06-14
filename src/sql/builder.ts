import { QueryError } from '../errors';
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
    Schema,
    SubQuery,
    WhereClause,
} from '../types';
import { buildColumnConstraint } from './constraints';

function isSubQueryValue(value: unknown): value is { subQuery: SubQuery } {
    return typeof value === 'object' && value !== null && 'subQuery' in value;
}

function orderBy(order: OrderClause): string {
    return order.orderBy === undefined
        ? ` ORDER BY ${order.field}`
        : ` ORDER BY ${order.field} ${order.orderBy}`;
}

function limit(clause: LimitClause): string {
    if (typeof clause === 'number') {
        return ` LIMIT ${Number(clause)}`;
    }
    if (clause.length === 1) {
        return ` LIMIT ${Number(clause[0])}`;
    }
    return ` LIMIT ${Number(clause[0])} OFFSET ${Number(clause[1])}`;
}

function hasLimit(clause: LimitClause | undefined): clause is LimitClause {
    return typeof clause === 'number' || (Array.isArray(clause) && clause.length > 0);
}

export function buildWhere(where: WhereClause | undefined): BoundSql {
    if (!where) return { sql: '', binds: [] };

    const parts: string[] = [];
    const binds: Bind[] = [];

    if (where.condition && Object.keys(where.condition).length !== 0) {
        for (const key of Object.keys(where.condition)) {
            const value = where.condition[key];
            if (isSubQueryValue(value)) {
                const sub = buildSubQuery(value.subQuery);
                parts.push(`${key} = ${sub.sql}`);
                binds.push(...sub.binds);
            } else {
                parts.push(`${key} = ?`);
                binds.push(value as Bind);
            }
        }
    }

    if (where.operator && Object.keys(where.operator).length !== 0) {
        for (const rawKey of Object.keys(where.operator)) {
            const op = rawKey.toLowerCase();
            const args = where.operator[rawKey];
            if (!Array.isArray(args) || args.length === 0) continue;

            switch (op) {
                case 'like':
                case 'notlike': {
                    const [field, value] = args;
                    const keyword = op === 'like' ? 'LIKE' : 'NOT LIKE';
                    if (isSubQueryValue(value)) {
                        const sub = buildSubQuery(value.subQuery);
                        parts.push(`${field} ${keyword} ${sub.sql}`);
                        binds.push(...sub.binds);
                    } else {
                        parts.push(`${field} ${keyword} ?`);
                        binds.push(value as Bind);
                    }
                    break;
                }
                case 'between':
                case 'notbetween': {
                    const [field, low, high] = args;
                    const keyword = op === 'between' ? 'BETWEEN' : 'NOT BETWEEN';
                    parts.push(`${field} ${keyword} ? AND ?`);
                    binds.push(low as Bind, high as Bind);
                    break;
                }
                case 'in':
                case 'notin': {
                    const [field, ...values] = args;
                    const keyword = op === 'in' ? 'IN' : 'NOT IN';
                    const placeholders = values.map(() => '?').join(', ');
                    parts.push(`${field} ${keyword} (${placeholders})`);
                    binds.push(...(values as Bind[]));
                    break;
                }
                case 'gt':
                case 'gte':
                case 'lt':
                case 'lte': {
                    const [field, value] = args;
                    const symbol = op === 'gt' ? '>' : op === 'gte' ? '>=' : op === 'lt' ? '<' : '<=';
                    if (isSubQueryValue(value)) {
                        const sub = buildSubQuery(value.subQuery);
                        parts.push(`${field} ${symbol} ${sub.sql}`);
                        binds.push(...sub.binds);
                    } else {
                        parts.push(`${field} ${symbol} ?`);
                        binds.push(value as Bind);
                    }
                    break;
                }
                default:
                    throw new QueryError(`Unsupported operator: ${rawKey}`, '', []);
            }
        }
    }

    if (parts.length === 0) return { sql: '', binds: [] };
    return { sql: ` WHERE ${parts.join(' AND ')}`, binds };
}

export function buildSubQuery(sub: SubQuery): BoundSql {
    const binds: Bind[] = [];
    let sql = 'SELECT ';

    if (sub.column && sub.column.length > 0) {
        sql += `${sub.column.join(', ')} FROM ${sub.model.table}`;
    } else {
        sql += `* FROM ${sub.model.table}`;
    }

    const where = buildWhere(sub.where);
    sql += where.sql;
    binds.push(...where.binds);

    if (sub.order && Object.keys(sub.order).length !== 0) {
        sql += orderBy(sub.order);
    }
    if (hasLimit(sub.limit)) {
        sql += limit(sub.limit);
    }

    return { sql: `(${sql})`, binds };
}

export function buildSelect(table: string, options: FindOptions): BoundSql {
    let sql = 'SELECT ';

    if (options.column && options.column.length > 0) {
        const columnList = options.column.join(', ');
        sql += options.distinct === true ? `DISTINCT ${columnList} FROM ${table}` : `${columnList} FROM ${table}`;
    } else {
        sql += `* FROM ${table}`;
    }

    const where = buildWhere(options.where);
    sql += where.sql;

    if (options.order && Object.keys(options.order).length !== 0) {
        sql += orderBy(options.order);
    }
    if (hasLimit(options.limit)) {
        sql += limit(options.limit);
    }

    return { sql, binds: where.binds };
}

function buildFunctionColumn(spec: FunctionSpec): string {
    return spec.option
        .map((opt) => {
            let fn = opt.distinct === true ? `${spec.name}(distinct ${opt.column})` : `${spec.name}(${opt.column})`;
            if (opt.as !== undefined) fn += ` as ${opt.as}`;
            return fn;
        })
        .join(', ');
}

export function buildFunctionSelect(table: string, options: FindByFunctionOptions): BoundSql {
    let sql = 'SELECT ';

    if (Array.isArray(options.functions) && options.functions.length > 0) {
        sql += `${options.functions.map(buildFunctionColumn).join(', ')} FROM ${table}`;
    } else {
        sql += `* FROM ${table}`;
    }

    const where = buildWhere(options.where);
    sql += where.sql;

    return { sql, binds: where.binds };
}

export function buildInsert(table: string, data: Record<string, Bind>): BoundSql {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const binds = columns.map((key) => data[key]);
    return {
        sql: `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
        binds,
    };
}

export function buildSet(data: Record<string, Bind>): BoundSql {
    const columns = Object.keys(data);
    const assignments = columns.map((key) => `${key} = ?`).join(', ');
    const binds = columns.map((key) => data[key]);
    return { sql: assignments, binds };
}

export function buildUpdate(table: string, data: Record<string, Bind>, where: WhereClause | undefined): BoundSql {
    const set = buildSet(data);
    const whereClause = buildWhere(where);
    return {
        sql: `UPDATE ${table} SET ${set.sql}${whereClause.sql}`,
        binds: [...set.binds, ...whereClause.binds],
    };
}

export function buildDelete(table: string, where: WhereClause | undefined): BoundSql {
    const whereClause = buildWhere(where);
    return { sql: `DELETE FROM ${table}${whereClause.sql}`, binds: whereClause.binds };
}

export function buildJoin(table: string, joinType: string, options: JoinOptions): BoundSql {
    const columnList: string[] = options.column.map((c) => `${table}.${c}`);
    const tableList: string[] = [table];
    const eqList: string[] = [`${table}.${options.eqColumn}`];

    for (const inc of options.include) {
        for (const col of inc.column) {
            columnList.push(`${inc.model.table}.${col}`);
        }
        tableList.push(inc.model.table);
        eqList.push(`${inc.model.table}.${inc.eqColumn}`);
    }

    let sql = 'SELECT ';
    sql += options.distinct === true ? `DISTINCT ${columnList.join(', ')} FROM ` : `${columnList.join(', ')} FROM `;

    for (let t = 0; t < tableList.length - 1; t++) {
        const on = ` ON ${eqList[t]} = ${eqList[t + 1]}`;
        if (t > 0) {
            sql += `${joinType}${tableList[t + 1]}${on}`;
        } else {
            sql += `${tableList[t]}${joinType}${tableList[t + 1]}${on}`;
        }
    }

    const where = buildWhere(options.where);
    sql += where.sql;

    if (options.order && Object.keys(options.order).length !== 0) {
        sql += orderBy(options.order);
    }
    if (hasLimit(options.limit)) {
        sql += limit(options.limit);
    }

    return { sql, binds: where.binds };
}

export function buildCreateTable(table: string, schema: Schema): string {
    const columns = Object.keys(schema).map((key) => {
        const def = schema[key];
        if (typeof def === 'object') {
            return buildColumnConstraint(key, def as ColumnDefinition);
        }
        return `${key} ${def}`;
    });
    return `CREATE TABLE ${table} (${columns.join(', ')})`;
}
