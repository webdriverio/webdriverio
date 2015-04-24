describe('getText', function() {

    before(h.setup());

    it('should return the text of a single element', function() {
        return this.client.getText('#githubRepo').then(function (text) {
            text.should.be.exactly('GitHub Repo');
        });
    });

    it('should return the text of multiple elements', function() {
        return this.client.getText('.box').then(function (texts) {
            texts.should.be.an.instanceOf(Array);
            texts.should.have.length(5);

            texts.forEach(function(tagname) {
                tagname.should.be.exactly('');
            });
        });
    });

});