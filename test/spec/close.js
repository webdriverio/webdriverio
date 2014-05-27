describe('close', function() {

    before(h.setup());

    it('should close the current window', function(done) {

        this.client
            .close()
            .getTabIds(function(err, tabs) {
                assert.ifError(err);
                assert.strictEqual(tabs.length, 0);
            })
            .call(done);

    });

    it('should close the current window to switch back to another tab', function(done) {

        var that = this,
            openedTabs = [];

        this.client

            // get current tab id
            .getTabIds(function(err, tabs) {
                assert.ifError(err);
                openedTabs = tabs;
                done();
            })

            // open new tab
            .newWindow(conf.testPage.subPage)

            // ensure that there are two tabs open
            .getTabIds(function(err, tabs) {
                assert.ifError(err);
                assert.strictEqual(tabs.length, 2);
            })

            // command needs to be executed within new function context
            // to have access to the windowHandle assigned in L25
            .call(function() {
                that.client.close(openedTabs[0])
            })

            // test if there is only one tab open
            .getTabIds(function(err, res) {
                assert.ifError(err);
                assert.strictEqual(res, openedTabs);
            })
            .call(done);

    });

});