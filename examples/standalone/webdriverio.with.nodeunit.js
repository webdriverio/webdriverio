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
            .getElementSize('.header-logo-invertocat .octicon.octicon-mark-github').then(function (result) {
                test.ok(result.height === 32, 'logo height should be 32px');
                test.ok(result.width  === 32, 'logo width should be 89px');
            })
            .getTitle().then(function (title) {
                test.ok(title === 'How people build software · GitHub', 'title should be "How people build software · GitHub"');
            })
            .getCssProperty('a[href="/pricing"]', 'color').then(function (result) {
                test.ok(result.value === 'rgba(60,65,70,1)', 'color is "' + result + '" but should be "rgba(60,65,70,1)"');
            });

        test.done();
    },
    tearDown: function (callback) {
        // clean up
        client.end(callback);
    }
};
