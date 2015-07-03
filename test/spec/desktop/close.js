/* global beforeEach */
describe('close', function() {

    beforeEach(h.setup());

    it('should close the current window', function() {

        /**
         * safari doenst support `newWindow`
         */
        if(this.client.desiredCapabilities.browserName === 'safari') {
            return;
        }

        var openTab;

        return this.client

            // get current tab id
            .getTabIds().then(function(tabs) {
                openTab = tabs[0];
            })

            // open new tab
            .newWindow(conf.testPage.subPage)

            // ensure that there are two tabs open
            .getTabIds().then(function(tabs) {
                tabs.should.have.length(2);
            })

            // command needs to be executed within new function context
            // to have access to the windowHandle assigned in L23
            .call(function() {
                return this.close(openTab);
            })

            // test if there is only one tab open
            .windowHandle().then(function(windowHandle) {
                windowHandle.value.should.be.exactly(openTab);
            });

    });

});