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
    .url('http://webdriver.io')
    .setValue('.ds-input', 'click')
    .click('.algolia-docsearch-suggestion--title')
    .pause(1000)
    .getTitle().then((title) => {
        console.log(title); // should return "WebdriverIO - click"
    })
    .end()
    .catch((e) => console.log(e));
