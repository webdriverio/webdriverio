/**
 * sufficient to get tested with phantomjs
 */
describe.skip('pause executed by single multibrowser instance', function() {

    before(h.setupMultibrowser());

    it('should pause command queue', function(done) {

        var time = new Date().getTime();

        this.browserA
            .pause(1000)
            .call(function() {
                var newTime = new Date().getTime();
                (newTime - time).should.be.greaterThan(999);
                (newTime - time).should.be.lessThan(1020);
            })
            .call(done);

    });

});