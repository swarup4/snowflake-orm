const constraintsSupport = {
    allowNull: (key) => {
        if (key == true) {
            return ' NULL'
        } else if(key == false) {
            return ' NOT NULL'
        }else{
            return '';
        }
    },
    autoIncrement: (key) => {
        if (key == true) {
            return ' AUTOINCREMENT';
        } else {
            return '';
        }
    },
    defaultValue: (key) => {
        if (key != undefined) {
            return ' DEFAULT ' + key;
        } else {
            return '';
        }
    }
}
const constraints = {
    checkConstraints: (field, obj) => {
        let sql;
        let association;
        let constraint = constraintsSupport;
        Object.keys(obj).map(key => {
            if (key == "type") {
                sql = field + " " + obj[key];
            } else if (key == "primaryKey" && obj[key] == true) {
                sql = sql + " PRIMARY KEY";
                obj.allowNull = false;
            } else if (key == "unique" && obj[key] == true) {
                sql = sql + " UNIQUE";
            } else if(key == 'references' && Object.keys(key).length !== 0){
                association = "FOREIGN KEY(" + field + ") REFERENCES " + obj[key].model + "(" + obj[key].column + ")";
            }
        });
        sql = sql.concat(constraint.autoIncrement(obj.autoIncrement), constraint.allowNull(obj.allowNull), constraint.defaultValue(obj.defaultValue));
        
        if(association != undefined){
            sql = sql + ', ' + association;
        }
        
        return sql;
    }
}

module.exports = constraints;