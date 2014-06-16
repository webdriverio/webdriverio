/*jshint expr: true*/
describe('click', function() {

    before(h.setup());

    it('text should be visible after clicking on .btn1', function(done) {

        this.client
            .isVisible('//html/body/section/div[7]', function(err,isVisible) {
                assert.ifError(err);
                isVisible.should.be.false;
            })
            .click('//html/body/section/button[1]')
            .isVisible('//html/body/section/div[7]', function(err,isVisible) {
                assert.ifError(err);
                isVisible.should.be.true;
            })
            .call(done);

    });

});