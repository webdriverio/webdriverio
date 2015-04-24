/*jshint expr: true*/
describe('isEnabled', function() {

    before(h.setup());

    it('should check if a single element is visible', function() {
        return this.client.isEnabled('input[name="d"]').then(function (isEnabled) {
            isEnabled.should.be.false;
        }).isEnabled('input[name="b"]').then(function (isEnabled) {
            isEnabled.should.be.true;
        });
    });

    it('should check multiple elements are visible', function() {
        return this.client.isEnabled('form input').then(function (isEnabled) {
            isEnabled.should.be.an.instanceOf(Array);
            isEnabled.should.have.length(6);
        });
    });

});
