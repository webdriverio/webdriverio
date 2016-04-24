/**
 * To execute this test please download the NPM Jasmine package first and initialise a Jasmine
 * test suite by running:
 *
 * ```sh
 * $ npm install -g jasmine
 * $ jasmine init
 * ```
 *
 * Then run the test. Make sure you've all WebdriverIO dependencies installed
 *
 * ```sh
 * $ jasmine webdriverio.with.jasmine.spec.js
 * ```
 *
 */

var webdriverio = require('../../build');

describe('my webdriverio tests', function() {

    var client;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 9999999;

    beforeEach(function() {
        client = webdriverio.remote({ desiredCapabilities: {browserName: 'phantomjs'} });
        return client.init();
    });

    it('test it', function() {
        return client
            .url('https://github.com/')
            .getElementSize('.header-logo-wordmark').then(function (result) {
                expect(result.height).toBe(26);
                expect(result.width).toBe(89);
            })
            .getTitle().then(function (title) {
                expect(title).toBe('GitHub · Where software is built');
            })
            .getCssProperty('a[href="/plans"]', 'color').then(function (color) {
                expect(color).toBe('rgba(64,120,192,1)');
            });
    });

    afterEach(function(done) {
        return client.end(  );
    });
});
