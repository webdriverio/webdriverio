describe.skip('flickDown', function() {

    before(h.setup({ url: conf.testPage.gestureTest }));

    it('should trigger flickDown indicator', function(done) {
        this.client
            .context('NATIVE_APP')
            .getAttribute('//*[@id="log-gesture-dragdown"]', 'class', function(err, res) {
                console.log(err,res);
                assert.ifError(err);
                assert.ifError(res);
            })
            .flickDown('//*[@id="hitarea"]')
            .getAttribute('//*[@id="log-gesture-dragdown"]', 'class', function(err, res) {
                console.log(err,res);
                assert.ifError(err);//*[@id="log-gesture-dragup"]
                assert.equal(res, 'active');
            })
            .call(done);
    });

});