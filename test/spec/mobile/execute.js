describe('script execution', function() {
    before(h.setup);

    it('should be able to execute some js', function(done) {
        this.client
            .execute('return document.title', [], function(err, res) {
                assert.equal(null, err);
                assert.equal(conf.testPage.title, res.value);
                done(err);
            });
    });

    it('should be forgiving on giving an `args` parameter', function(done) {
        this.client
            .execute('return document.title', function(err, res) {
                assert.equal(null, err);
                assert.equal(conf.testPage.title, res.value);
                done(err);
            });
    });

    it('should be able to execute a pure function', function(done) {
        this.client
            .execute(function() {
                return document.title;
            }, function(err, res) {
                assert.equal(null, err);
                assert.equal(conf.testPage.title, res.value);
                done(err);
            });
    });

    it.skip('[not implemented in appium] should provide an executeAsync method', function(done) {
        this.client
            .timeouts('ms', 2000)
            .executeAsync(function() {
                var cb = arguments[arguments.length - 1];
                setTimeout(function() {
                    cb(document.title + '-async');
                }, 1000);
            }, function(err, res) {
                console.log(err,res);
                assert.equal(null, err);
                assert.equal(conf.testPage.title + '-async', res.value);
                done(err);
            });
    });

});
