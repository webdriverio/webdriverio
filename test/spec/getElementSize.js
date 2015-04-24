describe('getElementSize', function() {

    before(h.setup());

    it('should return a the size of an element', function() {
        return this.client.getElementSize('.overlay').then(function (size) {
            size.width.should.be.exactly(100);
            size.height.should.be.exactly(50);
        });
    });

    it('should return certain property width if set', function() {
        return this.client.getElementSize('.overlay', 'width').then(function (width) {
            width.should.be.exactly(100);
        });

    });

    it('should return certain property height if set', function() {
        return this.client.getElementSize('.overlay', 'height').then(function (height) {
            height.should.be.exactly(50);
        });
    });

});