export const DataType = {
    BINARY: 'BINARY',
    BOOLEAN: 'BOOLEAN',

    FLOAT: 'FLOAT',
    DOUBLE: 'DOUBLE',

    DATE: 'DATE',
    DATETIME: 'DATETIME',
    ARRAY: 'ARRAY',

    NUMBER: 'NUMBER',
    INT: 'INT',
    INTEGER: 'INTEGER',

    STRING(value?: number): string {
        return value === undefined ? 'STRING' : `STRING(${value})`;
    },
    VARCHAR(value?: number): string {
        return value === undefined ? 'VARCHAR' : `VARCHAR(${value})`;
    },
    CHAR(value?: number): string {
        return value === undefined ? 'CHAR' : `CHAR(${value})`;
    },

    TIMESTAMP(value?: 'LTZ' | 'NTZ'): string {
        if (value === undefined) return 'TIMESTAMP';
        if (value === 'LTZ') return 'TIMESTAMP_LTZ';
        return 'TIMESTAMP_NTZ';
    },
    NOW(): string {
        return 'CURRENT_TIMESTAMP()';
    },
} as const;

export type DataTypeMap = typeof DataType;
