describe('dragUp', function() {

    before(h.setup(false, conf.testPage.gestureTest))

    it('should trigger dragUp indicator', function(done) {
        this.client
            .getAttribute('//*[@id="log-gesture-dragup"]', 'class', function(err, res) {
                assert.ifError(err);
                assert.equal(res, '');
            })
            .dragUp('//*[@id="hitarea"]')
            .getAttribute('//*[@id="log-gesture-dragup"]', 'class', function(err, res) {
                assert.ifError(err);
                assert.equal(res, 'active');
            })
            .call(done);
    });

});