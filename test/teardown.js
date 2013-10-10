describe('teardown', function() {
    it('stops the client (browser)', function(done) {
        this.client.end(done);
    });
})