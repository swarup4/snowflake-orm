import type { ColumnDefinition } from '../types';

function autoIncrement(value?: boolean): string {
    return value === true ? ' AUTOINCREMENT' : '';
}

function allowNull(value?: boolean): string {
    if (value === true) return ' NULL';
    if (value === false) return ' NOT NULL';
    return '';
}

function defaultValue(value?: string | number | boolean): string {
    return value !== undefined ? ` DEFAULT ${value}` : '';
}

export function buildColumnConstraint(field: string, def: ColumnDefinition): string {
    let sql = `${field} ${def.type}`;
    let association: string | undefined;

    if (def.primaryKey === true) {
        sql += ' PRIMARY KEY';
        def.allowNull = false;
    }
    if (def.unique === true) {
        sql += ' UNIQUE';
    }
    if (def.references && Object.keys(def.references).length !== 0) {
        association = `FOREIGN KEY(${field}) REFERENCES ${def.references.model}(${def.references.column})`;
    }

    sql += autoIncrement(def.autoIncrement) + allowNull(def.allowNull) + defaultValue(def.defaultValue);

    if (association) {
        sql += `, ${association}`;
    }

    return sql;
}
