var WebdriverIO = require('../../build'),
    matrix = WebdriverIO.multiremote({
        browserA: {
            desiredCapabilities: {
                browserName: 'chrome',
                chromeOptions: {
                    args: [
                        'use-fake-device-for-media-stream',
                        'use-fake-ui-for-media-stream',
                    ]
                }
            }
        },
        browserB: {
            desiredCapabilities: {
                browserName: 'chrome',
                chromeOptions: {
                    args: [
                        'use-fake-device-for-media-stream',
                        'use-fake-ui-for-media-stream',
                    ]
                }
            }
        }
    });

var channel = Math.round(Math.random() * 10e10);

matrix
    .init()
    .url('https://apprtc.appspot.com/r/' + channel)
    .click('#confirm-join-button')
    .pause(5000)
    .end();
