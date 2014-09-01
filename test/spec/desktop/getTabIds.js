/**
 * `newWindow` will also been tested here
 */

describe('getTabIds', function() {

    before(h.setup());

    it('should return a single tab id', function(done) {

        this.client
            .getTabIds(function(err, tabs) {
                assert.ifError(err);
                tabs.should.be.an.instanceOf(Array);
                tabs.should.have.length(1);
            })
            .call(done);

    });

    it('should return two tab ids after openening a new window', function(done) {
        var tabsIds;

        this.client
            .newWindow(conf.testPage.subPage)
            .getTabIds(function(err, tabs) {
                tabsIds = tabs;
                assert.ifError(err);
                tabs.should.be.an.instanceOf(Array);
                tabs.should.have.length(2);
            })
            .call(function() {
                this.close(tabsIds[0]);
            })
            .call(done);

    });

});