describe('should work with window commands proberly', function() {
    before(h.setup);

    var tabs = null;

    it('should open two tabs', function(done) {

        this.client
            .url(conf.testPage.url)
            .click('#newWindow', h.noError)
            .getTabIds(function(err,res) {
                assert.equal(null, err);
                assert.equal(2, res.length);
                tabs = res;
            })
            .call(done);
    });

    it('should return title ("Google") of the current tab', function(done) {
        this.client
            .switchTab(tabs[1])
            .getTitle(function(err,title) {
                assert.equal(null, err)
                assert.strictEqual(title,'two');
            })
            .getCurrentTabId(function(err,res) {
                assert.equal(null, err)
                assert.equal(res,tabs[1]);
            })
            .call(done);
    });

    it('should return title of testpage after switching tab', function(done) {
        this.client
            .switchTab(tabs[0], function(err,res) {
                assert.equal(null, err)
            })
            .getTitle(function(err,title) {
                assert.equal(null, err);
                assert.strictEqual(title,conf.testPage.title);
            })
            .getCurrentTabId(function(err,res) {
                assert.equal(null, err)
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
                assert.equal(null, err)
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

    // this will not work if you use a tilling window manager
    describe('changing window sizes', function() {
        before(function(done) {
            this.client.windowHandleSize({
                width: 500,
                height: 500
            }, done);
        });

        it('changed the window size', function(done) {
            this.client.windowHandleSize(function(err, res) {
                assert(err === null);
                // on some systems, we might not have changed the size, like on phantomjs
                // still, no error means it worked
                assert.ok(res.value.width >= 500);
                assert.ok(res.value.height >= 500);
                done(err);
            });
        });

        it('can maximizes windows', function(done) {
            this.client
            .windowHandleMaximize()
            .windowHandleSize(function(err, res) {
                assert(err === null);
                // on some systems, we might not have maximized, like on phantomjs
                // still, no error means it worked
                assert.ok(res.value.width >= 500);
                assert.ok(res.value.height >= 500);
                done(err);
            });
        });
    });

    it.skip('should open new windows and should switch tab focus automatically', function(done) {

        this.client
            .url(conf.testPage.url)
            .newWindow(conf.testPage.url2,'two',function(err,res) {
                assert.equal(null, err)
            })
            .getTitle(function(err,title) {
                assert.equal(null, err)
                assert.strictEqual(title,'two');
            })
            .newWindow(conf.testPage.url,'Testpage',function(err) {
                assert.equal(null, err)
            })
            .getTitle(function(err,title) {
                assert.equal(null, err)
                assert.strictEqual(title,conf.testPage.title);
            })
            .call(done);
    });

    it.skip('should close remaining tabs without passing tab handle, tab focus should change automatically', function(done) {
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
            // open tabs: f1-6'
            .close(function(err,res) {
                assert.equal(null, err);
                assert.equal(0, res.openTabs.length);
            })
            .call(done);
    });
});
