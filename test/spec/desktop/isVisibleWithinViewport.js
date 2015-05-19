/*jshint expr: true*/
describe('isVisibleWithinViewport', function() {

    before(h.setup());

    it('should check if a single element is visible', function() {
        return this.client.isVisibleWithinViewport('.nested').then(function (isVisibleWithinViewport) {
            isVisibleWithinViewport.should.be.true;
        })
        .isVisibleWithinViewport('.notInViewport', function(err, isVisibleWithinViewport) {
            isVisibleWithinViewport.should.be.false;
        });
    });

    it('should check multiple elements are visible', function() {
        return this.client.isVisibleWithinViewport('.notInViewports').then(function (isVisibleWithinViewport) {
            isVisibleWithinViewport.should.be.an.instanceOf(Array);
            isVisibleWithinViewport.should.have.length(2);
            isVisibleWithinViewport[0].should.equal(false);
            isVisibleWithinViewport[1].should.equal(true);
        });
    });

});