/* jshint -W024 */
/* jshint expr:true */

module.exports = function(testpageURL,testpageTitle,assert,should,expect){

    it('should execute all commands in right order (asynchronous execution test)', function(done) {

        var result = '',
            client = this.client;

        client
            .url(testpageURL)
            .click('.btn1', function(err) {
                expect(err).to.be.null;
                result += '1';
            })
            .isVisible('.btn1', function(err) {
                expect(err).to.be.null;
                result += '2';
            })
            .call(function() {
                result += '3';

                client.click('.btn1',function(err) {
                    expect(err).to.be.null;
                    result += '4';

                    client.isVisible('.btn1', function(err) {
                        expect(err).to.be.null;
                        result += '5';
                    })
                    .call(function() {
                        result += '6';

                        client.call(function() {
                            result += '7';

                            client.doubleClick('.btn1', function(err) {
                                expect(err).to.be.null;
                                result += '8';

                                client.call(function() {
                                    result += '9';

                                    client.isVisible('.btn1', function(err) {
                                        expect(err).to.be.null;
                                        result += '0';

                                        setTimeout(function() {
                                            client.call(function() {
                                                result += 'a';
                                            });
                                        },1000);
                                    });
                                });
                            })
                            .click('.btn1', function(err) {
                                expect(err).to.be.null;
                                result += 'b';
                            });
                        });
                    })
                    .click('.btn1', function() {
                        result += 'c';
                    })
                    .call(function() {
                        result += 'd';

                        client.isVisible('.btn1', function(err) {
                            expect(err).to.be.null;
                            result += 'e';
                        });
                    });
                })
                .buttonClick('.btn1',function(err) {
                    expect(err).to.be.null;
                    result += 'f';
                })
                .call(function() {
                    assert(result,'1234567890abcdef');
                    done();
                });
            });

    });

};