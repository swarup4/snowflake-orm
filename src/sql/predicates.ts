import type { SubQuery } from '../types';

export function isSubQueryValue(value: unknown): value is { subQuery: SubQuery } {
    return typeof value === 'object' && value !== null && 'subQuery' in value;
}
