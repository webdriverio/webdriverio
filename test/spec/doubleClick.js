/* jshint -W024 */
/* jshint expr:true */

module.exports = function(testpageURL,testpageTitle,assert,should,expect){

    describe('doubleClick command test',function(done) {

        it('text should be visible after doubleClick on .btn1', function(done){

            var client = this.client;

            client
                .url(testpageURL)
                .isVisible('.btn1',function(err,result) {
                    expect(err).to.be.null;
                    if(result) {
                        client.doubleClick('.btn1',function(err,result) {
                            expect(err).to.be.null;
                            result.status.should.equal(0);
                        });
                    }
                })
                .isVisible('.btn1_dblclicked',function(err,result){
                    expect(err).to.be.null;
                    assert(result, '.btn1 was doubleClicked');
                })
                .call(done);
        });


        it('text should NOT be visible after doubleClick on .btn2 because button is disabled', function(done){

            var client = this.client;

            client
                .url(testpageURL)
                .isVisible('.btn2',function(err,result) {
                    expect(err).to.be.null;
                    if(result) {
                        client.doubleClick('.btn2',function(err,result) {
                            expect(err).to.be.null;
                            result.status.should.equal(0);
                        });
                    }
                })
                .isVisible('.btn2_dblclicked',function(err,result){
                    expect(err).to.be.null;
                    assert(!result, '.btn2 wasn\'t doubleClicked');
                })
                .call(done);
        });


        it('text should not be visible after doubleClick on .btn3 because button is behind overlay', function(done){

            var client = this.client;

            client
                .url(testpageURL)
                .isVisible('.btn3',function(err,result) {
                    expect(err).to.be.null;
                    if(result) {
                        client.doubleClick('.btn3',function(err,result) {
                            expect(err).to.be.null;
                            result.status.should.equal(0);
                        });
                    }
                })
                .isVisible('.btn3_dblclicked',function(err,result){
                    expect(err).to.be.null;
                    assert(!result, '.btn3 was doubleClicked');
                })
                .call(done);
        });


        it('text should be visible after doubleClicking ion .btn4 with a width/height of 0', function(done){

            var client = this.client;

            client
                .url(testpageURL)
                .isVisible('.btn4',function(err,result) {
                    expect(err).to.be.null;
                    if(result) {
                        client.doubleClick('.btn4',function(err,result) {
                            expect(err).to.be.null;
                            result.status.should.equal(0);
                        });
                    }
                })
                .isVisible('.btn4_dblclicked',function(err,result){
                    expect(err).to.be.null;

                    // it is possible to click on a button with width/height = 0
                    assert(result, '.btn4 was doubleClicked');
                })
                .call(done);
        });

    });

};