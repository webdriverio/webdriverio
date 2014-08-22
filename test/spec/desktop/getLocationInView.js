/**
 * seems to be not supported in Appium
 * returns null in iOS Simulator
 */

describe('getLocationInView', function() {

    before(h.setup());

    it('should return the location of a single element', function(done) {
        this.client
            .getLocationInView('header h1', function(err, location) {
                assert.equal(err, null);
                /**
                 * between devices and platform this can be different
                 */
                location.x.should.be.below(30);
                location.y.should.be.below(30);
            })
            .call(done);
    });

    it('should return the location of multiple elements', function(done) {
        this.client
            .getLocationInView('.box', function(err, locations) {
                assert.equal(err, null);
                locations.should.be.an.instanceOf(Array);
                locations.should.have.length(5);

                locations.forEach(function(location) {
                    location.x.should.be.type('number');
                    location.y.should.be.type('number');
                });
            })
            .call(done);
    });

});