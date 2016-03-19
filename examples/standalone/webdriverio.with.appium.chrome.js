var webdriverio = require('webdriverio');

var options = {
    desiredCapabilities: {
    	platformName: 'android',                        // operating system
    	platformVersion:'4.3',                          // OS version
        browserName: 'chrome',                          // browser
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

    describe("Google-search", function () {
        it("search-function", function () {
            return client
                .url('http://google.com')
                .setValue('*[name="q"]','webdriverio')
                .click('*[name="btnG"]')
                .pause(1000)
                .getTitle().then(function (title) {
                    console.log(title);
                });
        });
    });

    after(function () {
        return client.end();
    });
});
