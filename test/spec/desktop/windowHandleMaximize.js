describe('windowHandleMaximize', function() {

    before(h.setup());

    it('should increase window size', function(done) {
        this.client

            /**
             * first set window size
             */
            .windowHandleSize({ width: 500, height: 500 })
            .windowHandleMaximize()
            .windowHandleSize(function(err, res) {
                assert.ifError(err);
                // on some systems, we might not have maximized, like on phantomjs
                // still, no error means it worked
                res.value.width.should.be.above(500);
                res.value.height.should.be.above(500);
            })
            .call(done);

    });

});