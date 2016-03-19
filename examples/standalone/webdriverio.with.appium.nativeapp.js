var webdriverio = require('webdriverio');

var options = {
    desiredCapabilities: {
    	platformName: 'android',                        // operating system
        app: 'net.myandroidapp.test.appxyz',            // bundle id of the app
        appActivity: 'MainActivity',                    // app activity, which should be started
        avdReadyTimeout: '1000',                        // waiting time for the app to start
        udid: 'asdfasdfasdf',                           // udid of the android device
		deviceName: 'devicexy',                         // device name
    },
    host: 'localhost',                                  // localhost
    port: 4723                                          // port for appium
};

var client = webdriverio.remote(options);

describe('Simple cases', function () {
    this.timeout(300000);

    before(function () {
        return client.init();
    });

    describe("Test native App", function () {
        it("test-function", function () {
            //insert your test here
        });
    });

    after(function() {
        return client.end();
    });
});
