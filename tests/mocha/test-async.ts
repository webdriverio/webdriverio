import assert from 'node:assert'

describe('Mocha smoke test', () => {
    it('should return sync value', async () => {
        const now = Date.now()
        assert.equal(await browser.getTitle(), 'Mock Page Title')
        const duration = Date.now() - now

        assert.equal(duration > 200, true)
    })

    it('should allow to iterate over elements', async () => {
        // @ts-expect-error custom command
        const expectedResults = await browser.asyncIterationScenario()
        let i = 0
        for await (const elem of browser.$$('elems')) {
            assert.equal(expectedResults[i++], elem.elementId)
        }
    })

    it('should allow to fetch parent elements with chaining', async () => {
        // @ts-expect-error custom command
        await browser.parentElementChaining()
        assert.equal(
            await $('foo').parentElement().getText(),
            'some element text'
        )
    })

    it('should allow to fetch next elements with chaining', async () => {
        // @ts-expect-error custom command
        await browser.parentElementChaining()
        assert.equal(
            await $('foo').nextElement().getText(),
            'some element text'
        )
    })

    it('should allow to fetch previous elements with chaining', async () => {
        // @ts-expect-error custom command
        await browser.parentElementChaining()
        assert.equal(
            await $('foo').previousElement().getText(),
            'some element text'
        )
    })
})
