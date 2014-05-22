describe('getElementSize', function() {
    before(h.setup);

    it('should fetch the size of a specific element', function(done){
        this.client
            .url('http://localhost:8080/test/spec/getElementSize/')
            .getElementSize('#element', function(err, result) {
                assert.equal(null, err);
                assert.strictEqual(result.width, 120);
                assert.strictEqual(result.height, 50);
            })
            .call(done);
    });
});