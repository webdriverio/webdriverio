describe('multiremote example', () => {
    it('should open chat application', () => {
        browser.url('https://socket-io-chat.now.sh/')
    })

    it('should login the browser', () => {
        const nameInput = $('.usernameInput')
        nameInput.addValue('Browser')
        browser.keys('Enter')
    })

    it('should post something in browserA', () => {
        const msgElemBrowserA = browserA.$('.inputMessage')

        msgElemBrowserA.addValue('Hey Whats up!')
        browser.pause(1000)
        browserA.keys('Enter')

        msgElemBrowserA.addValue('My name is Edgar')
        browser.pause(1000)
        browserA.keys('Enter')
        browser.pause(200)
    })

    it('should read the message in browserB', () => {
        const msgElemBrowserB = browserB.$('.inputMessage')

        const chatLineBrowserB = browserB.$('.messageBody*=My name is')
        chatLineBrowserB.waitForExist(5000)

        const message = chatLineBrowserB.getText()
        const name = message.split(' ').pop()

        msgElemBrowserB.addValue(`Hello ${name}! How are you today?`)
        browserB.keys('Enter')
        browser.pause(5000)
    })
})
