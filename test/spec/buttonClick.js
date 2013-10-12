describe('buttonClick command test',function() {
    before(h.setup);

    it('text should be visible after click on .btn1', function(done){
        this.client
            .pause(1)
            .isVisible('.btn1',function(err,result) {
                assert.equal(null, err);
                assert.ok(result);
            })
            .buttonClick('.btn1',function(err,result) {
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
            .buttonClick('.btn2',function(err,result) {
                assert.equal(null, err);
                assert.equal(0, result.status);
            })
            .isVisible('.btn2_clicked',function(err,result){
                assert.equal(null, err)
                assert(!result, '.btn2 was not clicked');
            })
            .call(done);
    });


    it('text should not be visible after click on .btn3 because button is behind overlay', function(done){
        this.client
            .isVisible('.btn3',function(err,result) {
                assert.equal(null, err);
                assert.ok(result);
            })
            .buttonClick('.btn3',function(err,result) {
                assert.equal(null, err);
                assert.equal(0, result.status);
            })
            .isVisible('.btn3_clicked',function(err,result){
                assert.equal(null, err);
                assert(!result, '.btn3 was clicked');
            })
            .call(done);
    });


    it('text should be visible after clicking ion .btn4 1px/1px width/height', function(done){
        this.client
            .isVisible('.btn4',function(err,result) {
                assert.equal(null, err);
                assert.ok(result);
            })
            .buttonClick('.btn4',function(err,result) {
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
