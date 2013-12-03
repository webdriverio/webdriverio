describe('teardown', function() {
  it('stops the client', function(done) {
    this.client.end(done);
  })
})