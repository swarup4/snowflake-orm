function functions(functionName, option) {
    let arr = [];
    for (let i = 0; i < option.length; i++) {
        let sql;
        if (option[i].distinct != undefined && option[i].distinct == true) {
            sql = functionName + "(distinct " + option[i].column + ")";
        } else {
            sql = functionName + "(" + option[i].column + ")";
        }
        if (option[i].as != undefined) {
            sql = sql.concat(" as " + option[i].as);
        }
        arr.push(sql);
    }
    return arr;
}

module.exports = functions;