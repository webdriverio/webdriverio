/*jshint expr: true*/
describe('isExisting', function() {

    before(h.setup());

    it('should check if an element is existing', function() {
        return this.client.isExisting('div').then(function (isExisting) {
            isExisting.should.be.true;
        });
    });

    it('should check if an element is not existing', function() {
        return this.client.isExisting('#notExistingElement').then(function (isExisting) {
            isExisting.should.be.false;
        });
    });

});