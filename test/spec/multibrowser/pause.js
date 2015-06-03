describe('pause', function() {

    before(h.setupMultibrowser());

    it('should pause command queue', function() {

        var time = new Date().getTime();

        return this.matrix.pause(1000).call(function() {
            var newTime = new Date().getTime();
            (newTime - time).should.be.greaterThan(999);
            (newTime - time).should.be.lessThan(1010);
        });

    });

});