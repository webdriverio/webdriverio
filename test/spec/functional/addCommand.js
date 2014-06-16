describe('addCommand', function() {

    before(h.setup());

    before(function() {

        this.client.addCommand('getUrlAndTitle', function(callback) {

            var result = {},
                error;

            this.url(function(err, url) {
                    error = err;
                    result.url = url.value;
                })
                .getTitle(function(err, title) {
                    error = err;
                    result.title = title;
                })
                .call(callback.bind(this, error, result));

        });

    });

    it('added a `getUrlAndTitle` command', function(done) {

        this.client
            .getUrlAndTitle(function(err, result) {
                assert.ifError(err);
                assert.strictEqual(result.url, conf.testPage.start);
                assert.strictEqual(result.title, conf.testPage.title);
            })
            .call(done);

    });

});