describe('Chaining', function() {

    before(h.setupMultibrowser());

    it('should execute all commands in right order (asynchronous execution test)', function(done) {
        var result = '';
        var matrix = this.matrix;
        var browserA = this.browserA;
        var browserB = this.browserB;

        matrix
            .click('.btn1').then(function() {
                result += '1';
            })
            .isVisible('.btn1').then(function() {
                result += '2';
            })
            .call(function() {
                result += '3';

                return browserA.click('.btn1').then(function() {

                    result += '4';

                    return browserB.isVisible('.btn1').then(function() {
                        result += '5';
                    }).call(function() {
                        result += '6';

                        return browserA.call(function() {

                            result += '7';

                            return browserB.click('.btn1').then(function() {
                                result += '8';

                                return browserA.call(function() {
                                    result += '9';

                                    return browserB.isVisible('.btn1').then(function() {
                                        result += '0';

                                        // this can't work
                                        // there's no way the chain
                                        // can now when the setTimeout
                                        // will be finished
                                        // setTimeout(function() {
                                        //     client.call(function() {
                                        //         result += 'a';
                                        //     });
                                        // },1000);
                                    });
                                });
                            }).click('.btn1').then(function() {
                                result += 'b';
                            });
                        });
                    })
                    .click('.btn1').then(function() {
                        result += 'c';
                    })
                    .call(function() {
                        result += 'd';

                        return browserA.isVisible('.btn1').then(function() {
                            result += 'e';
                        });
                    });
                })
                .click('.btn1').then(function() {
                    result += 'f';
                })
                .call(function() {
                    assert.equal(result,'1234567890bcdef');
                    done();
                });
            });
    });

    it('should be able to sync browser chained commands', function() {
        var result = '';
        var matrix = this.matrix;
        var browserA = this.browserA;
        var browserB = this.browserB;

        browserA.isVisible('.btn1').then(function() {
            result += '0'; // use same value as we don't know what command is faster
        });

        browserB.click('.btn1').then(function() {
            result += '0'; // use same value as we don't know what command is faster
        });

        return matrix.sync().click('.btn1').then(function() {
            result += '7';
        }).call(function() {
            assert.equal(result,'007');
        });
    });

});