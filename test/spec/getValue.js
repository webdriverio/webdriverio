describe('getValue', function() {

    before(h.setup());

    it('should return the text of a single element', function(done) {
        this.client
            .getValue('[name="a"]', function(err, value) {
                assert.equal(err, null);
                value.should.be.exactly('a');
            })
            .call(done);
    });

    it('should return the text of multiple elements', function(done) {
        this.client
            .getValue('form input[name]', function(err, values) {
                assert.equal(err, null);
                values.should.be.an.instanceOf(Array);
                values.should.have.length(4);
                values.should.containEql('a');
                values.should.containEql('b');
                values.should.containEql('c');
                values.should.containEql('d');
            })
            .call(done);
    });

});