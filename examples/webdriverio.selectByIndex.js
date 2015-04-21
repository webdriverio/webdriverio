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
    .selectByIndex('select', 4)

    //.end();