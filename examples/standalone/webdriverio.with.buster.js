var buster = require('buster'),
    assert = buster.referee.assert,
    webdriverio = require('../../build'),
    client;

buster.testCase('Nested setup and teardown call order', {

    'setUp': function () {
        this.timeout = 5000;
        client = webdriverio.remote({ desiredCapabilities: {browserName: 'firefox'} });
        return client.init();
    },

    'test it': function () {
        return client
            .url('http://github.com/')
            .getElementSize('.header-logo-wordmark').then(function (result) {
                assert(result.height === 26);
                assert(result.width  === 89);
            })
            .getTitle().then(function (title) {
                assert(err === undefined);
                assert(title === 'GitHub · Where software is built');
            })
            .getCssProperty('a[href="/plans"]', 'color').then(function (result) {
                assert(err === undefined);
                assert(result.value === 'rgba(64,120,192,1)');
            });
    },

    'tearDown': function() {
        return client.end();
    }
});
