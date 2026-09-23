import url from 'node:url'
import path from 'node:path'
import { browser, $, $$, expect } from '@wdio/globals'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * e2e coverage for strict `$` semantics, see
 * https://github.com/webdriverio/webdriverio/issues/15666
 */
describe('strict selectors', () => {
    beforeEach(async () => {
        const resource = path.resolve(__dirname, '__fixtures__', 'strictSelectors.html')
        await browser.url(url.pathToFileURL(resource).href)
    })

    it('resolves a selector that matches a single element', async () => {
        await expect($('#unique')).toHaveText('Strict Selectors')
    })

    it('throws when a selector matches multiple elements', async () => {
        const err = await $('button.multiple').getElement().catch((e: Error) => e) as Error
        expect(err.name).toBe('StrictSelectorError')
        expect(err.message).toContain('resolved to 3 elements')
        expect(err.message).toContain('button.multiple')
    })

    it('still waits for elements that do not exist yet', async () => {
        const elem = $('#appears-late')
        await elem.waitForExist({ timeout: 5000 })
        await expect(elem).toHaveText('here')
    })

    it('leaves $$ untouched', async () => {
        await expect($$('button.multiple')).toBeElementsArrayOfSize(3)
        await expect($$('#does-not-exist')).toBeElementsArrayOfSize(0)
    })

    it('is strict at every step of a chain', async () => {
        await expect($('#scope').$('.only-one-in-scope')).toHaveText('only me')

        const err = await $('#scope').$('.in-scope').getElement().catch((e: Error) => e) as Error
        expect(err.name).toBe('StrictSelectorError')
        expect(err.message).toContain('resolved to 2 elements')
    })

    it('applies the same rule to elements inside a shadow root', async () => {
        await expect($('.shadow-unique')).toHaveText('c')

        const err = await $('.shadow-multiple').getElement().catch((e: Error) => e) as Error
        expect(err.name).toBe('StrictSelectorError')
        expect(err.message).toContain('resolved to 2 elements')
    })

    it('can be opted out of per call', async () => {
        await expect($('button.multiple', { strict: false })).toHaveText('A')
    })
})
