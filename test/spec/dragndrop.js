describe.skip('drag&drop command test', function() {
    before(h.setup);

    it('should drag and drop the overlay without an error', function(done) {
        this.client
            .dragAndDrop('#overlay','.red',function(err,result) {
                assert.equal(null, err);
                assert.equal(0, result.status);
            })
            .call(done);
    });

    it('should be able to click on .btn3 because the overlay is gone now', function(done) {
        this.client
            .isVisible('.btn3',function(err,result) {
                assert.equal(null, err);
                assert.ok(result);
            })
            .clickMouseButton('.btn3',function(err,result) {
                assert.equal(null, err);
                assert.equal(0, result.status);
            })
            .isVisible('.btn3_dblclicked',function(err,result){
                assert.equal(null, err);
                assert(result, '.btn3 was not clicked');
            })
            .call(done);

    });

});
