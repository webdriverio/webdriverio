/* jshint -W024 */
/* jshint expr:true */

module.exports = function(testpageURL,testpageTitle,assert,should,expect){

    describe('script execution', function() {

        before(function(done) {
            this.client.url(testpageURL).call(done);
        });

        it('should be able to execute some js', function(done) {
            this.client.execute('return document.title', [], function(err, res) {
                expect(err).to.be.null;
                expect(res.value).to.equal(testpageTitle);
            }).call(done);
        });

        it('should be forgiving on giving an `args` parameter', function(done) {
            this.client.execute('return document.title', function(err, res) {
                expect(err).to.be.null;
                expect(res.value).to.equal(testpageTitle);
            }).call(done);
        });

        it('should be able to execute a pure function', function(done) {
            this.client.execute(function() {
                return document.title;
            }, function(err, res) {
                expect(err).to.be.null;
                expect(res.value).to.equal(testpageTitle);
            }).call(done);
        });

        it('should provide an executeAsync method', function(done) {
            this.client
                .timeouts('script', 2000)
                .executeAsync(function() {
                    var cb = arguments[arguments.length - 1];
                    setTimeout(function() {
                        cb(document.title + '-async');
                    }, 1000);
                }, function(err, res) {
                    expect(err).to.be.null;
                    expect(res.value).to.equal(testpageTitle + '-async');
                })
                .call(done);
        });

    });

};