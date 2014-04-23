describe.skip('should work with window commands proberly', function() {
    before(h.setup);

    var tabs = null;

    it('should open two tabs', function(done) {

        this.client
            .url(conf.testPage.start)
            .click('#newWindow', h.noError)
            .getTabIds(function(err,res) {
                assert.equal(null, err);
                assert.equal(2, res.length);
                tabs = res;
            })
            .call(done);
    });

    /**
     * tests are buggy in IE and should get fixed
     */
    if(process.env._BROWSER !== 'internet_explorer') {
    it('should return title ("Google") of the current tab', function(done) {
        this.client
            .switchTab(tabs[1])
            .getTitle(function(err,title) {
                assert.equal(null, err);
                assert.strictEqual(title,'two');
            })
            .getCurrentTabId(function(err,res) {
                assert.equal(null, err);
                assert.equal(res,tabs[1]);
            })
            .call(done);
    });

    it('should return title of testpage after switching tab', function(done) {
        this.client
            .switchTab(tabs[0], function(err,res) {
                assert.equal(null, err);
            })
            .getTitle(function(err,title) {
                assert.equal(null, err);
                assert.strictEqual(title,conf.testPage.title);
            })
            .getCurrentTabId(function(err,res) {
                assert.equal(null, err);
                assert.equal(res,tabs[0]);
            })
            .call(done);
    });


    it('should change the tab after closing one by passing a tab id to the command', function(done) {
        this.client
            .getTabIds(function(err,res) {
                assert.equal(null, err);
                assert.equal(2, res.length);
            })
            .close(tabs[1],function(err,res) {
                assert.equal(null, err);
            })
            .getTabIds(function(err,res) {
                assert.equal(null, err);
                assert.equal(1, res.length);
            })
            .getCurrentTabId(function(err,res) {
                assert.equal(null, err);
                assert.equal(res,tabs[1]);
            })
            .getTitle(function(err,title) {
                assert.equal(null, err);
                assert.strictEqual(title,'two');
            })
            .call(done);
    });
    }

    it('should open new windows and should switch tab focus automatically', function(done) {

        this.client
            .url(conf.testPage.start)
            .newWindow(conf.testPage.subPage,'two','menubar=no,toolbar=no',function(err,res) {
                assert.equal(null, err);
            })
            .getTitle(function(err,title) {
                assert.equal(null, err);
                assert.strictEqual(title,'two');
            })
            .newWindow(conf.testPage.start,'Testpage','menubar=no,toolbar=no',function(err) {
                assert.equal(null, err);
            })
            .getTitle(function(err,title) {
                assert.equal(null, err);
                assert.strictEqual(title,conf.testPage.title);
            })
            .pause(1000)
            .call(done);
    });

    /**
     * tests are buggy in IE and should get fixed
     */
    if(process.env._BROWSER !== 'internet_explorer') {
    it('should close remaining tabs without passing tab handle, tab focus should change automatically', function(done) {
        this.client
            .getTabIds(function(err,res) {
                assert.equal(null, err);
                assert.equal(3, res.length);
            })
            // open tabs: 'f1-2', 'f1-6', 'f1-8'
            .close(function(err,res) {
                assert.equal(null, err);
                assert.equal(2, res.openTabs.length);
            })
            // open tabs: 'f1-2', 'f1-6'
            .close(function(err,res) {
                assert.equal(null, err);
                assert.equal(1, res.openTabs.length);
            })
            // NOTE: PhantomJS can't close all tabs, real browser can
            .call(done);
    });
    }
});
