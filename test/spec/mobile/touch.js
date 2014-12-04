describe.skip('touch', function() {

    before(h.setup({ url: conf.testPage.gestureTest }));

    it('should trigger touch indicator', function(done) {

        this.client
            .context('NATIVE_APP')
            .pause(2000)
            // .click('//UIAApplication[1]/UIAWindow[1]/UIAScrollView[1]/UIAWebView[1]/UIALink[1]/UIAStaticText[1]')
            // .elements('//UIAApplication[1]/UIAWindow[1]/UIAScrollView[1]/UIAWebView[1]/UIAStaticText', function(err,res) {
                // console.log('xpath',err,res);//*[@id="log-gesture-touch"]
                // self.client.getText()
            // })
            .getText('//UIAApplication[1]/UIAWindow[1]/UIAScrollView[1]/UIAWebView[1]/UIAStaticText[2]', function(err,res) {
                console.log(res);
            })

            // .touchClick('//UIAApplication[1]/UIAWindow[1]/UIAScrollView[1]/UIAWebView[1]/UIAStaticText[3]')
            // .pause(3000)
            // .getText('//UIAApplication[1]/UIAWindow[1]/UIAScrollView[1]/UIAWebView[1]/UIAStaticText[2]', function(err,res) {
            //     console.log(err,res);
            // })

            // .getAttribute('//*[@id="log-gesture-touch"]', 'class', function(err, res) {
                // assert.ifError(err);
                // res.should.not.containDeep('active');
            // })
            // .click('//*[@id="hitarea"]')
            // .pause(3000)
            // .doubleClick('//*[@id="hitarea"]')
            // .pause(3000)
            // .flickLeft('//*[@id="hitarea"]')
            // .pause(3000)
            // .getAttribute('//*[@id="log-gesture-touch"]', 'class', function(err, res) {
            //     console.log(err,err,res);
            //     assert.ifError(err);
            //     res.should.containDeep('active');
            // })
            .call(done);
    });

});
