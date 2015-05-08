describe('windowHandleSize', function() {
    before(h.setup());

    it('should change window size of current window if no handle is given', function() {
        return this.client.windowHandleSize({
            width: 500,
            height: 500
        }).windowHandleSize().then(function(res) {
            // on some systems, we might not have changed the size, like on phantomjs
            // still, no error means it worked
            res.value.width.should.be.exactly(500);
            res.value.height.should.be.exactly(500);
        });
    });

    it('should change window size of a different window using a window handle', function() {
        return this.client
            /**
             * open new window
             */
            .newWindow(conf.testPage.subPage, 'windowHandleSizeTest', 'width=200, height=300')

            /**
             * get current window handles
             */
            .getTabIds().then(function(tabs) {
                return this
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
                    .windowHandleSize(tabs[1]).then(function(res) {
                        res.value.width.should.be.exactly(600);
                        res.value.height.should.be.exactly(500);
                    })

                    /**
                     * close opened window
                     */
                    .close(tabs[1]);

            });
    });
});