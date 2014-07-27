/*jshint expr: true*/
describe('isExisting', function() {

    before(h.setup());

    it('should check if an element is existing', function(done) {
        this.client
            .isExisting('div', function(err, isExisting) {
                assert.equal(err, null);
                isExisting.should.be.true;
            })
            .call(done);
    });

    it('should check if an element is not existing', function(done) {
        this.client
            .isExisting('#notExistingElement', function(err, isExisting) {
                assert.equal(err, null);
                isExisting.should.be.false;
            })
            .call(done);
    });

});