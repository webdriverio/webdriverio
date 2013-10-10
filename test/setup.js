describe('Setup', function() {
    this.beforeAll(function(done) {
        var webdriverjs = require('../index.js');
        this.client = webdriverjs.remote(conf);
        this.client
            .init()
            .url(conf.testPage.url, done);
    });

    it('has a client (browser)', function() {
        assert.ok(this.client);
    });
})