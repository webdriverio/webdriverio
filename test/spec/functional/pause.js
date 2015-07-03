/**
 * sufficient to get tested with phantomjs
 */
describe('pause', function() {

    before(h.setup());

    it('should pause command queue', function() {

        var time = new Date().getTime();

        return this.client
            .pause(1000)
            .call(function() {
                var newTime = new Date().getTime();
                (newTime - time).should.be.greaterThan(999);
                (newTime - time).should.be.lessThan(1010);
            });

    });

});