
const mysql = require('mysql2');

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

ControllerBd.prototype.getLogs = function (callback) {
    connection.query(
        'SELECT * FROM `logs` ORDER BY data DESC',
        function (err, result, fields) {
            // console.log(rows)
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
        }
    );
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

module.exports = ControllerBd;