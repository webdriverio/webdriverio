describe('addCommand', function() {

    before(h.setupMultibrowser());

    before(function(done) {

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

        this.browserA.url(conf.testPage.subPage);
        this.browserB.url(conf.testPage.start);
        this.matrix.call(done);
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

    it('should promisify added command', function(done) {

        this.matrix
            .getUrlAndTitle().then(function(result) {
                assert.strictEqual(result.url, conf.testPage.subPage);
                assert.strictEqual(result.title, conf.testPage.title);
            })
            .call(done);

    });

    it('should not register that command to other instances', function() {
        assert.ifError(this.browserA.getUrlAndTitle);
        assert.ifError(this.browserB.getUrlAndTitle);
    });

});