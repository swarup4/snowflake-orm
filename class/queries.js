let query = {

    orderBy: function(obj) {
        let orderBy;
        if (obj.orderBy == undefined) {
            orderBy = " ORDER BY " + obj.field;
        } else {
            orderBy = " ORDER BY " + obj.field + " " + obj.orderBy;
        }
        return orderBy;
    },
    limit: function(condition) {
        let limit;
        if (typeof condition == "number") {
            limit = " LIMIT " + condition;
        } else {
            if (condition.length == 1) {
                limit = " LIMIT " + condition[0];
            } else if (condition.length == 2) {
                limit = " LIMIT " + condition[0] + " OFFSET " + condition[1];
            }
        }
        return limit;
    },
    subQuery: function(condition) {
        let sql = "SELECT ";
        let table = condition.model.table;
        // Display Column List based on Condition. Otherwise All Column will be display
        if (condition.column != undefined && condition.column.length > 0) {
            let columnList = condition.column.join(', ');
            sql = sql.concat(columnList).concat(" FROM " + table);
            // sql = sql.concat("DISTINCT ", columnList, " FROM " + table);
        } else {
            sql = sql.concat("* FROM " + table);
        }

        // Where Clause
        if (condition.where != undefined && Object.keys(condition.where).length !== 0) {
            sql = sql.concat(this.whereClause(condition.where));
        }

        // Column Order By. Default is Ascending. For Descending Order need to Pass DESC Keyword
        if (condition.order != undefined && Object.keys(condition.order).length !== 0) {
            sql = sql.concat(this.orderBy(condition.order));
        }

        // Limit & Offset
        if ((typeof condition.limit == "object" && condition.limit.length > 0) || typeof condition.limit == "number") {
            sql = sql.concat(this.limit(condition.limit));
        }

        return '(' + sql + ')';
    },

    whereClause: function(where) {
        let whereArr = [];

        // Basic equal Condition
        if (where.condition != undefined && Object.keys(where.condition).length !== 0) {
            Object.keys(where.condition).map(key => {
                if (typeof where.condition[key] == "string") {
                    whereArr.push(key + "='" + where.condition[key] + "'");
                } else if(typeof where.condition[key] == "object"){
                    if(where.condition[key].subQuery != undefined){
                        let sql = this.subQuery(where.condition[key].subQuery);
                        console.log(sql);
                        whereArr.push(key + "=" + sql);
                    }
                } else {
                    whereArr.push(key + "=" + where.condition[key]);
                }
            });
        }

        // Like, NotLike, Between, NotBetween Condition
        if (where.operator != undefined && Object.keys(where.operator).length !== 0) {
            Object.keys(where.operator).map(key => {

                // LIKE & NOT LIKE
                if (key.toLowerCase() == "like" || key.toLowerCase() == "notlike") {
                    if (where.operator[key].length > 0) {
                        if (key.toLowerCase() == "like") {
                            if(typeof where.operator[key][1] == "object"){
                                if(where.operator[key][1].subQuery != undefined){
                                    let sql = this.subQuery(where.operator[key][1].subQuery);
                                    console.log(sql);
                                    whereArr.push(where.operator[key][0] + " " + key + " " + sql);
                                }
                            }else{
                                whereArr.push(where.operator[key][0] + " " + key + " '" + where.operator[key][1] + "'");
                            }
                        } else {
                            if(typeof where.operator[key][1] == "object"){
                                if(where.operator[key][1].subQuery != undefined){
                                    let sql = this.subQuery(where.operator[key][1].subQuery);
                                    console.log(sql);
                                    whereArr.push(where.operator[key][0] + " NOT LIKE '" + sql);
                                }
                            }else{
                                whereArr.push(where.operator[key][0] + " NOT LIKE  '" + where.operator[key][1] + "'");
                            }                            
                        }
                    }
                }

                // BETWEEN & NOT BETWEEN
                else if (key.toLowerCase() == "between" || key.toLowerCase() == "notbetween") {
                    if (where.operator[key].length > 0) {
                        if (key.toLowerCase() == "between") {
                            whereArr.push(where.operator[key][0] + " " + key + " " + where.operator[key][1] + " AND " + where.operator[key][2]);
                        } else {
                            whereArr.push(where.operator[key][0] + " NOT BETWEEN " + where.operator[key][1] + " AND " + where.operator[key][2]);
                        }
                    }
                }

                // IN & NOT IN
                else if (key.toLowerCase() == 'in' || key.toLowerCase() == 'notin') {
                    if (where.operator[key].length > 0) {
                        let fieldName = where.operator[key].shift();
                        if (key.toLowerCase() == "in") {
                            whereArr.push(fieldName + " " + key + " (" + where.operator[key].join(', ') + ")");
                        } else {
                            whereArr.push(fieldName + " NOT IN (" + where.operator[key].join(', ') + ")");
                        }
                    }
                }

                // GREATER THEN & GREATER THEN OR EQUAL
                else if (key.toLowerCase() == 'gt' || key.toLowerCase() == 'gte') {
                    if (where.operator[key].length > 0) {
                        if (key.toLowerCase() == "gt") {
                            if(typeof where.operator[key][1] == "object"){
                                if(where.operator[key][1].subQuery != undefined){
                                    let sql = this.subQuery(where.operator[key][1].subQuery);
                                    console.log(sql);
                                    whereArr.push(where.operator[key][0] + " > " + sql);
                                }
                            }else{
                                whereArr.push(where.operator[key][0] + " > " + where.operator[key][1]);
                            }
                        } else {
                            if(typeof where.operator[key][1] == "object"){
                                if(where.operator[key][1].subQuery != undefined){
                                    let sql = this.subQuery(where.operator[key][1].subQuery);
                                    console.log(sql);
                                    whereArr.push(where.operator[key][0] + " >= " + sql);
                                }
                            }else{
                                whereArr.push(where.operator[key][0] + " >= " + where.operator[key][1]);
                            }
                        }
                    }
                }

                // LESS THEN & LESS THEN OR EQUAL
                else if (key.toLowerCase() == 'lt' || key.toLowerCase() == 'lte') {
                    if (where.operator[key].length > 0) {
                        if (key.toLowerCase() == "lt") {
                            if(typeof where.operator[key][1] == "object"){
                                if(where.operator[key][1].subQuery != undefined){
                                    let sql = this.subQuery(where.operator[key][1].subQuery);
                                    console.log(sql);
                                    whereArr.push(where.operator[key][0] + " < " + sql);
                                }
                            }else{
                                whereArr.push(where.operator[key][0] + " < " + where.operator[key][1]);
                            }
                        } else {
                            if(typeof where.operator[key][1] == "object"){
                                if(where.operator[key][1].subQuery != undefined){
                                    let sql = this.subQuery(where.operator[key][1].subQuery);
                                    console.log(sql);
                                    whereArr.push(where.operator[key][0] + " <= " + sql);
                                }
                            }else{
                                whereArr.push(where.operator[key][0] + " <= " + where.operator[key][1]);
                            }
                            
                        }
                    }
                }
            });
        }
        // Default AND Operator
        if (whereArr.length > 0) {
            let whereClause = whereArr.join(' AND ');
            let sql = " WHERE " + whereClause;
            return sql;
        }else{
            return '';
        }
        
    }
}

module.exports = query;