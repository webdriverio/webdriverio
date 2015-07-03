
/*jshint expr: true*/
describe('cookie command test', function() {

    before(h.setup());

    it('getCookie should return null / [] if no cookie(s) is/are set', function(){
        return this.client
            .getCookie('test').then(function (cookie) {
                (cookie === null).should.be.true;
            })
            .getCookie().then(function (cookies) {
                cookies.should.have.length(0);
            });
    });

    it('getCookie should return multiple cookies if no name is given', function(){
        return this.client
            .setCookie({name: 'test',value: 'cookie saved!'})
            .setCookie({name: 'test2',value: 'cookie saved2!'})
            .getCookie().then(function (cookies) {
                cookies.should.be.an.instanceOf(Array);
                cookies.should.have.length(2);
                cookies.should.containDeep([{ value: 'cookie saved!' }]);
                cookies.should.containDeep([{ value: 'cookie saved2!' }]);
                cookies.should.containDeep([{ name: 'test' }]);
                cookies.should.containDeep([{ name: 'test2' }]);
            });
    });

    it('getCookie should return a single cookies if name is given', function(){
        return this.client
            .setCookie({name: 'test',value: 'cookie saved!'})
            .setCookie({name: 'test2',value: 'cookie saved2!'})
            .getCookie('test2').then(function (cookie) {
                cookie.should.be.an.instanceOf(Object);
                cookie.value.should.be.exactly('cookie saved2!');
                cookie.name.should.be.exactly('test2');
            });
    });

    it('deleteCookie should delete a specific cookie', function() {

        if(this.client.desiredCapabilities.browserName === 'safari' && !this.client.isMobile) {
            return;
        }

        return this.client
            .setCookie({ name: 'test', value: 'cookie saved!' })
            .setCookie({ name: 'test2', value: 'cookie2 saved!' })
            .deleteCookie('test')
            .getCookie('test').then(function (result) {
                assert.strictEqual(result, null);
            })
            .getCookie().then(function (result) {
                assert.notStrictEqual(result, null);
            });
    });

    it('deleteCookie should delete all cookies', function() {

        if(this.client.desiredCapabilities.browserName === 'safari' && !this.client.isMobile) {
            return;
        }

        return this.client
            .setCookie({ name: 'test', value: 'cookie saved!' })
            .setCookie({ name: 'test2', value: 'cookie2 saved!' })
            .deleteCookie()
            .getCookie().then(function (result) {
                assert.strictEqual(result.length, 0);
            });
    });

});