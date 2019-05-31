import assert from 'assert'

describe('smoke test multiremote', () => {
    it('should return sync value', () => {
        assert.equal(
            JSON.stringify(browser.getTitle()),
            JSON.stringify(['Mock Page Title', 'Mock Page Other Title']))
    })

    it('should respect promises', () => {
        browser.addCommand('customFn', () => {
            let start = Date.now()
            browser.pause(30)
            return Promise.all([
                Promise.resolve(Date.now() - start),
                Promise.resolve(Date.now() - start)
            ])
        })

        const results = browser.customFn()

        assert.strictEqual(results[0] >= 30, true, `First of [${results}] is less than 30`)
    })

    it('should throw if promise rejects', () => {
        browser.addCommand('customFn', () => {
            return Promise.reject('Boom!')
        })

        let err = null
        try {
            browser.customFn()
        } catch (e) {
            err = e
        }
        assert.equal(err.message, 'Boom!')
    })

    it('allows to create custom commands on elements that respects promises', () => {
        browser.customCommandScenario(Object.keys(browser.instances).length)
        browser.addCommand('myCustomPromiseCommand', function () {
            let start = Date.now()
            browser.pause(30)
            return Promise.resolve(Date.now() - start)
        }, true)
        const elem = $('elem')
        const results = elem.myCustomPromiseCommand()

        assert.strictEqual(results[0] >= 30, true, `First of [${results}] is less than 30`)
    })
})
