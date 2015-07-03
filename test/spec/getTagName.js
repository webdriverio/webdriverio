describe('getTagName', function() {

    before(h.setup());

    it('should return the tag name of a single element', function() {
        return this.client.getTagName('.black').then(function(tagname) {
            tagname.should.be.exactly('div');
        });
    });

    it('should return the location of multiple elements', function() {
        return this.client.getTagName('.box').then(function(tagnames) {
            tagnames.should.be.an.instanceOf(Array);
            tagnames.should.have.length(5);

            tagnames.forEach(function(tagname) {
                tagname.should.be.exactly('div');
            });
        });
    });

});