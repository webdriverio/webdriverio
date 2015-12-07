/*jshint expr: true*/
describe('selectBy', function() {

    before(h.setup());

    describe('VisibleText', function() {

        it('should find element without special conditions', function() {
            return this.client.selectByVisibleText('#selectTest', 'seis').getValue('#selectTest').then(function (value) {
                value.should.be.exactly('someValue6');
            });
        });

        it('should find element with spaces before and after the text', function() {
            return this.client.selectByVisibleText('#selectTest', 'dos').getValue('#selectTest').then(function (value) {
                value.should.be.exactly('someValue2');
            });
        });

        it('should find element with spaces before and after the text parameter', function() {
            return this.client.selectByVisibleText('#selectTest', '   cinco  ').getValue('#selectTest').then(function (value) {
                value.should.be.exactly('someValue5');
            });
        });

        it('should find element with quotes around the text', function() {
             return this.client.selectByVisibleText('#selectTest', '"siete"').getValue('#selectTest').then(function (value) {
                value.should.be.exactly('someValue7');
            });
        });

        it('should find element with quotes in the text', function() {
            return this.client.selectByVisibleText('#selectTest', 'ocho "huit" (otto)').getValue('#selectTest').then(function (value) {
                value.should.be.exactly('someValue8');
            });
        });

        it('should find element with a quote in the text', function() {
            return this.client.selectByVisibleText('#selectTest', 'nu"eve').getValue('#selectTest').then(function (value) {
                value.should.be.exactly('someValue9');
            });
        });

        it('should find element with a quote at the end of the text', function() {
            return this.client.selectByVisibleText('#selectTest', 'diez"').getValue('#selectTest').then(function (value) {
                value.should.be.exactly('someValue10');
            });
        });

    });

    describe('Index', function() {

        it('should find element without special conditions', function() {
            return this.client.selectByIndex('#selectTest', 3).getValue('#selectTest').then(function (value) {
                value.should.be.exactly('someValue4');
            });
        });

        it('should throw error if index is negative', function() {
            return this.client.selectByIndex('#selectTest', -2).catch(function(err) {
                assert.ifError(!!!err);
            });
        });

        it('should throw error if index is higher than number of options', function() {
            return this.client.selectByIndex('#selectTest', 99).catch(function(err) {
                assert.ifError(!!!err);
            });
        });

    });

    describe('Name', function() {

        it('should find element without special conditions', function() {
            return this.client.selectByName('#selectTest',  'someName7').getValue('#selectTest').then(function (value) {
                value.should.be.exactly('someValue7');
            });
        });

        it('should find element with spaces before and after the name', function() {
            return this.client.selectByName('#selectTest',  'someName9').getValue('#selectTest').then(function (value) {
                value.should.be.exactly('someValue9');
            });
        });

        it('should find element with spaces before and after the name parameter', function() {
            return this.client.selectByName('#selectTest', '    someName8    ').getValue('#selectTest').then(function (value) {
                value.should.be.exactly('someValue8');
            });
        });

    });

    describe('Value', function() {

        it('should find element without special conditions', function() {
            return this.client.selectByValue('#selectTest',  'someValue1').getValue('#selectTest').then(function (value) {
                value.should.be.exactly('someValue1');
            });
        });

        it('should find element with spaces before and after the value', function() {
            return this.client.selectByValue('#selectTest',  'someValue3').getValue('#selectTest').then(function (value) {
                value.should.be.exactly('someValue3');
            });
        });

        it('should find element with spaces before and after the value parameter', function() {
            return this.client.selectByValue('#selectTest', '    someValue5    ').getValue('#selectTest').then(function (value) {
                value.should.be.exactly('someValue5');
            });
        });

    });

});
