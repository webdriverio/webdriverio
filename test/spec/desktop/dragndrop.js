describe('drag&drop command test', function() {
    before(h.setup());

    it('should drag and drop an element', function(done) {

        /**
         * skip for ie
         * not working anymore
         */
        if(process.env._BROWSER === 'internet_explorer') {
            return done();
        }

        this.client
            .getValue('.searchinput', function(err,res) {
                assert.ifError(err);
                assert.strictEqual(res,'');
            })
            .dragAndDrop('.ui-draggable','.red')
            .getValue('.searchinput', function(err,res) {
                assert.ifError(err);
                assert.strictEqual(res,'Dropped!');
            })
            .call(done);
    });

});
