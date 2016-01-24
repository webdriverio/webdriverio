describe('cookie command test', () => {
    it('getCookie should return null / [] if no cookie(s) is/are set', async function () {
        (await this.client.getCookie('test') === null).should.be.equal(true);
        (await this.client.getCookie()).should.have.length(0)
    })

    it('getCookie should return multiple cookies if no name is given', async function () {
        await this.client.setCookie({name: 'test', value: 'cookie saved!'})
        await this.client.setCookie({name: 'test2', value: 'cookie saved2!'})

        const cookies = await this.client.getCookie()
        cookies.should.be.an.instanceOf(Array)
        cookies.should.have.length(2)
        cookies.should.contain.a.thing.with.property('name', 'test')
        cookies.should.contain.a.thing.with.property('value', 'cookie saved!')
        cookies.should.contain.a.thing.with.property('name', 'test2')
        cookies.should.contain.a.thing.with.property('value', 'cookie saved2!')
    })

    it('getCookie should return a single cookies if name is given', async function () {
        await this.client.setCookie({name: 'test', value: 'cookie saved!'})
        await this.client.setCookie({name: 'test2', value: 'cookie saved2!'})

        const cookie = await this.client.getCookie('test2')
        cookie.should.be.an.instanceOf(Object)
        cookie.value.should.be.equal('cookie saved2!')
        cookie.name.should.be.equal('test2')
    })

    it('deleteCookie should delete a specific cookie', async function () {
        if (this.client.desiredCapabilities.browserName === 'safari' && !this.client.isMobile) {
            return
        }

        await this.client.setCookie({ name: 'test', value: 'cookie saved!' })
        await this.client.setCookie({ name: 'test2', value: 'cookie2 saved!' })
        await this.client.deleteCookie('test');

        (await this.client.getCookie('test') === null).should.be.equal(true);
        (await this.client.getCookie()).should.have.length(1)
    })

    it('deleteCookie should delete all cookies', async function () {
        if (this.client.desiredCapabilities.browserName === 'safari' && !this.client.isMobile) {
            return
        }

        await this.client.setCookie({ name: 'test', value: 'cookie saved!' })
        await this.client.setCookie({ name: 'test2', value: 'cookie2 saved!' })
        await this.client.deleteCookie();

        (await this.client.getCookie('test') === null).should.be.equal(true);
        (await this.client.getCookie('test2') === null).should.be.equal(true);
        (await this.client.getCookie()).should.have.length(0)
    })
})
