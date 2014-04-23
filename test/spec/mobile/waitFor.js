describe('waitFor command should wait until an element is available on page or the timeout expires',function() {
    before(h.setup);

    it.skip('waitfor works when chained and wait the specified amount of time if the element doesn\'t exist', function(done) {

        var startTime = null;
        this.client
            .call(function() {
                startTime = Date.now();
            })
            .waitFor('#new-element', 500) // this element doesnt exist
            .call(function() {
                var delta = Date.now() - startTime;
                assert(delta > 499);
                done();
            });

    });

    it('should wait until an element appears after 3 seconds',function(done) {
        this.client.waitFor('.lateElem', 5000, done);
    });

});
