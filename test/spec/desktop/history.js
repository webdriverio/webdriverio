describe('test ability to go back and forward in browser history', function() {
    before(h.setup);

    it('should be able to go backward in history', function(done){
        this.client
            .getTitle(function(err,title) {
                assert.equal(null, err)
                assert.strictEqual(title,conf.testPage.title);
            })
            .click('#secondPageLink')
            .getTitle(function(err,title) {
                assert.equal(null, err);
                assert.strictEqual(title,'two');
            })
            .back()
            .pause(100)
            .getTitle(function(err,title) {
                assert.equal(null, err)
                assert.strictEqual(title,conf.testPage.title);
                done(err);
            })
    });

    it('should be able to go forward in history', function(done){
        this.client
            .forward()
            .pause(100)
            .getTitle(function(err,title) {
                assert.equal(null, err)
                assert.strictEqual(title,'two');
            })
            .back()
            .call(done);
    });

});