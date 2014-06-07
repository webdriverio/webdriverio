describe('getCssProperty', function() {

    before(h.setup());

    it('should return a color attribute to test with properly', function(done) {
        this.client
            .getCssProperty('.red', 'background-color', function(err, bgColor) {
                assert.ifError(err);
                bgColor.value.should.be.exactly('rgba(255,0,0,1)');
                bgColor.parsed.hex.should.be.exactly('#ff0000');
                bgColor.parsed.alpha.should.be.exactly(1);
                bgColor.parsed.type.should.be.exactly('color');
            })
            .call(done);
    });

    it('should return a number attribute to test with properly', function(done) {
        this.client
            .getCssProperty('.red', 'width', function(err, width) {
                assert.ifError(err);
                width.value.should.be.exactly('100px');
                width.parsed.value.should.be.exactly(100);
                width.parsed.type.should.be.exactly('number');
                width.parsed.unit.should.be.exactly('px');
                width.parsed.string.should.be.exactly('100px');
            })
            .call(done);
    });

    it('should return a font attribute to test with properly', function(done) {
        this.client
            .getCssProperty('.red', 'font-family', function(err, font) {
                assert.ifError(err);
                font.value.should.be.exactly('helvetica neue');
                font.parsed.value.should.be.an.instanceOf(Array);
                font.parsed.value.should.have.length(4);
                font.parsed.value.should.containEql('helvetica neue');
                font.parsed.value.should.containEql('helvetica');
                font.parsed.value.should.containEql('arial');
                font.parsed.value.should.containEql('sans-serif');
            })
            .call(done);
    });

    it('should return multiple css attributes if selector matches multiple elements', function(done) {
        this.client
            .getCssProperty('.box', 'display', function(err, display) {
                assert.ifError(err);
                display.should.be.an.instanceOf(Array);
                display.should.have.length(5);
                display.should.containDeep([{
                    property: 'display',
                    value: 'block',
                    parsed: { type: 'ident', string: 'block' }
                }]);
            })
            .call(done);
    });

});