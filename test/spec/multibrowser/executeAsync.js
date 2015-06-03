describe('executeAsync', function() {
    before(h.setupMultibrowser());

    before(function() {
        this.browserA.url(conf.testPage.subPage);
        this.browserB.url(conf.testPage.start);
        return this.matrix.sync();
    });

    it('should execute an async function', function() {
        return this.matrix.timeouts('script', 5000).executeAsync(function() {
            var cb = arguments[arguments.length - 1];
            setTimeout(function() {
                cb(document.title + '-async');
            }, 500);
        }).then(function(browserA, browserB) {
            browserA.value.should.be.equal('two-async');
            browserB.value.should.be.equal(conf.testPage.title + '-async');
        });
    });

});