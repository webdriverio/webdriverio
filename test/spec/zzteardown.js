describe('teardown', function() {
    it('stops the client', function(done) {
        client.end(done);
    })
})