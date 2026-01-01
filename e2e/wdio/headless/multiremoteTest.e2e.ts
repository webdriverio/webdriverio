import { multiRemoteBrowser as browser } from '@wdio/globals'
import { Key } from 'webdriverio'

let browserA: WebdriverIO.Browser
let browserB: WebdriverIO.Browser

describe('multi remote test', () => {
    before(() => {
        browserA = browser.getInstance('browserA')
        browserB = browser.getInstance('browserB')
    })

    it.skip('should also detect non PWAs', async () => {
        await browserA.url('https://json.org')
        await browserB.url('https://webdriver.io')

        // eslint-disable-next-line wdio/no-pause
        await browser.pause(1000)

        /**
         * Unfortunately we don't know which result is from which browser
         */
        const results = (await browser.checkPWA() as unknown as []).map((result: { passed: boolean }) => result.passed)
        expect(typeof results[0]).toBe('boolean')
        expect(typeof results[1]).toBe('boolean')
        expect(results[0] !== results[1]).toBeTruthy()
    })

    describe('chat test', () => {
        it('should open chat application', async () => {
            browserA = await browser.getInstance('browserA')
            browserB = await browser.getInstance('browserB')
            await browser.url('https://socketio-chat-h9jt.herokuapp.com/')
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
})
