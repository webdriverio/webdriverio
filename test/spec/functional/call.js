describe('call', function() {

    before(h.setup());

    var isCalled = false;

    before(function() {
        this.client.call(function() {
            isCalled = true;
        });
    });

    it('should have executed a function', function(done) {

        assert.ok(isCalled);
        done();

    });

});