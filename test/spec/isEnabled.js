/*jshint expr: true*/
describe('isEnabled', function() {

    before(h.setup());

    it('should check if a single element is visible', function(done) {
        this.client
            .isEnabled('.waitForValueEnabled', function(err, isEnabled) {
                assert.equal(err, null);
                isEnabled.should.be.false;
            })
            .isEnabled('.waitForValueEnabledReverse', function(err, isEnabled) {
                assert.equal(err, null);
                isEnabled.should.be.true;
            })
            .call(done);
    });

    it('should check multiple elements are visible', function(done) {
        this.client
            .isEnabled('form input', function(err, isEnabled) {
                assert.equal(err, null);
                isEnabled.should.be.an.instanceOf(Array);
                isEnabled.should.have.length(5);
                isEnabled.should.containEql(true);
            })
            .call(done);
    });

});
