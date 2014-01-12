describe('doubleClick command test',function(done) {
    before(h.setup);

    before(function(done) {
        this.client.refresh(done);
    });

    it('text should be visible after doubleClick on .btn1', function(done){
        this.client
            .isVisible('.btn1',function(err,result) {
                assert.equal(null, err);
                assert.ok(result);
            })
            .doubleClick('.btn1',function(err,result) {
                assert.equal(null, err);
                assert.equal(0, result.status);
            })
            .isVisible('.btn1_dblclicked',function(err,result){
                assert.equal(null, err);
                assert(result, '.btn1 was doubleClicked');
            })
            .call(done);
    });


    it('text should NOT be visible after doubleClick on .btn2 because button is disabled', function(done){
        this.client
            .isVisible('.btn2',function(err,result) {
                assert.equal(null, err);
                assert.ok(result);
            })
            .doubleClick('.btn2',function(err,result) {
                assert.equal(null, err);
                assert.equal(0, result.status);
            })
            .isVisible('.btn2_dblclicked',function(err,result){
                assert.equal(null, err);
                assert(!result, '.btn2 wasn\'t doubleClicked');
            })
            .call(done);
    });

    // doubleClick on a button behind overlay won't work in chrome
    // in fact it should work nowhere since selenium mimics what users CAN do
    // and users can't click on buttons behind overlays
    if (['chrome', 'phantomjs', 'firefox'].indexOf(conf.desiredCapabilities.browserName) === -1) {
        it('text should be visible after doubleClick on .btn3 although button is behind overlay', function(done){
            this.client
                .isVisible('.btn3',function(err,result) {
                    assert.equal(null, err);
                    assert.ok(result);
                })
                .doubleClick('.btn3',function(err,result) {
                    assert.equal(null, err);
                    assert.equal(0, result.status);
                })
                .client.isVisible('.btn3_dblclicked',function(err,result){
                    assert.equal(null, err);
                    assert.ok(result, '.btn3 was doubleClicked');
                })
                .call(done);
        });
    }



    it('text should be visible after doubleClicking on on .btn4 1px/1px width/height', function(done){
        this.client
            .isVisible('.btn4',function(err,result) {
                assert.equal(null, err);
                assert.ok(result);
            })
            .doubleClick('.btn4',function(err,result) {
                assert.equal(null, err);
                assert.equal(0, result.status);
            })
            .isVisible('.btn4_dblclicked',function(err,result){
                assert.equal(null, err);
                // it is possible to click on a button with width/height = 0
                assert(result, '.btn4 was doubleClicked');
            })
            .call(done);
    });

});