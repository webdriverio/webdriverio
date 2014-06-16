describe('getTagName', function() {

    before(h.setup());

    it('should return the tag name of a single element', function(done) {
        this.client
            .getTagName('.black', function(err, tagname) {
                assert.equal(err, null);
                tagname.should.be.exactly('div');
            })
            .call(done);
    });

    it('should return the location of multiple elements', function(done) {
        this.client
            .getTagName('.box', function(err, tagnames) {
                assert.equal(err, null);
                tagnames.should.be.an.instanceOf(Array);
                tagnames.should.have.length(5);

                tagnames.forEach(function(tagname) {
                    tagname.should.be.exactly('div');
                });
            })
            .call(done);
    });

});