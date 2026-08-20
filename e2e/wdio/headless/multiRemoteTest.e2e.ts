import { multiRemoteBrowser, expect } from '@wdio/globals'
import { Key } from 'webdriverio'

let browserA: WebdriverIO.Browser
let browserB: WebdriverIO.Browser

describe('multi remote test', () => {
    before(() => {
        browserA = multiRemoteBrowser.getInstance('browserA')
        browserB = multiRemoteBrowser.getInstance('browserB')
    })

    it.skip('should also detect non PWAs', async () => {
        await browserA.url('https://json.org')
        await browserB.url('https://webdriver.io')

        await multiRemoteBrowser.pause(1000)

        /**
         * Unfortunately we don't know which result is from which browser
         */
        const results = (await multiRemoteBrowser.checkPWA() as unknown as []).map((result: { passed: boolean }) => result.passed)
        expect(typeof results[0]).toBe('boolean')
        expect(typeof results[1]).toBe('boolean')
        expect(results[0] !== results[1]).toBeTruthy()
    })

    describe('chat test', () => {
        it('should open chat application', async () => {
            browserA = await multiRemoteBrowser.getInstance('browserA')
            browserB = await multiRemoteBrowser.getInstance('browserB')
            await multiRemoteBrowser.url('https://socketio-chat-h9jt.herokuapp.com/')
        })

        it.skip('should login the browser A', async () => {
            const nameInput = await browserA.$('.usernameInput')
            await nameInput.addValue('Browser A')
            await browserA.keys(Key.Enter)
            await expect(browserA.$('.inputMessage')).toHaveAttribute('placeHolder', 'Type here...')
        })

        it.skip('should login the browser B', async () => {
            const nameInput = await browserB.$('.usernameInput')
            await nameInput.addValue('Browser B')
            await browserB.keys(Key.Enter)
            await expect(browserB.$('.inputMessage')).toHaveAttribute('placeHolder', 'Type here...')
        })

        it('can access shared store', async () => {
            expect(await browser.sharedStore.get('foo')).toBe('bar')
            expect(await browserA.sharedStore.get('foo')).toBe('bar')
            expect(await browserB.sharedStore.get('foo')).toBe('bar')
        })
    })

    describe('Multi-remote instance', () => {
        it('should have 3 browser titles', async () => {
            await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')

            const titles = await multiRemoteBrowser.getTitle()

            expect(titles).toEqual([
                'WebdriverJS Testpage',
                'WebdriverJS Testpage',
                'WebdriverJS Testpage'
            ])
            expect(await multiRemoteBrowser.$('header').$('h1').isExisting()).toEqual([true, true, true])
            expect(await multiRemoteBrowser.$('header').$('h1').getText()).toEqual([
                'WebdriverJS Testpage',
                'WebdriverJS Testpage',
                'WebdriverJS Testpage'
            ])
        })

        it('should be able to select one specific instance on multi-remote element', async () => {
            await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')

            const title = multiRemoteBrowser.$('header').$('h1')
            const browserAHeader = title.unstable_select('browserA')

            expect(await browserAHeader.instances).toEqual(['browserA'])
            expect(await browserAHeader.isExisting()).toEqual([true])

            const browserAText = await browserAHeader.getText()
            expect(browserAText).toEqual(['WebdriverJS Testpage'])
        })

        it('should be able to select two specific instance on multi-remote element', async () => {
            await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')

            const title = multiRemoteBrowser.$('header').$('h1')
            const browserAHeader = title.unstable_select(['browserA', 'browserC'])

            expect(await browserAHeader.instances).toEqual(['browserA', 'browserC'])
            expect(await browserAHeader.isExisting()).toEqual([true, true])

            const browserAText = await browserAHeader.getText()
            expect(browserAText).toEqual(['WebdriverJS Testpage', 'WebdriverJS Testpage'])
        })

        it('should be able to filter on multi-remote element', async () => {
            await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')
            await browserB.url('about:blank')

            const header = multiRemoteBrowser.$('header')

            const existingHeaders = await header.unstable_filter((e) => e.isExisting())

            // TODO review to assert order of instances, as it may not be guaranteed to be the same order each time
            expect(existingHeaders.instances).toEqual(['browserA', 'browserC'])
            const header1Texts = await existingHeaders.isExisting()
            expect(header1Texts).toEqual([true, true])
        })

        // TODO part of unstable API, to fix later
        it.skip('should be able to filter on chained multi-remote element when non-existing on 1 browser', async () => {
            await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')
            await browserB.url('about:blank')

            const h1 = multiRemoteBrowser.$('header').$('h1')

            const existingHeaders = await h1.unstable_filter((e) => e.isExisting())

            // TODO review to assert order of instances, as it may not be guaranteed to be the same order each time
            expect(existingHeaders.instances).toEqual(['browserA', 'browserC'])
            const header1Texts = await existingHeaders.getText()
            expect(header1Texts).toEqual(['WebdriverJS Testpage', 'WebdriverJS Testpage'])
        })

        it('should be able to select and filter on multi-remote element', async () => {
            await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')
            await browserB.url('about:blank')

            const header = multiRemoteBrowser.$('header')

            const existingHeaders = await header.unstable_select(['browserA', 'browserC']).unstable_filter((e) => e.isExisting())

            expect(existingHeaders.instances).toEqual(['browserA', 'browserC'])
            const headerExistence = await existingHeaders.isExisting()
            expect(headerExistence).toEqual([true, true])
        })

        it('should be able to select on multi-remote browser', async () => {
            await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')
            // Remove h1 from browserB to ensure it would fail if accessed
            await browserB.execute(() => {
                document.querySelector('header')?.remove()
            })

            // Select only browserA, so browserB's missing element shouldn't matter
            const header = await multiRemoteBrowser.unstable_select('browserA').$('header')

            expect(await header.instances).toEqual(['browserA'])
            expect(await header.isExisting()).toEqual([true])
        })

        it('should allow chaining select with 1 browser on element query', async () => {
            await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')

            const header = await multiRemoteBrowser.unstable_select('browserA').$('header').$('h1').getText()

            expect(header).toEqual(['WebdriverJS Testpage'])
        })

        it('should allow chaining select with 2 browser on element query', async () => {
            await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')

            const header = await multiRemoteBrowser.unstable_select(['browserA', 'browserC']).$('header').$('h1').getText()

            expect(header).toEqual(['WebdriverJS Testpage', 'WebdriverJS Testpage'])
        })

        // TODO Review if scoping on element should be preserved when chaining $() on a selected element, or if it should reset to all instances!!
        it('should keep instance scope when using select on a chained $ from an element????', async () => {
            await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')

            expect(await browserA.$('header').$('h1').getText()).toEqual('WebdriverJS Testpage')

            // On browser, using select we do keep the selected instance scope, so we can chain $ and get the element from the selected browser
            const browserChainedText = await multiRemoteBrowser.unstable_select('browserA').$('header').$('h1').getText()
            expect(browserChainedText).toEqual(['WebdriverJS Testpage'])

            // Selecting only for value it works!
            const elementTextFromChainedSelected = await multiRemoteBrowser.$('header').$('h1').unstable_select('browserA').getText()
            expect(elementTextFromChainedSelected).toEqual(['WebdriverJS Testpage'])

            // However, should we do the same when selecting on a element and chaining $()?
            const elementTextFromChainedParentSelected = await multiRemoteBrowser.$('header').unstable_select('browserA').$('h1').getText()
            expect(elementTextFromChainedParentSelected).toEqual(['WebdriverJS Testpage'])
        })

        // TODO part of unstable API, to fix later
        it.skip('should return empty array and not dispatch to all browsers when filter excludes everything (Bug 2)', async () => {
            // about:blank has no h1 in any browser
            await multiRemoteBrowser.url('about:blank')

            const header = await multiRemoteBrowser.$('h1')
            const existing = await header.unstable_filter((e) => e.isExisting())

            // All instances excluded → empty selection
            expect(existing.instances).toHaveLength(0)

            // Bug 2: selector is null on the empty element, so commandWrapper skips the
            // mElem.instances branch and falls back to Object.entries(instances) — the full set
            // Throws instance[commandName] is not a function
            const texts = await existing.getText()
            expect(texts).toEqual([])  // ← fails today: returns ['', '', ''] (3 browsers executed)
        })
    })
})
