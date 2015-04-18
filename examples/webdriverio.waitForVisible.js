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
    .url('http://www.google.com/')
    .waitForVisible('//input[@type="submit"]', 5000)
    .then(function(visible){
        console.log(visible); //Should return true
    })
    .end();