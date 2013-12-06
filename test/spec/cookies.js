/*module.exports = function(testpageURL,testpageTitle,assert,should,expect){

    describe('test cookie functionality',function() {

        it('should set a cookie and read its content afterwards', function(done){
            client
                .setCookie({name: 'test',value: 'cookie saved!'})
                .getCookie('test', function(err,result) {
                    assert.equal(null, err)
                    assert.strictEqual(result.name,'test');
                    assert.strictEqual(result.value,'cookie saved!');
                })
                .call(done);
        });

        it('should delete created cookie and is not able to read its content', function(done){
            client
                .deleteCookie('test')
                .getCookie('test', function(err,result) {
                    assert.equal(null, err)
                    assert.strictEqual(result,null);
                })
                .call(done);
        });

        it('should create two cookies and delete all at once', function(done){
            client
                .setCookie({name: 'test',value: 'cookie saved!'})
                .setCookie({name: 'test2',value: 'cookie2 saved!'})
                .deleteCookie()
                .getCookie('test', function(err,result) {
                    assert.equal(null, err)
                    assert.strictEqual(result,null);
                })
                .getCookie('test2', function(err,result) {
                    assert.equal(null, err)
                    assert.strictEqual(result,null);
                })
                .call(done);
        });

    });

};*/