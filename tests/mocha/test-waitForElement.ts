import assert from 'node:assert'

describe('Mocha smoke test', () => {
    it('should be able to wait for an element', async () => {
        // @ts-expect-error custom command
        await browser.waitForDisplayedScenario()
        assert(await $('elem').waitForDisplayed())
    })
})
