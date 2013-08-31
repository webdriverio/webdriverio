var webdriverjs = require('../index'),
    client = webdriverjs.remote({
        host: 'hub.browserstack.com',
        port: 80,
        logLevel: 'silent',
        desiredCapabilities: {
            'browser': 'IE',
            'browser_version': '7.0',
            'os': 'Windows',
            'os_version': 'XP',
            'browserstack.debug': 'true',
            'browserstack.user' : 'test1359',
            'browserstack.key': 'rRz7rSR24gUy446CpJB9'
        }
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