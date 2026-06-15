import { QueryError } from '../errors';
import type { Bind, BoundSql, SubQuery } from '../types';
import { isSubQueryValue } from './predicates';

/** What an operator strategy is allowed to call back into (e.g. to inline a sub-query). */
export interface OperatorContext {
    compileSubQuery(sub: SubQuery): BoundSql;
}

/**
 * A WHERE-operator strategy. `args` is the user's `[field, ...values]` tuple.
 * Implement this and register it to add an operator WITHOUT touching existing code
 * (Open/Closed).
 */
export interface SqlOperator {
    build(args: unknown[], ctx: OperatorContext): BoundSql;
}

/** `field <symbol> value` (gt/gte/lt/lte), with sub-query support. */
export class ComparisonOperator implements SqlOperator {
    constructor(private readonly symbol: string) {}

    build(args: unknown[], ctx: OperatorContext): BoundSql {
        const [field, value] = args as [string, unknown];
        if (isSubQueryValue(value)) {
            const sub = ctx.compileSubQuery(value.subQuery);
            return { sql: `${field} ${this.symbol} ${sub.sql}`, binds: sub.binds };
        }
        return { sql: `${field} ${this.symbol} ?`, binds: [value as Bind] };
    }
}

/** `field [NOT] LIKE value`, with sub-query support. */
export class LikeOperator implements SqlOperator {
    constructor(private readonly negate: boolean) {}

    build(args: unknown[], ctx: OperatorContext): BoundSql {
        const [field, value] = args as [string, unknown];
        const keyword = this.negate ? 'NOT LIKE' : 'LIKE';
        if (isSubQueryValue(value)) {
            const sub = ctx.compileSubQuery(value.subQuery);
            return { sql: `${field} ${keyword} ${sub.sql}`, binds: sub.binds };
        }
        return { sql: `${field} ${keyword} ?`, binds: [value as Bind] };
    }
}

/** `field [NOT] BETWEEN low AND high`. */
export class BetweenOperator implements SqlOperator {
    constructor(private readonly negate: boolean) {}

    build(args: unknown[]): BoundSql {
        const [field, low, high] = args as [string, Bind, Bind];
        const keyword = this.negate ? 'NOT BETWEEN' : 'BETWEEN';
        return { sql: `${field} ${keyword} ? AND ?`, binds: [low, high] };
    }
}

/** `field [NOT] IN (...)`. */
export class InOperator implements SqlOperator {
    constructor(private readonly negate: boolean) {}

    build(args: unknown[]): BoundSql {
        const [field, ...values] = args as [string, ...Bind[]];
        const keyword = this.negate ? 'NOT IN' : 'IN';
        const placeholders = values.map(() => '?').join(', ');
        return { sql: `${field} ${keyword} (${placeholders})`, binds: values };
    }
}

/** Maps operator names (case-insensitive) to strategies. Extend via `register`. */
export class OperatorRegistry {
    private readonly operators = new Map<string, SqlOperator>();

    register(name: string, operator: SqlOperator): this {
        this.operators.set(name.toLowerCase(), operator);
        return this;
    }

    has(name: string): boolean {
        return this.operators.has(name.toLowerCase());
    }

    resolve(name: string): SqlOperator {
        const operator = this.operators.get(name.toLowerCase());
        if (!operator) {
            throw new QueryError(`Unsupported operator: ${name}`, '', []);
        }
        return operator;
    }
}

export function defaultOperatorRegistry(): OperatorRegistry {
    return new OperatorRegistry()
        .register('like', new LikeOperator(false))
        .register('notlike', new LikeOperator(true))
        .register('between', new BetweenOperator(false))
        .register('notbetween', new BetweenOperator(true))
        .register('in', new InOperator(false))
        .register('notin', new InOperator(true))
        .register('gt', new ComparisonOperator('>'))
        .register('gte', new ComparisonOperator('>='))
        .register('lt', new ComparisonOperator('<'))
        .register('lte', new ComparisonOperator('<='));
}
