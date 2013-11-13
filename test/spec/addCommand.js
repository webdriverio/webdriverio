xdescribe('addCommand', function () {
    before(h.setup);

    before(function() {
        this.client
            .addCommand("getUrlAndTitle", function(callback) {
                this.url(function(err,urlResult) {
                    this.getTitle(function(err,titleResult) {
                        var specialResult = {url: urlResult.value, title: titleResult};
                        if (typeof callback == "function") {
                            callback(err,specialResult);
                        }
                    });
                });
            })
    })

    it('added a `getUrlAndTitle` command',function(done) {
        this.client
            .getUrlAndTitle(function(err,result){
                assert.equal(null, err)
                assert.strictEqual(result.url, conf.testPage.url);
                assert.strictEqual(result.title, conf.testPage.title);
                done(err);
            })
    });
});
