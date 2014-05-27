describe('getCurrentTabId', function() {

    before(h.setup());

    it('should return a single tab id', function(done) {

        this.client
            .getCurrentTabId(function(err, tabId) {
                assert.ifError(err);
                tabId.should.be.type('string');
            })
            .call(done);

    });

});