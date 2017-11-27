
const mysql = require('mysql2');
const Promise = require("bluebird");

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'bdarduino'
});

function ControllerBd() {

}

ControllerBd.prototype.login = function (login, senha, callback) {
    connection.query(
        'SELECT idlogin, login FROM `login` WHERE `login` = ? AND `senha` = ?',
        [login, senha],
        function (err, rows) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, rows[0]);
            }
        }
    );
};

ControllerBd.prototype.getLogs = function (tipo) {
    let where = 'SELECT la.idlogs, la.data, la.acao, la.tipo, l.idlogin, l.login FROM logs AS la, login AS l WHERE tipo = \'' + tipo + '\' ORDER BY data DESC LIMIT 20';
    console.log(where);
    return new Promise(function (resolve, reject) {
        connection.query(
            where,
            function (err, result, fields) {
                // console.log(rows)
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            }
        );
    })
}

ControllerBd.prototype.saveLog = function (acao, tipo, idLogin, callback) {
    var data = new Date();
    var sql = "INSERT INTO logs (acao, tipo, data, idLogin) VALUES ?";
    var values = [
        [acao, tipo, data, idLogin],
    ];
    connection.query(
        sql, [values], function (err) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        }
    );
}

ControllerBd.prototype.saveLogAlarme = function (acao, idLogin, callback) {
    var data = new Date();
    var sql = "INSERT INTO logs_alarme (acao, data, idLogin) VALUES ?";
    var values = [
        [acao, data, idLogin],
    ];
    connection.query(
        sql, [values], function (err) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        }
    );
}

ControllerBd.prototype.getLogsAlarme = function () {
    let where = 'SELECT la.idlogs, la.data, la.acao, l.idlogin, l.login FROM logs_alarme AS la, login AS l ORDER BY data DESC LIMIT 20';
    console.log(where);
    return new Promise(function (resolve, reject) {
        connection.query(
            where,
            function (err, result, fields) {
                // console.log(rows)
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            }
        );
    })
}

module.exports = ControllerBd;