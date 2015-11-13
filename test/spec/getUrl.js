describe('getUrl', function() {

    before(h.setup());

    it('should return the url of the current webpage', function() {
        return this.client.getUrl().then(function (url) {
            url.should.be.exactly(conf.testPage.start);
        });
    });

});
