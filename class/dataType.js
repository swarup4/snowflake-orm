const DataType = {
    Binary: "BINARY",
    Boolean: "BOOLEAN",
    
    Float: "FLOAT",
    Double: "DOUBLE",

    Date: "DATE",
    Datetime: "DATETIME",
    Array: "ARRAY",

    String: function (value) {
        return value == undefined ? "STRING" : "STRING(" + value + ")";
    },
    Varchar: function (value) {
        return value == undefined ? "VARCHAR" : "VARCHAR(" + value + ")";
    },
    Char: function (value) {
        return value == undefined ? "CHAR" : "CHAR(" + value + ")";
    },

    Number: function (value) {
        return value == undefined ? "NUMBER" : "NUMBER(" + value + ")";
    },
    Int: function (value) {
        return value == undefined ? "INT" : "INT(" + value + ")";
    },
    Integer: function (value) {
        return value == undefined ? "INTEGER" : "INTEGER(" + value + ")";
    },
    Timestamp: function(value){
        if(value == undefined){
            return "TIMESTAMP";
        }else if(value == 'LTZ'){
            return "TIMESTAMP_LTZ";
        }else if(value == 'NTZ'){
            return "TIMESTAMP_NTZ";
        }
    },
    Now: function () {
        return "CURRENT_TIMESTAMP()";
    }
};

module.exports = DataType;