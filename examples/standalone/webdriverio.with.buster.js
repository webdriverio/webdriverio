var buster = require('buster'),
    assert = buster.referee.assert,
    webdriverio = require('../../index'),
    client;

buster.testCase('Nested setup and teardown call order', {

    'setUp': function (done) {
        this.timeout = 5000;
        client = webdriverio.remote({ desiredCapabilities: {browserName: 'firefox'} });
        client.init(done);
    },

    'test it': function (done) {
        client
            .url('http://github.com/')
            .getElementSize('.header-logo-wordmark', function(err, result) {
                assert(err === undefined);
                assert(result.height === 26);
                assert(result.width  === 89);
            })
            .getTitle(function(err, title) {
                assert(err === undefined);
                assert(title === 'GitHub · Build software better, together.');
            })
            .getCssProperty('a[href="/plans"]', 'color', function(err, result){
                assert(err === undefined);
                assert(result.value === 'rgba(64,120,192,1)');
            })
            .call(done);
    },

    'tearDown': function(done) {
        client.end(done);
    }
});