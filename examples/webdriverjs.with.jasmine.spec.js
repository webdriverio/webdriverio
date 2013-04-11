var webdriverjs = require('../index');

describe('my webdriverjs tests', function() {

    var client = {};
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 9999999;

    beforeEach(function() {
        client = webdriverjs.remote({ desiredCapabilities: {browserName: 'phantomjs'} });
        client.init();
    });

    it('test it', function(done) {
        client
            .url('https://github.com/')
            .getElementSize('.header-logo-wordmark', function(err, result) {
                expect(err).toBe(null);
                expect(result.height).toBe(30);
                expect(result.width).toBe(68);
            })
            .getTitle(function(err, title) {
                expect(err).toBe(null);
                expect(title).toBe('GitHub · Build software better, together.');
            })
            .getElementCssProperty('class name','subheading', 'color', function(err, result){
                expect(err).toBe(null);
                expect(result).toBe('rgba(136, 136, 136, 1)');
            })
            .call(done);
    });

    afterEach(function(done) {
        client.end(done);
    });
});