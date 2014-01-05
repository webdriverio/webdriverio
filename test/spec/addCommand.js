describe('addCommand', function () {
    before(h.setup);

    before(function() {
        this.client
            .addCommand("getUrlAndTitle", function(callback) {
                this.url(function(err,urlResult) {
                    this.getTitle(function(err,titleResult) {
                        callback(err, {
                            url: urlResult.value, title: titleResult
                        });
                    });
                });
            })
            .addCommand("checkTitle", function(expectedTitle, callback) {
                this.getTitle(function(err, title) {
                    callback(err, title === expectedTitle);
                });
            });
    });

    it('added a `getUrlAndTitle` command',function(done) {
        this.client
            .getUrlAndTitle(function(err,result){
                assert.equal(null, err);
                assert.strictEqual(result.url, conf.testPage.start);
                assert.strictEqual(result.title, conf.testPage.title);
            })
            .checkTitle(conf.testPage.title, function(err, res) {
                assert.equal(true, res);
            })
            .call(done);
    });
});
