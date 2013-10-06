/* jshint -W024 */
/* jshint expr:true */

module.exports = function(testpageURL,testpageTitle,assert,should,expect,browserName){
    
    describe('test submit button with click and submitForm', function(done) {

        var elementShouldBeNotFound = function(err,result) {
            err.should.not.equal.null;
            // for phantomjs it is an UnknownError instead of NoSuchElement in Browser
            assert.strictEqual(result.status, browserName === 'phantomjs' ? 13 : 7);
        };
        var elementShouldBeVisible = function(err,result) {
            expect(err).to.be.null;
            assert.strictEqual(result,true);
        };
        var shouldCauseNoError = function(err) {
            expect(err).to.be.null;
        };

        it('click on submit button should send data from form', function(done) {
            this.client
                .url(testpageURL)
                .isVisible('.gotDataA', elementShouldBeNotFound)
                .isVisible('.gotDataB', elementShouldBeNotFound)
                .isVisible('.gotDataC', elementShouldBeNotFound)
                .click('.send',         shouldCauseNoError)
                .isVisible('.gotDataA', elementShouldBeVisible)
                .isVisible('.gotDataB', elementShouldBeVisible)
                .isVisible('.gotDataC', elementShouldBeVisible)
                .call(done);
        });

        it('submit form via provided command should send data from form', function(done) {
            this.client
                .url(testpageURL)
                .isVisible('.gotDataA', elementShouldBeNotFound)
                .isVisible('.gotDataB', elementShouldBeNotFound)
                .isVisible('.gotDataC', elementShouldBeNotFound)
                .submitForm('.send',    shouldCauseNoError)
                .isVisible('.gotDataA', elementShouldBeVisible)
                .isVisible('.gotDataB', elementShouldBeVisible)
                .isVisible('.gotDataC', elementShouldBeVisible)
                .call(done);
        });

    });

};