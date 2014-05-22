describe('getTitle', function() {
    before(h.setup);

    it('should fetch the page title', function(done){
        this.client
            .url('http://localhost:8080/test/spec/getTitle/')
            .getTitle(function(err, result) {
                assert.equal(null, err);
                assert.strictEqual(result, 'GetTitle Test');
            })
            .call(done);
    });
});