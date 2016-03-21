var webdriverio = require('../../build/index');

var options = {
    desiredCapabilities: {
        browserName: 'chrome'
    }
};

var client = webdriverio.remote(options);

client
    .init()
    .url('http://www.google.com/')
    .waitForVisible('//input[@type="submit"]', 5000)
    .then(function(visible){
        console.log(visible); //Should return true
    })
    .end();
