var assert = require("assert"),
    webdriverjs = require("../index");

describe('Test command getCssProperty(cssSelector, cssProperty, callback)', function(){

    this.timeout(99999999);

    var client = {};

    before(function(){
        // init client
        var capabilities =  {
            'browserName': 'phantomjs'
        };
        client = webdriverjs.remote({desiredCapabilities:capabilities});
    });

    beforeEach(function(){
        client
            .init()
            .url('https://github.com/Camme/webdriverjs');
    });

    describe('check CSS property of several tags', function(){
        it('should return rgba(119,119,119,1) as font-color', function(done){
            client
                .getElementCssProperty('id', 'footer', 'color', function(result) {
                    assert('rgba(119,119,119,1)' === result.replace(/\s+/g, ''));
                })
                .getCssProperty('#footer', 'color', function(result) {
                    assert('rgba(119,119,119,1)' === result.replace(/\s+/g, ''));
                })
                .end(done);
        });

        it('should return \'uppercase\' as text-transform style', function(done) {
            client
                .getElementCssProperty('class name', 'repo-label', 'text-transform', function(result) {
                    console.log(result);
                    assert('uppercase' === result);
                })
                .getCssProperty('.repo-label', 'text-transform', function(result) {
                    assert('uppercase' === result);
                })
                .end(done);
        });

        it('should return a width of 920px', function(done) {
            client
                .getElementCssProperty('id', 'js-repo-pjax-container', 'width', function(result) {
                    assert('920px' === result);
                })
                .getCssProperty('.container', 'width', function(result) {
                    assert('920px' === result);
                })
                .end(done);
        });
    });
});