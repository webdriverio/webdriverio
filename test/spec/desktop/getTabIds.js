/**
 * `newWindow` will also been tested here
 */

describe('getTabIds', function() {

    before(h.setup());

    it('should return a single tab id', function() {
        return this.client.getTabIds().then(function(tabs) {
            tabs.should.be.an.instanceOf(Array);
            tabs.should.have.length(1);
        });
    });

    it('should return two tab ids after openening a new window', function() {
        var tabsIds;
        return this.client.newWindow(conf.testPage.subPage).getTabIds().then(function(tabs) {
            tabsIds = tabs;
            tabs.should.be.an.instanceOf(Array);
            tabs.should.have.length(2);
        }).call(function() {
            return this.close(tabsIds[0]);
        });
    });

});