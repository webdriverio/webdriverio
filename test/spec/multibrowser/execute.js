/* global document */
var async = require('async');

describe('execute', function() {
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

    it('should be able to execute some js', function(done) {
        this.matrix
            .execute('return document.title', [], function(err, res) {
                assert.ifError(err);
                res.browserA.value.should.be.equal('two');
                res.browserB.value.should.be.equal(conf.testPage.title);
            })
            .call(done);
    });

    it('should be forgiving on giving an `args` parameter', function(done) {
        this.matrix
            .execute('return document.title', function(err, res) {
                assert.ifError(err);
                res.browserA.value.should.be.equal('two');
                res.browserB.value.should.be.equal(conf.testPage.title);
            })
            .call(done);
    });

    it('should be able to execute a pure function', function(done) {
        this.matrix
            .execute(function() {
                return document.title;
            }, function(err, res) {
                assert.ifError(err);
                res.browserA.value.should.be.equal('two');
                res.browserB.value.should.be.equal(conf.testPage.title);
            })
            .call(done);
    });

});
