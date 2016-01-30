import q from 'q'

describe('promised based async handling', () => {
    it('command result should be a promise', () => {
        q.isPromiseAlike(browser.status()).should.be.equal(true)
    })

    it('should pass a promise test', () => {
        return browser.url('/').getTitle().then((result) => {
            expect(result).to.be.equal('WebdriverJS Testpage')
        })
    })

    it('should defer execution', () => {
        let start = new Date().getTime()
        return browser.pause(500).then(() => {
            let now = new Date().getTime()
            expect(now - start).to.be.greaterThan(500)
        })
    })
})
