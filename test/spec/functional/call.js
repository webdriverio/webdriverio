describe('call', function() {

    before(h.setup());

    var isCalled = false;

    before(function(done) {
        this.client.call(function() {
            isCalled = true;
            done();
        });
    });

    it('should have executed a function', function() {
        assert.ok(isCalled);
    });

});