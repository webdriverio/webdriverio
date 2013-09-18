var webdriverjs = require('../index'),
    client = webdriverjs.remote({
        desiredCapabilities: {
            browserName: 'firefox',
            version: '23',
            platform: 'WINDOWS',
            tags: ['examples'],
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
    .setValue('*[name="q"]','webdriverjs')
    .click('*[name="btnG"]')
    .pause(1000)
    .getTitle(function(err,title) {
        console.log(title);
    })
    .end();