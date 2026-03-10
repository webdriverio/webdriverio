import assert from 'node:assert'

describe('Vitest smoke test', () => {
    it('has globals set up', async () => {
        expect(global.browser).toBeDefined()
        expect(global.driver).toBeDefined()
        expect(global.$).toBeDefined()
        expect(global.$$).toBeDefined()
        expect(global.expect).toBeDefined()
    })

    it('should allow to use WebdriverIO assertions', async () => {
        await expect(browser).toHaveTitle('Mock Page Title')
    })

    it('should allow to use asymmetric matchers', async () => {
        await expect(browser).toHaveTitle(
            expect.stringContaining('Page'))
        await expect(browser).toHaveTitle(
            expect.not.stringContaining('foobar'))
        await expect(browser).toHaveUrl(
            expect.stringContaining('mymockpage'))
        await expect(browser).toHaveUrl(
            expect.not.stringContaining('mymock_page.'))
    })

    it('should return async value', async () => {
        const title = await browser.getTitle()
        assert.equal(title, 'Mock Page Title')
    })

    it('should chain properly', async () => {
        // @ts-expect-error custom command
        await browser.isExistingScenario()

        const el = browser.$('body')
        assert.equal(await el.$('.selector-1').isExisting(), true)
        assert.equal(await el.$('.selector-2').isExisting(), true)
    })

    it('should allow to reload a session', async () => {
        const sessionIdBefore = browser.sessionId
        await browser.reloadSession()
        expect(sessionIdBefore).not.toBe(browser.sessionId)
    })

    describe('add customCommands', () => {
        it('should allow to call nested custom commands', async () => {
            browser.addCommand('myCustomCommand', async function (param) {
                const result = {
                    url: await browser.getUrl(),
                    title: await browser.getTitle()
                }

                return { param, ...result }
            })

            assert.equal(
                // @ts-expect-error custom command
                JSON.stringify(await browser.myCustomCommand('foobar')),
                JSON.stringify({
                    param: 'foobar',
                    url: 'https://mymockpage.com',
                    title: 'Mock Page Title'
                })
            )
        })

        it('allows to create custom commands on elements', async () => {
            // @ts-expect-error custom command
            await browser.customCommandScenario()
            const elem = await $('elem')
            elem.addCommand('myCustomCommand', async function (param) {
                const result = await this.getSize()
                return { selector: this.selector, result, param }
            })

            assert.equal(
                // @ts-expect-error custom command
                JSON.stringify(await elem.myCustomCommand('foobar')),
                JSON.stringify({
                    selector: 'elem',
                    result: { width: 1, height: 2 },
                    param: 'foobar'
                })
            )
        })
    })
})
