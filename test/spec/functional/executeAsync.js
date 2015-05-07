/* global document */
describe('executeAsync', function() {

    before(h.setup());

    it('should execute an async function', function() {
        return this.client
            .timeouts('script', 5000)
            .executeAsync(function() {
                var cb = arguments[arguments.length - 1];
                setTimeout(function() {
                    cb(document.title + '-async');
                }, 500);
            }).then(function(res) {
                res.value.should.be.exactly(conf.testPage.title + '-async');
            });
    });

});