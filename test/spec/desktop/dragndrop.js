describe('drag&drop command test', function() {
    before(h.setup);

    it('should drag and drop an element', function(done) {
        this.client
            .getValue('.searchinput', function(err,res) {
                assert.equal(null, err);
                assert.strictEqual(res,'');
            })
            .dragAndDrop('.ui-draggable','.red',function(err,result) {
                assert.equal(null, err);
                assert.equal(0, result.status);
            })
            .getValue('.searchinput', function(err,res) {
                assert.equal(null, err);
                assert.strictEqual(res,'Dropped!');
            })
            .call(done);
    });

});
