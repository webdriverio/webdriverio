var webdriverio = require('../../index'),
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
            .getElementSize('.header-logo-wordmark', function(err, result) {
                test.ok(err === undefined, 'getElementSize() should cause no error');
                test.ok(result.height === 26, 'logo height should be 32px');
                test.ok(result.width  === 37, 'logo width should be 89px');
            })
            .getTitle(function(err, title) {
                test.ok(err === undefined, 'getTitle() should cause no error');
                test.ok(title === 'GitHub · Build software better, together.', 'title should be "GitHub · Build software better, together."');
            })
            .getCssProperty('a[href="/plans"]', 'color', function(err, result){
                test.ok(err === undefined, 'getElementCssProperty() should cause no error');
                test.ok(result.value === 'rgba(64,120,192,1)', 'color is "' + result + '" but should be "rgba(64,120,192,1)"');
            });

        test.done();
    },
    tearDown: function (callback) {
        // clean up
        client.end(callback);
    }
};