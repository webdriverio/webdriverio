describe('execute', function() {
    before(h.setupMultibrowser());

    before(function(done) {
        this.browserA.url(conf.testPage.subPage);
        this.browserB.url(conf.testPage.start);
        this.matrix.call(done);
    });

    it('should be able to execute some js', function(done) {
        this.matrix
            .execute('return document.title', [], function(err, res) {
                assert.ifError(err);
                res.browserA.value.should.be.equal('two');
                res.browserB.value.should.be.equal(conf.testPage.title);
            })
            .call(done);
    });

    it('should be forgiving on giving an `args` parameter', function(done) {
        this.matrix
            .execute('return document.title', function(err, res) {
                assert.ifError(err);
                res.browserA.value.should.be.equal('two');
                res.browserB.value.should.be.equal(conf.testPage.title);
            })
            .call(done);
    });

    it('should be able to execute a pure function', function(done) {
        this.matrix
            .execute(function() {
                return document.title;
            }, function(err, res) {
                assert.ifError(err);
                res.browserA.value.should.be.equal('two');
                res.browserB.value.should.be.equal(conf.testPage.title);
            })
            .call(done);
    });

});
