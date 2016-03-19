var webdriverio = require('webdriverio');

var options = {
    desiredCapabilities: {
    	platformName: 'iOS',                              // operating system
        app: 'net.company.SafariLauncher',                // bundle id of the app or safari launcher
        udid: '123123123123abc',                          // udid of the device
		deviceName: 'iPhone',                             // name of the device
    },
    host: 'localhost',
    port: 4723                                            // port for Appium
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
