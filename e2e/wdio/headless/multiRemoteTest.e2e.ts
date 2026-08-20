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
            await multiRemoteBrowser.url('https://webdriver.io')

            const titles = await multiRemoteBrowser.getTitle()
            expect(titles).toEqual([
                'WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO',
                'WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO',
                'WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO'
            ])
        })

        it('should be able to select one specific instance on multi-remote element', async () => {
            await multiRemoteBrowser.url('https://webdriver.io')
            const header = multiRemoteBrowser.$('h1')

            const browserAHeader = header.unstable_select('browserA')

            expect(await browserAHeader.instances).toEqual(['browserA'])

            const browserAClasses = await browserAHeader.getAttribute('class')
            expect(browserAClasses).toEqual(expect.arrayContaining([expect.stringContaining('hero__title')]))
            expect(browserAClasses).toHaveLength(1)
        })

        it('should be able to select two specific instance on multi-remote element', async () => {
            await multiRemoteBrowser.url('https://webdriver.io')
            const header = multiRemoteBrowser.$('h1')

            const browserAHeader = header.unstable_select(['browserA', 'browserC'])

            expect(await browserAHeader.instances).toEqual(['browserA', 'browserC'])

            const browserAClasses = await browserAHeader.getAttribute('class')
            expect(browserAClasses).toEqual(expect.arrayContaining([expect.stringContaining('hero__title'), expect.stringContaining('hero__title')]))
            expect(browserAClasses).toHaveLength(2)
        })

        it('should be able to filter on multi-remote element', async () => {
            await multiRemoteBrowser.url('https://webdriver.io')
            await browserB.url('about:blank')

            const header = multiRemoteBrowser.$('h1')

            const existingHeaders = await header.unstable_filter((e) => e.isExisting())

            // TODO review to assert order of instances, as it may not be guaranteed to be the same order each time
            expect(existingHeaders.instances).toEqual(expect.arrayContaining(['browserA', 'browserC']))
            const classes = await existingHeaders.getAttribute('class')
            expect(classes).toHaveLength(2)
        })

        it('should be able to select and filter on multi-remote element', async () => {
            await multiRemoteBrowser.url('https://webdriver.io')
            await browserB.url('about:blank')

            const header = multiRemoteBrowser.$('h1')

            const existingHeaders = await header.unstable_select(['browserA', 'browserC']).unstable_filter((e) => e.isExisting())

            expect(existingHeaders.instances).toEqual(['browserA', 'browserC'])
            const classes = await existingHeaders.getAttribute('class')
            expect(classes).toHaveLength(2)
        })

        it('should be able to select on multi-remote browser', async () => {

            await multiRemoteBrowser.unstable_select('browserA').url('https://webdriver.io')
            // Remove h1 from browserB to ensure it would fail if accessed
            await browserB.execute(() => {
                document.querySelector('h1')?.remove()
            })

            // Select only browserA, so browserB's missing element shouldn't matter
            const header = await multiRemoteBrowser.unstable_select('browserA').$('h1')

            expect(await header.instances).toEqual(['browserA'])
            const classes = await header.getAttribute('class')
            expect(classes).toEqual(expect.arrayContaining([expect.stringContaining('hero__title')]))
            expect(classes).toHaveLength(1)
        })

        it('should allow chaining select with element query', async () => {
            const header = await multiRemoteBrowser.unstable_select('browserA').$('h1')

            expect(header.instances).toEqual(['browserA'])
        })
    })
})
