describe('dragDown', function() {

    before(h.setup(false, conf.testPage.gestureTest))

    it('should trigger dragDown indicator', function(done) {
        this.client
            .getAttribute('//*[@id="log-gesture-dragdown"]', 'class', function(err, res) {
                assert.ifError(err);
                assert.equal(res, '');
            })
            .dragDown('//*[@id="hitarea"]')
            .getAttribute('//*[@id="log-gesture-dragdown"]', 'class', function(err, res) {
                assert.ifError(err);
                assert.equal(res, 'active');
            })
            .call(done);
    });

})