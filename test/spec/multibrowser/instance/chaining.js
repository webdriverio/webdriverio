describe('Chaining executed by single multibrowser instance', function() {

    before(h.setupMultibrowser());

    it('should execute all commands in right order (asynchronous execution test)', function(done) {
        var result = '';
        var browserA = this.browserA;

        this.browserA
            .click('.btn1', function(err) {
                assert.ifError(err);
                result += '1';
            })
            .isVisible('.btn1', function(err) {
                assert.ifError(err);
                result += '2';
            })
            .call(function() {
                result += '3';

                browserA.click('.btn1',function(err) {

                    assert.ifError(err);
                    result += '4';

                    browserA.isVisible('.btn1', function(err) {
                        assert.ifError(err);
                        result += '5';
                    })
                    .call(function() {
                        result += '6';

                        browserA.call(function() {

                            result += '7';

                            browserA.click('.btn1', function(err) {
                                assert.ifError(err);
                                result += '8';

                                browserA.call(function() {
                                    result += '9';

                                    browserA.isVisible('.btn1', function(err) {
                                        assert.ifError(err);
                                        result += '0';

                                        // this can't work
                                        // there's no way the chain
                                        // can now when the setTimeout
                                        // will be finished
                                        // setTimeout(function() {
                                        //     browserA.call(function() {
                                        //         result += 'a';
                                        //     });
                                        // },1000);
                                    });
                                });
                            })
                            .click('.btn1', function(err) {
                                assert.ifError(err);
                                result += 'b';
                            });
                        });
                    })
                    .click('.btn1', function() {
                        result += 'c';
                    })
                    .call(function() {
                        result += 'd';

                        browserA.isVisible('.btn1', function(err) {
                            assert.ifError(err);
                            result += 'e';
                        });
                    });
                })
                .click('.btn1',function(err) {
                    assert.ifError(err);
                    result += 'f';
                })
                .call(function() {
                    assert.equal(result,'1234567890bcdef');
                    done();
                });
            });
    });
});