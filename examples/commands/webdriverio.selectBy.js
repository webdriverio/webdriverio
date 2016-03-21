/* http://thenostalgiamachine.com/ */

var webdriverio = require('../../build/index');

var options = {
    desiredCapabilities: {
        browserName: 'chrome'
    }
};

var client = webdriverio.remote(options);

client
    .init()
    .url('http://thenostalgiamachine.com/')
    .pause(2000)
    .selectByIndex('select', 4)
    .pause(2000)
    .selectByValue('select', 'years/2009.html')
    .pause(2000)
    .selectByVisibleText('select', '2008')
    .pause(2000)
    .end();
