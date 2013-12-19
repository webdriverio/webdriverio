describe('singleton option', function() {
    var c1;
    var c2;
    var conf = require('../conf/index.js');

    before(function() {
        var webdriverjs = require('../../index.js');
        var merge = require('lodash.merge');

        c1 = webdriverjs.remote(merge(conf, {
            singleton: true
        }));

        c2 = webdriverjs.remote(merge(conf, {
            singleton: true
        }));
    });

    it('creates only one instance', function() {
        assert(c1 === c2);
    });

    describe('when browsing on one reference', function() {
        before(function(done) {
            c1
                .init()
                .url(conf.testPage.url2, done);
        });

        it('browses on the other reference', function(done) {
            c2
                .url(function(err, res) {
                    assert.equal(res.value, conf.testPage.url2);
                })
                .getTitle(function(err, title) {
                    assert.equal(title, 'two');
                    done(err);
                });
        });

        it('should end other reference probably', function(done) {
            c1.end(done);
        });
    });
});