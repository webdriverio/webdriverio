describe('orientation commands', function() {

    before(h.setup({ url: conf.testPage.gestureTest }));

    it('should get current orientation (getOrientation)', function() {
        return this.client.getOrientation().then(function(orientation) {
            orientation.should.be.exactly('portrait');
        });
    });

    it('should change the orientation (setOrientation)', function() {
        return this.client.setOrientation('landscape').getOrientation().then(function(orientation) {
            orientation.should.be.exactly('landscape');
        });
    });

});