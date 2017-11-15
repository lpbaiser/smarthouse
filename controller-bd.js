
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'bdarduino'
  });

function ControllerBd(){

}

ControllerBd.prototype.login = function (login, senha, callback) {
    
};

module.exports = ControllerBd;