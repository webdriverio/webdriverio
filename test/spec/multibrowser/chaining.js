describe('Chaining', function() {

    before(h.setupMultibrowser());

    it('should execute all commands in right order (asynchronous execution test)', function(done) {
        var result = '';
        var matrix = this.matrix;
        var browserA = this.browserA;
        var browserB = this.browserB;

        this.matrix
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

                browserA.call(function() {
                    result += '4';

                    browserB.isVisible('.btn1', function(err) {
                        assert.ifError(err);
                        result += '5';
                    })
                    .call(function() {
                        result += '6';

                        browserA.call(function() {
                            result += '7';

                            matrix.click('.btn1', function(err) {
                                assert.ifError(err);
                                result += '8';

                                browserA.title(function() {
                                    result += '9';

                                    browserB.isVisible('.btn1', function(err) {
                                        assert.ifError(err);
                                        result += '0';

                                        // this can't work
                                        // there's no way the chain
                                        // can now when the setTimeout
                                        // will be finished
                                        // setTimeout(function() {
                                        //     matrix.call(function() {
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

                        matrix.isVisible('.btn1', function(err) {
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