/* global document */
var async = require('async');

/**
 * executeAsync is currently pretty unstable with phantomJS 1.9.x therefor we skip
 * this test until 2.0 is released
 * @see https://github.com/detro/ghostdriver/issues/328
 */
describe.skip('executeAsync', function() {
    before(h.setupMultibrowser());

    before(function(done) {
        var self = this;

        async.waterfall([
            function(cb) {
                self.browserA.url(conf.testPage.subPage, cb);
            },
            function(res, cb) {
                self.browserB.url(conf.testPage.start, cb);
            }
        ], done);
    });

    it('should execute an async function', function(done) {
        this.matrix
            .timeouts('script', 5000)
            .executeAsync(function() {
                var cb = arguments[arguments.length - 1];
                setTimeout(function() {
                    cb(document.title + '-async');
                }, 500);
            }, function(err, res) {
                assert.ifError(err);
                res.browserA.value.should.be.equal('two-async');
                res.browserB.value.should.be.equal(conf.testPage.title + '-async');
            })
            .call(done);
    });

});