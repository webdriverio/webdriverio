var chai        = require('chai'),
    assert      = chai.assert,
    webdriverio = require('../../build');

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
            .getElementSize('.header-logo-invertocat .octicon.octicon-mark-github').then(function (result) {
                assert.strictEqual(result.height , 32);
                assert.strictEqual(result.width, 32);
            })
            .getTitle().then(function (title) {
                assert.strictEqual(title,'How people build software · GitHub');
            })
            .getCssProperty('a[href="/pricing"]', 'color').then(function (result) {
                assert.strictEqual(result.value, 'rgba(60,65,70,1)');
            });
    });

    after(function() {
        return client.end();
    });
});
