describe('Promises', function() {
    before(h.setup);
    it('should execute all commands in right order (asynchronous execution test)', function(done) {
        var result = '';
        var client = this.client;

        this.client
            .click('.btn1', function(err) {
                assert.equal(null, err);
                result += '1';
            })
            .isVisible('.btn1', function(err) {
                assert.equal(null, err);
                result += '2';
            })
            .call(function() {
                result += '3';

                client.click('.btn1',function(err) {

                    assert.equal(null, err);
                    result += '4';

                    client.isVisible('.btn1', function(err) {
                        assert.equal(null, err);
                        result += '5';
                    })
                    .call(function() {
                        result += '6';

                        client.call(function() {

                            result += '7';

                            client.click('.btn1', function(err) {
                                assert.equal(null, err);
                                result += '8';

                                client.call(function() {
                                    result += '9';

                                    client.isVisible('.btn1', function(err) {
                                        assert.equal(null, err);
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
                            })
                            .click('.btn1', function(err) {
                                assert.equal(null, err);
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
                            assert.equal(null, err);
                            result += 'e';
                        });
                    });
                })
                .click('.btn1',function(err) {
                    assert.equal(null, err);
                    result += 'f';
                })
                .call(function() {
                    assert.equal(result,'1234567890bcdef');
                    done();
                });
            });
    });
});