describe('windowHandleSize', function() {
    before(h.setup());

    it('should change window size of current window if no handle is given', function(done) {
        this.client
            .windowHandleSize({
                width: 500,
                height: 500
            })
            .windowHandleSize(function(err, res) {
                assert.ifError(err);
                // on some systems, we might not have changed the size, like on phantomjs
                // still, no error means it worked
                res.value.width.should.be.exactly(500);
                res.value.height.should.be.exactly(500);
            })
            .call(done);
    });

    it('should change window size of a different window using a window handle', function(done) {

        var that = this;

        this.client

            /**
             * open new window
             */
            .newWindow(conf.testPage.subPage, 'windowHandleSizeTest', 'width=200, height=300')

            /**
             * get current window handles
             */
            .getTabIds(function(err, tabs) {
                assert.ifError(err);

                that.client
                    /**
                     * switch to other tab
                     */
                    .switchTab(tabs[0])

                    /**
                     * change window size of other tab
                     */
                    .windowHandleSize(tabs[1], { width: 600, height: 500 })

                    /**
                     * check if other tab has now another size
                     */
                    .windowHandleSize(tabs[1], function(err, res) {
                        assert.ifError(err);
                        res.value.width.should.be.exactly(600);
                        res.value.height.should.be.exactly(500);
                    })

                    /**
                     * close opened window
                     */
                    .close(tabs[1]);

            })

            .call(done);

    });

});