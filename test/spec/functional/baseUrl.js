describe('baseUrl', function() {

    before(h.setup());

    it('should get prepended if url starts with /', function() {
        return this.client.url('/two.html').getTitle().then(function (title) {
            title.should.be.equal('two');
        });
    });

});
