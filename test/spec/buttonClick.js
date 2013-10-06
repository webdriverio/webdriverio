/* jshint -W024 */
/* jshint expr:true */

module.exports = function(testpageURL,testpageTitle,assert,should,expect){

    describe('buttonClick command test',function(done) {

        it('text should be visible after click on .btn1', function(done){

            var client = this.client;

            client
                .url(testpageURL)
                .isVisible('.btn1',function(err,result) {
                    expect(err).to.be.null;
                    if(result) {
                        client.buttonClick('.btn1',function(err,result) {
                            expect(err).to.be.null;
                            result.status.should.equal(0);
                        });
                    }
                })
                .isVisible('.btn1_clicked',function(err,result){
                    expect(err).to.be.null;
                    assert(result, '.btn1 was clicked');
                })
                .call(done);
        });


        it('text should NOT be visible after click on .btn2 because button is disabled', function(done){

            var client = this.client;

            client
                .url(testpageURL)
                .isVisible('.btn2',function(err,result) {
                    expect(err).to.be.null;
                    if(result) {
                        client.buttonClick('.btn2',function(err,result) {
                            expect(err).to.be.null;
                            result.status.should.equal(0);
                        });
                    }
                })
                .isVisible('.btn2_clicked',function(err,result){
                    expect(err).to.be.null;
                    assert(!result, '.btn2 wasn\'t clicked');
                })
                .call(done);
        });


        it('text should not be visible after click on .btn3 because button is behind overlay', function(done){

            var client = this.client;

            client
                .url(testpageURL)
                .isVisible('.btn3',function(err,result) {
                    expect(err).to.be.null;
                    if(result) {
                        client.buttonClick('.btn3',function(err,result) {
                            expect(err).to.be.null;
                            result.status.should.equal(0);
                        });
                    }
                })
                .isVisible('.btn3_clicked',function(err,result){
                    expect(err).to.be.null;
                    assert(!result, '.btn3 was clicked');
                })
                .call(done);
        });


        it('text should be visible after clicking ion .btn4 with a width/height of 0', function(done){

            var client = this.client;

            client
                .url(testpageURL)
                .isVisible('.btn4',function(err,result) {
                    expect(err).to.be.null;
                    if(result) {
                        client.buttonClick('.btn4',function(err,result) {
                            expect(err).to.be.null;
                            result.status.should.equal(0);
                        });
                    }
                })
                .isVisible('.btn4_clicked',function(err,result){
                    expect(err).to.be.null;

                    // it is possible to click on a button with width/height = 0
                    assert(result, '.btn4 was clicked');
                })
                .call(done);
        });

    });

};