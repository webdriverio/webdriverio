var assert = require("assert"),
    webdriverjs = require("../index");

describe('Test command getCssProperty(cssSelector, cssProperty, callback)', function(){

    this.timeout(99999999);

    var client = {};

    before(function(){
        // init client
        var capabilities =  {
            'browserName': 'chrome',
            'chrome.binary': '/Applications/Browser/Google Chrome.app/Contents/MacOS/Google Chrome'
        };
        client = webdriverjs.remote({desiredCapabilities:capabilities});
    });

    beforeEach(function(){
        client
            .init()
            .url('https://github.com/Camme/webdriverjs');
    });

    describe('check CSS property of several tags', function(){
        it('should return #777777 as font-color', function(done){
            client
                .getElementCssProperty('id', 'footer', 'color', function(result) {
                    console.log('result: rgba(119,119,119,1) === ' + result);
                    assert('rgba(119,119,119,1)' === result);
                })
                .end(done);
        });
    });
});