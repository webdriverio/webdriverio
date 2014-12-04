describe('orientation commands', function() {

    before(h.setup({ url: conf.testPage.gestureTest }));

    it('should get current orientation (getOrientation)', function(done) {

        this.client
            .getOrientation(function(err, orientation) {
                assert.ifError(err);
                orientation.should.be.exactly('portrait');
            })
            .call(done);

    });

    it('should change the orientation (setOrientation)', function(done) {

        this.client
            .setOrientation('landscape')
            .getOrientation(function(err, orientation) {
                assert.ifError(err);
                orientation.should.be.exactly('landscape');
            })
            .call(done);

    });

});