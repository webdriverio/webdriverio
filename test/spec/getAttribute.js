describe('getAttribute', function() {

    before(h.setup());

    it('should get the attribute of a single element', function(){
        return this.client.getAttribute('.nested', 'style').then(function (result) {
            result.should.be.exactly('text-transform: uppercase;');
        });
    });

    it('should get the attribute of multiple elements', function(){
        return this.client.getAttribute('.box', 'class').then(function (result) {
            result.should.be.an.instanceOf(Array);
            result.should.have.length(5);

            result.forEach(function(className) {
                className.should.startWith('box ');
            });
        });
    });

});