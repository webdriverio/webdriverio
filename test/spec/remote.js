describe('remote method uses default values', function() {
    var client;
    var conf = require('../conf/index.js');

    before(function(done) {
        var webdriverjs = require('../../index.js');

        // should use 127.0.0.1:4444
        // we still force to use phantomjs otherwise
        client = webdriverjs.remote({
            desiredCapabilities: {
                browserName: 'phantomjs'
            }
        }).init(done);
    });

    it('browses using default selenium grid', function(done) {
        client
            .url(conf.testPage.url)
            .url(function(err, res) {
                assert.equal(null, err);
                assert.equal(res.value, conf.testPage.url);
                done(err);
            })
    });
})