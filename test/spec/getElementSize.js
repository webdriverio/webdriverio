describe('getElementSize', function() {

    before(h.setup());

    it('should return a the size of an element', function(done) {

        this.client
            .getElementSize('.red', function(err, size) {
                assert.ifError(err);
                size.width.should.be.strictEqual(102);
                size.height.should.be.strictEqual(102);
            })
            .call(done);

    });

});