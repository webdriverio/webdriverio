describe('waitForVisible command test', function() {
    before(h.setup);

    beforeEach(function(done) {
        this.client
            .execute(function() {
                $('.hidden-text').hide();
                setTimeout(function() {
                    $('.hidden-text').show();
                }, 2000)
            })
            .call(done);
    });

    it('should wait for the element to appear within the specified time', function(done) {
        this.timeout(2500);
        this.client
            .isVisible('.hidden-text',function(err,result) {
                assert.equal(null, err);
                assert(!result);
            })
            .waitForVisible('.hidden-text', 2000, function(err) {
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

    context('when an interval is specified', function() {
        it('should work', function(done) {
            this.client
                .isVisible('.hidden-text',function(err,result) {
                    assert.equal(null, err);
                    assert(!result);
                })
                .waitForVisible('.hidden-text', 2000, 200, function(err) {
                    assert.equal(err, null);
                })
                .call(done);
        });
    });
});