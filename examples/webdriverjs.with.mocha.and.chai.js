/* jshint -W024 */
/* jshint expr:true */

var chai        = require('chai'),
    assert      = chai.assert,
    should      = chai.should(),
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
                assert.strictEqual(result.height , 30);
                assert.strictEqual(result.width, 68);
            })
            .getTitle(function(err, title) {
                expect(err).to.be.null;
                assert.strictEqual(title,'GitHub · Build software better, together.');
            })
            .getElementCssProperty('class name','subheading', 'color', function(err, result){
                expect(err).to.be.null;
                assert.strictEqual(result, 'rgba(136, 136, 136, 1)');
            })
            .call(done);
    });

    after(function(done) {
        client.end(done);
    });
});