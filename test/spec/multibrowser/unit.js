describe('Browsermatrix', function() {

    before(h.setupMultibrowser({ asSingleton: true }));

    it('should provide all WebdriverIO commands', function() {
        Object.keys(require('../../../lib/webdriverio')).forEach(function(fnName) {
            this.matrix[fnName].should.be.typeof('function');
            this.browserA[fnName].should.be.typeof('function');
            this.browserB[fnName].should.be.typeof('function');
        });
    });

    it('should provide a method to select certain instances by name', function() {
        this.matrix.select('browserA').should.be.eql(this.browserA);
        this.matrix.select('browserB').should.be.eql(this.browserB);
    });

});