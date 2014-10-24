/*jshint expr: true*/
describe('selectBy', function() {

    before(h.setup());

    describe('VisibleText', function(done) {

        it('should find element without special conditions', function(done) {
            this.client
                .selectByVisibleText('#selectTest', 'seis')
                .getValue('#selectTest', function(err, value) {
                    assert.ifError(err);
                    value.should.be.exactly('someValue6');
                })
                .call(done);
        });

        it('should find element with spaces before and after the text', function(done) {
            this.client
                .selectByVisibleText('#selectTest', 'dos')
                .getValue('#selectTest', function(err, value) {
                    assert.ifError(err);
                    value.should.be.exactly('someValue2');
                })
                .call(done);
        });

        it('should find element with spaces before and after the text parameter', function(done) {
            this.client
                .selectByVisibleText('#selectTest', '    cinco    ')
                .getValue('#selectTest', function(err, value) {
                    assert.ifError(err);
                    value.should.be.exactly('someValue5');
                })
                .call(done);
        });

    });

    describe('Index', function(done) {

        it('should find element without special conditions', function(done) {
            this.client
                .selectByIndex('#selectTest', 3)
                .getValue('#selectTest', function(err, value) {
                    assert.ifError(err);
                    value.should.be.exactly('someValue4');
                })
                .call(done);
        });

        it('should throw error if index is negative', function(done) {
            this.client
                .selectByIndex('#selectTest', -2, function(err) {
                    assert.ifError(!!!err);
                })
                .call(done);
        });

        it('should throw error if index is higher than number of options', function(done) {
            this.client
                .selectByIndex('#selectTest', 99, function(err) {
                    assert.ifError(!!!err);
                })
                .call(done);
        });

    });

    describe('Value', function(done) {

        it('should find element without special conditions', function(done) {
            this.client
                .selectByValue('#selectTest', 'someValue1')
                .getValue('#selectTest', function(err, value) {
                    assert.ifError(err);
                    value.should.be.exactly('someValue1');
                })
                .call(done);
        });

        it('should find element with spaces before and after the value', function(done) {
            this.client
                .selectByValue('#selectTest', 'someValue3')
                .getValue('#selectTest', function(err, value) {
                    assert.ifError(err);
                    value.should.be.exactly('   someValue3  ');
                })
                .call(done);
        });

        it('should find element with spaces before and after the value parameter', function(done) {
            this.client
                .selectByValue('#selectTest', '    someValue5    ')
                .getValue('#selectTest', function(err, value) {
                    assert.ifError(err);
                    value.should.be.exactly('someValue5');
                })
                .call(done);
        });

    });

});