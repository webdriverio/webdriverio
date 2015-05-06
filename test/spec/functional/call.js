describe('call', function() {

    before(h.setup());

    var isCalled = false;

    before(function() {
        return this.client.call(function(zwei) {
            isCalled = true;
        });
    });

    it('should have executed a function', function() {
        assert.ok(isCalled);
    });

});