var buster      = require('buster'),
    assert      = require('assert')
    webdriverjs = require('../index');

buster.testCase('my webdriverjs tests', {

    'setUp': function() {
        this.timeout = 9999999;

        client = webdriverjs.remote({ desiredCapabilities: {browserName: 'phantomjs'} });
        client.init();
    },

    'test it': function (done) {
        client
            .url('https://github.com/')
            .getElementSize('.header-logo-wordmark', function(err, result) {
                assert(err === undefined);
                assert(result.height === 26);
                assert(result.width  === 37);
            })
            .getTitle(function(err, title) {
                assert(err === undefined);
                assert(title === 'GitHub · Build software better, together.');
            })
            .getCssProperty('a[href="/plans"]', 'color', function(err, result){
                assert(err === undefined);
                assert(result.value === 'rgba(65,131,196,1)');
            })
            .call(done);
    },

    'tearDown': function(done) {
        client.end(done);
    }
});