var WebdriverIO = require('../'),
    matrix = WebdriverIO.multiremote({
        browserA: {
            desiredCapabilities: {
                browserName: 'chrome',
                chromeOptions: {
                    args: [
                        "use-fake-device-for-media-stream",
                        "use-fake-ui-for-media-stream",
                    ]
                }
            }
        },
        browserB: {
            desiredCapabilities: {
                browserName: 'chrome',
                chromeOptions: {
                    args: [
                        "use-fake-device-for-media-stream",
                        "use-fake-ui-for-media-stream",
                    ]
                }
            }
        }
    });

var channel = Math.round(Math.random() * 100000000000);

matrix
    .init()
    .url('https://apprtc.appspot.com/r/' + channel)
    .pause(5000)
    .end();
