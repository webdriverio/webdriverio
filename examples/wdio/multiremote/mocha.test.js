describe('multiremote example', () => {
    it('should open chat application', async () => {
        await browser.url('https://socketio-chat-h9jt.herokuapp.com/')
    })

    it('should login the browser A', async () => {
        const nameInput = await browserA.$('.usernameInput')
        await nameInput.addValue('Browser A')
        await browserA.keys('Enter')
    })

    it('should login the browser B', async () => {
        const nameInput = await browserB.$('.usernameInput')
        await nameInput.addValue('Browser B')
        await browserB.keys('Enter')
    })

    it('should post something in browserA', async () => {
        const msgElemBrowserA = await browserA.$('.inputMessage')
        await msgElemBrowserA.addValue('Hey Whats up!')
        await browser.pause(1000)
        await browserA.keys('Enter')

        await msgElemBrowserA.addValue('My name is Edgar')
        await browserA.keys('Enter')
        await browser.pause(200)
    })

    it('should read the message in browserB', async () => {
        const msgElemBrowserB = await browserB.$('.inputMessage')
        const chatLineBrowserB = await browserB.$('.messageBody*=My name is')
        const message = await chatLineBrowserB.getText()
        const name = message.slice(11)
        await msgElemBrowserB.addValue(`Hello ${name}! How are you today?`)
        await browserB.keys('Enter')
        await browser.pause(5000)
    })
})
