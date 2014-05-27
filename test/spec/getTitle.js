describe('getTitle', function() {

    before(h.setup());

    it('should return the text of a single element', function(done) {
        this.client
            .getTitle(function(err, title) {
                assert.equal(err, null);
                title.should.be.exactly(conf.testPage.title);
            })
            .call(done);
    });

});