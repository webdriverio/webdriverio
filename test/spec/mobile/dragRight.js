describe('dragRight', function() {

    before(h.setup(false, conf.testPage.gestureTest))

    it('should trigger dragRight indicator', function(done) {
        this.client
            .getAttribute('//*[@id="log-gesture-dragright"]', 'class', function(err, res) {
                assert.ifError(err);
                assert.equal(res, '');
            })
            .dragright('//*[@id="hitarea"]')
            .getAttribute('//*[@id="log-gesture-dragright"]', 'class', function(err, res) {
                assert.ifError(err);
                assert.equal(res, 'active');
            })
            .call(done);
    });

});