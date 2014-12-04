describe.skip('flickRight', function() {

    before(h.setup({ url: conf.testPage.gestureTest }));

    it('should trigger flickRight indicator', function(done) {
        this.client
            .getAttribute('//*[@id="log-gesture-dragright"]', 'class', function(err, res) {
                assert.ifError(err);
                assert.equal(res, '');
            })
            .flickRight('//*[@id="hitarea"]')
            .getAttribute('//*[@id="log-gesture-dragright"]', 'class', function(err, res) {
                assert.ifError(err);
                assert.equal(res, 'active');
            })
            .call(done);
    });

});