describe('test cookie functionality',function() {
    before(h.setup);

    it('should set a cookie and read its content afterwards', function(done){
        this.client
            .setCookie({name: 'test',value: 'cookie saved!'})
            .getCookie('test', function(err,result) {
                assert.equal(null, err);
                assert.strictEqual(result.name,'test');
                assert.strictEqual(result.value,'cookie saved!');
            })
            .call(done);
    });

    it('should delete created cookie and is not able to read its content', function(done){
        this.client
            .deleteCookie('test')
            .getCookie('test', function(err,result) {
                assert.equal(null, err);
                assert.strictEqual(result,null);
            })
            .call(done);
    });

    it('should set two cookies and read all at once', function(done){
        this.client
            .setCookie({name: 'test',value: 'cookie saved!'})
            .setCookie({name: 'test2',value: 'cookie2 saved!'})
            .getCookie(function(err,result) {
                assert.equal(null, err);
                assert.strictEqual(2,result.length);
                assert.strictEqual('cookie saved!',result[0].value);
                assert.strictEqual('cookie2 saved!',result[1].value);
            })
            .call(done);
    });

    it('should delete all previous created cookies at once', function(done){
        this.client
            .deleteCookie()
            .getCookie(function(err,result) {
                assert.equal(null, err);
                assert.strictEqual(0,result.length);
            })
            .call(done);
    });
});