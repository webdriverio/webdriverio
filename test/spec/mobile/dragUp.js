describe.skip('flickUp', function() {

    before(h.setup({ url: conf.testPage.gestureTest }));

    it('should trigger flickUp indicator', function(done) {
        this.client
            // .getAttribute('#log-gesture-dragup', 'class', function(err, res) {
            //     assert.ifError(err);
            //     assert.equal(res, '');
            // })
            .click('=2')
            .pause(1000)
            .flickUp('//UIAApplication[1]/UIAWindow[1]/UIAScrollView[1]/UIAWebView[1]/UIAStaticText[3]')
            .getAttribute('//UIAApplication[1]/UIAWindow[1]/UIAScrollView[1]/UIAWebView[1]/UIAStaticText[3]', 'class', function(err, res) {
                assert.ifError(err);
                console.log(res);
                // assert.equal(res, 'active');
            })
            .call(done);
    });

});