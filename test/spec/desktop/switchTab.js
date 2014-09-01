describe('switchTab', function() {
    before(h.setup());

    it('should switch to an other tab', function(done) {

        var openedTabs = [];

        this.client

            // get current tab id
            .getTabIds(function(err, tabs) {
                assert.ifError(err);
                openedTabs = tabs;
            })

            // open new tab and switch window
            .newWindow(conf.testPage.subPage)

            // ensure that there are two tabs open
            .switchTab(openedTabs[0])

            // fetch the current window handle
            .windowHandle(function(err, res) {
                assert.ifError(err);
                openedTabs[0].should.be.exactly(res.value);
            })
            .close()
            .call(done);

    });
});