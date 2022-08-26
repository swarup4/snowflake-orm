const { v4: uuidv4 } = require('uuid');

const DataType = require('./class/dataType');
const helper = require('./helper');
const snowflakeConnection = require('./connection');
let dbConnection;

const snowflakeObj = {
    connect: (connectionObj) => {
        return new Promise(function (resolve, reject) {
            snowflakeConnection(connectionObj).then(data => {
                dbConnection = data;
                resolve('Successfully connected to Snowflake.');
            }, err => {
                reject("Unable to connect: " + err.message);
            });
        });
    },
    query: (sql, values) => {
        return new Promise((resolve, reject) => {
            if (values != undefined && Array.isArray(values) == true && values.length > 0) {
                dbConnection.execute({
                    sqlText: sql,
                    binds: values,
                    complete: function (err, stmt, rows) {
                        if (err) {
                            reject(err.message);
                        } else {
                            resolve(rows);
                        }
                    }
                });
            } else {
                dbConnection.execute({
                    sqlText: sql,
                    complete: function (err, stmt, rows) {
                        if (err) {
                            reject(err.message);
                        } else {
                            resolve(rows);
                        }
                    }
                });
            }

        });
    },
    
    Init: function (table, cols) {
        this.table = table;
        this.cols = cols;

        /* Create Table based on Models */
        this.create = () => {
            let sql = `CREATE TABLE ${this.table} (${helper.createTable(this.cols).join(', ')})`;
            return new Promise((resolve, reject) => {
                dbConnection.execute({
                    sqlText: sql,
                    complete: function (err, stmt, rows) {
                        if (err) {
                            reject(err.message);
                        } else {
                            resolve(rows);
                        }
                    }
                });
            });
        };
        /* Drop Table based on Models */
        this.drop = () => {
            let sql = `DROP TABLE ${this.table}`;
            return new Promise((resolve, reject) => {
                dbConnection.execute({
                    sqlText: sql,
                    complete: function (err, stmt, rows) {
                        if (err) {
                            reject(err.message);
                        } else {
                            resolve(rows);
                        }
                    }
                });
            });
        };

        /* Insert record into table */
        this.save = (data) => {
            if(this.cols.id != undefined && this.cols.id.require != undefined && this.cols.id.require == true){
                if(data.id == undefined){
                    data.id = uuidv4();
                }
            }
            let sql = `insert into ${this.table} (${helper.insertTableColumn('column', data).join(', ')}) values (${helper.insertTableColumn('value', data).join(', ')})`;
            return new Promise((resolve, reject) => {
                dbConnection.execute({
                    sqlText: sql,
                    complete: function (err, stmt, rows) {
                        if (err) {
                            reject(err.message);
                        } else {
                            resolve(rows);
                        }
                    }
                });
            })
        };

        // Find
        /* condition is Use for Multiple Codition. List of Column, Where Clause
            column: We have column object. We need to pass an array of Column list which column we need to display.
            Where: We have Where clause Object. We need to pass an object of condition .
        */
        this.find = (obj) => {
            let sql = helper.query(this.table, obj);
            return new Promise((resolve, reject) => {
                dbConnection.execute({
                    sqlText: sql,
                    complete: function (err, stmt, rows) {
                        if (err) {
                            reject(err.message);
                        } else {
                            resolve(rows);
                        }
                    }
                });
            })
        };
        this.findById = (id) => {
            let sql = `SELECT * FROM ${this.table} WHERE id = ?`;
            return new Promise((resolve, reject) => {
                dbConnection.execute({
                    sqlText: sql,
                    binds: [id],
                    complete: function (err, stmt, rows) {
                        if (err) {
                            reject(err.message);
                        } else {
                            resolve(rows[0]);
                        }
                    }
                });
            })
        };

        this.findByFunction = (obj) => {
            let sql = helper.queryFunction(this.table, obj);
            return new Promise((resolve, reject) => {
                dbConnection.execute({
                    sqlText: sql,
                    complete: function (err, stmt, rows) {
                        if (err) {
                            reject(err.message);
                        } else {
                            resolve(rows[0]);
                        }
                    }
                });
            })
        }

        // Update Data from Table
        this.update = (data, obj) => {
            let sql = `UPDATE ${this.table} SET ${helper.basicQuery(data).join(', ')} ${helper.where(obj)}`;
            return new Promise((resolve, reject) => {
                dbConnection.execute({
                    sqlText: sql,
                    complete: function (err, stmt, rows) {
                        if (err) {
                            reject(err.message);
                        } else {
                            resolve(rows);
                        }
                    }
                });
            });
        };
        this.updateById = (data, id) => {
            let sql = `UPDATE ${this.table} SET ${helper.basicQuery(data).join(', ')} WHERE id = ?`;
            return new Promise((resolve, reject) => {
                dbConnection.execute({
                    sqlText: sql,
                    binds: [id],
                    complete: function (err, stmt, rows) {
                        if (err) {
                            reject(err.message);
                        } else {
                            resolve(rows);
                        }
                    }
                });
            });
        };

        // Delete Data from Table
        this.delete = (obj) => {
            let sql = `DELETE FROM ${this.table} ${helper.where(obj)}`;
            return new Promise((resolve, reject) => {
                dbConnection.execute({
                    sqlText: sql,
                    complete: function (err, stmt, rows) {
                        if (err) {
                            reject(err.message);
                        } else {
                            resolve(rows);
                        }
                    }
                });
            });
        };
        this.deleteById = (id) => {
            let sql = `DELETE FROM ${this.table} WHERE id = ?`;
            return new Promise((resolve, reject) => {
                dbConnection.execute({
                    sqlText: sql,
                    binds: [id],
                    complete: function (err, stmt, rows) {
                        if (err) {
                            reject(err.message);
                        } else {
                            resolve(rows);
                        }
                    }
                });
            });
        };

        // Joining
        this.innerJoin = (obj) => {
            let joinType = " INNER JOIN ";
            let sql = helper.join(this.table, joinType, obj);
            console.log(sql);
            return new Promise((resolve, reject) => {
                dbConnection.execute({
                    sqlText: sql,
                    complete: function (err, stmt, rows) {
                        if (err) {
                            reject(err.message);
                        } else {
                            resolve(rows);
                        }
                    }
                });
            });
        };

        this.leftJoin = (obj) => {
            let joinType = " LEFT JOIN ";
            let sql = helper.join(this.table, joinType, obj);
            console.log(sql);
            return new Promise((resolve, reject) => {
                dbConnection.execute({
                    sqlText: sql,
                    complete: function (err, stmt, rows) {
                        if (err) {
                            reject(err.message);
                        } else {
                            resolve(rows);
                        }
                    }
                });
            });
        };

        this.rightJoin = (obj) => {
            let joinType = " RIGHT JOIN ";
            let sql = helper.join(this.table, joinType, obj);
            console.log(sql);
            return new Promise((resolve, reject) => {
                dbConnection.execute({
                    sqlText: sql,
                    complete: function (err, stmt, rows) {
                        if (err) {
                            reject(err.message);
                        } else {
                            resolve(rows);
                        }
                    }
                });
            });
        };

        this.fullJoin = (obj) => {
            let joinType = " FULL OUTER JOIN ";
            let sql = helper.join(this.table, joinType, obj);
            console.log(sql);
            return new Promise((resolve, reject) => {
                dbConnection.execute({
                    sqlText: sql,
                    complete: function (err, stmt, rows) {
                        if (err) {
                            reject(err.message);
                        } else {
                            resolve(rows);
                        }
                    }
                });
            });
        };
    }
}
snowflakeObj.__proto__ = DataType;

module.exports = snowflakeObj;