const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'bdarduino'
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
    var table_login = "CREATE TABLE login (idlogin int(11) NOT NULL AUTO_INCREMENT, login varchar(45) DEFAULT NULL, senha varchar(45) DEFAULT NULL, PRIMARY KEY (idlogin));";
    var table_logs = "CREATE TABLE logs (idlogs int(11) NOT NULL AUTO_INCREMENT, acao enum('ABRIR','FECHAR') NOT NULL, tipo enum('PORTAO','PORTA') NOT NULL, data datetime NOT NULL, idlogin int(11) DEFAULT NULL, PRIMARY KEY (idlogs), KEY idlogin (idlogin), CONSTRAINT idlogin FOREIGN KEY (idlogin) REFERENCES login (idlogin));";
    var table_logs = "CREATE TABLE logs_alarme (idlogs int(11) NOT NULL AUTO_INCREMENT, acao enum('ATIVADO','DESATIVADO') NOT NULL, data datetime NOT NULL, idlogin int(11) DEFAULT NULL, PRIMARY KEY (idlogs), KEY idlogin (idlogin), CONSTRAINT idlogin FOREIGN KEY (idlogin) REFERENCES login (idlogin));";
    var insert_login = "INSERT INTO login (login, senha) VALUES ?";
    var values = [
        ['lpbaiser', '123'],
        ['rmeloca', '456'],
    ];
    connection.query(table_login, function (err, result) {
        if (err) throw err;
        console.log("Table login created");
    });
    connection.query(table_logs, function (err, result) {
        if (err) throw err;
        console.log("Table logs created");
    });
    connection.query(
        insert_login, [values], function (err) {
            if (err) throw err;
            console.log("Insert new login success");
        }
    );
});