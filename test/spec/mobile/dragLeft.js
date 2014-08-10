describe.skip('flickLeft', function() {

    before(h.setup(false, conf.testPage.gestureTest));

    it('should trigger flickLeft indicator', function(done) {
        this.client
            .getAttribute('//*[@id="log-gesture-dragleft"]', 'class', function(err, res) {
                assert.ifError(err);
                assert.equal(res, '');
            })
            .flickLeft('//*[@id="hitarea"]')
            .getAttribute('//*[@id="log-gesture-dragleft"]', 'class', function(err, res) {
                assert.ifError(err);
                assert.equal(res, 'active');
            })
            .call(done);
    });

});