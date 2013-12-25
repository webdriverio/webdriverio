var chai        = require('chai'),
    assert      = chai.assert,
    expect      = chai.expect,
    webdriverjs = require('../index');

describe('my webdriverjs tests', function(){

    this.timeout(99999999);
    var client = {};

    before(function(done){
            client = webdriverjs.remote({ desiredCapabilities: {browserName: 'phantomjs'} });
            client.init(done);
    });

    it('Github test',function(done) {
        client
            .url('https://github.com/')
            .getElementSize('.header-logo-wordmark', function(err, result) {
                assert.equal(null, err);
                assert.strictEqual(result.height , 32);
                assert.strictEqual(result.width, 89);
            })
            .getTitle(function(err, title) {
                assert.equal(null, err);
                assert.strictEqual(title,'GitHub · Build software better, together.');
            })
            .getCssProperty('a[href="/plans"]', 'color', function(err, result){
                assert.equal(null, err);
                assert.strictEqual(result, 'rgba(65,131,196,1)');
            })
            .call(done);
    });

    after(function(done) {
        client.end(done);
    });
});
