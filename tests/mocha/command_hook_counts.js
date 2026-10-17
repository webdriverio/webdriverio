import assert from 'node:assert'

describe('command hooks', () => {
    it('run once for a protocol command of an element', async () => {
        await browser.clickScenario()
        const elem = await $('elem')
        globalThis.commandHooks = []
        await elem.elementClick(elem.elementId)
        assert.deepStrictEqual(globalThis.commandHooks, ['before elementClick', 'after elementClick'])
    })

    it('run once for an element command and the protocol command that it runs', async () => {
        await browser.clickScenario()
        const elem = await $('elem')
        globalThis.commandHooks = []
        await elem.click()
        const hooks = globalThis.commandHooks
        const count = (entry) => hooks.filter((e) => e === entry).length
        // click runs other commands (elementClick, a scroll check), each one with as many before as after hooks
        assert.strictEqual(hooks[0], 'before click')
        assert.strictEqual(hooks.at(-1), 'after click')
        assert.strictEqual(count('before click'), 1)
        assert.strictEqual(count('after click'), 1)
        assert.ok(hooks.includes('before elementClick'))
        for (const name of new Set(hooks.map((e) => e.replace(/^(before|after) /, '')))) {
            assert.strictEqual(count(`before ${name}`), count(`after ${name}`), name)
        }
    })
})
