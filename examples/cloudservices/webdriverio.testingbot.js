var webdriverio = require('../../build/index'),
    client = webdriverio.remote({
        desiredCapabilities: {
            browserName: 'chrome',
            version: '27',
            platform: 'XP',
            name: 'This is an example test'
        },
        host: 'hub.testingbot.com',
        port: 80,
        user: process.env.TESTINGBOT_KEY,
        key: process.env.TESTINGBOT_SECRET,
        logLevel: 'silent'
    }).init();

client
    .url('http://google.com')
    .setValue('*[name="q"]','webdriverio')
    .click('*[name="btnG"]')
    .pause(1000)
    .getTitle(function(err,title) {
        console.log(title);
    })
    .end();
