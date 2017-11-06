// Vamos carregar os módulos johnny five e http var five = require('johnny-five'); var http = require('http');
var http = require('http');
var five = require('johnny-five');

// Instanciaremos uma placa 
var board = new five.Board();

// isReady vai ser verdadeira quando a placa
// disparar o evento 'ready'

var isReady = false;

// isOn guarda o estado do led para sabermos 
// se está aceso ou apagado 

var isOn = false;

// Vamos criar uma variável global para o led 
// dessa forma podemos acessá-lo de forma global 
// sem precisar de muita complexidade 

var led;

// quando a placa se conecta e está pronta... 
board.on('ready', function() { 
    // instanciamos um led no pino 13 
    led = new five.Led(13);

    // certificamos que o led estará desligado 
    led.off();

    // setamos a variável que usamos para 
    // saber o estado atual da placa 
    isReady = true; 
});

// Vamos criar um servidor http extremamente simples 
// que escuta a porta 3000 
http.createServer(function (req, res) { 
    // Em toda a requisição checamos a url 
    // acessada verificando se ela foi feita 
    // para a raiz do servidor...

    if (req.url == '/') { 
        // chamamos a função que muda o estado do led toggleLed();
        // encerramos a requisição com a variável isOn
        //  informando se o led está aceso ou não
        //  a concatenação com uma string se dá porque
        //  o método end precisa de uma string ou um buffer
        res.end(isOn + '');

     } else {

        // caso a requisição não seja para a raiz
        // encerramos a conexão sem fazer mais nada
        res.end();
      }
}).listen(3000);

console.log('listening at 3000');

// Função responsável por ligar e desligar o led 
function toggleLed () {

    // Se a placa não estiver pronta 
    // a execução não prossegue 

    if (!isReady) { return; }

    // Se o led estiver ligado... 
    if (isOn) {

        // o método off é chamado, desligando-o
        led.off();

        // a variável recebe false
        isOn = false;

} else {

    // se o led estiver desligado, o método on
    //  é chamado, ligando-o
    led.on();

    // a variável recebe true
    isOn = true;

} } 