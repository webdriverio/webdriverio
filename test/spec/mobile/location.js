describe('orientation commands', function() {

    before(h.setup(false, conf.testPage.gestureTest))

    it('getOrientation: should get current orientation', function(done) {

        this.client
            .getOrientation(function(err, orientation) {
                assert.ifError(err);
                orientation.should.be.exactly('portrait');
            })
            .call(done);

    });

    it('setOrientation: should change the orientation', function(done) {

        this.client
            .setOrientation('landscape')
            .getOrientation(function(err, orientation) {
                assert.ifError(err);
                orientation.should.be.exactly('landscape');
            })
            .call(done);

    });

})