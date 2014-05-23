describe('test submit button with click and submitForm', function(done) {
    beforeEach(h.setup());

    var elementShouldBeNotFound = function(err,result) {
        assert.ok(err);
    };
    var elementShouldBeVisible = function(err,result) {
        assert.ifError(err);
        assert.strictEqual(result,true);
    };

    it('click on submit button should send data from form', function(done) {
        this.client
            .isVisible('.gotDataA', elementShouldBeNotFound)
            .isVisible('.gotDataB', elementShouldBeNotFound)
            .isVisible('.gotDataC', elementShouldBeNotFound)
            .click('.sendBtn',      h.noError)
            .isVisible('.gotDataA', elementShouldBeVisible)
            .isVisible('.gotDataB', elementShouldBeVisible)
            .isVisible('.gotDataC', elementShouldBeVisible)
            .call(done);
    });

    it('submit form via provided command should send data from form', function(done) {
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
