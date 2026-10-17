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
        // click runs other commands (elementClick, a scroll check): each one runs its hooks once
        assert.strictEqual(hooks[0], 'before click')
        assert.strictEqual(hooks.at(-1), 'after click')
        assert.ok(hooks.includes('before elementClick'))
        for (const entry of hooks) {
            const name = entry.replace(/^(before|after) /, '')
            assert.strictEqual(hooks.filter((e) => e === `before ${name}`).length, 1, `before ${name}`)
            assert.strictEqual(hooks.filter((e) => e === `after ${name}`).length, 1, `after ${name}`)
        }
    })
})
