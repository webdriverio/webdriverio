describe('context', function() {

    before(h.setup());

    it('should return available context modes', function(done) {
        this.client
            .context(function(err,res) {
                assert.ifError(err);
                res.value.should.be.exactly('WEBVIEW_1')
            })
            .call(done);
    });

});