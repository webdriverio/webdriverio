/* global document */
var async = require('async');

/**
 * executeAsync is currently pretty unstable with phantomJS 1.9.x therefor we skip
 * this test until 2.0 is released
 * @see https://github.com/detro/ghostdriver/issues/328
 */
describe.skip('executeAsync executed by single multibrowser instance', function() {
    before(h.setupMultibrowser());

    it('should execute an async function', function(done) {
        this.browserA
            .timeouts('script', 5000)
            .executeAsync(function() {
                var cb = arguments[arguments.length - 1];
                setTimeout(function() {
                    cb(document.title + '-async');
                }, 500);
            }, function(err, res) {
                assert.ifError(err);
                res.value.should.be.exactly(conf.testPage.title + '-async');
            })
            .call(done);
    });

});