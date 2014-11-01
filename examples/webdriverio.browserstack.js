var webdriverjs = require('../index'),
    client = webdriverjs.remote({
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
    .setValue('*[name="q"]','webdriverjs')
    .click('*[name="btnG"]')
    .pause(1000)
    .getTitle(function(err,title) {
        console.log(title);
    })
    .end();