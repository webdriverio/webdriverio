var async = require('async');

describe('addCommand', function() {

    before(h.setupMultibrowser());

    before(function(done) {
        var self = this;

        this.matrix.addCommand('getUrlAndTitle', function(callback) {

            var result = {},
                error;

            this.url(function(err, url) {
                    error = err;
                    result.url = url.browserA.value;
                })
                .getTitle(function(err, title) {
                    error = err;
                    result.title = title.browserB;
                })
                .pause(1000)
                .call(callback.bind(this, error, result));

        });

        async.waterfall([
            function(cb) {
                self.browserA.url(conf.testPage.subPage, cb);
            },
            function(res, cb) {
                self.browserB.url(conf.testPage.start, cb);
            }
        ], done);

    });

    it('added a `getUrlAndTitle` command', function(done) {

        this.matrix
            .getUrlAndTitle(function(err, result) {
                assert.ifError(err);
                assert.strictEqual(result.url, conf.testPage.subPage);
                assert.strictEqual(result.title, conf.testPage.title);
            })
            .call(done);

    });

});