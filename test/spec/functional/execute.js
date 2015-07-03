describe('execute', function() {
    before(h.setup());

    it('should be able to execute some js', function() {
        return this.client
            .execute('return document.title', []).then(function(res) {
                assert.equal(conf.testPage.title, res.value);
            });
    });

    it('should be forgiving on giving an `args` parameter', function() {
        return this.client
            .execute('return document.title').then(function(res) {
                assert.equal(conf.testPage.title, res.value);
            });
    });

    it('should be able to execute a pure function', function() {
        return this.client
            .execute(function() {
                return document.title;
            }).then(function(res) {
                assert.equal(conf.testPage.title, res.value);
            });
    });

    it('should be able to take just a single function', function() {
        return this.client
            .execute(function() {
                window.testThatStuff = true;
            })
            .execute(function() {
                return window.testThatStuff;
            }).then(function(res) {
                assert.equal(res.value, true);
            });
    });

});
