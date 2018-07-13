var path = require('path');
var helper = require('./helpers/drawHelper');
var webdriverio = require('../../packages/webdriverio/build');
var webviewApp = path.resolve(__dirname, '..', '..', 'test', 'site', 'platforms', 'ios', 'build', 'emulator', 'WebdriverIO Guinea Pig.app');

var client = webdriverio.remote({
    port: 4723,
    logLevel: 'verbose',
    desiredCapabilities: {
        platformName: 'iOS',
        platformVersion: '8.4',
        deviceName: 'iPhone 6',
        app: webviewApp
    }
});

client
    .init()
    .pause(2000)
    .click('//UIAApplication[1]/UIAWindow[1]/UIAScrollView[1]/UIAWebView[1]/UIALink[1]')
    .touchAction([
        { action: 'press', x: 200, y: 50 },
        { action: 'moveTo', x: 0, y: 200 },
        'release'
    ])
    .touchAction([
        { action: 'press', x: 100, y: 150 },
        { action: 'moveTo', x: 200, y: 0 },
        'release'
    ])
    .touchAction(helper.circleAction(200, 150))
    .touchAction([
        helper.arcAction(0,                   2 * Math.PI / 3 * 1),
        helper.arcAction(2 * Math.PI / 3 * 1, 2 * Math.PI / 3 * 2),
        helper.arcAction(2 * Math.PI / 3 * 2, 2 * Math.PI / 3 * 3)
    ])
    .touchAction([
        helper.innerArcAction(2*Math.PI / 3*1 + Math.PI / 3, 2*Math.PI / 3*1 + Math.PI + Math.PI / 8 + Math.PI / 3),
        helper.innerArcAction(2*Math.PI / 3*2 + Math.PI / 3, 2*Math.PI / 3*2 + Math.PI + Math.PI / 8 + Math.PI / 3),
        helper.innerArcAction(2*Math.PI / 3*3 + Math.PI / 3, 2*Math.PI / 3*3 + Math.PI + Math.PI / 8 + Math.PI / 3)
    ])
    .end().catch(function (e) {
        // eslint-disable-next-line
        console.error(e.stack);
        return client.end();
    });
