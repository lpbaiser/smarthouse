const http = require('http').createServer(servidor);
const url = require('url');
var qs = require('querystring');
const fs = require('fs');
const five = require('johnny-five');
const mysql = require('mysql2');
const arduino = new five.Board();
var led, portao, porta, buzzer;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'bdarduino'
});

arduino.on('ready', function () {
  console.log("Arduino Pronto");

  led = new five.Led(13);
  portao = new five.Servo(8);
  porta = new five.Servo(9);
  buzzer = new five.Piezo(10);
  // buzzer.noTone();
  // buzzer.tone(0, 0);
  porta.to(-90);
});

var chavePortao = 'F';
var chavePorta = 'F';
var body = '';

var idLogin = null;

function servidor(request, response) {

  var url = request.url;
  if (url == '/') {
    response.writeHead(200);
    response.end(fs.readFileSync('./login.html'));
  } else if (url == '/index') {
    // if (!idLogin) {
    //   response.writeHead(200);
    //   response.end(fs.readFileSync('./login.html'));
    //   return;
    // }
    response.writeHead(200, {
      "Content-Type": "text/html"
    });
    fs.readFile('./index.html', "utf8", function (err, data) {
      if (err) throw err;
      response.write(data);
      response.end();
    });



  } else if (url == '/login') {
    let login;
    let senha;
    if (request.method == 'POST') {
      request.on('data', function (data) {
        body = data;
      });
      request.on('end', function () {
        var POST = qs.parse(body);
        var jsonP = JSON.parse(body);
        login = jsonP.login;
        senha = jsonP.senha;
        console.log('ACAO LOGIN', jsonP);

        var user;
        fazerLogin(login, senha, function (err, content) {
          if (err) {
            console.log(err);
            response.writeHead(401);
            response.end();
            return;
          } else {
            user = content;
            if (!user) {
              response.writeHead(401);
              response.end();
              return;
            }
            console.log(user);
            idLogin = user.idlogin;
            response.writeHead(200);
            response.write({'idlogin': idLogin})
            response.end();
          }
        });
      });
    }

  } else if (url == '/portao') {
    response.writeHead(302, { 'Location': '/' });
    response.end();
    if (chavePortao == 'F') {
      chavePortao = 'A';
      portao.to(-90);
    } else {
      chavePortao = 'F';
      portao.to(90);
    }

    if (request.method == 'POST') {
      request.on('data', function (data) {
        body = data;
      });
      request.on('end', function () {
        var POST = qs.parse(body);
        var jsonS = JSON.parse(body)
        let acao = jsonS.controlePortao == 0 ? 'FECHAR' : 'ABRIR';
        let tipo = 'PORTAO';
        saveLog(acao, tipo, idLogin, function (err) {
          if (err) {
            console.log('erro ao salvar log', err);
          } else {
            console.log('log salvo');
          }
        });
        console.log('ACAO PORTAO', acao);
      });
    }

  } else if (url == '/porta') {
    response.writeHead(302, { 'Location': '/' });
    response.end();
    if (chavePorta == 'F') {
      chavePorta = 'A';
      porta.to(90);
    } else {
      chavePorta = 'F';
      porta.to(-90);
    }
    if (request.method == 'POST') {
      request.on('data', function (data) {
        body = data;
      });
      request.on('end', function () {
        var POST = qs.parse(body);
        var jsonS = JSON.parse(body)
        let acao = jsonS.controlePorta == 0 ? 'FECHAR' : 'ABRIR';
        let tipo = 'PORTA';
        saveLog(acao, tipo, idLogin, function (err) {
          if (err) {
            console.log('erro ao salvar log', err);
          } else {
            console.log('log salvo');
          }
        });
        console.log('ACAO PORTA', acao);
      });
    }
  } else if (url == '/getLogs') {
    getLogs(function (err, content) {
      if (err) {
        console.log(err);
      } else {
        // console.log(content)
        sendLogs(response, content);
      }
    })
  } else if (url == '/buzzer') {
    response.writeHead(302, { 'Location': '/' });
    response.end();
    portao.to(90);
    // buzzer.play({
    //   // song is composed by a string of notes
    //   // a default beat is set, and the default octave is used
    //   // any invalid note is read as "no note"
    //   song: "C D F D A - A A A A G G G G - - C D F D G - G G G G F F F F - -",
    //   beats: 1 / 4,
    //   tempo: 100
    // });
    // buzzer.frequency(587, 1000);
    // buzzer.tone(0, 1000);
  } else {
    response.writeHead(200);
    response.end("<h1>Erro 404</h1>");
  }
};


function fazerLogin(login, senha, callback) {
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
}

function getLogs(callback) {
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

function sendLogs(response, logs) {
  response.writeHead(200, { "Content-Type": "application/json" });
  var json = JSON.stringify({
    logs: logs,
  });
  response.end(json);
}

function saveLog(acao, tipo, idLogin, callback) {
  var data = new Date();
  var sql = "INSERT INTO logs (acao, tipo, data, idLogin) VALUES ?";
  var values = [
    [acao, tipo, data, idLogin],
  ];
  connection.query(
    sql, [values], function (err) {
      // console.log(rows)
      if (err) {
        callback(err);
      } else {
        callback(null);
      }
    }
  );
}

http.listen(3000, function () {
  console.log("Servidor On-line");
});