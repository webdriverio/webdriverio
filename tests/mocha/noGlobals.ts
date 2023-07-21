import { browser, $, $$, expect } from '../../packages/wdio-globals/build/index.js'

describe('global usage', () => {
    it('has no globals registered', () => {
        expect(typeof global.browser).toBe('undefined')
        expect(typeof global.$).toBe('undefined')
        expect(typeof global.$$).toBe('undefined')
        expect(typeof global.driver).toBe('undefined')
        expect(typeof global.multiremotebrowser).toBe('undefined')
    })

    it('can use browser global', async () => {
        expect(await browser.getTitle()).toBe('Mock Page Title')
    })

    // enable once support is available in https://github.com/webdriverio/expect-webdriverio/issues/829
    // @ts-expect-error it thinks it uses Jasmine
    it.skip('supports non globals using expect-webdriverio', async () => {
        await expect(browser).toHaveTitle('Mock Page Title')
    })

    it('it can use $ and $$ globals', async () => {
        // @ts-expect-error custom command
        browser.isExistingScenario()

        const el = $('body')
        expect(await el.$('.selector-1').isExisting()).toBe(true)
    })

    it('can use $$ global', async () => {
        // @ts-expect-error custom command
        browser.asyncIterationScenario()

        const els = await $$('body')
        expect(els.length).toBe(2)
    })
})
