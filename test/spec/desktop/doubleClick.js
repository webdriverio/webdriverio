/**
 * still not supported in Appium
 * TODO test also for mobile when supported
 */

describe('doubleClick', function() {

    before(h.setup());

    it('should make an element visible after doubleClick on .btn1', function() {

        return this.client
            .isVisible('.btn1').then(function(isVisible) {
                isVisible.should.be.true;
            })
            .doubleClick('.btn1')
            .isVisible('.btn1_dblclicked').then(function(isVisible) {
                isVisible.should.be.true;
            });

    });

});