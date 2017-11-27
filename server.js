const http = require('http').createServer(servidor);
const Promise = require("bluebird");
const five = require('johnny-five');
const arduino = new five.Board();
const url = require('url');
var qs = require('querystring');
const fs = require('fs');
const mysql = require('mysql2');
const CONFIG = require('./configuration')
const Alarm = require('./alarm')
const ControllerBd = require('./controller-bd')
var led, portao, porta, buzzer, sensor, ir, motor, temperatura;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'bdarduino'
});

let chavePortao = 'F';
let chavePorta = 'F';
let body = '';
let idLogin = null;

let alarmePorta;
let alarmePortao;

let acaoAlarme = false;
let disparoAlarme = false;
let intervalAlarme = null;

let acaoVentilador = false;

let temperaturaAtual;


arduino.on('ready', function () {
  console.log("Arduino Pronto");

  led = new five.Led(CONFIG.LED.PIN);
  portao = new five.Servo(CONFIG.PORTAO.PIN);
  porta = new five.Servo(CONFIG.PORTA.PIN);
  // buzzer = new five.Piezo(CONFIG.BUZZER.PIN);
  alarm = new Alarm();
  controllerBd = new ControllerBd();
  sensor = new five.Motion(CONFIG.PIR.PIN);
  temperatura = new five.Thermometer({
    controller: CONFIG.TEMPERATURA.TYPE,
    pin: CONFIG.TEMPERATURA.PIN
  });

  porta.to(-90);

  motor = new five.Motor([3, 4]);
  motor.fwd(255);

  temperatura.on("change", function () {
    temperaturaAtual = this.celsius;
    if (this.celsius >= 30 && acaoAlarme == false) {
      motor.fwd(1);
    } else if (acaoVentilador == false) {
      motor.fwd(255);
    }
    // console.log(this.celsius + "°C", this.fahrenheit + "°F");
  });


  // "calibrated" occurs once, at the beginning of a session,
  sensor.on("calibrated", function () {
    console.log("calibrated");
  });

  // "motionstart" events are fired when the "calibrated"
  // proximal area is disrupted, generally by some form of movement
  sensor.on("motionstart", function () {
    console.log("motionstart");
    // motor.fwd(1);
    if (acaoAlarme) {
      disparoAlarme = true;
      alarm.playAlarm();
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
        controllerBd.login(login, senha, function (err, content) {
          // fazerLogin(login, senha, function (err, content) {
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
    motor.fwd(255);
    response.writeHead(302, { 'Location': '/' });
    response.end();

    if (request.method == 'POST') {
      request.on('data', function (data) {
        body = data;
      });
      request.on('end', function () {
        var POST = qs.parse(body);
        var jsonS = JSON.parse(body)
        let acao = jsonS.controlePortao == 0 ? 'FECHAR' : 'ABRIR';

        console.log("POrtao", acao);
        if (acao == "ABRIR") {
          portao.to(-90);
          alarm.playAlarmOpen();
        } else {
          portao.to(90);
          alarm.playAlarmClose();
        }

        let idLogin = jsonS.idLogin;
        let tipo = 'PORTAO';
        controllerBd.saveLog(acao, tipo, idLogin, function (err) {
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

        console.log("POrta", acao);
        if (acao == "ABRIR") {
          porta.to(90);
          alarm.playAlarmOpen();
        } else {
          porta.to(-90);
          alarm.playAlarmClose();
        }

        controllerBd.saveLog(acao, tipo, idLogin, function (err) {
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
    let logsPorta, logsPortao, logsAlarme;
    return new Promise(function (resolve, reject) {
      controllerBd.getLogs('PORTA')
        .then((result) => {
          logsPorta = result;
          return controllerBd.getLogs('PORTAO')
        })
        .then((result) => {
          logsPortao = result;
          return controllerBd.getLogsAlarme()
        })
        .then((result) => {
          logsAlarme = result;
          response.writeHead(200, { "Content-Type": "application/json" });
          var json = JSON.stringify({
            logs: {
              logsPorta,
              logsPortao,
              logsAlarme
            },
          });
          response.end(json);
          resolve();
        })
        .catch(reject);
    })

  } else if (url == '/alarme') {
    response.writeHead(302, { 'Location': '/' });
    response.end();

    if (request.method == 'POST') {
      request.on('data', function (data) {
        body = data;
      });
      request.on('end', function () {
        var POST = qs.parse(body);
        var jsonS = JSON.parse(body)
        let acao = jsonS.controleAlarme == 0 ? 'DESATIVADO' : 'ATIVADO';
        let idLogin = jsonS.idLogin;
        if (acao == 'ATIVADO') {
          alarm.playAlarmClose();
          acaoAlarme = true;
        } else if (acao == 'DESATIVADO') {
          alarm.stopAlarm();
          acaoAlarme = false;
          disparoAlarme = false;
          setTimeout(() => {
            alarm.playAlarmOpen();
          }, 1000);//espera 1 segundo para soar som de desativacao
        }

        controllerBd.saveLogAlarme(acao, idLogin, function (err) {
          if (err) {
            console.log('erro ao salvar log', err);
          } else {
            console.log('log salvo');
          }
        });
      });
    }

  } else if (url == '/ventilador') {
    response.writeHead(302, { 'Location': '/' });
    response.end();

    if (request.method == 'POST') {
      request.on('data', function (data) {
        body = data;
      });
      request.on('end', function () {
        var POST = qs.parse(body);
        var jsonS = JSON.parse(body)
        let acao = jsonS.controleVentilador == 0 ? 'DESATIVADO' : 'ATIVADO';
        let idLogin = jsonS.idLogin;
        if (acao == 'ATIVADO') {
          acaoVentilador = true;
          motor.fwd(1);
        } else if (acao == 'DESATIVADO') {
          acaoVentilador = false;
          motor.fwd(255);
        }
      });
    }
  } else if (url == '/led') {
    request.on('data', function (data) {
      body = data;
    });
    request.on('end', function () {
      var POST = qs.parse(body);
      var jsonS = JSON.parse(body)
      let acao = jsonS.controleLed == 0 ? 'DESATIVADO' : 'ATIVADO';
      let idLogin = jsonS.idLogin;
      if (acao == 'ATIVADO') {
        led.on();
      } else if (acao == 'DESATIVADO') {
        led.off();
      }
    });
  } else if (url == '/disparoAlarme') {
    response.writeHead(200, { "Content-Type": "application/json" });
    var json = JSON.stringify({
      disparoAlarme: disparoAlarme,
    });
    response.end(json);
  } else if (url == '/temperatura') {
    response.writeHead(200, { "Content-Type": "application/json" });
    var json = JSON.stringify({
      temperatura: temperaturaAtual,
    });
    response.end(json);
  } else if (url.endsWith('.js')) {
    response.writeHead(200, {
      "Content-Type": "application/javascript"
    });
    fs.readFile('.' + url, "utf8", function (err, data) {
      if (err) throw err;
      response.write(data);
      response.end();
    });
  } else if (url.endsWith('.css')) {
    response.writeHead(200, {
      "Content-Type": "text/css"
    });
    fs.readFile('.' + url, "utf8", function (err, data) {
      if (err) throw err;
      response.write(data);
      response.end();
    });
  } else {
    response.writeHead(200);
    response.end("<h1>Erro 404</h1>");
  }
};

function sendLogs(response, logs) {
  response.writeHead(200, { "Content-Type": "application/json" });
  var json = JSON.stringify({
    logs: logs,
  });
  response.end(json);
}

http.listen(3000, function () {
  console.log("Servidor On-line");
});