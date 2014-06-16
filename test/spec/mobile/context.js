describe('context', function() {

    before(h.setup());

    it('should return available context modes', function(done) {
        this.client
            .getNetworkConnection(function(err,res) {
                console.log(res);
            })
            .pause(2000)
            // .context(function(err,res) {
            //     console.log(err,res);
            // })
            // .context('NATIVE_APP')
            .call(done);
    });

});