const queryies = require('./class/queries');
const functions = require('./class/functions');
const constraints = require('./class/constraints');

let helper = {
    createTable: (cols) => {
        let array = [];
        Object.keys(cols).map(key => {
            if (typeof cols[key] == "object") {
                array.push(constraints.checkConstraints(key, cols[key]));
            } else {
                array.push(key + " " + cols[key]);
            }
        });
        return array;
    },
    basicQuery: (cols) => {
        let array = [];
        Object.keys(cols).map(key => {
            if (typeof cols[key] == "string") {
                array.push(key + "='" + cols[key] + "'");
            } else {
                array.push(key + "=" + cols[key]);
            }
        });
        return array;
    },
    where: (condition) => {
        if (condition.where != undefined && Object.keys(condition.where).length !== 0) {
            return queryies.whereClause(condition.where);
        }
    },
    insertTableColumn: (type, cols) => {
        let column = [];
        let value = [];
        Object.keys(cols).map(key => {
            column.push(key);
            if (typeof cols[key] == "string") {
                value.push("'" + cols[key] + "'");
            } else {
                value.push(cols[key]);
            }
        });
        if (type == "column") {
            return column;
        } else {
            return value;
        }
    },

    query: (table, condition) => {
        let sql = "SELECT ";

        // Display Column List based on Condition. Otherwise All Column will be display
        if (condition.column != undefined && condition.column.length > 0) {
            let columnList = condition.column.join(', ');
            if(condition.distinct != undefined && condition.distinct == true){
                sql = sql.concat("DISTINCT ", columnList, " FROM " + table);
            }else{
                sql = sql.concat(columnList).concat(" FROM " + table);
            }
        } else {
            sql = sql.concat("* FROM " + table);
        }

        // Where Clause
        if (condition.where != undefined && Object.keys(condition.where).length !== 0) {
            sql = sql.concat(queryies.whereClause(condition.where));
        }

        // Column Order By. Default is Ascending. For Descending Order need to Pass DESC Keyword
        if (condition.order != undefined && Object.keys(condition.order).length !== 0) {
            sql = sql.concat(queryies.orderBy(condition.order));
        }

        // Limit & Offset
        if ((typeof condition.limit == "object" && condition.limit.length > 0) || typeof condition.limit == "number") {
            sql = sql.concat(queryies.limit(condition.limit));
        }

        return sql;
    },

    queryFunction: (table, condition) => {
        let sql = "SELECT ";
        // Display Column List based on Condition. Otherwise All Column will be display
        if (Array.isArray(condition.functions) == true && condition.functions.length > 0) {
            let funcArr = [];
            for (let i = 0; i < condition.functions.length; i++) {
                funcArr.push(functions(condition.functions[i].name, condition.functions[i].option).join(', '));
            }
            sql = sql.concat(funcArr.join(', ') + ' FROM ' + table);
        } else {
            sql = sql.concat('* FROM ' + table);
        }

        if (condition.where != undefined && Object.keys(condition.where).length !== 0) {
            sql = sql.concat(queryies.whereClause(condition.where));
        }

        return sql;
    },

    join: (table, joinType, condition) => {
        let sql = "SELECT ";

        let columnList = [];
        let tableList = [];
        let eqList = [];
        
        tableList.push(table);
        eqList.push(table+ '.' + condition.eqColumn);
        for (let i = 0; i < condition.column.length; i++) {
            columnList.push(table + '.' + condition.column[i])
        }

        for (let i = 0; i < condition.include.length; i++) {
            for (let c = 0; c < condition.include[i].column.length; c++) {
                columnList.push(condition.include[i].model.table + '.' + condition.include[i].column[c])
            }
            tableList.push(condition.include[i].model.table);
            eqList.push(condition.include[i].model.table + '.' + condition.include[i].eqColumn);
        }

        if(condition.distinct == true){
            sql = sql.concat('DISTINCT ' + columnList.join(', '), " FROM ");
        }else{
            sql = sql.concat(columnList.join(', '), " FROM ");
        }

        for (let t = 0; t < tableList.length - 1; t++) {
            if (t > 0) {
                let colList = joinType + tableList[t + 1];
                let comp = ' ON ' + eqList[t] + '=' + eqList[t + 1];
                sql = sql.concat(colList, comp);
            } else {
                let colList = tableList[t] + joinType + tableList[t + 1];
                let comp = ' ON ' + eqList[t] + '=' + eqList[t + 1];
                sql = sql.concat(colList, comp);
            }
        }

        // Where Clause
        if (condition.where != undefined && Object.keys(condition.where).length !== 0) {
            sql = sql.concat(queryies.whereClause(condition.where));
        }

        // Column Order By. Default is Ascending. For Descending Order need to Pass DESC Keyword
        if (condition.order != undefined && Object.keys(condition.order).length !== 0) {
            sql = sql.concat(queryies.orderBy(condition.order));
        }

        // Limit & Offset
        if ((typeof condition.limit == "object" && condition.limit.length > 0) || typeof condition.limit == "number") {
            sql = sql.concat(queryies.limit(condition.limit));
        }

        return sql;
    }
}

module.exports = helper;