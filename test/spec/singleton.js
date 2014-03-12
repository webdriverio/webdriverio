describe.skip('singleton option', function() {
    var c1;
    var c2;
    var conf = require('../conf/index.js');

    before(function(done) {
        var webdriverjs = require('../../index.js');
        var merge = require('deepmerge');

        c1 = webdriverjs.remote(merge(conf, {
            singleton: true
        }));

        c2 = webdriverjs.remote(merge(conf, {
            singleton: true
        }));

        c1.init().url(conf.testPage.subPage, done);
    });

    it('creates only one instance', function() {
        assert(c1 === c2);
    });

    it('browses on the other reference', function(done) {
        c2
            .url(function(err, res) {
                assert.equal(res.value, conf.testPage.subPage);
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