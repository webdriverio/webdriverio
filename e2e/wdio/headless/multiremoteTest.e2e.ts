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
})
