describe('cookie command test', () => {
    afterEach(async function () {
        // Clear cookies after each test
        await this.client.deleteCookie()
    })

    it('setCookie should fail if user provides name that is not a string type', async function () {
        try {
            await this.client.setCookie({name: 12345, value: 'cookie saved!', domain: '127.0.0.1'})
            await this.client.setCookie({name: 'test2', value: 'cookie saved2!', domain: '127.0.0.1'})

            const cookies = await this.client.getCookie()
            cookies.should.have.length(0) // should never happen.
        } catch (e) {
            (e.message).should.be.equal('Please specify a cookie object to set (see https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#cookie-json-object for documentation.')
        }
    })

    it('setCookie should fail if user does not provide an object type', async function () {
        try {
            await this.client.setCookie('not appropriate')
            await this.client.setCookie({name: 'test2', value: 'cookie saved2!', domain: '127.0.0.1'})

            const cookies = await this.client.getCookie()
            cookies.should.have.length(0) // should never happen.
        } catch (e) {
            (e.message).should.be.equal('Please specify a cookie object to set (see https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#cookie-json-object for documentation.')
        }
    })

    it('setCookie should fail if user does not provide name', async function () {
        try {
            await this.client.setCookie({value: 'cookie saved2!', domain: '127.0.0.1'})
            await this.client.setCookie({name: 'test2', value: 'cookie saved2!', domain: '127.0.0.1'})

            const cookies = await this.client.getCookie()
            cookies.should.have.length(0) // should never happen.
        } catch (e) {
            (e.message).should.be.equal('Please specify a cookie object to set (see https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#cookie-json-object for documentation.')
        }
    })

    it('getCookie should return null / [] if no cookie(s) is/are set', async function () {
        (await this.client.getCookie('test') === null).should.be.equal(true);
        (await this.client.getCookie()).should.have.length(0)
    })

    it('getCookie should return multiple cookies if no name is given', async function () {
        await this.client.setCookie({name: 'test', value: 'cookie saved!', domain: '127.0.0.1'})
        await this.client.setCookie({name: 'test2', value: 'cookie saved2!', domain: '127.0.0.1'})

        const cookies = await this.client.getCookie()
        cookies.should.be.an.instanceOf(Array)
        cookies.should.have.length(2)
        cookies.should.contain.a.thing.with.property('name', 'test')
        cookies.should.contain.a.thing.with.property('value', 'cookie saved!')
        cookies.should.contain.a.thing.with.property('name', 'test2')
        cookies.should.contain.a.thing.with.property('value', 'cookie saved2!')
    })

    it('getCookie should return a single cookies if name is given with double URI encoding', async function () {
        await this.client.setCookie({name: 'test', value: 'cookie saved!', domain: '127.0.0.1'})
        await this.client.setCookie({name: '/:?test2', value: 'cookie saved2!', domain: '127.0.0.1'})

        const cookie = await this.client.getCookie('/:?test2')
        cookie.should.be.an.instanceOf(Object)
        cookie.value.should.be.equal('cookie saved2!')
        cookie.name.should.be.equal('%252F%253A%253Ftest2')
    })

    it('getCookie should return a single cookies full of special characters', async function () {
        await this.client.setCookie({name: "~!@#$%^&*()_+-={}|[]\:\"'<>?,./", value: 'cookie saved!', domain: '127.0.0.1'})
        await this.client.setCookie({name: 'test2', value: 'cookie saved2!', domain: '127.0.0.1'})

        const cookie = await this.client.getCookie("~!@#$%^&*()_+-={}|[]\:\"'<>?,./")
        cookie.should.be.an.instanceOf(Object)
        cookie.value.should.be.equal('cookie saved!')

        cookie.name.should.be.equal("~!%2540%2523%2524%2525%255E%2526*()_%252B-%253D%257B%257D%257C%255B%255D%253A%2522'%253C%253E%253F%252C.%252F")
    })

    it('getCookie should return a single cookies if name is given', async function () {
        await this.client.setCookie({name: 'test', value: 'cookie saved!', domain: '127.0.0.1'})
        await this.client.setCookie({name: 'test2', value: 'cookie saved2!', domain: '127.0.0.1'})

        const cookie = await this.client.getCookie('test2')
        cookie.should.be.an.instanceOf(Object)
        cookie.value.should.be.equal('cookie saved2!')
        cookie.name.should.be.equal('test2')
    })

    it('deleteCookie should delete a specific cookie', async function () {
        if (this.client.desiredCapabilities.browserName === 'safari' && !this.client.isMobile) {
            return
        }

        await this.client.setCookie({ name: 'test', value: 'cookie saved!', domain: '127.0.0.1' })
        await this.client.setCookie({ name: 'test2', value: 'cookie2 saved!', domain: '127.0.0.1' })
        await this.client.deleteCookie('test');

        (await this.client.getCookie('test') === null).should.be.equal(true);
        (await this.client.getCookie()).should.have.length(1)
    })

    it('deleteCookie should delete all cookies', async function () {
        if (this.client.desiredCapabilities.browserName === 'safari' && !this.client.isMobile) {
            return
        }

        await this.client.setCookie({ name: 'test', value: 'cookie saved!', domain: '127.0.0.1' })
        await this.client.setCookie({ name: 'test2', value: 'cookie2 saved!', domain: '127.0.0.1' })
        await this.client.deleteCookie();

        (await this.client.getCookie('test') === null).should.be.equal(true);
        (await this.client.getCookie('test2') === null).should.be.equal(true);
        (await this.client.getCookie()).should.have.length(0)
    })

    it('deleteCookie should delete all cookies with double URI encoding', async function () {
        if (this.client.desiredCapabilities.browserName === 'safari' && !this.client.isMobile) {
            return
        }

        await this.client.setCookie({ name: '/test', value: 'cookie saved!', domain: '127.0.0.1' })
        await this.client.setCookie({ name: 'test2?:', value: 'cookie2 saved!', domain: '127.0.0.1' })
        await this.client.deleteCookie();

        (await this.client.getCookie('/test') === null).should.be.equal(true);
        (await this.client.getCookie('test2?:') === null).should.be.equal(true);
        (await this.client.getCookie()).should.have.length(0)
    })

    it('deleteCookie should delete a specific cookie with double URI encoding', async function () {
        if (this.client.desiredCapabilities.browserName === 'safari' && !this.client.isMobile) {
            return
        }

        await this.client.setCookie({ name: '/test', value: 'cookie saved!', domain: '127.0.0.1' })
        await this.client.setCookie({ name: 'test2?:', value: 'cookie2 saved!', domain: '127.0.0.1' })
        await this.client.deleteCookie('test2?:');

        (await this.client.getCookie('test2?:') === null).should.be.equal(true);
        (await this.client.getCookie()).should.have.length(1)
    })

    it('deleteCookie should delete a single cookies full of special characters', async function () {
        if (this.client.desiredCapabilities.browserName === 'safari' && !this.client.isMobile) {
            return
        }

        await this.client.setCookie({name: "~!@#$%^&*()_+-={}|[]\:\"'<>?,./", value: 'cookie saved!', domain: '127.0.0.1'})
        await this.client.setCookie({name: 'test2', value: 'cookie saved2!', domain: '127.0.0.1'})
        await this.client.deleteCookie("~!@#$%^&*()_+-={}|[]\:\"'<>?,./");

        (await this.client.getCookie("~!@#$%^&*()_+-={}|[]\:\"'<>?,./") === null).should.be.equal(true);
        (await this.client.getCookie()).should.have.length(1)
    })
})
