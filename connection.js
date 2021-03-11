let snowflake = require('snowflake-sdk');

let connect = function (connectionObj) {
    snowflake.configure({ insecureConnect: true });
    const connection = snowflake.createConnection(connectionObj);

    return new Promise(function (resolve, reject) {
        connection.connect((err, conn) => {
            if (err) {
                reject(err);
            } else {
                resolve(conn);
            }
        });
    });
}

module.exports = connect;