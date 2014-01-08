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

    it('should provide an executeAsync method', function(done) {
        var that = this;

        this.client
            .timeouts('script', 2000)
            .executeAsync(function() {
                var cb = arguments[arguments.length - 1];
                setTimeout(function() {
                    cb(document.title + '-async');
                }, 1000);
            }, function(err, res) {
                assert.equal(null, err);
                assert.equal(conf.testPage.title + '-async', res.value);

                // pause for 1s to prevent PhantomJS from crashing
                that.client.pause(1000).call(function(){
                    done(err);
                });
            });
    });

});
