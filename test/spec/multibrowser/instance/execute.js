/* global document */
var async = require('async');

describe('execute executed by single multibrowser instance', function() {
    before(h.setupMultibrowser());

    it('should be able to execute some js', function(done) {
        this.browserA
            .execute('return document.title', [], function(err, res) {
                assert.ifError(err);
                assert.equal(conf.testPage.title, res.value);
                done(err);
            });
    });

    it('should be forgiving on giving an `args` parameter', function(done) {
        this.browserA
            .execute('return document.title', function(err, res) {
                assert.ifError(err);
                assert.equal(conf.testPage.title, res.value);
                done(err);
            });
    });

    it('should be able to execute a pure function', function(done) {
        this.browserA
            .execute(function() {
                return document.title;
            }, function(err, res) {
                assert.ifError(err);
                assert.equal(conf.testPage.title, res.value);
                done(err);
            });
    });

});
