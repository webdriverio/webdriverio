/* jshint -W024 */
/* jshint expr:true */

var webdriverjs = require('../index'),
    assert      = require('assert');

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
                assert(err === null);
                assert(result.height === 30);
                assert(result.width  === 68);
            })
            .getTitle(function(err, title) {
                assert(err === null);
                assert(title === 'GitHub · Build software better, together.');
            })
            .getElementCssProperty('class name','subheading', 'color', function(err, result){
                assert(err === null);
                assert(result === 'rgba(136, 136, 136, 1)');
            })
            .call(done);
    });

    after(function(done) {
        client.end(done);
    });
});