var webdriverio = require('../../build'),
    client;

module.exports = {

    setUp: function (callback) {
        client = webdriverio.remote({ desiredCapabilities: {browserName: 'phantomjs'} });
        client.init();

        callback();
    },
    test1: function (test) {
        client
            .url('https://github.com/')
            .getElementSize('.header-logo-wordmark').then(function (result) {
                test.ok(result.height === 26, 'logo height should be 32px');
                test.ok(result.width  === 89, 'logo width should be 89px');
            })
            .getTitle().then(function (title) {
                test.ok(title === 'GitHub · Where software is built', 'title should be "GitHub · Where software is built"');
            })
            .getCssProperty('a[href="/plans"]', 'color').then(function (result) {
                test.ok(result.value === 'rgba(64,120,192,1)', 'color is "' + result + '" but should be "rgba(64,120,192,1)"');
            });

        test.done();
    },
    tearDown: function (callback) {
        // clean up
        client.end(callback);
    }
};
