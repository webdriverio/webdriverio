describe('getText', function() {
    before(h.setup);

    it('should fetch a single element with classname "firstElement"', function(done){
        this.client
            .url('http://localhost:8080/test/spec/getText/')
            .getText('.firstElement', function(err, result) {
                assert.equal(null, err);
                assert.strictEqual(result,'Lorem ipsum');
            })
            .call(done);
    });

    it('should fetch multiple elements', function(done){
        this.client
            .url('http://localhost:8080/test/spec/getText/')
            .getText('div', function(err, result) {
                assert.equal(null, err);
                assert.ok(result instanceof Array);
                assert.strictEqual(result.length, 3);
                assert.strictEqual(result.join(' '), 'Lorem ipsum dolor sit amet');
            })
            .call(done);
    });
});