/**
 * still not supported in Appium
 * TODO test also for mobile when supported
 */

describe('doubleClick', function() {

    before(h.setup());

    it('should make an element visible after doubleClick on .btn1', function(done) {

        this.client
            .isVisible('.btn1', function(err, result) {
                assert.ifError(err);
                assert.ok(result);
            })
            .doubleClick('.btn1')
            .isVisible('.btn1_dblclicked', function(err, result) {
                assert.ifError(err);
                assert(result, '.btn1 was doubleClicked');
            })
            .call(done);

    });

});