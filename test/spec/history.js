describe('test ability to go back and forward in browser history', function() {
    it('should be able to go backward in history', function(done){
        client
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
            .getTitle(function(err,title) {
                assert.equal(null, err)
                assert.strictEqual(title,conf.testPage.title);
                done(err);
            })
    });

    it('should be able to go forward in history', function(done){
        client
            .forward()
            .getTitle(function(err,title) {
                assert.equal(null, err)
                assert.strictEqual(title,'two');
            })
            .back()
            .call(done);
    });

});