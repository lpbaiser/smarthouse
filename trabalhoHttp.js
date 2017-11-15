const http = require('http').createServer(servidor);
const url = require('url');
var qs = require('querystring');
const fs = require('fs');
const five = require('johnny-five');
const mysql = require('mysql2');
const CONFIG = require('./configuration')
const Alarm = require('./alarm')
const arduino = new five.Board();
var led, portao, porta, buzzer, sensor;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'bdarduino'
});

var chavePortao = 'F';
var chavePorta = 'F';
var body = '';

var idLogin = null;

let alarmePorta;
let alarmePortao;

let acaoAlarme = true;
var intervalAlarme = null;

arduino.on('ready', function () {
  console.log("Arduino Pronto");

  led = new five.Led(CONFIG.LED.PIN);
  portao = new five.Servo(CONFIG.PORTAO.PIN);
  porta = new five.Servo(CONFIG.PORTA.PIN);
  // buzzer = new five.Piezo(CONFIG.BUZZER.PIN);
  alarm = new Alarm();
  sensor = new five.Motion(CONFIG.PIR.PIN);
  // buzzer.noTone();
  // buzzer.tone(0, 0);
  porta.to(-90);



  // sensor.on("data", function() {
  //   console.log("data");
  // });

  // "calibrated" occurs once, at the beginning of a session,
  sensor.on("calibrated", function () {
    console.log("calibrated");
  });

  // "motionstart" events are fired when the "calibrated"
  // proximal area is disrupted, generally by some form of movement
  sensor.on("motionstart", function () {
    console.log("motionstart");
    if (acaoAlarme) {
      alarm.startAlarm();
    }
  });

  // "motionend" events are fired following a "motionstart" event
  // when no movement has occurred in X ms
  sensor.on("motionend", function () {
    console.log("motionend");
  });

});


function servidor(request, response) {

  var url = request.url;
  if (url == '/') {
    response.writeHead(200);
    response.end(fs.readFileSync('./login.html'));
  } else if (url == '/index') {
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

            idLogin = user.idlogin;
            response.writeHead(200);
            response.end(JSON.stringify({ idlogin: content.idlogin }));
          }
        });
      });
    }

  } else if (url == '/portao') {
    response.writeHead(302, { 'Location': '/' });
    response.end();
    buzzer.play({
      song: "C - D - C",
      beats: 1 / 3,
      tempo: 60
    });
    if (chavePortao == 'F') {
      alarmePortao = setInterval(function () {
        buzzer.play({
          song: "C - C - C",
          beats: 1 / 3,
          tempo: 60
        });
      }, 5000);
      chavePortao = 'A';
      portao.to(-90);
    } else {
      clearInterval(alarmePortao)
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
        console.log(jsonS.controlePortao)
        let acao = jsonS.controlePortao == 0 ? 'FECHAR' : 'ABRIR';
        let idLogin = jsonS.idLogin;
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
    buzzer.play({
      song: "C - D -",
      beats: 1 / 2,
      tempo: 60
    });
    if (chavePorta == 'F') {
      alarmePorta = setInterval(function () {
        buzzer.play({
          song: "C - C - C",
          beats: 1 / 3,
          tempo: 60
        });
      }, 5000);
      chavePorta = 'A';
      porta.to(90);
    } else {
      clearInterval(alarmePorta)
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
        let idLogin = jsonS.idLogin;
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
  } else if (url == '/stopAlarme') {
    response.writeHead(302, { 'Location': '/' });
    response.end();
    alarm.stopAlarm();
  } else {
    response.writeHead(200);
    response.end("<h1>Erro 404</h1>");
  }
};

function enviaAlertaAlarmeDisparou() {

}


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