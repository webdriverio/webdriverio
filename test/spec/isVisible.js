/*jshint expr: true*/
describe('isVisible', function() {

    before(h.setup());

    it('should check if a single element is visible', function() {
        return this.client.isVisible('.searchinput').then(function (isVisible) {
            isVisible.should.be.true;
        })
        .isVisible('.invisible', function(err, isVisible) {
            isVisible.should.be.false;
        });
    });

    it('should check multiple elements are visible', function() {
        return this.client.isVisible('.visibletest').then(function (isVisible) {
            isVisible.should.be.an.instanceOf(Array);
            isVisible.should.have.length(2);
            isVisible.should.containEql(false);
        });
    });

});