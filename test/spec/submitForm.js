/* global beforeEach */
describe('submitForm', function() {

    beforeEach(h.setup());

    var elementShouldBeNotExisting = function (isExisting) {
        /**
         * because there was no element found isExisting is false
         */
        isExisting.should.be.exactly(false);
    };

    var elementShouldBeExisting = function (isExisting) {
        isExisting.should.be.exactly(true);
    };

    it('should send data from form', function () {
        return this.client
            .isExisting('.gotDataA').then(elementShouldBeNotExisting)
            .isExisting('.gotDataB').then(elementShouldBeNotExisting)
            .isExisting('.gotDataC').then(elementShouldBeNotExisting)
            .submitForm('.send')
            .pause(1000)
            .isExisting('.gotDataA').then(elementShouldBeExisting)
            .isExisting('.gotDataB').then(elementShouldBeExisting)
            .isExisting('.gotDataC').then(elementShouldBeExisting);
    });

});
