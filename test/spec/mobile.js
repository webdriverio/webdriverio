describe.only('mobile tests', function() {

    before(h.setup);

    it('should get current orientation', function(done) {

        this.client
            .getOrientation(function(err,res) {
                assert.equal(null, err);
                assert.equal(res, 'PORTRAIT');
            })
            .setOrientation('landscape',function(err,res) {
                assert.equal(null, err);
            })
            .getOrientation(function(err,res) {
                assert.equal(null, err);
                assert.equal(res, 'LANDSCAPE');
            })
            .call(done);

    });

    it('should scroll to specified X and Y position', function(done) {

        this.client
            .isVisible('//window[1]/scrollview[1]/webview[1]/text[1]', function(err,res) {
                assert.equal(null, err);
                // headline should be visible on app start
                assert.equal(res, true);
            })
            .scroll('//window[1]/scrollview[1]/webview[1]/textfield[5]',10,100,function(err) {
                assert.equal(null, err);
            })
            .isVisible('//window[1]/scrollview[1]/webview[1]/text[1]', function(err,res) {
                assert.equal(null, err);
                // headline shouldn't be visible when we scroll down
                assert.equal(res, false);
            })
            .call(done);

    });

});