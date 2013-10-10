/* jshint -W024 */
/* jshint expr:true */

module.exports = function(testpageURL,testpageTitle,assert,should,expect){

    describe('should work with window commands proberly', function() {

        var tabs = null;

        it('should open two tabs', function(done) {

            this.client
                .url(testpageURL)
                .click('#newWindow', function(err){
                    expect(err).to.be.null;
                })
                .url('http://google.com')
                .getTabIds(function(err,res) {
                    expect(err).to.be.null;
                    res.should.have.length(2);
                    tabs = res;
                })
                .call(done);
        });

        it('should return title ("Google") of the current tab', function(done) {
            this.client
                .getTitle(function(err,title) {
                    expect(err).to.be.null;
                    assert.strictEqual(title,'Google');
                })
                .getCurrentTabId(function(err,res) {
                    expect(err).to.be.null;
                    assert(res,tabs[0]);
                })
                .call(done);
        });

        it('should return title of testpage after switching tab', function(done) {
            this.client
                .switchTab(tabs[1], function(err,res) {
                    expect(err).to.be.null;
                })
                .getTitle(function(err,title) {
                    expect(err).to.be.null;
                    assert.strictEqual(title,testpageTitle);
                })
                .getCurrentTabId(function(err,res) {
                    expect(err).to.be.null;
                    assert(res,tabs[1]);
                })
                .call(done);
        });

        it('should change the tab after closing one by passing a tab id to the command', function(done) {
            this.client
                .pause(1) // problem with command chain here
                .close(tabs[0],function(err,res) {
                    expect(err).to.be.null;
                })
                .getTabIds(function(err,res) {
                    expect(err).to.be.null;
                    res.should.have.length(1);
                })
                .getCurrentTabId(function(err,res) {
                    expect(err).to.be.null;
                    assert(res,tabs[0]);
                })
                .getTitle(function(err,title) {
                    expect(err).to.be.null;
                    assert.strictEqual(title,'Google');
                })
                .call(done);
        });

        it.skip('should open new windows and should switch tab focus automatically', function(done) {

            this.client
                .url(testpageURL)
                .newWindow('http://google.com','Google',function(err,res) {
                    expect(err).to.be.null;
                })
                .getTitle(function(err,title) {
                    expect(err).to.be.null;
                    assert.strictEqual(title,'Google');
                })
                .newWindow(testpageURL,'Testpage',function(err) {
                    expect(err).to.be.null;
                })
                .getTitle(function(err,title) {
                    expect(err).to.be.null;
                    assert.strictEqual(title,testpageTitle);
                })
                .call(done);
        });

        it.skip('should close remaining tabs without passing tab handle, tab focus should change automatically', function(done) {
            this.client
                .pause(1)
                .getTabIds(function(err,res) {
                    expect(err).to.be.null;
                    res.should.have.length(3);
                })
                // open tabs: 'f1-2', 'f1-6', 'f1-8'
                .close(function(err,res) {
                    expect(err).to.be.null;
                    res.openTabs.should.have.length(2);
                })
                // open tabs: 'f1-2', 'f1-6'
                .close(function(err,res) {
                    expect(err).to.be.null;
                    res.openTabs.should.have.length(1);
                })
                // open tabs: f1-6'
                .close(function(err,res) {
                    expect(err).to.be.null;
                    res.openTabs.should.have.length(0);
                })
                .call(done);
        });

    });
};