const DataType = {
    BINARY: "BINARY",
    BOOLEAN: "BOOLEAN",
    
    FLOAT: "FLOAT",
    DOUBLE: "DOUBLE",

    DATE: "DATE",
    DATETIME: "DATETIME",
    ARRAY: "ARRAY",

    NUMBER: "NUMBER",
    INT: "INT",
    INTEGER: "INTEGER",

    STRING: function (value) {
        return value == undefined ? "STRING" : "STRING(" + value + ")";
    },
    VARCHAR: function (value) {
        return value == undefined ? "VARCHAR" : "VARCHAR(" + value + ")";
    },
    CHAR: function (value) {
        return value == undefined ? "CHAR" : "CHAR(" + value + ")";
    },

    // NUMBER: function (value) {
    //     return value == undefined ? "NUMBER" : "NUMBER(" + value + ")";
    // },
    // INT: function (value) {
    //     return value == undefined ? "INT" : "INT(" + value + ")";
    // },
    // INTEGER: function (value) {
    //     return value == undefined ? "INTEGER" : "INTEGER(" + value + ")";
    // },

    TIMESTAMP: function(value){
        if(value == undefined){
            return "TIMESTAMP";
        }else if(value == 'LTZ'){
            return "TIMESTAMP_LTZ";
        }else if(value == 'NTZ'){
            return "TIMESTAMP_NTZ";
        }
    },
    NOW: function () {
        return "CURRENT_TIMESTAMP()";
    }
};

module.exports = DataType;