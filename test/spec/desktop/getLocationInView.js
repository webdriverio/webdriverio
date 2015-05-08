/**
 * seems to be not supported in Appium
 * returns null in iOS Simulator
 */

describe('getLocationInView', function() {

    before(h.setup());

    it('should return the location of a single element', function() {
        return this.client.getLocationInView('header h1').then(function(location) {
            /**
             * between devices and platform this can be different
             */
            location.x.should.be.below(30);
            location.y.should.be.below(30);
        });
    });

    it('should return only the x propery of a single element', function() {
        return this.client.getLocationInView('header h1', 'x').then(function(x) {
            x.should.be.below(30);
        });
    });

    it('should return only the y propery of a single element', function() {
        return this.client.getLocationInView('header h1', 'y').then(function(y) {
            y.should.be.below(30);
        });
    });

    it('should return the location of multiple elements', function() {
        return this.client.getLocationInView('.box').then(function(locations) {
            locations.should.be.an.instanceOf(Array);
            locations.should.have.length(5);

            locations.forEach(function(location) {
                location.x.should.be.type('number');
                location.y.should.be.type('number');
            });
        });
    });

});