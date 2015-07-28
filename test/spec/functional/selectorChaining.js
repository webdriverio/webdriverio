var q = require('q');

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

    it('should select cell using context of row', function() {
        var client = this.client;

        return this.client.elements('tr').then(function(rows) {

            var foundRows = [];

            rows.value.forEach(function(element) {

                var td1 = client.elementIdElement(element.ELEMENT, 'td=2015-03-02');
                var td2 = client.elementIdElement(element.ELEMENT, 'td=12:00');

                var p = q.all([td1, td2])
                    .then(function() {
                        return true;
                    }).catch(function() {
                        return false;
                    });

                foundRows.push(p);
            });

            return q.all(foundRows).then(function(rows) {
                rows.should.be.an.instanceOf(Array);
                rows.should.have.length(2);
                rows.should.containEql(true);
                rows.should.containEql(false);
            });
        });

    });

});