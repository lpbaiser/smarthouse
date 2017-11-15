const CONFIG = require('./configuration');
const five = require('johnny-five');

let intervalAlarm = null;

function Alarm() {
    this.buzzer = new five.Piezo(CONFIG.BUZZER.PIN);
}

Alarm.prototype.stopAlarm = function () {
    clearInterval(intervalAlarm);
};

Alarm.prototype.startAlarm = function () {
    let self = this;
    if (!self.buzzer.isPlaying) {
        intervalAlarm = setInterval(function () {
            self.buzzer.play({
                song: [
                    ['G5', 1 / 4],
                    [null, 7 / 4]
                ],
                tempo: 200
            });
        }, 1000)
    }
};

module.exports = Alarm;