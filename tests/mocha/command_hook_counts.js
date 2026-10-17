import assert from 'node:assert'

describe('command hooks', () => {
    it('run once for a protocol command of an element', async () => {
        await browser.clickScenario()
        const elem = await $('elem')
        globalThis.commandHooks = []
        await elem.elementClick(elem.elementId)
        assert.deepStrictEqual(globalThis.commandHooks, ['before elementClick', 'after elementClick'])
    })
})
