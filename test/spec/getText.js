describe('getText', function() {

    before(h.setup());

    it('should return the text of a single element', function(done) {
        this.client
            .getText('#githubRepo', function(err, text) {
                assert.equal(err, null);
                text.should.be.exactly('GitHub Repo');
            })
            .call(done);
    });

    it('should return the text of multiple elements', function(done) {
        this.client
            .getText('.box', function(err, texts) {
                assert.equal(err, null);
                texts.should.be.an.instanceOf(Array);
                texts.should.have.length(5);

                texts.forEach(function(tagname) {
                    tagname.should.be.exactly('');
                });
            })
            .call(done);
    });

});