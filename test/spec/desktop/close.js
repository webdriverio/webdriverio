/* global beforeEach */
describe('close', function() {

    beforeEach(h.setup());

    it('should close the current window', function(done) {

        /**
         * safari doenst support `newWindow`
         */
        if(this.client.desiredCapabilities.browserName === 'safari') {
            done();
        }

        var that = this,
            openTab;

        this.client

            // get current tab id
            .getTabIds(function(err, tabs) {
                assert.ifError(err);
                openTab = tabs[0];
            })

            // open new tab
            .newWindow(conf.testPage.subPage)

            // ensure that there are two tabs open
            .getTabIds(function(err, tabs) {
                assert.ifError(err);
                tabs.should.have.length(2);
            })

            // command needs to be executed within new function context
            // to have access to the windowHandle assigned in L23
            .call(function() {
                that.client.close(openTab);
            })

            // test if there is only one tab open
            .windowHandle(function(err, windowHandle) {
                assert.ifError(err);
                windowHandle.value.should.be.exactly(openTab);
            })
            .call(done);

    });

});