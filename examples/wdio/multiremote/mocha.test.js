describe('multiremote example', () => {
    it('should open chat application', () => {
        browser.url('https://socketio-chat-h9jt.herokuapp.com/')
    })

    it('should login the browser A', () => {
        const nameInput = browserA.$('.usernameInput')
        nameInput.addValue('Browser A')
        browserA.keys('Enter')
    })

    it('should login the browser B', () => {
        const nameInput = browserB.$('.usernameInput')
        nameInput.addValue('Browser B')
        browserB.keys('Enter')
    })

    it('should post something in browserA', () => {
        const msgElemBrowserA = browserA.$('.inputMessage')
        msgElemBrowserA.addValue('Hey Whats up!')
        browser.pause(1000)
        browserA.keys('Enter')

        msgElemBrowserA.addValue('My name is Edgar')
        browserA.keys('Enter')
        browser.pause(200)
    })

    it('should read the message in browserB', () => {
        const msgElemBrowserB = browserB.$('.inputMessage')
        const chatLineBrowserB = browserB.$('.messageBody*=My name is')
        const message = chatLineBrowserB.getText()
        const name = message.slice(11)
        msgElemBrowserB.addValue(`Hello ${name}! How are you today?`)
        browserB.keys('Enter')
        browser.pause(5000)
    })
})
