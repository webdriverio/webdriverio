/*jshint expr: true*/
describe('rightclick', function() {

    before(h.setup());

    it('text should be visible after right-clicking on .btn1', function(done) {

        this.client
            .isVisible('.btn1_right_clicked', function(err,isVisible) {
                assert.ifError(err);
                isVisible.should.be.false;
            })
            .rightClick('.btn1')
            .isVisible('.btn1_right_clicked', function(err,isVisible) {
                assert.ifError(err);
                isVisible.should.be.true;
            })
            .call(done);

    });

});