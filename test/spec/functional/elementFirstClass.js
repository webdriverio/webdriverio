describe('element as first class citizen', function() {

    before(h.setup());

    it('should return a color attribute to test with properly', function() {
        return this.client.element('.red').getCssProperty('background-color').then(function (bgColor) {
            bgColor.value.should.be.exactly('rgba(255,0,0,1)');
        });
    });

    it('should return the text of a single element', function() {
        return this.client.element('#githubRepo').getText().then(function (text) {
            text.should.be.exactly('GitHub Repo');
        });
    });

    it('should return a specific property width of the location if set', function() {
        return this.client.element('header h1').getLocation('x').then(function (x) {
            x.should.be.below(27);
        });
    });

    it('should get the attribute of a single element', function(){
        return this.client.element('.nested').getAttribute('style').then(function (result) {
            result.should.be.exactly('text-transform: uppercase;');
        });
    });

    it('add a value to existing input value', function() {
        var el = this.client.element('input[name="a"]');

        return el.addValue('b').then(function() {
            return el.addValue('c');
        }).then(function() {
            return el.getValue();
        }).then(function(val) {
            val.should.be.equal('abc')
        })
    });

});
