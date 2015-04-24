describe('getCurrentTabId', function() {

    before(h.setup());

    it('should return a single tab id', function() {
        return this.client.getCurrentTabId().then(function (tabId) {
            tabId.should.be.type('string');
        });
    });

});