var webdriverio = require('../../index'),
    client = webdriverio.remote({
        desiredCapabilities: {
            browserName: 'chrome',
            version: '27',
            platform: 'XP'
        },
        host: 'hub.browserstack.com',
        port: 80,
        user : process.env.BROWSERSTACK_USERNAME,
        key: process.env.BROWSERSTACK_ACCESS_KEY,
        logLevel: 'silent',
    }).init();

client
    .url('http://google.com')
    .setValue('*[name="q"]','webdriverio')
    .click('*[name="btnG"]')
    .pause(1000)
    .getTitle().then(function(title) {
        console.log(title);
    })
    .end();