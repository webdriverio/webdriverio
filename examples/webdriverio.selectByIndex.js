/* http://thenostalgiamachine.com/ */

var webdriverio = require('../index'),
    Q = require('q');

var options = {
    desiredCapabilities: {
        browserName: 'chrome'
    }
};

webdriverio
    .remote(options)
    .init()
    .url('http://thenostalgiamachine.com/')
    .pause(2000)
    .selectByIndex('select', 4)
    .pause(2000)
    .end();