import { multiremotebrowser as browser } from '@wdio/globals'
import { Key } from 'webdriverio'

let browserA: WebdriverIO.Browser
let browserB: WebdriverIO.Browser

describe('main suite 1', () => {
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
