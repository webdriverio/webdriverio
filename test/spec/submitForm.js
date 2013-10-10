describe('test submit button with click and submitForm', function(done) {

    var elementShouldBeNotFound = function(err,result) {
        assert.ok(err !== null);
    };
    var elementShouldBeVisible = function(err,result) {
        assert.equal(null, err)
        assert.strictEqual(result,true);
    };
    var shouldCauseNoError = function(err) {
        assert.equal(null, err)
    };

    it('click on submit button should send data from form', function(done) {
        client
            .url(conf.testPage.url)
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
        client
            .url(conf.testPage.url)
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
