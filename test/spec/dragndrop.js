/* jshint -W024 */
/* jshint expr:true */

module.exports = function(testpageURL,testpageTitle,assert,should,expect){

    describe.skip('drag&drop command test', function() {

        it('should drag and drop the overlay without an error', function(done) {

            this.client
                .url(testpageURL)
                .dragAndDrop('#overlay','.red',function(err,result) {
                    expect(err).to.be.null;
                    result.status.should.equal(0);
                })
                .call(done);

        });

        it('should be able to click on .btn3 because the overlay is gone now', function(done) {

            var client = this.client;

            client
                .isVisible('.btn3',function(err,result) {
                    expect(err).to.be.null;
                    if(result) {
                        client.buttonClick('.btn3',function(err,result) {
                            expect(err).to.be.null;
                            result.status.should.equal(0);
                        });
                    }
                })
                .isVisible('.btn3_dblclicked',function(err,result){
                    expect(err).to.be.null;
                    assert(result, '.btn3 was not clicked');
                })
                .call(done);

        });

    });

};