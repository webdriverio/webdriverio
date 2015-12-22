/**
 * too flaky in IE
 */
var runTest = process.env._BROWSER === 'internet_explorer' ? describe.skip : describe;

runTest('switchTab', function() {

    before(h.setup());

    describe('should switch tabs', function() {

        var openedTabs = [],
            myTab, newTab, popupTab;

        it('by getting the current tab id first', function() {
            // get current tab id
            return this.client.getCurrentTabId().then(function(tab) {
                myTab = tab;
            });
        });

        it('then by creating new windows', function() {
            // create a bunch of tabs/windows
            return this.client.newWindow(conf.testPage.subPage).newWindow(conf.testPage.subPage).newWindow(conf.testPage.subPage);
        });

        it('then should have a new tab id', function() {
            // check new tab id
            return this.client.getCurrentTabId().then(function(res) {
                res.should.not.be.exactly(myTab);
                newTab = res;
            });
        });

        it('then by changing to one of the new created window handles', function() {
            // check if tab id has changed
            return this.client.getTabIds().then(function(res) {
                openedTabs = res;
                newTab.should.be.exactly(openedTabs[openedTabs.length - 1]);

                // switch tab to another tab
                // IMPORTANT this always needs to be done in a callback
                return this.switchTab(openedTabs[2]);
            });
        });

        it('it then should have the desired new tab id', function() {
            return this.client.getCurrentTabId().then(function(res) {
                openedTabs[2].should.be.exactly(res);
            });
        });

        it('it should select the first available tab when called without a window handle', function() {
            return this.client.switchTab().getCurrentTabId().then(function(res) {
                openedTabs[0].should.be.exactly(res);
                // get back to old tab
                return this.switchTab(myTab);
            });
        });

        it('for windows opened via Javascript', function() {
            // Back to the index.html page
            return this.client.switchTab(myTab)
                // Launch the JS popup
                .click('#newWindowJs')
                .getTabIds().then(function(res) {
                    openedTabs = res;
                    popupTab = openedTabs[openedTabs.length - 1];
                })
                .switchTab(popupTab)
                .getCurrentTabId().then(function(tabId) {
                    openedTabs[4].should.be.exactly(tabId);
                })
                .window(openedTabs[4])
                .getCurrentTabId().then(function(tabId) {
                    openedTabs[4].should.be.exactly(tabId);
                });
        });

        /**
         * clean up that tab mess ^^
         */
        after(function() {
            return this.client.close(openedTabs[1]).close(openedTabs[2]).close(openedTabs[3]).close(openedTabs[4]);
        });

    });
});
