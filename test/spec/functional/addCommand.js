describe('addCommand', function() {

    before(h.setup());

    before(function() {
        this.client.addCommand('getUrlAndTitle', function() {

            var result = {};

            return this.url().then(function(url) {
                result.url = url.value;
            }).getTitle().then(function(title) {
                result.title = title;
            }).then(function() {
                return result;
            });

        });
    });

    it('added a `getUrlAndTitle` command', function() {
        return this.client.getUrlAndTitle().then(function(result) {
            assert.strictEqual(result.url, conf.testPage.start);
            assert.strictEqual(result.title, conf.testPage.title);
        });
    });

    it('should promisify added command', function() {
        return this.client.getUrlAndTitle().then(function(result) {
            assert.strictEqual(result.url, conf.testPage.start);
            assert.strictEqual(result.title, conf.testPage.title);
        });
    });

});