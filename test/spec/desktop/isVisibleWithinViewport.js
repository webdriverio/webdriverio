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

    it('should check multiple elements are not within the current viewport', function() {
        return this.client.scroll(0, 0).isVisibleWithinViewport('.notInViewports').then(function (isVisibleWithinViewport) {
            isVisibleWithinViewport.should.be.an.instanceOf(Array);
            isVisibleWithinViewport.should.have.length(2);
            isVisibleWithinViewport[0].should.equal(false);
            isVisibleWithinViewport[1].should.equal(false); // element is not inside the viewport
        });
    });

    it('should check that element is inside the viewport when it is', function() {
        return this.client.scroll('.notInViewports').isVisibleWithinViewport('.notInViewports').then(function (isVisibleWithinViewport) {
            isVisibleWithinViewport.should.be.an.instanceOf(Array);
            isVisibleWithinViewport.should.have.length(2);
            isVisibleWithinViewport[0].should.equal(false);
            isVisibleWithinViewport[1].should.equal(true); // this element is now within the viewport
        });
    });

    it('should check that elements just outside the viewport are hidden', function() {
        return this.client.scroll(0, 0).isVisibleWithinViewport('.viewportTest').then(function (isVisibleWithinViewport) {
            isVisibleWithinViewport.should.be.an.instanceOf(Array);
            isVisibleWithinViewport.should.have.length(4);
            isVisibleWithinViewport[0].should.equal(false);
            isVisibleWithinViewport[1].should.equal(false);
            isVisibleWithinViewport[2].should.equal(false);
            isVisibleWithinViewport[3].should.equal(false);
        });
    });
});
