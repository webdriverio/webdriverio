const assert = require('assert')

describe('webdriver.io page', () => {
    it('should be a pending test')

    it('should have the right title', () => {

        browser.runPerformanceAudits(true)
        browser.url('http://json.org')

        console.log(browser.getMetrics(), browser.getPerformanceScore())

        $('=Esperanto').click()

        console.log(browser.getMetrics(), browser.getPerformanceScore())
        // const title = browser.getTitle()
        // assert.equal(title, 'WebdriverIO · Next-gen WebDriver test framework for Node.js')
    })
})
