describe('execute', function() {
    before(h.setupMultibrowser());

    before(function() {
        this.browserA.url(conf.testPage.subPage);
        this.browserB.url(conf.testPage.start);
        return this.matrix.sync();
    });

    it('should be able to execute some js', function() {
        return this.matrix.execute('return document.title').then(function(browserA, browserB) {
            browserA.value.should.be.equal('two');
            browserB.value.should.be.equal(conf.testPage.title);
        });
    });

    it('should be forgiving on giving an `args` parameter', function() {
        return this.matrix.execute('return document.title').then(function(browserA, browserB) {
            browserA.value.should.be.equal('two');
            browserB.value.should.be.equal(conf.testPage.title);
        });
    });

    it('should be able to execute a pure function', function() {
        return this.matrix.execute(function() {
            return document.title;
        }).then(function(browserA, browserB) {
            browserA.value.should.be.equal('two');
            browserB.value.should.be.equal(conf.testPage.title);
        });
    });

});
