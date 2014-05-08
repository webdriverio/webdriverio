describe('waitForInvisible command test', function() {
    before(h.setup);

    beforeEach(function(done) {
        this.client
            .execute(function() {
                $('.visible-text').show();
                setTimeout(function() {
                    $('.visible-text').hide();
                }, 2000)
            })
            .call(done);
    });


    it('should wait for the element to disappear within the specified time', function(done) {
        this.timeout(2500);
        this.client
            .isVisible('.visible-text',function(err,result) {
                assert.equal(null, err);
                assert(result);
            })
            .waitForInvisible('.visible-text', 2000, function(err) {
                assert.equal(null, err);
            })
            .call(done);
    });

    it('should fail when the element does not disappear within the specified time', function(done) {
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