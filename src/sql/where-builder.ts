import type { Bind, BoundSql, WhereClause } from '../types';
import { OperatorContext, OperatorRegistry } from './operators';
import { isSubQueryValue } from './predicates';

/** Turns a WhereClause into bound SQL. Equality is handled here; operators are delegated. */
export class WhereBuilder {
    constructor(
        private readonly operators: OperatorRegistry,
        private readonly ctx: OperatorContext,
    ) {}

    build(where?: WhereClause): BoundSql {
        if (!where) return { sql: '', binds: [] };

        const parts: string[] = [];
        const binds: Bind[] = [];

        if (where.condition && Object.keys(where.condition).length !== 0) {
            for (const key of Object.keys(where.condition)) {
                const value = where.condition[key];
                if (isSubQueryValue(value)) {
                    const sub = this.ctx.compileSubQuery(value.subQuery);
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
                const args = where.operator[rawKey];
                if (!Array.isArray(args) || args.length === 0) continue;
                const fragment = this.operators.resolve(rawKey).build(args, this.ctx);
                parts.push(fragment.sql);
                binds.push(...fragment.binds);
            }
        }

        if (parts.length === 0) return { sql: '', binds: [] };
        return { sql: ` WHERE ${parts.join(' AND ')}`, binds };
    }
}
