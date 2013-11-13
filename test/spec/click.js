describe('click command test',function() {
    before(h.setup);

    it('text should be visible after click on .btn1', function(done){
        this.client
            .isVisible('.btn1',function(err,result) {
                assert.equal(null, err);
                assert.ok(result);
            })
            .click('.btn1',function(err,result) {
                assert.equal(null, err);
                assert.equal(0, result.status);
            })
            .isVisible('.btn1_clicked',function(err,result){
                assert.equal(null, err)
                assert(result, '.btn1 was clicked');
            })
            .call(done);
    });

    it('text should NOT be visible after click on .btn2 because button is disabled', function(done){
        this.client
            .isVisible('.btn2',function(err,result) {
                assert.equal(null, err);
                assert.ok(result);
            })
            .click('.btn2',function(err,result) {
                assert.equal(null, err);
                assert.equal(0, result.status);
            })
            .isVisible('.btn2_clicked',function(err,result){
                assert.equal(null, err)
                assert(!result, '.btn2 was not clicked');
            })
            .call(done);
    });

    // test is taking too long in chrome AND should not be ok
    xit('text should be visible after click on .btn3 altought it is behind an overlay', function(done){
        this.client
            .isVisible('.btn3',function(err,result) {
                assert.equal(null, err);
                assert.ok(result);
            })
            .click('.btn3',function(err,result) {
                assert.equal(null, err);
                assert.equal(0, result.status);
            })
            .isVisible('.btn3_clicked',function(err,result){
                assert.equal(null, err);
                assert(result, '.btn3 was clicked');
            })
            .call(done);
    });


    it('text should be visible after clicking on .btn4 1px/1px width/height', function(done){
        this.client
            .isVisible('.btn4',function(err,result) {
                assert.equal(null, err);
                assert.ok(result);
            })
            .click('.btn4',function(err,result) {
                assert.equal(null, err);
                assert.equal(0, result.status);
            })
            .isVisible('.btn4_clicked',function(err,result){
                assert.equal(null, err);
                assert(result, '.btn4 was clicked');
            })
            .call(done);
    });

});
