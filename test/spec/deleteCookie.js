describe('deleteCookie', function() {

    before(h.setup());

    it('should delete a specific cookie', function(done) {
        this.client
            .setCookie({
                name: 'test',
                value: 'cookie saved!'
            })
            .setCookie({
                name: 'test2',
                value: 'cookie2 saved!'
            })
            .deleteCookie('test')
            .getCookie('test', function(err, result) {
                assert.ifError(err);
                assert.strictEqual(result, null);
            })
            .getCookie('test2', function(err, result) {
                assert.ifError(err);
                assert.notStrictEqual(result, null);
            })
            .call(done);
    });

    it('should delete all cookies', function(done) {
        this.client
            .setCookie({
                name: 'test',
                value: 'cookie saved!'
            })
            .setCookie({
                name: 'test2',
                value: 'cookie2 saved!'
            })
            .deleteCookie()
            .getCookie(function(err, result) {
                assert.ifError(err);
                assert.strictEqual(result.length, 0);
            })
            .call(done);
    });

});