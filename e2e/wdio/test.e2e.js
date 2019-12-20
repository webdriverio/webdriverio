const assert = require('assert')

describe('main suite 1', () => {
    it('foobar test', () => {
        browser.url('http://guinea-pig.webdriver.io')
        assert.equal(browser.getTitle(), 'WebdriverJS Testpage')
    })
})
