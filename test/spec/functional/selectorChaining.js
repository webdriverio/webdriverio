describe('selectorChaining', function() {

    before(h.setup());

    it('should find all .findme elements without any selector chaining', function() {
        return this.client.getText('.findme').then(function(elements) {
            elements.should.be.lengthOf(3);
        });
    });

    it('should find only two .findme elements using selector chaining', function() {
        return this.client.element('.nested').getText('.findme').then(function(elements) {
            elements.should.be.lengthOf(2);
        });
    });

    it('should find only one element using double selector chaining', function() {
        return this.client.element('.nested').element('.moreNesting').getText('.findme').then(function(elements) {
            elements.should.be.equal('MORE NESTED');
        });
    });

    it('should loose selector restriction after calling another command', function() {
        return this.client.element('.nested').element('.moreNesting').getText('.findme').getText('.findme').then(function(elements) {
            elements.should.be.lengthOf(3);
        });
    });

    it('should be possible to keep selector empty if element was used before', function() {
        return this.client.element('.nested').element('.moreNesting').element('.findme').getText().then(function(elements) {
            elements.should.be.equal('MORE NESTED');
        });
    });

});