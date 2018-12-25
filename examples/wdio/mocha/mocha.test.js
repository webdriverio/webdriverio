const assert = require('assert')

describe('webdriver.io page', () => {
    it('should be a pending test')

    it('should have the right title - the fancy generator way', () => {
        browser.url('https://webdriver.io')
        const title = browser.getCurrentTitle()
        assert.equal(title, 'WebdriverIO - WebDriver bindings for Node.js')
    })
})
