describe('getAttribute', function() {

    before(h.setup());

    it('should get the attribute of a single element', function(done){
        this.client
            .getAttribute('.nested', 'style', function(err,result) {
                assert.ifError(err);
                result.should.be.exactly('text-transform: uppercase;');
            })
            .call(done);
    });

    it('should get the attribute of multiple elements', function(done){
        this.client
            .getAttribute('.box', 'class', function(err,result) {
                assert.ifError(err);
                result.should.be.an.instanceOf(Array);
                result.should.have.length(5);

                result.forEach(function(className) {
                    className.should.startWith('box ');
                });
            })
            .call(done);
    });

});