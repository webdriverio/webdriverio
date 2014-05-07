describe('waitForVisible command test', function() {
    before(h.setup);

    it('should wait for the element to appear within the specified time', function(done) {
        this.timeout(2100);
        this.client
            .isVisible('.hidden-text',function(err,result) {
                assert.equal(null, err);
                assert(!result);
            })
            .waitForVisible('.hidden-text', 2100, function(err) {
                assert.equal(null, err);
            })
            .call(done);
    });

    it('should fail when the element does not appear within the specified time', function(done) {
        this.client
            .isVisible('.hidden-text',function(err,result) {
                assert.equal(null, err);
                assert(!result);
            })
            .waitForVisible('.hidden-text', 500, function(err) {
                assert.ok(err instanceof Error);
            })
            .call(done);
    });
});