describe('getValue', function() {

    before(h.setup());

    it('should return the text of a single element', function() {
        return this.client.getValue('[name="a"]').then(function (value) {
            value.should.be.exactly('a');
        });
    });

    it('should return the text of multiple elements', function() {
        return this.client.getValue('form input[name]').then(function (values) {
            values.should.be.an.instanceOf(Array);
            values.should.have.length(4);
            values.should.containEql('a');
            values.should.containEql('b');
            values.should.containEql('c');
            values.should.containEql('d');
        });
    });

});