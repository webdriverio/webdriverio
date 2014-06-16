describe('flickUp', function() {

    before(h.setup(false, conf.testPage.gestureTest));

    it('should trigger flickUp indicator', function(done) {
        this.client
            .context('NATIVE_APP')
            .getAttribute('#log-gesture-dragup', 'class', function(err, res) {
                assert.ifError(err);
                assert.equal(res, '');
            })
            .flickUp('#hitarea')
            .getAttribute('#log-gesture-dragup', 'class', function(err, res) {
                assert.ifError(err);
                assert.equal(res, 'active');
            })
            .call(done);
    });

});