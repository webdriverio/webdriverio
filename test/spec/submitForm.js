/* global beforeEach */
describe('submitForm', function() {

    beforeEach(h.setup());

    var elementShouldBeNotExisting = function(err,isExisting) {
        assert.ifError(err);

        /**
         * because there was no element found isExisting is false
         */
        isExisting.should.be.exactly(false);
    };

    var elementShouldBeExisting = function(err,isExisting) {
        assert.ifError(err);
        isExisting.should.be.exactly(true);
    };

    it('should send data from form', function(done) {
        this.client
            .isExisting('.gotDataA', elementShouldBeNotExisting)
            .isExisting('.gotDataB', elementShouldBeNotExisting)
            .isExisting('.gotDataC', elementShouldBeNotExisting)
            .submitForm('.send')
            .pause(1000)
            .isExisting('.gotDataA', elementShouldBeExisting)
            .isExisting('.gotDataB', elementShouldBeExisting)
            .isExisting('.gotDataC', elementShouldBeExisting)
            .call(done);
    });

});
