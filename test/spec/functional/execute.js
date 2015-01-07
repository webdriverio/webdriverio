/* global document */
describe('execute', function() {
    before(h.setup());

    it('should be able to execute some js', function(done) {
        this.client
            .execute('return document.title', [], function(err, res) {
                assert.ifError(err);
                assert.equal(conf.testPage.title, res.value);
                done(err);
            });
    });

    it('should be forgiving on giving an `args` parameter', function(done) {
        this.client
            .execute('return document.title', function(err, res) {
                assert.ifError(err);
                assert.equal(conf.testPage.title, res.value);
                done(err);
            });
    });

    it('should be able to execute a pure function', function(done) {
        this.client
            .execute(function() {
                return document.title;
            }, function(err, res) {
                assert.ifError(err);
                assert.equal(conf.testPage.title, res.value);
                done(err);
            });
    });

    it('should be able to take just a single function', function(done) {
        this.client
            .execute(function() {
                window.testThatStuff = true;
            })
            .execute(function() {
                return window.testThatStuff;
            }, function(err, res) {
                assert.ifError(err);
                assert.equal(res.value, true);
            })
            .call(done);
    });

});
