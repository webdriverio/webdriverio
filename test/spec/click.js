describe('click', function() {

    before(h.setup());

    it('text should be visible after clicking on .btn1', function(done) {

        this.client
            .isVisible('.btn1_clicked', function(err,isVisible) {
                assert.ifError(err);
                isVisible.should.be.false;
            })
            .click('.btn1')
            .isVisible('.btn1_clicked', function(err,isVisible) {
                assert.ifError(err);
                isVisible.should.be.true;
            })
            .call(done);

    });

});