/* jshint -W024 */
/* jshint expr:true */

module.exports = function(testpageURL,testpageTitle,assert,should,expect){

	describe('waitFor command should wait until an element is available on page or the timeout expires',function() {

        it('waitfor works when chained and wait the specified amount of time if the element doesn\'t exist', function(done) {

            var startTime = null;
            this.client
                .url(testpageURL)
                .call(function() {
                    startTime = Date.now();
                })
                .waitFor('#new-element', 3000) // this element doesnt exist
                .call(function() {
                    var delta = Date.now() - startTime;
                    delta.should.be.within(2999,10000);
                    done();
                });

        });

        it('should wait until an element appears after 3 seconds',function(done) {

            this.client
                .url(testpageURL)
                .waitFor('.lateElem', 5000, function(err,res) {
                    expect(err).to.be.null;
                })
                .call(done);

        });

    });

};