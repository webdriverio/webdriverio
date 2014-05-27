describe('submitForm', function(done) {

    beforeEach(h.setup());

    var elementShouldBeNotFound = function(err,isVisible) {
        assert.ifError(err);

        /**
         * because there was no element found isVisible is false
         */
        isVisible.should.be.exactly(false);
    };
    var elementShouldBeVisible = function(err,isVisible) {
        assert.ifError(err);
        isVisible.should.be.exactly(true);
    };

    it('should send data from form', function(done) {
        this.client
            .isVisible('.gotDataA', elementShouldBeNotFound)
            .isVisible('.gotDataB', elementShouldBeNotFound)
            .isVisible('.gotDataC', elementShouldBeNotFound)
            .submitForm('.send',    h.noError)
            .isVisible('.gotDataA', elementShouldBeVisible)
            .isVisible('.gotDataB', elementShouldBeVisible)
            .isVisible('.gotDataC', elementShouldBeVisible)
            .call(done);
    });

});
