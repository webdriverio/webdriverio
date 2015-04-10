var webdriverio = require('../index');
var options = {
    desiredCapabilities: {
        browserName: 'chrome'
    }
};

webdriverio
    .remote(options)
    .init()
    .url('http://www.google.com')
    .title().then(function (title) {
        console.log('Title was: ' + title.value);
    })
    .end();