describe('waitForInvisible command test', function() {
    before(h.setup);

    it('should wait for the element to disappear within the specified time', function(done) {
        this.timeout(2100);
        this.client
            .isVisible('.visible-text',function(err,result) {
                assert.equal(null, err);
                assert(result);
            })
            .waitForInvisible('.visible-text', 2100, function(err) {
                assert.equal(null, err);
            })
            .call(done);
    });

    it.only('should fail when the element does not disappear within the specified time', function(done) {
        this.client
            .isVisible('.visible-text',function(err,result) {
                assert.equal(null, err);
                assert(result);
            })
            .waitForInvisible('.visible-text', 500, function(err) {
                assert.ok(err instanceof Error);
            })
            .call(done);
    });
});