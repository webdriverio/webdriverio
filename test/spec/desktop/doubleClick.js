describe('doubleClick', function(done) {

    before(h.setup);

    it('should make an element visible after doubleClick on .btn1', function(done) {

        this.client
            .isVisible('.btn1', function(err, result) {
                assert.ifError(err);
                assert.ok(result);
            })
            .doubleClick('.btn1', function(err, result) {
                assert.ifError(err);
                assert.equal(0, result.status);
            })
            .isVisible('.btn1_dblclicked', function(err, result) {
                assert.ifError(err);
                assert(result, '.btn1 was doubleClicked');
            })
            .call(done);

    });

});