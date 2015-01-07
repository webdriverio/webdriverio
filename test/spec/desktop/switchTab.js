describe('switchTab', function() {
    before(h.setup());

    describe('should switch tabs', function() {

        var openedTabs = [],
            myTab, newTab;

        it('by getting the current tab id first', function(done) {

            this.client
                // get current tab id
                .getCurrentTabId(function(err, tab) {
                    myTab = tab;
                })
                .call(done);

        });

        it('then by creating new windows', function(done) {

            this.client
                // create a bunch of tabs/windows
                .newWindow(conf.testPage.subPage)
                .newWindow(conf.testPage.subPage)
                .newWindow(conf.testPage.subPage)
                .call(done);

        });

        it('then should have a new tab id', function(done) {

            this.client
                // check new tab id
                .getCurrentTabId(function(err, res) {
                    assert.ifError(err);
                    res.should.not.be.exactly(myTab);
                    newTab = res;
                })
                .call(done);

        });

        it('then by changing to one of the new created window handles', function(done) {

            var self = this;
            this.client
                // check if tab id has changed
                .getTabIds(function(err, res) {
                    openedTabs = res;

                    assert.ifError(err);
                    newTab.should.be.exactly(openedTabs[openedTabs.length - 1]);

                    // switch tab to another tab
                    // IMPORTANT this always needs to be done in a callback
                    self.client.switchTab(openedTabs[2])
                })
                .call(done);

        });

        it('it then should have the desired new tab id', function(done) {

            var self = this;
            this.client
                .getCurrentTabId(function(err, res) {
                    assert.ifError(err);
                    openedTabs[2].should.be.exactly(res);

                    // get back to old tab
                    self.client.switchTab(myTab);
                })
                .call(done);

        });

        /**
         * clean up that tab mess ^^
         */
        after(function(done) {
            var self = this;
            this.client
                .call(function() {
                    self.client
                        .close(openedTabs[1])
                        .close(openedTabs[2])
                        .close(openedTabs[3]);
                })
                .call(done);
        });

    });
});