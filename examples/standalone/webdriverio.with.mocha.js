var webdriverio = require('../../build'),
    assert      = require('assert');

describe('my webdriverio tests', function(){

    this.timeout(99999999);
    var client;

    before(function(){
            client = webdriverio.remote({ desiredCapabilities: {browserName: 'phantomjs'} });
            return client.init();
    });

    it('Github test',function() {
        return client
            .url('https://github.com/')
            .getElementSize('.header-logo-wordmark').then(function (result) {
                assert(result.height === 26);
                assert(result.width  === 89);
            })
            .getTitle().then(function (title) {
                assert(title === 'GitHub · Where software is built');
            })
            .getCssProperty('a[href="/plans"]', 'color').then(function (result) {
                assert(result.value === 'rgba(64,120,192,1)');
            });
    });

    after(function() {
        return client.end();
    });
});
