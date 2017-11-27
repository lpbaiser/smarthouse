const CONFIG = require('./configuration');
const five = require('johnny-five');

const pew = [
    ["G5", 1/4],
    ["F5", 1/4],
    ["E5", 1/4],
    ["D5", 1/4],
    ["C5", 1/4],
    ["B5", 1/4],
    ["A5", 1/4],
    [null, 1/2]
];

let intervalAlarm = null;

function Alarm() {
    this.buzzer = new five.Piezo(CONFIG.BUZZER.PIN);
}

Alarm.prototype.startAlarm = function () {
    let self = this;
    
};

Alarm.prototype.stopAlarm = function () {
    clearInterval(intervalAlarm);
};

Alarm.prototype.playAlarm = function () {
    let self = this;
    if (!self.buzzer.isPlaying) {
        intervalAlarm = setInterval(function () {
            self.buzzer.play({
                // song: [
                //     ['G5', 1 / 4],
                //     [null, 7 / 4]
                // ],
                song: pew.concat(pew, pew),
                
                tempo: 300
            });
        }, 1000)
    }
};

Alarm.prototype.playAlarmOpen = function () {
    let self = this;
    if (!self.buzzer.isPlaying) {
        self.buzzer.play({
            song: "C - C",
            beats: 1,
            tempo: 180
        });
    }
};

Alarm.prototype.playAlarmClose = function () {
    let self = this;
    if (!self.buzzer.isPlaying) {
        self.buzzer.play({
            song: "C",
            beats: 1,
            tempo: 180
        });
    }
};

module.exports = Alarm;