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
            .getElementSize('.header-logo-invertocat .octicon.octicon-mark-github').then(function (result) {
                assert(result.height === 32);
                assert(result.width  === 32);
            })
            .getTitle().then(function (title) {
                assert(err === undefined);
                assert(title === 'How people build software · GitHub');
            })
            .getCssProperty('a[href="/pricing"]', 'color').then(function (result) {
                assert(err === undefined);
                assert(result.value === 'rgba(60,65,70,1)');
            });
    },

    'tearDown': function() {
        return client.end();
    }
});
