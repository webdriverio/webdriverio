describe('getTitle', function() {

    before(h.setup());

    it('should return the text of a single element', function() {
        return this.client.getTitle().then(function (title) {
            title.should.be.exactly(conf.testPage.title);
        });
    });

});