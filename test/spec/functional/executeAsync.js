/* global document */
describe('executeAsync', function() {

    before(h.setup());

    it('should execute an async function', function(done) {
        this.client
            .timeouts('script', 5000)
            .executeAsync(function() {
                var cb = arguments[arguments.length - 1];
                setTimeout(function() {
                    cb(document.title + '-async');
                }, 500);
            }, function(err, res) {
                assert.ifError(err);
                res.value.should.be.exactly(conf.testPage.title + '-async');
            })
            .call(done);
    });

});