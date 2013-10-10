/* jshint -W024 */
/* jshint expr:true */

module.exports = function(testpageURL,testpageTitle,assert,should,expect){

    describe('test ability to go back and forward in browser history', function() {

        before(function(done) {
            this.client.url(testpageURL).call(done);
        });

        it('should be able to go backward in history', function(done){
            this.client
                .getTitle(function(err,title) {
                    expect(err).to.be.null;
                    assert.strictEqual(title,testpageTitle);
                })
                .click('#githubRepo')
                .getTitle(function(err,title) {
                    expect(err).to.be.null;
                    assert.strictEqual(title,'GitHub · Build software better, together.');
                })
                .back()
                .getTitle(function(err,title) {
                    expect(err).to.be.null;
                    assert.strictEqual(title,testpageTitle);
                })
                .call(done);
        });

        it('should be able to go forward in history', function(done){
            this.client
                .forward()
                .waitFor('.teaser-illustration',5000)
                .getTitle(function(err,title) {
                    expect(err).to.be.null;
                    assert.strictEqual(title,'GitHub · Build software better, together.');
                })
                .call(done);
        });

    });

};