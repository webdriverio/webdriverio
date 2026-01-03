import { multiRemoteBrowser } from '@wdio/globals'
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
        it('should be able to expect with multi-remote browser', async () => {
            await multiRemoteBrowser.url('https://webdriver.io')

            const titles = await multiRemoteBrowser.getTitle()
            expect(titles).toEqual([
                'WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO',
                'WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO',
                'WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO'
            ])
            // await expect(multiremotebrowser).toHaveTitle('WebdriverIO')
        })

        // it('should be able to expect with multi-remote element', async () => {
        //     await multiremotebrowser.url('https://webdriver.io')

        //     const multiRemoteTitleSelector: WebdriverIO.MultiRemoteElement = multiremotebrowser.$('title')

        //     await expect(multiRemoteTitleSelector).toBeExisting()
        //     await expect(titleSelector).toBeExisting()
        // })

        it('should be able to select specific instances', async () => {
            await multiRemoteBrowser.url('https://webdriver.io')
            const header = multiRemoteBrowser.$('h1')

            // @ts-ignore
            const browserAHeader = header.select(['browserA'])
            expect(await browserAHeader.instances).toEqual(['browserA'])
            const browserAClasses = await browserAHeader.getAttribute('class')
            expect(browserAClasses).toEqual(expect.arrayContaining([expect.stringContaining('hero__title')]))
            expect(browserAClasses).toHaveLength(1)
        })

        it('should be able to filter instances', async () => {
            await multiRemoteBrowser.url('https://webdriver.io')
            await browserB.url('about:blank')

            const header = multiRemoteBrowser.$('h1')

            // @ts-ignore
            const existingHeaders = await header.filter((e) => e.isExisting())

            expect(existingHeaders.instances).toEqual(['browserA', 'browserC'])
            const classes = await existingHeaders.getAttribute('class')
            expect(classes).toEqual(expect.arrayContaining([expect.stringContaining('hero__title')]))
            expect(classes).toHaveLength(2)
        })

        it('should not fail if element is missing on unselected instance', async () => {
            // @ts-ignore
            await multiRemoteBrowser.select('browserA').url('https://webdriver.io')
            // Remove h1 from browserB to ensure it would fail if accessed
            await browserB.execute(() => {
                document.querySelector('h1')?.remove()
            })

            // Select only browserA, so browserB's missing element shouldn't matter
            // @ts-ignore
            const header = await multiRemoteBrowser.select('browserA').$('h1')

            expect(await header.instances).toEqual(['browserA'])
            const classes = await header.getAttribute('class')
            expect(classes).toEqual(expect.arrayContaining([expect.stringContaining('hero__title')]))
            expect(classes).toHaveLength(1)
        })

        it('should not fail if element is missing on unselected instance 2', async () => {
            // @ts-ignore
            // await multiremotebrowser.select('browserA', 'browserC').url('https://webdriver.io')
            await multiRemoteBrowser.select('browserC').url('https://webdriver.io')
            // Remove h1 from browserB to ensure it would fail if accessed
            await browserB.execute(() => {
                document.querySelector('h1')?.remove()
            })

            await multiRemoteBrowser.pause(10000)
            // @ts-ignore
            const header = await multiRemoteBrowser.select('browserA', 'browserC').$('h1')

            // Select only browserA, so browserB's missing element shouldn't matter
            // @ts-ignore
            const browserAHeader = header

            expect(await browserAHeader.instances).toEqual(['browserA'])
            const classes = await browserAHeader.getAttribute('class')
            expect(classes).toEqual(expect.arrayContaining([expect.stringContaining('hero__title')]))
            expect(classes).toHaveLength(1)
        })

        it('should not fail if element is missing on unselected instance 3', async () => {
            // @ts-ignore
            const selection = multiRemoteBrowser.select(['browserB', 'browserC'])
            await selection.url('https://webdriver.io')

            // Remove h1 from browserA to ensure it would fail if accessed
            await browserA.execute(() => {
                document.querySelector('h1')?.remove()
            })

            await multiRemoteBrowser.pause(2000)
            // @ts-ignore
            const header = await selection.$('h1')

            expect(await header.instances).toEqual(['browserB', 'browserC'])
            const classes = await header.getAttribute('class')
            expect(classes).toEqual(expect.arrayContaining([expect.stringContaining('hero__title')]))
            expect(classes).toHaveLength(2)
        })

        // it('should be able to select instance before command execution', async () => {
        //     await multiremotebrowser.url('https://webdriver.io')

        //     // Reset state
        //     await browserA.execute(() => { (window as any).wasCalled = false })
        //     await browserB.execute(() => { (window as any).wasCalled = false })

        //     // Select browserA and run execute
        //     // @ts-ignore
        //     const browserAOnly = multiremotebrowser.select('browserA')
        //     await browserAOnly.execute(() => { (window as any).wasCalled = true })

        //     const resultA = await browserA.execute(() => (window as any).wasCalled)
        //     const resultB = await browserB.execute(() => (window as any).wasCalled)

        //     expect(resultA).toBe(true)
        //     expect(resultB).toBe(false)
        // })

        it('should allow chaining select with element query', async () => {
            // @ts-ignore
            const header = await multiRemoteBrowser.select('browserA').$('h1')
            expect(header.instances).toEqual(['browserA'])
        })
    })
})
