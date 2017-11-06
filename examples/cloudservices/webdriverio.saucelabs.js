var webdriverio = require('../../build/index'),
    client = webdriverio.remote({
        desiredCapabilities: {
            browserName: 'chrome',
            version: '27',
            platform: 'XP',
            tags: ['examples'],
            name: 'This is an example test',

            // If using Open Sauce (https://saucelabs.com/opensauce/),
            // capabilities must be tagged as "public" for the jobs's status
            // to update (failed/passed). If omitted on Open Sauce, the job's
            // status will only be marked "Finished." This property can be
            // be omitted for commercial (private) Sauce Labs accounts.
            // Also see https://support.saucelabs.com/customer/portal/articles/2005331-why-do-my-tests-say-%22finished%22-instead-of-%22passed%22-or-%22failed%22-how-do-i-set-the-status-
            'public': true
        },
        host: 'ondemand.saucelabs.com',
        port: 80,
        user: process.env.SAUCE_USERNAME,
        key: process.env.SAUCE_ACCESS_KEY,
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
