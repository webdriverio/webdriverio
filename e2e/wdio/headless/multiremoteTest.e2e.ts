import { Key } from 'webdriverio'

describe('main suite 1', () => {
    it('should open chat application', async () => {
        await browser.url('https://socketio-chat-h9jt.herokuapp.com/')
    })

    it('should login the browser A', async () => {
        const nameInput = await browserA.$('.usernameInput')
        await nameInput.addValue('Browser A')
        await browserA.keys(Key.Enter)
        await expect(browserA.$('.inputMessage')).toHaveAttribute('placeHolder', 'Type here...')
    })

    it('should login the browser B', async () => {
        const nameInput = await browserB.$('.usernameInput')
        await nameInput.addValue('Browser B')
        await browserB.keys(Key.Enter)
        await expect(browserB.$('.inputMessage')).toHaveAttribute('placeHolder', 'Type here...')
    })

    it('should return devtools result', async () => {
        await browserA.url('https://webdriver.io')
        await browserB.url('https://google.com')

        const cookiesA = await browserA.cdp('Network', 'getCookies')
        const cookiesB = await browserB.cdp('Network', 'getCookies')
        const cookies = await browser.cdp('Network', 'getCookies')

        expect(Object.keys(cookiesA).length).toBe(1)
        expect(Object.keys(cookiesA)).toEqual(['cookies'])
        expect(Object.keys(cookiesB).length).toBe(1)
        expect(Object.keys(cookiesB)).toEqual(['cookies'])
        expect(Object.keys(cookies).length).toBe(2)

        const score = await browser.checkPWA()
        expect(Object.keys(score).length).toBe(2)
    })
})
