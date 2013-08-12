/* jshint -W024 */
/* jshint expr:true */

var chai        = require('chai'),
    assert      = chai.assert,
    expect      = chai.expect,
    webdriverjs = require('../index');

describe('my webdriverjs tests', function(){

    this.timeout(99999999);
    var client = {};

    before(function(){
            client = webdriverjs.remote({ desiredCapabilities: {browserName: 'phantomjs'} });
            client.init();
    });

    it('Github test',function(done) {
        client
            .url('https://github.com/')
            .getElementSize('.header-logo-wordmark', function(err, result) {
                expect(err).to.be.null;
                assert.strictEqual(result.height , 32);
                assert.strictEqual(result.width, 89);
            })
            .getTitle(function(err, title) {
                expect(err).to.be.null;
                assert.strictEqual(title,'GitHub · Build software better, together.');
            })
            .getElementCssProperty('css selector','a[href="/plans"]', 'color', function(err, result){
                expect(err).to.be.null;
                assert.strictEqual(result, 'rgba(65,131,196,1)');
            })
            .call(done);
    });

    after(function(done) {
        client.end(done);
    });
});